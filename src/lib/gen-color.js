const CHARS = '0123456789abcdef'
const r = () => CHARS[~~(Math.random() * CHARS.length)]
export const genColor = () => '#' + r() + r() + r() + r() + r() + r()
