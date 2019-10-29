var highestPid = 0b0

export const genMailbox = () => {
  const pid = (highestPid += 0b1)
  const queue = []
  var next

  const send = async msg => {
    queue.push(msg)
    if (next) {
      next(queue.shift())
      next = undefined
    }
  }

  const receive = () =>
    new Promise(resolve => {
      const msg = queue.shift()
      if (msg) {
        return resolve(msg)
      }
      next = resolve
    })

  return {pid, send, receive}
}
