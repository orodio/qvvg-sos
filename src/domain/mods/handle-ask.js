export function noop(ctx, state) {
  return ctx.Reply(null, state)
}

export function handleAsk(key, fn = noop) {
  return function modNode(node) {
    if (node.handleAsk == null) node.handleAsk = {}
    node.handleAsk[key] = fn
    return node
  }
}
