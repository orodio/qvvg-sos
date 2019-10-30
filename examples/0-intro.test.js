import {Domain, label, withName, handleInit, handleTell, handleAsk} from '../src/main.js'

describe('intro', () => {
  // A Domain by itself still works, it just cant really do anything
  test('does nothing', async () => {
    // first we define out definition.
    // this one doesn't do anything, but this
    // is where we would define what it means to be our domain.
    const definition = Domain()

    // We can create an instance of our domain.
    // it returns an address where we can find it later
    const instanceOne = definition.init()

    // Because our Domain doesnt have a `withName` modifier
    // everytime we call our init function we will get a new
    // instance with a new address
    const instanceTwo = definition.init()
    expect(instanceOne).not.toBe(instanceTwo)

    // In our tests we can see the current value of
    // our instance with Domain.dump(address) function
    // Becuase we didnt specifiy an initial value it will
    // be null
    expect(await Domain.dump(instanceOne)).toBe(null)

    // we can pass in an initial value when we initialize it
    const instanceThree = definition.init(99)
    expect(await Domain.dump(instanceThree)).toBe(99)
  })

  test('fetching data based on an id', async () => {
    // mock out an api call
    const getThingById = jest.fn(() => Promise.resolve(99))

    // Domain takes an array of modifiers we can use to
    // better define what it means to be our domain
    const definition = Domain([
      // handleInit is a modifier that lets us explain
      // what happens when our instance comes into existence
      // and before it handles any messages
      // handleInit should only ever be called once per instance
      handleInit(async (ctx, initialValue) => {
        // We will start by fetching a value from the api that corresponds with
        // our initial value
        const internalValue = await getThingById(initialValue)

        // We then return what our internal state should be.
        // We wrap it in an Ok signal though so our instance knows
        // that it can start processing message. With the exception of the
        // handleTerminate modifier, all of our `handle*` modifiers
        // need to return the next value wrapped in a signal. Most of
        // the time you will be using the Ok signal
        return ctx.Ok(internalValue)
      }),
    ])

    // we can create an instance of our domain, in this case we will get
    // an internal value based on what we pass into init
    const instanceOne = definition.init('foo')
    // our instance should now have an internal value of what our api returned
    // and our api call should have been called once with the id we passed in
    expect(await Domain.dump(instanceOne)).toBe(99)
    expect(getThingById).toHaveBeenCalledTimes(1)
    expect(getThingById).toHaveBeenLastCalledWith('foo')

    // like our very first example, because we havent used the withName modifier
    // if we were to create another instance of our definition they will be seperate
    // instances, even if we supply the same initial value
    const instanceTwo = definition.init('foo')
    expect(await Domain.dump(instanceTwo)).toBe(99)
    expect(getThingById).toHaveBeenCalledTimes(2)
    expect(getThingById).toHaveBeenLastCalledWith('foo')
  })

  test('naming our instances', async () => {
    const getThingById = jest.fn(() => Promise.resolve(99))
    // using a naming strategy gives us the ability to reuse an instance
    // if it already exists

    // to name an instance we need to add in two modifiers to the domain
    // the label which represents the definition, and the withName which
    // represents the instance. If we have a withName modifier we call
    // the domain a "named domain"
    const definition = Domain([
      // label is a modifier that takes a string. it represents the
      // name of the definition
      label('definition'),

      // withName is a modifier, it takes a function. it represents
      // the name of the instance, it is passed the initial value
      // and the label
      withName((initial, label) => `${label}|${initial}`),

      handleInit(async (ctx, id) => {
        const value = await getThingById(id)
        return ctx.Ok(value)
      }),
    ])

    // when we initialize a named domain its address will be its name
    const instanceOne = definition.init('foo')
    expect(instanceOne).toBe('definition|foo')
    // like the unnamed domain our api call will have happend
    expect(await Domain.dump(instanceOne)).toBe(99)
    expect(getThingById).toHaveBeenCalledTimes(1)
    expect(getThingById).toHaveBeenLastCalledWith('foo')

    // but if we are to initialize another one with the same initial value
    // it will reuse the original instance, not calling the api again because
    // the name already exists
    const instanceTwo = definition.init('foo')
    expect(instanceTwo).toBe(instanceOne)
    expect(await Domain.dump(instanceTwo)).toBe(99)
    expect(getThingById).toHaveBeenCalledTimes(1)
    expect(getThingById).toHaveBeenLastCalledWith('foo')
  })

  test('sending messages using tell', async () => {
    // we send messages to our instance using a tell
    // an in our domain we define how we handle tell
    // messages with a handleTell modifier
    const counter = Domain([
      handleTell('inc', (ctx, count) => {
        // we wrap the next state or our instance in
        // an Ok signal so our instance knows we are ready
        // to deal with the next message
        return ctx.Ok(count + 1)
      }),

      handleTell('dec', (ctx, count) => {
        return ctx.Ok(count - 1)
      }),
    ])

    // a counter with an initial value of 5
    const instanceOne = counter.init(5)
    expect(await Domain.dump(instanceOne)).toBe(5)

    // we can send a tell using Domain.tell
    Domain.tell(instanceOne, 'inc')
    expect(await Domain.dump(instanceOne)).toBe(6)
    Domain.tell(instanceOne, 'dec')
    expect(await Domain.dump(instanceOne)).toBe(5)
  })

  test('getting data out with an ask', async () => {
    // using dump outside of the tests should be considered
    // a code smell. But dont worry we have another way of
    // getting our data out.
    const counter = Domain([
      handleInit((ctx, id) => {
        return ctx.Ok({id, count: 50})
      }),

      handleAsk('count', (ctx, state) => {
        // Our first signal other than Ok.
        // The reply signal will resolve the
        // ask with the first argument, and then
        // return an Ok signal with the second argument
        return ctx.Reply(state.count, state)
      }),

      handleAsk('id', (ctx, state) => {
        // ctx in this case also gets a reply function (lowercase)
        // it will directly resolve the ask
        ctx.reply(state.id)
        // we return an Ok signal letting the instance
        // know that its okay to handle more messages
        return ctx.Ok(state)
      }),
    ])

    const instanceOne = counter.init('foo')
    expect(await Domain.ask(instanceOne, 'count')).toBe(50)
    expect(await Domain.ask(instanceOne, 'id')).toBe('foo')
  })

  test('tell and ask named instances', async () => {
    // named domains are a little special, because they are
    // named we can make a couple more assumptions about them
    // lets look at a named domain
    const getCountFromApi = jest.fn(() => Promise.resolve(52))

    // I dont think there is anything here you havent already seend
    const counter = Domain([
      label('c1'),
      withName((id, label) => `${label}|${id}`),

      handleInit(async (ctx, id) => {
        const count = await getCountFromApi(id)
        return ctx.Ok({id, count})
      }),

      handleTell('inc', (ctx, state) => {
        state.count += 1
        return ctx.Ok(state)
      }),

      handleTell('dec', (ctx, state) => {
        state.count -= 1
        return ctx.Ok(state)
      }),

      handleAsk('count', (ctx, state) => {
        return ctx.Reply(state.count, state)
      }),

      handleAsk('id', (ctx, state) => {
        return ctx.Reply(state.id, state)
      }),
    ])

    const instance = counter.init('bar')
    // Our Domain.ask and Domain.tell still work as expected
    expect(await Domain.dump(instance)).toEqual({id: 'bar', count: 52})
    Domain.tell(instance, 'inc')
    expect(await Domain.ask(instance, 'count')).toBe(53)

    // But because of how withName works, we can also reference it from the initial value
    Domain.tell(counter.withName('bar'), 'inc')
    expect(await Domain.ask(counter.withName('bar'), 'count')).toBe(54)

    // This is super common so there is a shortcut.
    counter.tell('bar', 'inc')
    expect(await counter.ask('bar', 'count')).toBe(55)
  })
})
