import {send} from '../../registry.js'

export const STOP = 'stop'

export const stop = (address, reason = 'unspecified') => send({to: address, meta: {type: STOP}}, reason)

export const isStop = message => message.meta.type === STOP
