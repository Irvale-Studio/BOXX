import { supabaseAdmin } from '@/lib/supabase/admin'

// ─── Free Tier Limits ────────────────────────────────────────────────────────
// Based on Vercel Hobby, Resend Free, and Supabase Free plans

const LIMITS = {
  emails_per_day: 100,       // Resend free tier
  emails_per_month: 3000,    // Resend free tier
  active_members: 500,       // Supabase MAU / practical limit
  classes_per_month: 200,    // Serverless budget
  active_instructors: 20,
  active_class_types: 30,
  active_packs: 20,
  file_storage_mb: 1000,     // Supabase free: 1 GB
}

const WARN_THRESHOLD = 0.8 // Warn at 80%

const PLATFORM_ALERT_EMAIL = 'jacobmhorgan@gmail.com'

// ─── Counter helpers (stored in studio_settings) ─────────────────────────────

async function getCounter(key) {
  if (!supabaseAdmin) return 0
  const { data } = await supabaseAdmin
    .from('studio_settings')
    .select('value')
    .eq('key', key)
    .single()
  return parseInt(data?.value || '0', 10)
}

async function setCounter(key, value) {
  if (!supabaseAdmin) return
  await supabaseAdmin
    .from('studio_settings')
    .upsert({ key, value: String(value) })
}

async function incrementCounter(key) {
  if (!supabaseAdmin) return
  const current = await getCounter(key)
  await setCounter(key, current + 1)
  return current + 1
}

// ─── Reset counters (called by cron or on first request of new period) ───────

function getMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getDayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

async function ensureCounterPeriod() {
  if (!supabaseAdmin) return

  const currentMonth = getMonthKey()
  const currentDay = getDayKey()

  const storedMonth = await getCounter('limit_month_key').then(String)
  const storedDay = await getCounter('limit_day_key').then(String)

  if (storedMonth !== currentMonth) {
    await setCounter('limit_month_key', currentMonth)
    await setCounter('emails_sent_month', 0)
  }

  if (storedDay !== currentDay) {
    await setCounter('limit_day_key', currentDay)
    await setCounter('emails_sent_day', 0)
  }
}

// ─── Email tracking ──────────────────────────────────────────────────────────

export async function trackEmailSent() {
  await ensureCounterPeriod()
  const dailyCount = await incrementCounter('emails_sent_day')
  const monthlyCount = await incrementCounter('emails_sent_month')

  // Check if we just hit a threshold and should alert
  if (dailyCount === LIMITS.emails_per_day ||
      monthlyCount === LIMITS.emails_per_month ||
      dailyCount === Math.floor(LIMITS.emails_per_day * WARN_THRESHOLD) ||
      monthlyCount === Math.floor(LIMITS.emails_per_month * WARN_THRESHOLD)) {
    await sendPlatformAlert('email_limit', {
      dailyCount,
      dailyLimit: LIMITS.emails_per_day,
      monthlyCount,
      monthlyLimit: LIMITS.emails_per_month,
    })
  }

  return { dailyCount, monthlyCount }
}

export async function checkEmailLimit() {
  await ensureCounterPeriod()
  const daily = await getCounter('emails_sent_day')
  const monthly = await getCounter('emails_sent_month')

  if (daily >= LIMITS.emails_per_day) {
    return { allowed: false, reason: `Daily email limit reached (${LIMITS.emails_per_day}/day)` }
  }
  if (monthly >= LIMITS.emails_per_month) {
    return { allowed: false, reason: `Monthly email limit reached (${LIMITS.emails_per_month}/month)` }
  }
  return { allowed: true }
}

// ─── Resource limit checks ───────────────────────────────────────────────────

export async function checkMemberLimit() {
  if (!supabaseAdmin) return { allowed: true }
  const { count } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .in('role', ['member', 'admin', 'employee', 'owner'])

  if (count >= LIMITS.active_members) {
    await sendPlatformAlert('member_limit', { count, limit: LIMITS.active_members })
    return { allowed: false, reason: `Active member limit reached (${LIMITS.active_members})` }
  }
  return { allowed: true, count }
}

export async function checkClassLimit() {
  if (!supabaseAdmin) return { allowed: true }
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const { count } = await supabaseAdmin
    .from('class_schedule')
    .select('id', { count: 'exact', head: true })
    .gte('starts_at', monthStart.toISOString())
    .lte('starts_at', monthEnd.toISOString())

  if (count >= LIMITS.classes_per_month) {
    await sendPlatformAlert('class_limit', { count, limit: LIMITS.classes_per_month })
    return { allowed: false, reason: `Monthly class limit reached (${LIMITS.classes_per_month}/month)` }
  }
  return { allowed: true, count }
}

