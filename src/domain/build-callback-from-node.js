import {send} from '../registry.js'
import Signal from './signal.js'

export function buildCallbackFromNode(node) {
  return async function callback(context, initialState) {
    const ctx = new Ctx(context, node)
    var signal = await node.handleInit(ctx, initialState)
    var timeout = null

    function dismissTimeout() {
      if (timeout == null) return
      clearTimeout(timeout)
      timeout = null
    }

    function scheduleTimeout({ms, args}) {
      timeout = setTimeout(function scheduledTimeout() {
        send({to: ctx.self(), from: ctx.self(), meta: {type: 'timeout'}}, {ms, args})
      }, ms)
    }

    while (1) {
      let letter = null
      try {
        switch (true) {
          case Signal.isStop(signal):
            return node.handleTerminate(ctx, signal.state, signal.reason)

          case Signal.hasTimeout(signal):
            scheduleTimeout(signal.timeout)
            signal = Signal.scrubTimeout(signal)
            break

          case Signal.hasContinue(signal):
            signal = await node.handleContinue[signal.continue.verb](
              ctx,
              signal.state,
              ...signal.continue.args
            )
            break

          case Signal.isOk(signal):
            letter = await context.receive()
            dismissTimeout()
            signal = await execMessage(node, ctx, signal.state, letter)
            break

          default:
            signal = ctx.Stop(signal.state, 'Unknown Signal Type')
            break
        }
      } catch (error) {
        console.error(`Domain(${node.label}) -- Signal Error`, error)
        return 'Signal Error'
      }
    }
    return 'DONE'
  }
}

function Ctx(context, node) {
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
  for (let key of Object.keys(context.extra)) this[key] = context.extra[key]
}

async function execMessage(node, ctx, state, message) {
  try {
    const from = message.from
    let signal = null
    if (from != null)
      ctx.reply = function sendReply(value) {
        send({to: from, from: ctx.self()}, value)
      }

    switch (true) {
      case message.meta.type === 'stop':
        signal = ctx.Stop(state, message.value)
        break

      case message.meta.type === 'dump':
        signal = ctx.Reply(state, state)
        break

      case message.meta.type === 'tell':
        signal = await node.handleTell[message.meta.verb](ctx, state, message.value)
        break

      case message.meta.type === 'ask':
        signal = await node.handleAsk[message.meta.verb](ctx, state, message.value)
        break

      case message.meta.type === 'timeout':
        signal = await node.handleTimeout(ctx, state, message)
        break

      default:
        signal = await node.handleInfo(ctx, state, message)
    }

    if (from != null && Signal.hasReply(signal)) ctx.reply(signal.reply)
    signal = Signal.scrubReply(signal)
    return signal
  } catch (error) {
    console.error(`Domain(${node.label}) -- Message Error`, {message, state}, error)
    return ctx.Stop('Message Error')
  }
}
