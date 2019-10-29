export const noop = (ctx, init) => ctx.Ok(init)

export const handleInit = (fn = noop) => node => {
  node.handleInit = fn
  return node
}
