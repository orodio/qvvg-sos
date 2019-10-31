var highestPid = 0b0

export function genMailbox() {
  const pid = (highestPid += 0b1)
  const queue = []
  var next

  async function send(msg) {
    queue.push(msg)
    if (next) {
      next(queue.shift())
      next = undefined
    }
  }

  function receive() {
    return new Promise(function promReceive(resolve) {
      const msg = queue.shift()
      if (msg) {
        return resolve(msg)
      }
      next = resolve
    })
  }

  return {pid, send, receive}
}
