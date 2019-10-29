const noop = (init, label) => `${label}|${init}`

export const withName = (fn = noop) => node => {
  node.withName = fn
  return node
}
