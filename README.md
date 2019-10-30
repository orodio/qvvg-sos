# State Owned State

Free the state, so your views can focus on the visual stuff.

> People keep pretending they can make things hierarchical, categorizable and sequential when they can't. Everything is deeply intertwingled. _–Theodor Holm Nelson_

## Install

```
npm install --save @qvvg/sos
```

## Examples

Please see the `examples` directory for more.

```javascript
// counter-domain.js
import {
  Domain,
  label,
  withName,
  deps,
  config,
  broadcast,
  handleInit,
  handleTell,
  handleContinue,
} from '@qvvg/sos'
import * as api from '../api/counter.js'

export default Domain([
  label('counter'),
  withName(),

  deps(() => ({
    getCount: api.getCount,
    saveCount: api.saveCount,
  })),

  config('delta', 1),

  broadcast('count', state => ({
    id: state.id,
    count: state.count,
  })),

  handleInit(async (ctx, id) => {
    const count = await ctx.deps.getCount(id)
    const subs = new Set()
    return ctx.Ok({id, count, subs})
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

  handleContinue('save', (ctx, state) => {
    ctx.deps.saveCount(state.id, state.count)
    return ctx.Ok(state)
  }),
])
```

```javascript
// counter-sidecar.js
import {withSidecar, label, handleInit, handleTell, handleTerminate} from '@qvvg/sidecar'
import counter from './counter-domain.js'

export default withSidecar(
  label('counterSidecar'),

  deps(() => ({
    counter,
  })),

  handleInit((ctx, props) => {
    ctx.deps.counter.init(props.id)
    ctx.deps.counter.tell(props.id, 'subscribe', ctx.self())
    return ctx.Ok({id: props.id})
  }),

  handleTell(counter.events.count, (ctx, state, {count}) => {
    ctx.setProps({count})
    return ctx.Ok(state)
  }),

  handleTerminate((ctx, state, reason) => {
    ctx.deps.counter.tell(state.id, 'unsubscribe', ctx.self())
    return reason
  })
)
```

```javascript
// counter-component
import React from 'react'
import withCounter from './counter-sidecar.js'
import counter from './counter-domain.js'

export const Counter = ({id, count, inc, dec}) =>
  count == null ? null : (
    <div>
      <h3>
        {id}: {count}
      </h3>
      <div>
        <button onClick={() => dec(id, 5)}>-5</button>
        <button onClick={() => dec(id)}>-1</button>
        <button onClick={() => inc(id)}>+1</button>
        <button onClick={() => inc(id, 5)}>+5</button>
      </div>
    </div>
  )

Counter.defaultProps = {
  count: null,
  inc: (id, ...args) => counter.tell(id, 'inc', ...args),
  dec: (id, ...args) => counter.tell(id, 'dec', ...args),
}

export default withCounter(Counter)
```

```javascript
import React from 'react'
import Counter from './counter-component.js'

export default () => (
  <div>
    <Counter id="foo" />
    <Counter id="bar" />
    <Counter id="baz" />
  </div>
)
```
