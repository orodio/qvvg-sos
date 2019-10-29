export const noop = (ctx, state) => ctx.Ok(state)

export const handleInfo = (fn = noop) => node => {
  node.handleInfo = fn
  return node
}
