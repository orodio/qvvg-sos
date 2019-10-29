import {tell} from '../send/tell.js'

const noop = v => v

export const broadcast = (key, fn = noop) => node => {
  if (node.broadcast == null) node.broadcast = {}
  node.broadcast[key] = (pids, ...args) => {
    const msg = fn(...args)
    const event = node.ns == null ? key : node.ns(key)
    for (let pid of pids) tell(pid, event, msg)
  }
  return node
}
