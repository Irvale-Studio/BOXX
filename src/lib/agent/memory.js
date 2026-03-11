/**
 * Agent Memory — Learns what the admin usually asks for.
 * Stores top patterns per user and uses them for dynamic suggestions.
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_PATTERNS = 20
const DEFAULT_SUGGESTIONS = [
  "What's on the schedule this week?",
  "How's the studio doing this month?",
  "Show me today's classes",
  "Search for a member",
]

/**
 * Update the user's memory patterns after each message.
 */
export async function updateMemory(userId, userMessage) {
  try {
    const text = userMessage.trim()
    if (text.length < 5) return // skip very short messages like "yes", "ok"

    // Fetch or create memory
    const { data: existing } = await supabaseAdmin
      .from('agent_memory')
      .select('patterns')
      .eq('user_id', userId)
      .single()

    const patterns = existing?.patterns || []
    const normalised = text.toLowerCase().slice(0, 60)
    const today = new Date().toISOString().split('T')[0]

    // Check if similar pattern exists (compare first 30 chars)
    const prefix = normalised.slice(0, 30)
    const idx = patterns.findIndex((p) => p.text.toLowerCase().slice(0, 30) === prefix)

    if (idx >= 0) {
      // Bump existing pattern
      patterns[idx].count += 1
      patterns[idx].last_used = today
      // Keep the most recent wording
      if (text.length <= 80) patterns[idx].text = text
    } else {
      const entry = { text: text.slice(0, 80), count: 1, last_used: today }

      if (patterns.length < MAX_PATTERNS) {
        patterns.push(entry)
      } else {
        // Replace least-used, oldest pattern
        patterns.sort((a, b) => a.count - b.count || a.last_used.localeCompare(b.last_used))
        patterns[0] = entry
      }
    }

    // Upsert
    await supabaseAdmin
      .from('agent_memory')
      .upsert({
        user_id: userId,
        patterns,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
  } catch (err) {
    // Memory is best-effort — don't break the chat
    console.error('[agent/memory] Error:', err.message)
  }
}

/**
 * Get dynamic suggestions for the user based on their usage patterns.
 * Returns top 4 most-used patterns, padded with defaults.
 */
export async function getSuggestions(userId) {
  try {
    const { data } = await supabaseAdmin
      .from('agent_memory')
      .select('patterns')
      .eq('user_id', userId)
      .single()

    const patterns = data?.patterns || []

    // Sort by count descending
    const sorted = [...patterns].sort((a, b) => b.count - a.count)
    const suggestions = sorted.slice(0, 4).map((p) => p.text)

    // Pad with defaults
    if (suggestions.length < 4) {
      for (const d of DEFAULT_SUGGESTIONS) {
        if (suggestions.length >= 4) break
        if (!suggestions.some((s) => s.toLowerCase() === d.toLowerCase())) {
          suggestions.push(d)
        }
      }
    }

    return suggestions
  } catch {
    return DEFAULT_SUGGESTIONS
  }
}
