export function parseModelResponseContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') return part
        if (
          typeof part === 'object' &&
          part !== null &&
          'text' in part &&
          typeof (part as { text?: unknown }).text === 'string'
        ) {
          return (part as { text: string }).text
        }
        return ''
      })
      .join('')
      .trim()

    return text || 'I could not generate a response.'
  }

  return 'I could not generate a response.'
}
