import { auth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * GET /api/bookings/ical?id=<bookingId> — Download .ics file for a booked class
 */
export async function GET(request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('id')

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, status, class_schedule(id, starts_at, duration_minutes, class_types(name), instructors(name))')
      .eq('id', bookingId)
      .eq('user_id', session.user.id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const escapeIcal = (s) => s.replace(/[\\;,\n]/g, (c) => '\\' + c)

    const cls = booking.class_schedule
    const className = escapeIcal(cls.class_types?.name || 'BOXX Class')
    const instructor = escapeIcal(cls.instructors?.name || '')
    const start = new Date(cls.starts_at)
    const end = new Date(start.getTime() + (cls.duration_minutes || 55) * 60000)

    const formatDate = (d) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const uid = `booking-${booking.id}@boxxthailand.com`
    const now = formatDate(new Date())

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BOXX Thailand//Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${className}${instructor ? ` with ${instructor}` : ''}`,
      'DESCRIPTION:BOXX Boxing Studio — Chiang Mai',
      'LOCATION:89/2 Bumruang Road\\, Wat Ket\\, Chiang Mai 50000',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Your BOXX class starts in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="boxx-${className.toLowerCase().replace(/\s+/g, '-')}.ics"`,
      },
    })
  } catch (error) {
    console.error('[bookings/ical] Error:', error)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
