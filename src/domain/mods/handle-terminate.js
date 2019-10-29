export const noop = (_ctx, _state, reason) => reason

export const handleTerminate = (fn = noop) => node => {
  node.handleTerminate = fn
  return node
}
