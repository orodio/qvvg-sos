import {spawn} from '../registry.js'
import {stop} from './send/stop.js'
import {dump} from './send/dump.js'
import {tell} from './send/tell.js'
import {ask} from './send/ask.js'
import {noop as depsNoop} from './mods/deps.js'
import {noop as handleInitNoop} from './mods/handle-init.js'
import {noop as handleInfoNoop} from './mods/handle-info.js'
import {noop as handleTimeoutNoop} from './mods/handle-timeout.js'
import {noop as handleTerminateNoop} from './mods/handle-terminate.js'
import {buildCallbackFromNode} from './build-callback-from-node.js'

function Domain(mods = []) {
  if (!(this instanceof Domain)) return new Domain(...arguments)
  this.node = {
    withName: null,
    label: '*',
    ns: key => this.node.label + '/' + key,
    config: {},
    broadcast: {},
    deps: depsNoop,
    handleInit: handleInitNoop,
    handleInfo: handleInfoNoop,
    handleTimeout: handleTimeoutNoop,
    handleTerminate: handleTerminateNoop,
    handleTell: {},
    handleAsk: {},
    handleContinue: {},
  }
  this.node = mods.filter(Boolean).reduce(function applyMod(node, mod) {
    return mod(node)
  }, this.node)
  this.callback = buildCallbackFromNode(this.node)
  this.events = Object.keys(this.node.broadcast).reduce(
    (ex, e) => ({...ex, [e]: this.node.ns(e)}),
    {}
  )
  this.withName = initState =>
    this.node.withName == null ? initState : this.node.withName(initState, this.node.label)
  this.init = (initState, opts) => spawn(this, initState, opts)
  this.stop = (address, reason) => stop(this.withName(address), reason)
  this.ask = (address, ...args) => ask(this.withName(address), ...args)
  this.tell = (address, ...args) => tell(this.withName(address), ...args)
  this.dump = address => dump(this.withName(address))
}

Domain.init = spawn
Domain.stop = stop
Domain.dump = dump
Domain.tell = tell
Domain.ask = ask

export {Domain}
