import {send} from '../registry.js'
import {noop as noopHandleTell} from './mods/handle-tell.js'
import {noop as noopHandleAsk} from './mods/handle-ask.js'
import {noop as noopHandleContinue} from './mods/handle-continue.js'
import {timeout as sendTimeout, isTimeout} from './send/timeout.js'
import {isAsk} from './send/ask.js'
import {isDump} from './send/dump.js'
import {isStop} from './send/stop.js'
import {isTell} from './send/tell.js'
import Signal from './signal.js'

export function buildCallbackFromNode(self, node) {
  return async function callback(context, initialState) {
    const ctx = new Ctx(self, context, node)
    var signal = await node.handleInit(ctx, initialState)
    var timeout = null

    function dismissTimeout() {
      if (timeout == null) return
      ctx.debug(ctx.self(), 'Clearing Scheduled Timeout')
      clearTimeout(timeout)
      timeout = null
    }

    function scheduleTimeout({ms, args}) {
      ctx.debug(ctx.self(), `Scheduling Timeout Message for ${ms}ms from now.`, {ms, args})
      timeout = setTimeout(function scheduledTimeout() {
        ctx.debug(ctx.self(), `Timeout Message Dispatched`, {ms, args})
        sendTimeout(ctx.self(), ms, args)
      }, ms)
    }

    const grock = (label, args = []) => {
      const t1 = Date.now()
      ctx.debug(ctx.self(), `${label}/${args.length}`, args)
      return (ret, ...more) => {
        const t2 = Date.now()
        ctx.debug(ctx.self(), `(${t2 - t1}ms) ${label}/${args.length} -> ${ret}`, args, ...more)
      }
    }

    while (1) {
      try {
        if (Signal.isStop(signal)) {
          const args = [ctx, signal.state, signal.reason]
          const done = grock('handleTerminate', args)
          const result = await node.handleTerminate(...args)
          done()
          return result
        } else if (Signal.hasTimeout(signal)) {
          scheduleTimeout(signal.timeout)
          signal = Signal.scrubTimeout(signal)
        } else if (Signal.hasContinue(signal)) {
          const callback = node.handleContinue[signal.continue.verb] || noopHandleContinue
          const args = [ctx, signal.state, ...signal.continue.args]
          const done = grock(`handleContinue[${signal.continue.verb}]`, args)
          signal = await (node.handleContinue[signal.continue.verb] || noopHandleContinue)(
            ctx,
            signal.state,
            ...signal.continue.args
          )
          done(signal.signal, signal)
        } else if (Signal.isOk(signal)) {
          const letter = await context.receive()
          dismissTimeout()
          signal = await execMessage(grock, node, ctx, signal.state, letter)
        } else {
          ctx.error(ctx.self(), 'Unknown Signal Type', signal)
          signal = ctx.Stop(signal.state, 'Unknown Signal Type')
        }
      } catch (error) {
        console.error(`Domain(${node.label}) -- Signal Error`, error)
        return 'Signal Error'
      }
    }
    return 'DONE'
  }
}

function Ctx(self, context, node) {
  this[node.label] = self
  this.self = context.self
  this.Stop = Signal.Stop
  this.Ok = Signal.Ok
  this.Reply = Signal.Reply
  this.Continue = Signal.Continue
  this.Timeout = Signal.Timeout
  this.reply = () => {}
  this.deps = node.deps()
  this.config = node.config
  this.broadcast = node.broadcast
  this.debug = context.debug
  this.warn = context.warn
  this.error = context.error
  for (let key of Object.keys(context.extra)) this[key] = context.extra[key]
}

async function execMessage(grock, node, ctx, state, message) {
  try {
    const from = message.from
    let signal = null
    if (from != null)
      ctx.reply = function sendReply(value) {
        send({to: from, from: ctx.self()}, value)
      }

    if (isStop(message)) {
      signal = ctx.Stop(state, message.value)
    } else if (isDump(message)) {
      const done = grock('handleDump', [])
      signal = ctx.Reply(state, state)
      done(signal.signal, signal)
    } else if (isTell(message)) {
      const args = [ctx, state, message.value]
      const callback = node.handleTell[message.meta.verb] || noopHandleTell
      const done = grock(`handleTell[${message.meta.verb}]`, args)
      signal = await callback(...args)
      done(signal.signal, signal)
    } else if (isAsk(message)) {
      const args = [ctx, state, message.value]
      const callback = node.handleAsk[message.meta.verb] || noopHandleAsk
      const done = grock(`handleAsk[${message.meta.verb}]`, args)
      signal = await callback(...args)
      done(signal.signal, signal)
    } else if (isTimeout(message)) {
      const args = [ctx, state, ...(((message || {}).value || {}).args || [])]
      const done = grock(`handleTimeout`, args)
      signal = await node.handleTimeout(...args)
      done(signal.signal)
    } else {
      const args = [ctx, state, message]
      const done = grock('handleInfo', args)
      signal = await node.handleInfo(args)
      done(signal.signal, signal)
    }

    if (from != null && Signal.hasReply(signal)) ctx.reply(signal.reply)
    signal = Signal.scrubReply(signal)
    return signal
  } catch (error) {
    console.error(`Domain(${node.label}) -- Message Error`, {message, state}, error)
    return ctx.Stop('Message Error')
  }
}
