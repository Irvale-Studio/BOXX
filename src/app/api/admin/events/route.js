import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/admin/events — Unified activity log for all user actions
 * Aggregates: bookings (created/cancelled), account signups, admin actions
 * Query params: type, dateFrom, dateTo, search, sort, page, limit
 */
export async function GET(request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin' && session.user.role !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // booking, cancellation, signup, admin, all
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

    // If searching, find matching user IDs first
    let searchUserIds = null
    if (search) {
      const { data: matchedUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      searchUserIds = (matchedUsers || []).map((u) => u.id)
      if (searchUserIds.length === 0) {
        return NextResponse.json({ events: [], total: 0, page, limit })
      }
    }

    const events = []

    // 1. Booking events (created)
    if (type === 'all' || type === 'booking') {
      let q = supabaseAdmin
        .from('bookings')
        .select(`
          id, status, created_at,
          users(id, name, email, avatar_url),
          class_schedule(id, starts_at, class_types(name, color))
        `)
        .eq('status', 'confirmed')

      if (searchUserIds) q = q.in('user_id', searchUserIds)
      if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString())
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        q = q.lte('created_at', end.toISOString())
      }

      const { data } = await q
      ;(data || []).forEach((b) => {
        const className = b.class_schedule?.class_types?.name || 'Unknown class'
        events.push({
          id: `booking-${b.id}`,
          type: 'booking',
          label: `Booked ${className}`,
          detail: b.class_schedule?.starts_at ? new Date(b.class_schedule.starts_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Bangkok' }) : '',
          color: b.class_schedule?.class_types?.color || '#c8a750',
          user: b.users,
          timestamp: b.created_at,
          meta: {
            classTime: b.class_schedule?.starts_at,
          },
        })
      })
    }

    // 2. Cancellation events
    if (type === 'all' || type === 'cancellation') {
      let q = supabaseAdmin
        .from('bookings')
        .select(`
          id, status, cancelled_at, late_cancel, created_at,
          users(id, name, email, avatar_url),
          class_schedule(id, starts_at, class_types(name, color))
        `)
        .eq('status', 'cancelled')

      if (searchUserIds) q = q.in('user_id', searchUserIds)
      if (dateFrom) q = q.gte('cancelled_at', new Date(dateFrom).toISOString())
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        q = q.lte('cancelled_at', end.toISOString())
      }

      const { data } = await q
      ;(data || []).forEach((b) => {
        const cancelClassName = b.class_schedule?.class_types?.name || 'Unknown class'
        events.push({
          id: `cancel-${b.id}`,
          type: 'cancellation',
          label: b.late_cancel ? `Late cancelled ${cancelClassName}` : `Cancelled ${cancelClassName}`,
          detail: b.class_schedule?.starts_at ? new Date(b.class_schedule.starts_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Bangkok' }) : '',
          color: b.class_schedule?.class_types?.color || '#c8a750',
          user: b.users,
          timestamp: b.cancelled_at || b.created_at,
          meta: {
            classTime: b.class_schedule?.starts_at,
            lateCancel: b.late_cancel,
          },
        })
      })
    }

    // 3. Signup events (new accounts)
    if (type === 'all' || type === 'signup') {
      let q = supabaseAdmin
        .from('users')
        .select('id, name, email, avatar_url, created_at')
        .eq('role', 'member')

      if (searchUserIds) q = q.in('id', searchUserIds)
      if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString())
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        q = q.lte('created_at', end.toISOString())
      }

      const { data } = await q
      ;(data || []).forEach((u) => {
        events.push({
          id: `signup-${u.id}`,
          type: 'signup',
          label: 'Created account',
          detail: u.email,
          user: { id: u.id, name: u.name, email: u.email, avatar_url: u.avatar_url },
          timestamp: u.created_at,
        })
      })
    }

    // 4. Admin actions (from audit log)
    if (type === 'all' || type === 'admin') {
      let q = supabaseAdmin
        .from('admin_audit_log')
        .select('id, admin_id, action, target_type, target_id, details, created_at, users:admin_id(name, email, avatar_url)')

      if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString())
      if (dateTo) {
        const end = new Date(dateTo)
        end.setHours(23, 59, 59, 999)
        q = q.lte('created_at', end.toISOString())
      }

      const { data } = await q
      ;(data || []).forEach((log) => {
        const d = log.details || {}
        const actionLabels = {
          'booking_cancel': 'Cancelled booking',
          'create_class': 'Created class',
          'update_class': 'Updated class',
          'update_recurring_classes': 'Updated recurring classes',
          'cancel_class': 'Cancelled class',
          'cancel_recurring_classes': 'Cancelled recurring classes',
          'create_recurring_classes': 'Created recurring classes',
          'admin_add_to_class': 'Added member to class',
          'admin_remove_from_class': 'Removed member from class',
          'admin_remove_from_waitlist': 'Removed from waitlist',
          'edit_member': 'Edited member',
          'freeze_member': 'Froze member',
          'grant_credits': 'Granted credits',
          'create_class_type': 'Created class type',
          'update_class_type': 'Updated class type',
          'notify_class_change': 'Notified class change',
          'send_direct_email': 'Sent email',
        }

        // Build a human-readable detail string from the details JSONB
        let detail = ''
        switch (log.action) {
          case 'admin_add_to_class':
            detail = `Added ${d.memberName || 'member'} to ${d.className || 'class'}`
            break
          case 'admin_remove_from_class':
            detail = `Removed ${d.memberName || 'member'} from ${d.className || 'class'}`
            break
          case 'admin_remove_from_waitlist':
            detail = `Removed ${d.memberName || 'member'} from ${d.className || 'class'} waitlist`
            break
          case 'booking_cancel':
            detail = `Cancelled ${d.memberName || 'member'}'s booking for ${d.className || 'class'}`
            break
          case 'create_class':
            detail = `${d.className || 'Class'} — ${d.instructorName || ''}`
            break
          case 'update_class':
          case 'update_recurring_classes':
            detail = `${d.className || 'Class'}${d.siblingsUpdated ? ` (+${d.siblingsUpdated} siblings)` : ''}`
            break
          case 'cancel_class':
          case 'cancel_recurring_classes':
            detail = `${d.className || 'Class'} — ${d.classesCancelled || 1} cancelled, ${d.creditsRefunded || 0} credits refunded`
            break
          case 'create_recurring_classes':
            detail = `${d.className || 'Class'} — ${d.count || 0} classes created`
            break
          case 'edit_member':
            detail = `${d.memberName || 'Member'} (${d.memberEmail || ''})`
            break
          case 'freeze_member':
            detail = `Froze ${d.memberName || 'member'} (${d.memberEmail || ''})`
            break
          case 'grant_credits':
            detail = `Granted ${d.credits || '?'} credits (${d.packName || 'pack'}) to ${d.memberName || 'member'}`
            break
          case 'create_class_type':
            detail = d.name || 'New class type'
            break
          case 'update_class_type':
            detail = d.classTypeName || 'Class type'
            break
          case 'notify_class_change':
            detail = `${d.className || 'Class'} — ${d.memberCount || 0} members notified`
            break
          case 'send_direct_email':
            detail = `To ${d.to || '?'} — "${d.subject || ''}"`
            break
          default:
            detail = `${log.target_type || ''}${log.target_id ? ` #${log.target_id.slice(0, 8)}` : ''}`
        }

        events.push({
          id: `admin-${log.id}`,
          type: 'admin',
          label: actionLabels[log.action] || log.action.replace(/_/g, ' '),
          detail,
          user: log.users ? { id: log.admin_id, name: log.users.name, email: log.users.email, avatar_url: log.users.avatar_url } : null,
          timestamp: log.created_at,
          meta: log.details,
        })
      })
    }

    // Sort all events by timestamp
    events.sort((a, b) => {
      const tA = new Date(a.timestamp).getTime()
      const tB = new Date(b.timestamp).getTime()
      return sort === 'oldest' ? tA - tB : tB - tA
    })

    const total = events.length
    const offset = (page - 1) * limit
    const paged = events.slice(offset, offset + limit)

    return NextResponse.json({ events: paged, total, page, limit })
  } catch (error) {
    console.error('[admin/events] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
