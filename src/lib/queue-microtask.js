// source -- https://github.com/feross/queue-microtask
let promise

export default typeof queueMicrotask === 'function'
  ? queueMicrotask
  : // reuse resolved promise, and allocate it lazily
    cb =>
      (promise || (promise = Promise.resolve())).then(cb).catch(err =>
        setTimeout(() => {
          throw err
        }, 0)
      )
