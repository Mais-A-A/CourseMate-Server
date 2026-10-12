import { Event, type EventType } from './event.model.js'

/** Fire-and-forget: recording an event must never slow down or break a request. */
export function trackEvent(
  type: EventType,
  studentNo: string | null | undefined,
  meta: Record<string, unknown> = {},
): void {
  Event.create({ type, ...(studentNo ? { studentNo } : {}), meta }).catch((error) =>
    console.error('[Events] failed to record event', type, error),
  )
}
