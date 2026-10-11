import type { Request, Response, NextFunction } from 'express'
import { resolveLang, translate, translateValidation, type Lang } from './messages.js'

declare module 'express-serve-static-core' {
  interface Request {
    lang: Lang
  }
}

/**
 * Sets `req.lang` and, for Arabic requests, translates the `error` / `message` strings of JSON
 * responses so controllers can keep returning plain English messages.
 */
export function i18n(req: Request, res: Response, next: NextFunction) {
  req.lang = resolveLang(req.query.lang, req.headers['accept-language'])
  res.setHeader('Content-Language', req.lang)
  res.vary('Accept-Language')
  if (req.lang === 'ar') {
    const json = res.json.bind(res)
    res.json = (body: unknown) => {
      if (body && typeof body === 'object' && !Array.isArray(body)) {
        const out: Record<string, unknown> = { ...(body as Record<string, unknown>) }
        for (const key of ['error', 'message']) {
          if (typeof out[key] === 'string') out[key] = translate(out[key] as string, 'ar')
        }
        out.error = translateFlattened(out.error)
        return json(out)
      }
      return json(body)
    }
  }
  next()
}

const tv = (list: unknown) => (Array.isArray(list) ? list.map((m) => (typeof m === 'string' ? translateValidation(m) : m)) : list)

/** Translates the `{ formErrors, fieldErrors }` object produced by Zod's `flatten()`. */
function translateFlattened(error: unknown) {
  if (!error || typeof error !== 'object') return error
  const e = error as { formErrors?: unknown; fieldErrors?: Record<string, unknown> }
  if (!('formErrors' in e) && !('fieldErrors' in e)) return error
  return {
    ...e,
    formErrors: tv(e.formErrors),
    fieldErrors: Object.fromEntries(Object.entries(e.fieldErrors ?? {}).map(([k, v]) => [k, tv(v)])),
  }
}
