export function noop(_ctx, _state, reason) {
  return reason
}

export function handleTerminate(fn = noop) {
  return function modNode(node) {
    node.handleTerminate = fn
    return node
  }
}
