export const noop = (ctx, state) => ctx.Ok(state)

export const handleTimeout = (fn = noop) => node => {
  node.handleTimeout = fn
  return node
}
