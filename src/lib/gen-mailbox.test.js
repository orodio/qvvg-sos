import {genMailbox} from './gen-mailbox.js'

const MSG_ONE = 'message message message'
const MSG_TWO = 'another message'
const MSG_THREE = 'yet another message'

test('send and receive message', async () => {
  const m = genMailbox()
  m.send(MSG_ONE)
  expect(await m.receive()).toBe(MSG_ONE)
})

test('multiple messages, first-in/first-out', async () => {
  const m = genMailbox()
  const mx = [MSG_ONE, MSG_TWO, MSG_THREE]
  for (let msg of mx) m.send(msg)
  for (let msg of mx) expect(await m.receive()).toBe(msg)
})

test('multiple mailboxes', async () => {
  const m1 = genMailbox()
  const m2 = genMailbox()
  expect(m1.pid).not.toBe(m2.pid)

  const m1x = [MSG_ONE, MSG_TWO, MSG_ONE, MSG_TWO]
  const m2x = [MSG_ONE, MSG_TWO, MSG_THREE, MSG_THREE]

  for (let msg of m1x) m1.send(msg)
  for (let msg of m2x) m2.send(msg)
  for (let msg of m1x) expect(await m1.receive()).toBe(msg)
  for (let msg of m2x) expect(await m2.receive()).toBe(msg)
})
