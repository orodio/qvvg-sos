export function noop(ctx, state) {
  return ctx.Ok(state)
}

export function handleTell(key, fn = noop) {
  return function modNode(node) {
    if (node.handleTell == null) node.handleTell = {}
    node.handleTell[key] = fn
    return node
  }
}
