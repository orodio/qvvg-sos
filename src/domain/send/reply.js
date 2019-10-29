import {send} from '../../registry.js'

export const REPLY = 'reply'

export const reply = (address, value) => send({to: address, meta: {type: REPLY}}, value)

export const isReply = message => message.meta.type === REPLY
