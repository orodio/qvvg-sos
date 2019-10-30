export function debug(bool) {
  return function modNode(node) {
    node.debug = bool
    return node
  }
}
