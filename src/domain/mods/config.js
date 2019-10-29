export const config = (key, value) => node => {
  if (node.config == null) node.config = {}
  node.config[key] = value
  return node
}
