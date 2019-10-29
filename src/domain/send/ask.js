import {spawn, send} from '../../registry.js'

export const ASK = 'ask'

export const ask = (address, verb, msg) =>
  new Promise(resolve => {
    const from = spawn(async ctx => resolve((await ctx.receive()).value))
    send({to: address, from, meta: {type: ASK, verb}}, msg)
  })

export const isAsk = message => message.meta.type === ASK
