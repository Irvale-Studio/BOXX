'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Calendar, RefreshCw } from 'lucide-react'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function BookAppointmentPage() {
  const [slots, setSlots] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [toast, setToast] = useState(null)
  const [confirming, setConfirming] = useState(null) // slotKey being booked

  // Filters
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const fetchSlots = useCallback(async () => {
    setFetchError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: weekStart, days: '7' })
      if (selectedInstructor) params.set('instructorId', selectedInstructor)
      const res = await fetch(`/api/availability?${params}`)
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 402) {
          setFetchError('Appointment booking is not available on your current plan.')
        } else {
          setFetchError(data.error || 'Failed to load availability')
        }
        return
      }
      const data = await res.json()
      setSlots(data.slots || [])
      setInstructors(data.instructors || [])
    } catch {
      setFetchError('Unable to connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }, [weekStart, selectedInstructor])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  async function handleBook(slot) {
    const slotKey = `${slot.availabilityId}:${slot.date}:${slot.time}`
    setConfirming(slotKey)
    try {
      const res = await fetch('/api/availability/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availabilityId: slot.availabilityId,
          date: slot.date,
          time: slot.time,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Booking failed', type: 'error' })
        return
      }
      setToast({ message: data.message || 'Appointment booked!', type: 'success' })
      fetchSlots() // Refresh to remove booked slot
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setConfirming(null)
    }
  }

  function shiftWeek(direction) {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + direction * 7)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return
    setWeekStart(d.toISOString().split('T')[0])
    setSelectedDate('')
  }

  // Group slots by date
  const slotsByDate = {}
  slots.forEach((slot) => {
    if (!slotsByDate[slot.date]) slotsByDate[slot.date] = []
    slotsByDate[slot.date].push(slot)
  })

  // Generate week days for the header
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T00:00:00')
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const today = new Date().toISOString().split('T')[0]

  // Filter by selected date
  const displaySlots = selectedDate ? (slotsByDate[selectedDate] || []) : slots

  // Group display slots by instructor for better presentation
  const slotsByInstructor = {}
  displaySlots.forEach((slot) => {
    const key = slot.instructorId
    if (!slotsByInstructor[key]) {
      slotsByInstructor[key] = { instructor: slot.instructor, slots: [] }
    }
    slotsByInstructor[key].slots.push(slot)
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
        <p className="text-sm text-muted mt-1">Choose an available time slot with your preferred instructor</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'px-4 py-3 rounded-lg text-sm',
          toast.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
        )}>
          {toast.message}
        </div>
      )}

      {/* Instructor filter */}
      {instructors.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedInstructor('')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
              !selectedInstructor ? 'bg-accent text-background' : 'bg-card border border-card-border text-muted hover:text-foreground'
            )}
          >
            All
          </button>
          {instructors.map((inst) => (
            <button
              key={inst.id}
              onClick={() => setSelectedInstructor(inst.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                selectedInstructor === inst.id ? 'bg-accent text-background' : 'bg-card border border-card-border text-muted hover:text-foreground'
              )}
            >
              {inst.photo_url && (
                <Image src={inst.photo_url} alt="" width={16} height={16} className="w-4 h-4 rounded-full object-cover" />
              )}
              {inst.name}
            </button>
          ))}
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftWeek(-1)} className="text-muted hover:text-foreground transition-colors p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1">
          {weekDays.map((dateStr) => {
            const d = new Date(dateStr + 'T12:00:00Z')
            const isToday = dateStr === today
            const hasSlots = !!slotsByDate[dateStr]?.length
            const isSelected = dateStr === selectedDate
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? '' : dateStr)}
                className={cn(
                  'flex flex-col items-center px-2.5 py-2 rounded-lg text-xs transition-colors min-w-[48px]',
                  isSelected ? 'bg-accent text-background' :
                  isToday ? 'bg-accent/10 text-accent' :
                  hasSlots ? 'bg-card text-foreground hover:bg-card-border' :
                  'text-muted/40 cursor-default'
                )}
                disabled={!hasSlots}
              >
                <span className="font-medium">{DAY_NAMES[d.getDay()]}</span>
                <span className={cn('text-lg font-bold', !hasSlots && 'opacity-40')}>{d.getDate()}</span>
                {hasSlots && <span className="w-1 h-1 rounded-full bg-current mt-0.5" />}
              </button>
            )
          })}
        </div>
        <button onClick={() => shiftWeek(1)} className="text-muted hover:text-foreground transition-colors p-1">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="bg-card border border-card-border rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">{fetchError}</p>
          <Button variant="outline" onClick={fetchSlots} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && !fetchError && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg p-5 animate-pulse">
              <div className="h-5 w-40 bg-card-border rounded" />
              <div className="flex gap-2 mt-3">
                <div className="h-8 w-16 bg-card-border rounded" />
                <div className="h-8 w-16 bg-card-border rounded" />
                <div className="h-8 w-16 bg-card-border rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && displaySlots.length === 0 && (
        <div className="bg-card border border-card-border rounded-lg p-12 text-center">
          <Calendar className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No available slots</p>
          <p className="text-sm text-muted">
            {selectedDate ? `No availability on ${FULL_DAY_NAMES[new Date(selectedDate + 'T12:00:00Z').getDay()]}. Try another day.` :
             selectedInstructor ? 'This instructor has no availability this week. Try another week.' :
             'No appointments available this week. Try next week.'}
          </p>
        </div>
      )}

      {/* Slots grouped by instructor */}
      {!loading && !fetchError && Object.entries(slotsByInstructor).map(([instructorId, { instructor, slots: instrSlots }]) => (
        <Card key={instructorId} className="overflow-hidden">
          <CardContent className="p-4">
            {/* Instructor header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                {instructor?.photo_url ? (
                  <Image src={instructor.photo_url} alt={instructor?.name || ''} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-accent" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{instructor?.name || 'Instructor'}</h3>
                {instructor?.bio && (
                  <p className="text-xs text-muted line-clamp-1">{instructor.bio}</p>
                )}
              </div>
            </div>

            {/* Group by date */}
            {Object.entries(
              instrSlots.reduce((acc, slot) => {
                if (!acc[slot.date]) acc[slot.date] = []
                acc[slot.date].push(slot)
                return acc
              }, {})
            ).map(([dateStr, dateSlots]) => {
              const d = new Date(dateStr + 'T12:00:00Z')
              return (
                <div key={dateStr} className="mb-4 last:mb-0">
                  <p className="text-xs text-muted font-medium mb-2">
                    {FULL_DAY_NAMES[d.getDay()]}, {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dateSlots.map((slot) => {
                      const slotKey = `${slot.availabilityId}:${slot.date}:${slot.time}`
                      const isBooking = confirming === slotKey
                      const [h, m] = slot.time.split(':').map(Number)
                      const displayTime = new Date(2000, 0, 1, h, m).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

                      return (
                        <button
                          key={slotKey}
                          onClick={() => handleBook(slot)}
                          disabled={isBooking}
                          className={cn(
                            'flex flex-col items-center px-3 py-2 rounded-lg border transition-all text-sm',
                            isBooking
                              ? 'bg-accent/20 border-accent/40 text-accent'
                              : 'bg-card border-card-border hover:border-accent/50 hover:bg-accent/5 text-foreground'
                          )}
                        >
                          <span className="font-semibold">{displayTime}</span>
                          <span className="text-[10px] text-muted">{slot.duration}min</span>
                          {slot.creditsCost === 0 ? (
                            <span className="text-[9px] text-green-400 mt-0.5">Free</span>
                          ) : (
                            <span className="text-[9px] text-muted mt-0.5">{slot.creditsCost} credit{slot.creditsCost !== 1 ? 's' : ''}</span>
                          )}
                          {slot.concurrentSlots > 1 && (
                            <span className="text-[9px] text-accent/60 mt-0.5">{slot.slotsRemaining} left</span>
                          )}
                          {isBooking && <span className="text-[10px] text-accent mt-0.5">Booking...</span>}
                        </button>
                      )
                    })}
                  </div>
                  {/* Location info */}
                  {dateSlots[0]?.location && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted/60">
                      <MapPin className="w-3 h-3" />
                      {dateSlots[0].location.name}
                      {dateSlots[0].zone && ` · ${dateSlots[0].zone.name}`}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
