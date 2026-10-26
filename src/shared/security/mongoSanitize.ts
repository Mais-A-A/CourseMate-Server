import type { Request, Response, NextFunction } from 'express'

/** Removes keys starting with "$" (operators such as $ne, $gt, $where) from user input to stop NoSQL injection. */
function strip(value: unknown, depth = 0): unknown {
  if (depth > 10 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => strip(v, depth + 1))
  const clean: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k.startsWith('$') || k.includes('\0')) continue
    clean[k] = strip(v, depth + 1)
  }
  return clean
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction) {
  if (req.body) req.body = strip(req.body)
  // In Express 5 req.query is a getter, so mutate it in place instead of reassigning.
  const query = req.query as Record<string, unknown>
  for (const key of Object.keys(query)) {
    if (key.startsWith('$')) delete query[key]
    else query[key] = strip(query[key])
  }
  next()
}
