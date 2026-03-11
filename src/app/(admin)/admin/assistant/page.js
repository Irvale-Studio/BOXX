'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  "What's on the schedule this week?",
  "How's the studio doing this month?",
  "Who hasn't booked in a while?",
  "Show me members with active credits",
]

export default function AssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSend(text) {
    const msg = text || input.trim()
    if (!msg || loading) return

    setInput('')
    setError(null)

    const userMessage = { role: 'user', content: msg }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      // Build API messages (just role + content strings for Claude)
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/admin/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        toolResults: data.toolResults,
      }

      setMessages([...updatedMessages, assistantMessage])
    } catch {
      setError('Failed to reach the assistant. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Studio Assistant</h1>
          <p className="text-sm text-muted mt-0.5">Manage your studio with natural language</p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => setMessages([])}
          >
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="text-4xl mb-4">🥊</div>
            <h2 className="text-lg font-semibold text-foreground mb-2">How can I help?</h2>
            <p className="text-sm text-muted max-w-md mb-6">
              I can manage your schedule, look up members, check stats, send emails, and more. Just ask.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-left text-sm px-4 py-3 rounded-lg border border-card-border bg-card hover:bg-white/[0.04] hover:border-accent/30 transition-colors text-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3',
              msg.role === 'user'
                ? 'bg-accent/15 text-foreground'
                : 'bg-card border border-card-border text-foreground'
            )}>
              {/* Tool results (show as subtle badges) */}
              {msg.toolResults?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {msg.toolResults.map((tr, j) => (
                    <span
                      key={j}
                      className={cn(
                        'text-[10px] font-medium px-2 py-0.5 rounded-full',
                        tr.result.success
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      )}
                    >
                      {tr.tool.replace(/_/g, ' ')}
                      {tr.result.success ? ' ✓' : ' ✗'}
                    </span>
                  ))}
                </div>
              )}

              {/* Message text */}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-card-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-[85%]">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-card-border pt-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-lg bg-card border border-card-border px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 disabled:opacity-50"
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 shrink-0"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted mt-2 text-center">
          AI assistant — actions are logged. Double-check important operations.
        </p>
      </div>
    </div>
  )
}
