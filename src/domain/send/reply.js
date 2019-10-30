import {send} from '../../registry.js'

export const REPLY = 'reply'

export function reply(address, value) {
  return send({to: address, meta: {type: REPLY}}, value)
}

export function isReply(message) {
  return message.meta.type === REPLY
}
