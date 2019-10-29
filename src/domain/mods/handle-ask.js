export const noop = (ctx, state) => ctx.Reply(null, state)

export const handleAsk = (key, fn = noop) => node => {
  if (node.handleAsk == null) node.handleAsk = {}
  node.handleAsk[key] = fn
  return node
}
