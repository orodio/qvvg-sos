const ident = v => v

function Signal(opts) {
  if (!(this instanceof Signal)) return new Signal(...arguments)
  this.signal = Signal.Blooms.stop || opts.signal
  this.state = opts.state || null
  this.reply = opts.reply || null
  this.continue = opts.continue || null
  this.timeout = opts.timeout || null
  this.reason = opts.reason || null
}

Signal.Blooms = {
  stop: 0b0,
  ok: 0b1,
  reply: 0b10,
  continue: 0b100,
  timeout: 0b1000,
}

Signal.matchSignal = match => signal => Boolean(signal.signal & match)

Signal.isOk = Signal.matchSignal(Signal.Blooms.ok)
Signal.isStop = signal => !Signal.isOk(signal)
Signal.hasReply = Signal.matchSignal(Signal.Blooms.reply)
Signal.hasContinue = Signal.matchSignal(Signal.Blooms.continue)
Signal.hasTimeout = Signal.matchSignal(Signal.Blooms.timeout)

Signal.scrubMatch = (match, key = null) => signal => {
  signal.signal = signal.signal & ~match
  if (key != null) signal[key] = null
  return signal
}
Signal.scrubReply = Signal.scrubMatch(Signal.Blooms.reply, 'reply')
Signal.scrubContinue = Signal.scrubMatch(Signal.Blooms.continue, 'continue')
Signal.scrubTimeout = Signal.scrubMatch(Signal.Blooms.timeout, 'timeout')

Signal.Ok = (state, mod = ident) => mod(Signal({signal: Signal.Blooms.ok, state}))
Signal.Stop = (state, reason = 'Undefined Reason') =>
  Signal({signal: Signal.Blooms.stop, reason, state})
Signal.Reply = (reply, state, mod = v => v) =>
  mod(Signal({signal: Signal.Blooms.ok | Signal.Blooms.reply, reply, state}))
Signal.Continue = (verb, ...args) => signal => {
  signal.signal = signal.signal | Signal.Blooms.continue
  signal.continue = {verb, args}
  return signal
}
Signal.Timeout = (ms, ...args) => signal => {
  signal.signal = signal.signal | Signal.Blooms.timeout
  signal.timeout = {ms, args}
  return signal
}

export default Signal
