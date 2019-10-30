export function label(label) {
  return function modNode(node) {
    node.label = label
    return node
  }
}
