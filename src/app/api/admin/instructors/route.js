import { requireStaff } from '@/lib/api-helpers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * GET /api/admin/instructors — Get all instructors
 */
export async function GET(request) {
  try {
    const result = await requireStaff(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { data, error } = await supabaseAdmin
      .from('instructors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name')

    if (error) {
      console.error('[admin/instructors] Error:', error)
      return NextResponse.json({ error: 'Failed to load instructors' }, { status: 500 })
    }

    return NextResponse.json({ instructors: data || [] })
  } catch (error) {
    console.error('[admin/instructors] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  bio: z.string().nullable().optional(),
})

/**
 * POST /api/admin/instructors — Create an instructor
 */
export async function POST(request) {
  try {
    const result = await requireStaff(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Check platform instructor limit
    const { checkInstructorLimit, checkTenantPlanLimit } = await import('@/lib/platform-limits')
    const { allowed: instrAllowed, reason: instrReason } = await checkInstructorLimit()
    if (!instrAllowed) {
      return NextResponse.json({ error: instrReason }, { status: 403 })
    }

    // Check plan-level instructor limit
    const instructorLimit = await checkTenantPlanLimit(tenantId, 'max_instructors')
    if (!instructorLimit.allowed) {
      return NextResponse.json({ error: `Instructor limit reached (${instructorLimit.current}/${instructorLimit.limit} on ${instructorLimit.plan} plan)` }, { status: 403 })
    }

    const { data: instructor, error } = await supabaseAdmin
      .from('instructors')
      .insert({
        tenant_id: tenantId,
        name: parsed.data.name,
        bio: parsed.data.bio || null,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/instructors] Create error:', error)
      return NextResponse.json({ error: 'Failed to create instructor' }, { status: 500 })
    }

    return NextResponse.json({ instructor })
  } catch (error) {
    console.error('[admin/instructors] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

const updateSchema = z.object({
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Invalid ID'),
  name: z.string().min(1).optional(),
  bio: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

/**
 * PUT /api/admin/instructors — Update an instructor
 */
export async function PUT(request) {
  try {
    const result = await requireStaff(request)
    if (result.response) return result.response
    const { session, tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { id, ...updates } = parsed.data

    // K3: Prevent deactivating if future active classes exist
    if (updates.active === false) {
      const { count } = await supabaseAdmin
        .from('class_schedule')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('instructor_id', id)
        .eq('status', 'active')
        .gt('starts_at', new Date().toISOString())

      if (count > 0) {
        return NextResponse.json(
          { error: `Cannot deactivate: ${count} upcoming class${count !== 1 ? 'es' : ''} assigned to this instructor. Reassign them first.` },
          { status: 409 }
        )
      }
    }

    const { data: instructor, error } = await supabaseAdmin
      .from('instructors')
      .update(updates)
      .eq('tenant_id', tenantId)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/instructors] Update error:', error)
      return NextResponse.json({ error: 'Failed to update instructor' }, { status: 500 })
    }

    return NextResponse.json({ instructor })
  } catch (error) {
    console.error('[admin/instructors] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
