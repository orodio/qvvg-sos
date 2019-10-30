import {tell} from '../send/tell.js'

function noop(v) {
  return v
}

export function broadcast(key, fn = noop) {
  return function modNode(node) {
    if (node.broadcast == null) node.broadcast = {}
    node.broadcast[key] = (pids, ...args) => {
      const msg = fn(...args)
      const event = node.ns == null ? key : node.ns(key)
      for (let pid of pids) tell(pid, event, msg)
    }
    return node
  }
}