export async function checkInstructorLimit() {
  if (!supabaseAdmin) return { allowed: true }
  const { count } = await supabaseAdmin
    .from('instructors')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)

  if (count >= LIMITS.active_instructors) {
    return { allowed: false, reason: `Active instructor limit reached (${LIMITS.active_instructors})` }
  }
  return { allowed: true, count }
}

export async function checkClassTypeLimit() {
  if (!supabaseAdmin) return { allowed: true }
  const { count } = await supabaseAdmin
    .from('class_types')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)

  if (count >= LIMITS.active_class_types) {
    return { allowed: false, reason: `Active class type limit reached (${LIMITS.active_class_types})` }
  }
  return { allowed: true, count }
}

export async function checkPackLimit() {
  if (!supabaseAdmin) return { allowed: true }
  const { count } = await supabaseAdmin
    .from('class_packs')
    .select('id', { count: 'exact', head: true })
    .eq('active', true)

  if (count >= LIMITS.active_packs) {
    return { allowed: false, reason: `Active pack limit reached (${LIMITS.active_packs})` }
  }
  return { allowed: true, count }
}

// ─── Get all usage for dashboard ─────────────────────────────────────────────

export async function getUsageSummary() {
  if (!supabaseAdmin) return null

  await ensureCounterPeriod()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [
    emailsDay,
    emailsMonth,
    membersRes,
    classesRes,
    instructorsRes,
    classTypesRes,
    packsRes,
  ] = await Promise.all([
    getCounter('emails_sent_day'),
    getCounter('emails_sent_month'),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).in('role', ['member', 'admin', 'employee', 'owner']),
    supabaseAdmin.from('class_schedule').select('id', { count: 'exact', head: true }).gte('starts_at', monthStart.toISOString()).lte('starts_at', monthEnd.toISOString()),
    supabaseAdmin.from('instructors').select('id', { count: 'exact', head: true }).eq('active', true),
    supabaseAdmin.from('class_types').select('id', { count: 'exact', head: true }).eq('active', true),
    supabaseAdmin.from('class_packs').select('id', { count: 'exact', head: true }).eq('active', true),
  ])

  const usage = [
    { key: 'emails_day', label: 'Emails today', current: emailsDay, limit: LIMITS.emails_per_day },
    { key: 'emails_month', label: 'Emails this month', current: emailsMonth, limit: LIMITS.emails_per_month },
    { key: 'members', label: 'Active members', current: membersRes.count || 0, limit: LIMITS.active_members },
    { key: 'classes', label: 'Classes this month', current: classesRes.count || 0, limit: LIMITS.classes_per_month },
    { key: 'instructors', label: 'Active instructors', current: instructorsRes.count || 0, limit: LIMITS.active_instructors },
    { key: 'class_types', label: 'Active class types', current: classTypesRes.count || 0, limit: LIMITS.active_class_types },
    { key: 'packs', label: 'Active packs', current: packsRes.count || 0, limit: LIMITS.active_packs },
  ]

  // Flag any warnings or breaches
  const warnings = usage.filter((u) => u.current >= u.limit * WARN_THRESHOLD)
  const breached = usage.filter((u) => u.current >= u.limit)

  return { usage, warnings, breached, limits: LIMITS }
}

// ─── Platform alert email ────────────────────────────────────────────────────

async function sendPlatformAlert(type, details) {
  try {
    const { Resend } = await import('resend')
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return

    const resend = new Resend(resendKey)

    const labels = {
      email_limit: 'Email Limit Warning',
      member_limit: 'Member Limit Reached',
      class_limit: 'Class Limit Reached',
    }

    const subject = `[BOXX Platform] ${labels[type] || type}`

    const detailRows = Object.entries(details)
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#888;">${k}</td><td style="font-weight:600;">${v}</td></tr>`)
      .join('')

    await resend.emails.send({
      from: 'BOXX Platform <noreply@boxxthailand.com>',
      to: PLATFORM_ALERT_EMAIL,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#0a0a0a;color:#f5f5f5;">
          <h2 style="color:#c8a750;margin:0 0 16px;">${labels[type] || type}</h2>
          <table style="border-collapse:collapse;">${detailRows}</table>
          <p style="color:#888;font-size:13px;margin-top:20px;">This is an automated alert from the BOXX platform. Review your usage at the admin dashboard.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[platform-limits] Alert email failed:', err)
  }
}

export { LIMITS, WARN_THRESHOLD }
