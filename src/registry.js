import {genMailbox, enqueued, isIdle} from './lib/gen-mailbox.js'
import {genColor} from './lib/gen-color.js'

const TEST = false

const registry = {}
const via = {}

function register(opts = {}) {
  const {pid, ...mailbox} = genMailbox()
  registry[pid] = {
    pid,
    mailbox,
    name: opts.name,
    label: opts.label || '*',
    color: genColor(),
    debug: opts.debug || false,
  }
  if (opts.name != null) via[opts.name] = pid
  return pid
}

export function whereIs(address) {
  var pid = null
  if (via[address] != null) return (address = via[address])
  if (registry[address] != null) pid = address
  return pid
}

const display = {
  pid(pid) {
    try {
      const {color, name, label} = registry[pid]
      const value = `%c<${label}.${name || pid}>`
      const styles = `color:${color};font-family:monospace;`
      return [value, styles]
    } catch (error) {
      console.error('registry display.pid', {pid, error})
      return ['', '']
    }
  },
  print(verb, pid, ...rest) {
    try {
      pid = whereIs(pid)
      if (pid == null) return
      if (verb !== 'error' && !registry[pid].debug) return
      const [name, styles] = display.pid(pid)
      TEST ? console[verb](name.replace('%c', ''), ...rest) : console[verb](name, styles, ...rest)
      return
    } catch (error) {
      console.error('registry display.print', {verb, pid, rest, error})
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
  registry[pid].mailbox.send(msg)
  return true
}

function receive(address) {
  const pid = whereIs(address)
  if (pid == null) Promise.reject(`No mailbox found for: ${address}`)
  return registry[pid].mailbox.receive()
}

export function kill(address) {
  const pid = whereIs(address)
  if (address !== pid) delete via[address]
  delete registry[pid]
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

export function send(opts, value) {
  return new Promise(function promSend(resolve, reject) {
    const message = scrubMessage(opts, value)
    const sent = deliver(message.to, message)
    sent
      ? display.debug(message.to, 'was sent', message)
      : console.warn(message.to, 'unable to deliver message', message)
    return resolve(sent)
  })
}

function buildContext(pid, extra = {}) {
  return {
    self() {
      return registry[pid].name || pid
    },
    label() {
      return registry[pid].label
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

  setTimeout(async function innerSpawn() {
    const reason = await callback(buildContext(pid, opts.inject || {}), initState)
    display.debug(pid, 'kill', reason)
    kill(pid)
  }, 0)

  display.debug(pid, 'Started')
  return opts.name || pid
}

export function resetAll() {
  for (let address of Object.keys(via)) kill(address)
  for (let address of Object.keys(registry)) kill(address)
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
