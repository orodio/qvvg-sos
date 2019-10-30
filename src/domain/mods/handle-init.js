export function noop(ctx, init) {
  return ctx.Ok(init)
}

export function handleInit(fn = noop) {
  return function modNode(node) {
    node.handleInit = fn
    return node
  }
}
