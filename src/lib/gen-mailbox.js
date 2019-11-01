var highestPid = 0b0
var awaiting = 0

export function genMailbox() {
  const pid = (highestPid += 0b1)
  const queue = []
  var next

  async function send(msg) {
    queue.push(msg)
    ++awaiting
    if (next) {
      --awaiting
      next(queue.shift())
      next = undefined
    }
  }

  function receive() {
    return new Promise(function promReceive(resolve) {
      const msg = queue.shift()
      if (msg) {
        --awaiting
        return resolve(msg)
      }
      next = resolve
    })
  }

  function size() {
    return queue.length
  }

  return {pid, send, receive, size}
}

export function enqueued() {
  return awaiting
}

export function isIdle() {
  return awaiting <= 0
}
