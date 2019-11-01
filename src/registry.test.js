import {spawn, send, resetAll} from './registry.js'

beforeEach(() => {
  resetAll()
})

const INC = 'inc'
const DEC = 'dec'
const RPC = 'rpc'

const counter = async (ctx, count) => {
  __loop: while (1) {
    const {from, value: msg} = await ctx.receive()
    switch (msg.type) {
      case INC:
        count = count + 1
        continue __loop

      case DEC:
        count = count - 1
        continue __loop

      case RPC:
        send({to: from, from: ctx.self()}, count)
        continue __loop
    }
  }
}

const inc = pid => send({to: pid}, {type: INC})
const dec = pid => send(pid, {type: DEC})

const rpc = pid =>
  new Promise(resolve => {
    const from = spawn(async function innerRpc(ctx) {
      const msg = await ctx.receive()
      resolve(msg.value)
    })
    send({to: pid, from}, {type: RPC})
  })

test('basics', async () => {
  const pid = spawn(counter, 0)
  expect(await rpc(pid)).toBe(0)
})

test('ordering', async () => {
  const pid = spawn(counter, 0)
  inc(pid)
  inc(pid)
  expect(await rpc(pid)).toBe(2)
  dec(pid)
  expect(await rpc(pid)).toBe(1)
})

const namedTest = async () => {
  const p1 = spawn(counter, 0, {name: 'bob'})
  const p2 = spawn(counter, 5, {name: 'bob'})
  const p3 = spawn(counter, 0, {name: 'steve'})
  expect(p1).toBe(p2)
  expect(p1).not.toBe(p3)
  expect(await rpc(p1)).toBe(0)
  send('bob', {type: INC})
  expect(await rpc(p1)).toBe(1)
  expect(await rpc(p1)).toBe(await rpc(p2))
}

test('named (actually test named)', namedTest)
test('second named test (test before all)', namedTest)
