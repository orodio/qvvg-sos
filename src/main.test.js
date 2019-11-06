import {
  Domain,
  nextIdle,
  resetAll,
  whereIs,
  label,
  withName,
  deps,
  broadcast,
  config,
  handleInit,
  handleTell,
  handleAsk,
  handleContinue,
  handleTerminate,
} from './main.js'

beforeEach(() => resetAll())

const sleep = (ms = 5) => new Promise(resolve => setTimeout(() => resolve(), ms))

const counter = Domain([
  label('counter'),
  withName(),

  config('delta', 1),
  config('max', 10),
  config('min', 1),

  deps(() => ({
    getCount: () => Promise.resolve(0),
    saveCount: () => Promise.resolve(),
  })),

  broadcast('count', state => ({
    counterId: state.counterId,
    count: state.count,
  })),

  handleInit(async (ctx, counterId) => {
    const count = await ctx.deps.getCount(counterId)
    const subs = new Set()
    return ctx.Ok({counterId, count, subs})
  }),

  handleTell('subscribe', (ctx, state, sub) => {
    state.subs.add(sub)
    ctx.broadcast.count([sub], state)
    return ctx.Ok(state)
  }),

  handleTell('unsubscribe', (ctx, state, sub) => {
    state.subs.delete(sub)
    return ctx.Ok(state)
  }),

  handleTell('inc', (ctx, state, delta = ctx.config.delta) => {
    state.count += delta
    ctx.broadcast.count(state.subs, state)
    return ctx.Ok(state, ctx.Continue('save'))
  }),

  handleTell('dec', (ctx, state, delta = ctx.config.delta) => {
    state.count -= delta
    ctx.broadcast.count(state.subs, state)
    return ctx.Ok(state, ctx.Continue('save'))
  }),

  handleAsk('count', (ctx, state) => {
    return ctx.Reply(state.count, state)
  }),

  handleContinue('save', (ctx, state) => {
    ctx.deps.saveCount(state.counterId, state.count)
    return ctx.Ok(state)
  }),
])

describe('Domain', () => {
  test('init', async () => {
    const ID = 'foo'
    const getCount = jest.fn(() => Promise.resolve(5))
    const saveCount = jest.fn(() => Promise.resolve())

    expect(getCount).toHaveBeenCalledTimes(0)
    expect(saveCount).toHaveBeenCalledTimes(0)
    const c1 = counter.init(ID, {inject: {deps: {getCount, saveCount}}})
    const c2 = counter.init(ID, {inject: {deps: {getCount, saveCount}}})
    expect(c1).toBe(c2)
    expect(await counter.dump(ID)).toEqual({counterId: ID, count: 5, subs: new Set()})
    expect(await counter.ask(ID, 'count')).toBe(5)
    expect(getCount).toHaveBeenCalledTimes(1)
    expect(saveCount).toHaveBeenCalledTimes(0)

    counter.tell(ID, 'inc')
    expect(await counter.dump(ID)).toEqual({counterId: ID, count: 6, subs: new Set()})
    expect(await counter.ask(ID, 'count')).toBe(6)
    expect(saveCount).toHaveBeenCalledTimes(1)

    counter.tell(ID, 'dec', 4)
    expect(await counter.ask(ID, 'count')).toBe(2)
    expect(saveCount).toHaveBeenCalledTimes(2)
  })

  test('subscriber', async () => {
    const receiveMsg = jest.fn((ctx, state) => ctx.Ok(state))

    const subscriber = Domain([
      label('subscriber'),

      handleInit((ctx, counterId) => {
        counter.init(counterId)
        counter.tell(counterId, 'subscribe', ctx.self())
        return ctx.Ok({counterId})
      }),

      handleTell(counter.events.count, receiveMsg),

      handleTerminate((ctx, state, reason) => {
        counter.tell(state.counterId, 'unsubscribe', ctx.self())
        return reason
      }),
    ])

    expect(receiveMsg).toHaveBeenCalledTimes(0)
    const ID = 'bar'
    const sub = subscriber.init(ID)
    await nextIdle()
    await expect(await counter.dump(ID)).toEqual({
      counterId: ID,
      count: 0,
      subs: new Set([sub]),
    })
    expect(receiveMsg).toHaveBeenCalledTimes(1)
    expect(receiveMsg).toHaveBeenLastCalledWith(
      expect.any(Object),
      {counterId: ID},
      {count: 0, counterId: ID}
    )
    counter.tell(ID, 'inc', 10)
    await nextIdle()
    expect(receiveMsg).toHaveBeenCalledTimes(2)
    expect(receiveMsg).toHaveBeenLastCalledWith(
      expect.any(Object),
      {counterId: ID},
      {count: 10, counterId: ID}
    )

    Domain.stop(sub)
    await nextIdle()
    await expect(await counter.dump(ID)).toEqual({
      counterId: ID,
      count: 10,
      subs: new Set(),
    })
    expect(whereIs(sub)).toBe(null)
  })

  test('unhandled', async () => {
    const base = Domain([])
    const dm = base.init(55)
    base.tell(dm, 'rawr')
    expect(await base.dump(dm)).toBe(55)
    expect(await base.ask(dm, 'rawr')).toBe(null)
  })

  test('unhandled continue', async () => {
    const base = Domain([handleInit(ctx => ctx.Ok(55, ctx.Continue('rawr')))])
    const dm = base.init()
    expect(await base.dump(dm)).toBe(55)
  })

  test('unhandled timeout', async () => {
    const base = Domain([handleInit(ctx => ctx.Ok(55, ctx.Timeout(1)))])
    const dm = base.init()
    await nextIdle()
    expect(await base.dump(dm)).toBe(55)
  })
})
