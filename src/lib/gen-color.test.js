import {genColor} from './gen-color.js'

const COLORS = Array.from({length: 100}, () => genColor())
for (let color of COLORS) {
  test('genColor() => ' + color, () => {
    expect(color).toHaveLength(7)
    expect(color).toMatch(/^#[0-9abcdef]{6}$/i)
  })
}
