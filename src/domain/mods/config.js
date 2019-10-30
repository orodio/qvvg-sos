export function config(key, value) {
  return function modNode(node) {
    if (node.config == null) node.config = {}
    node.config[key] = value
    return node
  }
}
