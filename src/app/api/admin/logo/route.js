import { requireStaff } from '@/lib/api-helpers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 2 * 1024 * 1024

export async function POST(request) {
  try {
    const result = await requireStaff(request)
    if (result.response) return result.response
    const { tenantId } = result

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP, or SVG.' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 2MB.' }, { status: 400 })
    }

    const ext = file.name?.split('.').pop()?.toLowerCase() || 'png'
    const filename = `${tenantId}/logo.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from('tenant-logos')
      .upload(filename, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[admin/logo] Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed. Ensure the tenant-logos storage bucket exists.' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('tenant-logos')
      .getPublicUrl(filename)

    await supabaseAdmin
      .from('tenants')
      .update({ logo_url: publicUrl })
      .eq('id', tenantId)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[admin/logo] Error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
