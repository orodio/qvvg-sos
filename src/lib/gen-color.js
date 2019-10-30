const CHARS = '0123456789abcdef'

function r() {
  return CHARS[~~(Math.random() * CHARS.length)]
}

export function genColor() {
  return '#' + r() + r() + r() + r() + r() + r()
}
