import {send} from '../../registry.js'

export const TIMEOUT = 'timeout'

export function timeout(self, ms, args) {
  return send({to: self, from: self, meta: {type: TIMEOUT}}, {ms, args})
}

export function isTimeout(message) {
  return message.meta.type === TIMEOUT
}
