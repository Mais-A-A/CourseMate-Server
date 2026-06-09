import env from '../../env.js'

const EMBEDDING_MODEL = 'gemini-embedding-2'
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const BATCH_SIZE = 20

// Generate embedding for a single text (used for search queries)
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${env.GEMINI_EMBEDDING_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`)
  }

  const data = (await response.json()) as { embedding: { values: number[] } }
  return data.embedding.values
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Send up to 100 texts in a single API call
async function batchEmbed(texts: string[]): Promise<number[][]> {
  const requests = texts.map((text) => ({
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
  }))

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${env.GEMINI_EMBEDDING_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    },
  )

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const errorMessage = (errorBody as any)?.error?.message ?? 'Unknown error'
    throw new Error(`Batch embedding API error: ${response.status} — ${errorMessage}`)
  }

  const data = (await response.json()) as { embeddings: { values: number[] }[] }
  return data.embeddings.map((e) => e.values)
}

function extractRetryAfter(errorMessage: string): number {
  const match = errorMessage.match(/retry in ([\d.]+)s/i)
  return match?.[1] ? Math.ceil(parseFloat(match[1])) * 1000 + 2000 : 60000
}

async function batchEmbedWithRetry(texts: string[], retries = 4): Promise<number[][]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await batchEmbed(texts)
    } catch (err) {
      const isRateLimit = err instanceof Error && err.message.includes('429')
      if (isRateLimit && attempt < retries - 1) {
        const waitMs = extractRetryAfter(err instanceof Error ? err.message : '')
        await sleep(waitMs)
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

// Generate embeddings for multiple texts using batch API (100 per request)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const embeddings = await batchEmbedWithRetry(batch)
    allEmbeddings.push(...embeddings)

    // Pause between batches
    if (i + BATCH_SIZE < texts.length) {
      await sleep(3000)
    }
  }

  return allEmbeddings
}
