export const noop = () => ({})

export const deps = (fn = noop) => node => {
  node.deps = fn
  return node
}
