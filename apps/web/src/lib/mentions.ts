export type MentionUser = {
  id: string
  name: string
  email?: string
}

export type CommentSegment =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string; userId: string }

/** Highlight @Name tokens using known mentioned users (longest names first). */
export function segmentCommentBody(
  body: string,
  mentions: MentionUser[] = [],
): CommentSegment[] {
  if (!mentions.length) {
    return [{ type: 'text', value: body }]
  }

  const sorted = [...mentions].sort((a, b) => b.name.length - a.name.length)
  const pattern = new RegExp(
    `@(?:${sorted.map((m) => escapeRegExp(m.name)).join('|')})`,
    'g',
  )

  const segments: CommentSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: body.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    const name = raw.slice(1)
    const user = sorted.find((m) => m.name === name)
    if (user) {
      segments.push({ type: 'mention', value: raw, userId: user.id })
    } else {
      segments.push({ type: 'text', value: raw })
    }
    lastIndex = match.index + raw.length
  }

  if (lastIndex < body.length) {
    segments.push({ type: 'text', value: body.slice(lastIndex) })
  }

  return segments.length ? segments : [{ type: 'text', value: body }]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractMentionQuery(text: string, caret: number) {
  const before = text.slice(0, caret)
  const match = before.match(/@([^\s@]*)$/)
  if (!match) return null
  return {
    query: match[1] ?? '',
    start: caret - match[0].length,
    end: caret,
  }
}
