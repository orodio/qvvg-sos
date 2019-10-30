export function noop() {
  return function emptyDeps() {
    return {}
  }
}

export function deps(fn = noop) {
  return function modNode(node) {
    node.deps = fn
    return node
  }
}
