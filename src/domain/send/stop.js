import {send} from '../../registry.js'

export const STOP = 'stop'

export function stop(address, reason = 'unspecified') {
  return send({to: address, meta: {type: STOP}}, reason)
}

export function isStop(message) {
  return message.meta.type === STOP
}
