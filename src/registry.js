import queueMicrotask from './lib/queue-microtask.js'
import {genMailbox, enqueued} from './lib/gen-mailbox.js'
import {genColor} from './lib/gen-color.js'

const TEST = false
// const TEST = Boolean(((process || {}).env || {}).TEST)

const root =
  (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  (typeof window === 'object' && window.window === window && window) ||
  this
root.__SOS__ = root.__SOS__ == null ? {} : root.__SOS__
root.__REG__ = root.__REG__ == null ? {} : root.__REG__
root.__VIA__ = root.__VIA__ == null ? {} : root.__VIA__

function register(opts = {}) {
  const {pid, ...mailbox} = genMailbox()
  root.__REG__[pid] = {
    pid,
    mailbox,
    name: opts.name,
    label: opts.label || '*',
    color: genColor(),
    debug: opts.debug || false,
  }
  if (opts.name != null) root.__VIA__[opts.name] = pid
  return pid
}

root.__SOS__.whereIs = whereIs
export function whereIs(address) {
  var pid = null
  if (root.__VIA__[address] != null) return (address = root.__VIA__[address])
  if (root.__REG__[address] != null) pid = address
  return pid
}

const display = {
  pid(pid) {
    try {
      const {color, name, label} = root.__REG__[pid]
      const n = name || pid
      const value = n === label ? `%cGLOBAL %c[${n}]` : `%c${label} %c[${n}]`
      const lStyles = `font-size:8px;font-weight:bold;`
      const styles = `color:${color};font-family:monospace;`
      return [value, lStyles, styles]
    } catch (error) {
      console.error(`registry display.pid for <${pid}>`, {pid, error})
      return ['', '']
    }
  },
  print(verb, pid, ...rest) {
    try {
      const conn = root.__REG__[whereIs(pid)]
      if (conn == null) {
        console.warn(
          `%cNope: ${verb}(${pid})`,
          'color:tomato;font-family:monospace;font-weight:bold;',
          [pid, ...rest]
        )
        return
      }

      if (verb === 'log' && !conn.debug) return
      const [name, ...styles] = display.pid(conn.pid)
      TEST
        ? console[verb](name.replace(/\%c/g, ''), ...rest)
        : console[verb](name, ...styles, ...rest)
      return
    } catch (error) {
      console.error(
        `%cNope: ${verb}(${pid})`,
        'color:tomato;font-family:monospace;font-weight:bold;',
        [pid, ...rest]
      )
      return
    }
  },
  debug(...args) {
    display.print('log', ...args)
  },
  warn(...args) {
    display.print('warn', ...args)
  },
  error(...args) {
    display.print('error', ...args)
  },
}

function deliver(address, msg) {
  const pid = whereIs(address)
  if (pid == null) return false
  root.__REG__[pid].mailbox.send(msg)
  return true
}

function receive(address) {
  const pid = whereIs(address)
  if (pid == null) Promise.reject(`No mailbox found for: ${address}`)
  return root.__REG__[pid].mailbox.receive()
}

root.__SOS__.kill = kill
export function kill(address) {
  const pid = whereIs(address)
  if (address !== pid) delete root.__VIA__[address]
  delete root.__REG__[pid]
  return pid
}

function scrubMessage(opts = {}, value) {
  if (typeof opts === 'number' || typeof opts === 'string') opts = {to: opts}
  opts.value = opts.value || value

  return {
    to: opts.to,
    from: opts.from,
    meta: opts.meta || {},
    value: opts.value,
  }
}

root.__SOS__.send = send
export function send(opts, value) {
  queueMicrotask(function microSend() {
    const message = scrubMessage(opts, value)
    const sent = deliver(message.to, message)
    sent
      ? display.debug(message.to, 'was sent', message)
      : console.warn(message.to, 'unable to deliver message', message)
  })
}

function buildContext(pid, extra = {}) {
  return {
    self() {
      return root.__REG__[pid].name || pid
    },
    label() {
      return root.__REG__[pid].label
    },
    extra: extra,
    receive() {
      return receive(pid)
    },
    debug: display.debug,
    warn: display.warn,
    error: display.error,
  }
}

function noop() {
  return null
}

root.__SOS__.spawn = spawn
export function spawn(callback = noop, initState = null, opts = {}) {
  if (typeof callback === 'object') {
    const node = callback.node || {}
    opts.label = opts.label || node.label || '*'
    opts.name =
      opts.name || (node.withName != null && node.withName(initState, opts.label)) || undefined
    opts.debug = opts.debug || node.debug || false
    callback = callback.callback
  }

  if (whereIs(opts.name)) {
    display.debug(opts.name, 'Already Started')
    return opts.name
  }

  var pid = register(opts)

  queueMicrotask(async function microSpawn() {
    const reason = await callback(buildContext(pid, opts.inject || {}), initState)
    display.debug(pid, 'kill', reason)
    kill(pid)
  }, 0)

  display.debug(pid, 'Started')
  return opts.name || pid
}

export function resetAll() {
  for (let address of Object.keys(root.__VIA__)) kill(address)
  for (let address of Object.keys(root.__REG__)) kill(address)
}

export function nextIdle(minIdleTicks = 3) {
  return new Promise(resolve => {
    let idleTicks = 0

    function rec() {
      const count = enqueued()
      if (count > 0) {
        idleTicks = 0
        return setTimeout(() => rec(), 1)
      } else if (idleTicks >= minIdleTicks) {
        return resolve()
      } else {
        idleTicks += 1
        return setTimeout(() => rec(), 1)
      }
    }

    return setTimeout(() => rec(), 1)
  })
}
