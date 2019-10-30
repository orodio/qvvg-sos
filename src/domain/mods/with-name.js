function noop(init, label) {
  return label + '|' + init
}

export function withName(fn = noop) {
  return function modNode(node) {
    node.withName = fn
    return node
  }
}
