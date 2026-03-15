import { requireStaff } from '@/lib/api-helpers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/admin/class-types/image — Upload class type image
 */
export async function POST(request) {
  try {
    const result = await requireStaff(request)
    if (result.response) return result.response
    const { tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const formData = await request.formData()
    const file = formData.get('image')
    const classTypeId = formData.get('classTypeId')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!classTypeId) {
      return NextResponse.json({ error: 'Class type ID required' }, { status: 400 })
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classTypeId)) {
      return NextResponse.json({ error: 'Invalid class type ID' }, { status: 400 })
    }

    const fileType = file.type || ''
    if (fileType && !ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 })
    }

    // Look up class type by ID
    let { data: ct, error: ctErr } = await supabaseAdmin
      .from('class_types')
      .select('id, image_url, tenant_id')
      .eq('id', classTypeId)
      .single()

    console.log('[class-types/image] Lookup:', { classTypeId, tenantId, found: !!ct, ctTenant: ct?.tenant_id, err: ctErr?.message })

    if (!ct) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Backfill tenant_id if missing (seed data created before multi-tenant migration)
    if (!ct.tenant_id) {
      await supabaseAdmin
        .from('class_types')
        .update({ tenant_id: tenantId })
        .eq('id', classTypeId)
        .is('tenant_id', null)
    } else if (ct.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete old image if exists
    if (ct.image_url) {
      const oldPath = extractStoragePath(ct.image_url)
      if (oldPath) {
        await supabaseAdmin.storage.from('class-images').remove([oldPath])
      }
    }

    // Upload to Supabase Storage
    const ext = file.name?.split('.').pop()?.toLowerCase() || 'webp'
    const path = `class-types/${classTypeId}/image.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('class-images')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[class-types/image] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image. Ensure the class-images storage bucket exists.' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('class-images')
      .getPublicUrl(path)

    const imageUrl = urlData.publicUrl + '?t=' + Date.now()

    await supabaseAdmin
      .from('class_types')
      .update({ image_url: imageUrl })
      .eq('id', classTypeId)

    return NextResponse.json({ image_url: imageUrl })
  } catch (error) {
    console.error('[class-types/image] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/class-types/image — Remove class type image
 */
export async function DELETE(request) {
  try {
    const result = await requireStaff(request)
    if (result.response) return result.response
    const { tenantId } = result

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { classTypeId } = await request.json()

    if (!classTypeId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classTypeId)) {
      return NextResponse.json({ error: 'Invalid class type ID' }, { status: 400 })
    }

    const { data: ct } = await supabaseAdmin
      .from('class_types')
      .select('image_url, tenant_id')
      .eq('id', classTypeId)
      .single()

    if (ct && ct.tenant_id && ct.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (ct?.image_url) {
      const storagePath = extractStoragePath(ct.image_url)
      if (storagePath) {
        await supabaseAdmin.storage.from('class-images').remove([storagePath])
      }
    }

    await supabaseAdmin
      .from('class_types')
      .update({ image_url: null })
      .eq('id', classTypeId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[class-types/image] Delete error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

function extractStoragePath(url) {
  if (!url) return null
  const match = url.match(/\/object\/public\/class-images\/(.+?)(\?|$)/)
  return match ? match[1] : null
}
