import {send} from '../../registry.js'

export const TELL = 'tell'

export function tell(address, verb, msg) {
  return send({to: address, meta: {type: TELL, verb}}, msg)
}

export function isTell(message) {
  return message.meta.type === TELL
}
