export function noop(ctx, state) {
  return ctx.Ok(state)
}

export function handleTimeout(fn = noop) {
  return function modNode(node) {
    node.handleTimeout = fn
    return node
  }
}
