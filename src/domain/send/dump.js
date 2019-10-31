import {send, spawn} from '../../registry.js'

export const DUMP = 'dump'

export function dump(address) {
  return new Promise(resolve => {
    const from = spawn(async function waitForDumpReply(ctx) {
      resolve((await ctx.receive()).value)
    })
    send({to: address, from, meta: {type: DUMP}})
  })
}

export function isDump(message) {
  return message.meta.type === DUMP
}
