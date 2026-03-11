import { createElement, Fragment } from 'react'

/**
 * Lightweight markdown renderer for agent chat messages.
 * Handles: bold, italic, code, bullet/numbered lists, headers.
 */

const INLINE_RULES = [
  // Bold + italic
  { pattern: /\*\*\*(.+?)\*\*\*/g, render: (_, t) => createElement('strong', null, createElement('em', null, t)) },
  // Bold
  { pattern: /\*\*(.+?)\*\*/g, render: (_, t) => createElement('strong', { className: 'font-semibold' }, t) },
  // Italic
  { pattern: /\*(.+?)\*/g, render: (_, t) => createElement('em', null, t) },
  // Inline code
  { pattern: /`([^`]+)`/g, render: (_, t) => createElement('code', { className: 'bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono' }, t) },
]

function parseInline(text) {
  // Process inline rules by splitting on matches
  let parts = [text]

  for (const rule of INLINE_RULES) {
    const next = []
    for (const part of parts) {
      if (typeof part !== 'string') {
        next.push(part)
        continue
      }
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags)
      let lastIndex = 0
      let match
      while ((match = regex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          next.push(part.slice(lastIndex, match.index))
        }
        next.push(rule.render(match[0], match[1]))
        lastIndex = regex.lastIndex
      }
      if (lastIndex < part.length) {
        next.push(part.slice(lastIndex))
      }
    }
    parts = next
  }

  return parts
}

export function renderMarkdown(text) {
  if (!text) return null

  const lines = text.split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Headers
    if (line.startsWith('### ')) {
      blocks.push(createElement('p', { key: i, className: 'font-semibold text-foreground mt-3 mb-1' }, parseInline(line.slice(4))))
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push(createElement('p', { key: i, className: 'font-semibold text-foreground mt-3 mb-1' }, parseInline(line.slice(3))))
      i++
      continue
    }

    // Bullet list
    if (/^[-*] /.test(line)) {
      const items = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(createElement('li', { key: i, className: 'ml-4 list-disc' }, parseInline(lines[i].replace(/^[-*] /, ''))))
        i++
      }
      blocks.push(createElement('ul', { key: `ul-${i}`, className: 'space-y-0.5 my-1' }, items))
      continue
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(createElement('li', { key: i, className: 'ml-4 list-decimal' }, parseInline(lines[i].replace(/^\d+\. /, ''))))
        i++
      }
      blocks.push(createElement('ol', { key: `ol-${i}`, className: 'space-y-0.5 my-1' }, items))
      continue
    }

    // Empty line
    if (!line.trim()) {
      blocks.push(createElement('br', { key: i }))
      i++
      continue
    }

    // Regular paragraph
    blocks.push(createElement('p', { key: i, className: 'my-0.5' }, parseInline(line)))
    i++
  }

  return createElement(Fragment, null, blocks)
}
