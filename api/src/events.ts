import { EventEmitter } from 'events'

export const rankingBus = new EventEmitter()
rankingBus.setMaxListeners(100)

export function emitRankingUpdate() {
  rankingBus.emit('update')
}
