export const noop = (ctx, state) => ctx.Ok(state)

export const handleContinue = (key, fn = noop) => node => {
  if (node.handleContinue == null) node.handleContinue = {}
  node.handleContinue[key] = fn
  return node
}
