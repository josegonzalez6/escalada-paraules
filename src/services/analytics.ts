export interface GameEvent {
  type: 'daily_started' | 'daily_finished' | 'random_started' | 'random_finished' | 'share'
  lang: string
  dateKey: string
  score?: number
  timeSeconds?: number
}

function send(event: GameEvent): void {
  try {
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__analytics) {
      ((window as unknown as Record<string, unknown>).__analytics as (e: GameEvent) => void)(event)
    }
  } catch { /* never break */ }
}

export function trackDailyStarted(lang: string, dateKey: string): void {
  send({ type: 'daily_started', lang, dateKey })
}

export function trackDailyFinished(lang: string, dateKey: string, score: number, timeSeconds?: number): void {
  send({ type: 'daily_finished', lang, dateKey, score, timeSeconds })
}

export function trackRandomFinished(lang: string, dateKey: string, score: number): void {
  send({ type: 'random_finished', lang, dateKey, score })
}

export function trackShare(lang: string, dateKey: string): void {
  send({ type: 'share', lang, dateKey })
}
