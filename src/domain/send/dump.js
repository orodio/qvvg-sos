import {send, spawn} from '../../registry.js'

export const DUMP = 'dump'

export const dump = address =>
  new Promise(resolve => {
    const from = spawn(async ctx => resolve((await ctx.receive()).value))
    send({to: address, from, meta: {type: DUMP}})
  })

export const isDump = message => message.meta.type === DUMP
