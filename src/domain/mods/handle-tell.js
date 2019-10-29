export const noop = (ctx, state) => ctx.Ok(state)

export const handleTell = (key, fn = noop) => node => {
  if (node.handleTell == null) node.handleTell = {}
  node.handleTell[key] = fn
  return node
}
