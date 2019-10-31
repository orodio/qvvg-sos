import {spawn, send} from '../../registry.js'

export const ASK = 'ask'

export function ask(address, verb, msg) {
  return new Promise(function promAsk(resolve) {
    const from = spawn(async function waitForAskReply(ctx) {
      resolve((await ctx.receive()).value)
    })
    send({to: address, from, meta: {type: ASK, verb}}, msg)
  })
}

export function isAsk(message) {
  return message.meta.type === ASK
}
