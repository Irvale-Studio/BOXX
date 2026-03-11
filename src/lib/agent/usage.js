/**
 * Agent Usage Tracking — Track AI token spend per user per month.
 * Free tier: $2.00/month. Pricing based on Claude Haiku 4.5.
 */
import { supabaseAdmin } from '@/lib/supabase/admin'

// Haiku 4.5 pricing (USD per token)
const INPUT_COST = 1.00 / 1_000_000   // $1.00 per 1M input tokens
const OUTPUT_COST = 5.00 / 1_000_000  // $5.00 per 1M output tokens

const MONTHLY_LIMIT_USD = 2.00

function currentMonth() {
  return new Date().toISOString().slice(0, 7) // '2026-03'
}

/**
 * Calculate cost from token counts
 */
export function calculateCost(inputTokens, outputTokens) {
  return (inputTokens * INPUT_COST) + (outputTokens * OUTPUT_COST)
}

/**
 * Get current month's usage for a user.
 * Returns { cost_usd, input_tokens, output_tokens, limit_usd, limited }
 */
export async function getUsage(userId) {
  const month = currentMonth()

  try {
    const { data } = await supabaseAdmin
      .from('agent_usage')
      .select('input_tokens, output_tokens, cost_usd')
      .eq('user_id', userId)
      .eq('month', month)
      .single()

    const cost = data ? parseFloat(data.cost_usd) : 0
    return {
      cost_usd: cost,
      input_tokens: data?.input_tokens || 0,
      output_tokens: data?.output_tokens || 0,
      limit_usd: MONTHLY_LIMIT_USD,
      limited: cost >= MONTHLY_LIMIT_USD,
    }
  } catch {
    return {
      cost_usd: 0,
      input_tokens: 0,
      output_tokens: 0,
      limit_usd: MONTHLY_LIMIT_USD,
      limited: false,
    }
  }
}

/**
 * Check if user has exceeded monthly limit.
 */
export async function checkUsageLimit(userId) {
  const usage = await getUsage(userId)
  return usage.limited
}

/**
 * Record token usage after an API call.
 * Uses upsert to atomically increment counters.
 */
export async function trackUsage(userId, inputTokens, outputTokens) {
  const month = currentMonth()
  const cost = calculateCost(inputTokens, outputTokens)

  try {
    // Try to increment existing row
    const { data: existing } = await supabaseAdmin
      .from('agent_usage')
      .select('id, input_tokens, output_tokens, cost_usd')
      .eq('user_id', userId)
      .eq('month', month)
      .single()

    if (existing) {
      await supabaseAdmin
        .from('agent_usage')
        .update({
          input_tokens: existing.input_tokens + inputTokens,
          output_tokens: existing.output_tokens + outputTokens,
          cost_usd: parseFloat(existing.cost_usd) + cost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin
        .from('agent_usage')
        .insert({
          user_id: userId,
          month,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cost_usd: cost,
        })
    }
  } catch (err) {
    console.error('[agent/usage] Track error:', err.message)
  }
}
