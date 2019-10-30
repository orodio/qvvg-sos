export function noop(ctx, state) {
  return ctx.Ok(state)
}

export function handleInfo(fn = noop) {
  return function modNode(node) {
    node.handleInfo = fn
    return node
  }
}
