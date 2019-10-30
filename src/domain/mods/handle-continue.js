export function noop(ctx, state) {
  return ctx.Ok(state)
}

export function handleContinue(key, fn = noop) {
  return function modNode(node) {
    if (node.handleContinue == null) node.handleContinue = {}
    node.handleContinue[key] = fn
    return node
  }
}
