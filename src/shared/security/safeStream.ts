import { redactSecrets } from './promptGuard.js'

export const FALLBACK_MESSAGE =
  'عذراً، المساعد غير متاح حالياً بسبب ضغط أو عطل مؤقت. يرجى المحاولة بعد قليل.\n' +
  'Sorry, the assistant is temporarily unavailable. Please try again in a moment.'

export const INTERRUPTED_MESSAGE =
  '\n\n انقطع الرد قبل أن يكتمل. يرجى إعادة إرسال سؤالك. / The reply was interrupted, please resend your question.'

const CHUNK_TIMEOUT_MS = 45_000
const MAX_HELD_CHARS = 400

function nextWithTimeout<T>(it: AsyncIterator<T>, ms: number): Promise<IteratorResult<T>> {
  let timer: NodeJS.Timeout
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI response timed out')), ms)
  })
  return Promise.race([it.next(), timeout]).finally(() => clearTimeout(timer))
}

/**
 * Wraps a reply stream so that:
 *  - a failure (model down, quota, Mongo error, timeout) becomes a friendly message, never a raw error;
 *  - a stalled stream is cut after CHUNK_TIMEOUT_MS of silence;
 *  - secrets are redacted from every chunk.
 * The real error is logged server-side only.
 */
export async function* safeStream(
  source: AsyncGenerator<string>,
  logContext: string,
  onError?: (error: unknown) => void,
): AsyncGenerator<string> {
  let emitted = false
  // Secrets contain no whitespace, so only text up to the last whitespace is released; the trailing
  // partial word waits for the next chunk. This keeps a secret split across chunks from slipping through.
  let pending = ''
  try {
    while (true) {
      const { value, done } = await nextWithTimeout(source, CHUNK_TIMEOUT_MS)
      if (done) break
      pending += value
      const cut = Math.max(pending.lastIndexOf(' '), pending.lastIndexOf('\n'), pending.lastIndexOf('\t'))
      // also release if one "word" grows implausibly long without whitespace
      const releaseAt = cut >= 0 ? cut + 1 : pending.length > MAX_HELD_CHARS ? pending.length : 0
      if (releaseAt > 0) {
        emitted = true
        yield redactSecrets(pending.slice(0, releaseAt))
        pending = pending.slice(releaseAt)
      }
    }
    if (pending) {
      emitted = true
      yield redactSecrets(pending)
    }
  } catch (error) {
    console.error(`[Chat] stream failed (${logContext}):`, error)
    onError?.(error)
    yield emitted ? INTERRUPTED_MESSAGE : FALLBACK_MESSAGE
    await source.return?.(undefined).catch(() => undefined)
  }
}
