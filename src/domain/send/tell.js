import {send} from '../../registry.js'

export const TELL = 'tell'

export const tell = (address, verb, msg) => send({to: address, meta: {type: TELL, verb}}, msg)

export const isTell = message => message.meta.type === TELL
