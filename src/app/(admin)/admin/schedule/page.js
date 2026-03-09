'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AdminSchedulePage() {
  const [classes, setClasses] = useState([])
  const [classTypes, setClassTypes] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [toast, setToast] = useState(null)

  // Dialog states
  const [addDialog, setAddDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(null)
  const [cancelDialog, setCancelDialog] = useState(null)
  const [rosterDialog, setRosterDialog] = useState(null)
  const [recurringDialog, setRecurringDialog] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state for add/edit
  const [form, setForm] = useState({
    classTypeId: '', instructorId: '', date: '', startTime: '07:00', endTime: '07:55', capacity: 6, notes: '', isPrivate: false,
  })

  // Recurring form
  const [recurForm, setRecurForm] = useState({
    classTypeId: '', instructorId: '', startTime: '07:00', endTime: '07:55', capacity: 6, days: [], weeks: 4, startDate: '', notes: '',
  })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const getWeekRange = useCallback(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7)
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    return { start: startOfWeek, end: endOfWeek }
  }, [weekOffset])

  const fetchClasses = useCallback(async () => {
    const { start, end } = getWeekRange()
    try {
      const res = await fetch(`/api/admin/schedule?start=${start.toISOString()}&end=${end.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes || [])
      }
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
    } finally {
      setLoading(false)
    }
  }, [getWeekRange])

  useEffect(() => {
    fetch('/api/admin/schedule/options')
      .then((res) => res.ok ? res.json() : { classTypes: [], instructors: [] })
      .then((data) => { setClassTypes(data.classTypes || []); setInstructors(data.instructors || []) })
      .catch(console.error)
  }, [])

  useEffect(() => { setLoading(true); fetchClasses() }, [fetchClasses])

  const { start: weekStart } = getWeekRange()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d
  })
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const classesByDay = {}
  classes.forEach((cls) => {
    const dateKey = new Date(cls.starts_at).toISOString().split('T')[0]
    if (!classesByDay[dateKey]) classesByDay[dateKey] = []
    classesByDay[dateKey].push(cls)
  })

  function openAddDialog(date) {
    setForm({
      classTypeId: classTypes[0]?.id || '', instructorId: instructors[0]?.id || '',
      date: date || new Date().toISOString().split('T')[0],
      startTime: '07:00', endTime: '07:55', capacity: 6, notes: '', isPrivate: false,
    })
    setAddDialog(true)
  }

  function openEditDialog(cls) {
    const startsAt = new Date(cls.starts_at)
    const endsAt = new Date(cls.ends_at)
    setForm({
      classTypeId: cls.class_type_id, instructorId: cls.instructor_id,
      date: startsAt.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }),
      startTime: startsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }),
      endTime: endsAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }),
      capacity: cls.capacity, notes: cls.notes || '', isPrivate: cls.is_private || false,
    })
    setEditDialog(cls)
  }

  function openRecurringDialog() {
    setRecurForm({
      classTypeId: classTypes[0]?.id || '', instructorId: instructors[0]?.id || '',
      startTime: '07:00', endTime: '07:55', capacity: 6, days: [1, 3, 5], weeks: 4,
      startDate: new Date().toISOString().split('T')[0], notes: '',
    })
    setRecurringDialog(true)
  }

  function buildDatetime(date, time) {
    return new Date(`${date}T${time}:00+07:00`).toISOString()
  }

  async function handleCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classTypeId: form.classTypeId, instructorId: form.instructorId,
          startsAt: buildDatetime(form.date, form.startTime), endsAt: buildDatetime(form.date, form.endTime),
          capacity: form.capacity, notes: form.notes || null, isPrivate: form.isPrivate,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to create class', type: 'error' }); return }
      setToast({ message: 'Class created', type: 'success' })
      setAddDialog(false); fetchClasses()
    } catch { setToast({ message: 'Something went wrong', type: 'error' }) }
    finally { setSubmitting(false) }
  }

  async function handleUpdate() {
    if (!editDialog) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editDialog.id, classTypeId: form.classTypeId, instructorId: form.instructorId,
          startsAt: buildDatetime(form.date, form.startTime), endsAt: buildDatetime(form.date, form.endTime),
          capacity: form.capacity, notes: form.notes || null, isPrivate: form.isPrivate,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to update', type: 'error' }); return }
      setToast({ message: 'Class updated', type: 'success' })
      setEditDialog(null); fetchClasses()
    } catch { setToast({ message: 'Something went wrong', type: 'error' }) }
    finally { setSubmitting(false) }
  }

  async function handleCancel() {
    if (!cancelDialog) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/schedule/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: cancelDialog.id }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to cancel', type: 'error' }); return }
      setToast({ message: `Cancelled. ${data.bookingsCancelled} booking(s), ${data.creditsRefunded} credit(s) refunded.`, type: 'success' })
      setCancelDialog(null); fetchClasses()
    } catch { setToast({ message: 'Something went wrong', type: 'error' }) }
    finally { setSubmitting(false) }
  }

  async function handleRecurringCreate() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/schedule/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recurForm),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to create', type: 'error' }); return }
      setToast({ message: `Created ${data.created} classes`, type: 'success' })
      setRecurringDialog(false); fetchClasses()
    } catch { setToast({ message: 'Something went wrong', type: 'error' }) }
    finally { setSubmitting(false) }
  }

  const weekLabel = (() => {
    const s = weekDays[0], e = weekDays[6]
    const sM = s.toLocaleDateString('en-US', { month: 'short' })
    const eM = e.toLocaleDateString('en-US', { month: 'short' })
    return sM === eM ? `${sM} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}` : `${sM} ${s.getDate()} – ${eM} ${e.getDate()}, ${e.getFullYear()}`
  })()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openRecurringDialog}>Recurring</Button>
          <Button onClick={() => openAddDialog()}>+ Add Class</Button>
        </div>
      </div>

      {toast && (
        <div className={cn('mb-6 px-4 py-3 rounded-lg border flex items-center justify-between', toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400')}>
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setWeekOffset((o) => o - 1)} className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5 border border-card-border rounded">← Prev</button>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{weekLabel}</p>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-xs text-accent hover:text-accent-dim transition-colors">Today</button>
          )}
        </div>
        <button onClick={() => setWeekOffset((o) => o + 1)} className="text-sm text-muted hover:text-foreground transition-colors px-3 py-1.5 border border-card-border rounded">Next →</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="h-40 bg-card border border-card-border rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateKey = day.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
            const dayClasses = classesByDay[dateKey] || []
            const isToday = day.toDateString() === today.toDateString()
            const isPast = day < today

            return (
              <div key={dateKey} className={cn('border border-card-border rounded-lg overflow-hidden min-h-[160px]', isToday ? 'border-accent/30' : '', isPast ? 'opacity-60' : '')}>
                <div className={cn('px-2 py-1.5 text-center border-b border-card-border', isToday ? 'bg-accent/10' : 'bg-card')}>
                  <p className="text-xs text-muted">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <p className={cn('text-sm font-medium', isToday ? 'text-accent' : 'text-foreground')}>{day.getDate()}</p>
                </div>
                <div className="p-1 space-y-1">
                  {dayClasses.map((cls) => {
                    const time = new Date(cls.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Bangkok' })
                    const isCancelled = cls.status === 'cancelled'
                    const isFull = cls.booked_count >= cls.capacity
                    const isPrivate = cls.is_private

                    return (
                      <button
                        key={cls.id}
                        onClick={() => isCancelled ? null : openEditDialog(cls)}
                        className={cn('w-full text-left px-1.5 py-1 rounded text-xs transition-colors', isCancelled ? 'bg-red-500/10 opacity-50 cursor-default' : 'bg-card hover:bg-white/5 cursor-pointer')}
                      >
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cls.class_types?.color || '#c8a750' }} />
                          <span className={cn('truncate font-medium', isCancelled ? 'line-through text-muted' : 'text-foreground')}>
                            {cls.class_types?.name || 'Class'}
                          </span>
                          {isPrivate && <span className="text-[8px] text-amber-400">🔒</span>}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-muted">{time}</span>
                          {!isCancelled && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setRosterDialog(cls) }}
                              className={cn('font-medium hover:text-accent transition-colors', isFull ? 'text-red-400' : 'text-muted')}
                            >
                              {cls.booked_count}/{cls.capacity}
                            </button>
                          )}
                          {isCancelled && <span className="text-red-400">X</span>}
                        </div>
                      </button>
                    )
                  })}
                  {!isPast && (
                    <button onClick={() => openAddDialog(dateKey)} className="w-full text-center text-xs text-muted hover:text-accent transition-colors py-1 rounded border border-dashed border-card-border hover:border-accent/30">+</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Class Dialog */}
      <Dialog open={addDialog} onOpenChange={(open) => !open && setAddDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Class</DialogTitle><DialogDescription>Schedule a new class.</DialogDescription></DialogHeader>
          <ClassForm form={form} setForm={setForm} classTypes={classTypes} instructors={instructors} showPrivate />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Creating...' : 'Create Class'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>{editDialog?.class_types?.name} — {editDialog?.booked_count || 0} booking{editDialog?.booked_count !== 1 ? 's' : ''}</DialogDescription>
          </DialogHeader>
          <ClassForm form={form} setForm={setForm} classTypes={classTypes} instructors={instructors} showPrivate />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="text-red-400 border-red-400/30 hover:bg-red-400/10" onClick={() => { setEditDialog(null); setCancelDialog(editDialog) }}>Cancel Class</Button>
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="outline" onClick={() => setEditDialog(null)}>Close</Button>
              <Button onClick={handleUpdate} disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Class Confirmation */}
      <Dialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cancel Class</DialogTitle><DialogDescription>This cannot be undone. All bookings will be cancelled and credits refunded.</DialogDescription></DialogHeader>
          {cancelDialog && (
            <div className="py-4 space-y-2">
              <p className="text-sm font-medium text-foreground">{cancelDialog.class_types?.name}</p>
              <p className="text-xs text-muted">
                {new Date(cancelDialog.starts_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'Asia/Bangkok' })} at {new Date(cancelDialog.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Bangkok' })}
              </p>
              <p className="text-xs text-muted">{cancelDialog.booked_count || 0} booking{cancelDialog.booked_count !== 1 ? 's' : ''} will be cancelled</p>
              {cancelDialog.booked_count > 0 && (
                <div className="mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-400">
                  {cancelDialog.booked_count} member{cancelDialog.booked_count !== 1 ? 's' : ''} will be notified and credits will be refunded.
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelDialog(null)}>Keep Class</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCancel} disabled={submitting}>{submitting ? 'Cancelling...' : 'Cancel Class'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Roster Dialog */}
      <Dialog open={!!rosterDialog} onOpenChange={(open) => !open && setRosterDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Class Roster</DialogTitle>
            <DialogDescription>
              {rosterDialog?.class_types?.name} — {new Date(rosterDialog?.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'Asia/Bangkok' })}
              {' · '}{rosterDialog?.booked_count}/{rosterDialog?.capacity} booked
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2 max-h-[400px] overflow-y-auto">
            {rosterDialog?.roster?.length > 0 ? rosterDialog.roster.map((m, i) => (
              <div key={m.id || i} className="flex items-center justify-between p-2 rounded-lg border border-card-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-accent text-[10px] font-bold">{(m.name || '?')[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{m.name || 'No name'}</p>
                    <p className="text-[10px] text-muted">{m.email}</p>
                  </div>
                </div>
                <Badge variant={m.status === 'confirmed' ? 'success' : m.status === 'attended' ? 'default' : 'outline'} className="text-[10px] capitalize">
                  {m.status}
                </Badge>
              </div>
            )) : (
              <p className="text-sm text-muted text-center py-4">No bookings yet</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRosterDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Classes Dialog */}
      <Dialog open={recurringDialog} onOpenChange={(open) => !open && setRecurringDialog(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Create Recurring Classes</DialogTitle><DialogDescription>Generate a weekly schedule template.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Class Type</Label>
              <select value={recurForm.classTypeId} onChange={(e) => setRecurForm({ ...recurForm, classTypeId: e.target.value })} className="mt-1 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
                {classTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Instructor</Label>
              <select value={recurForm.instructorId} onChange={(e) => setRecurForm({ ...recurForm, instructorId: e.target.value })} className="mt-1 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
                {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Days</Label>
              <div className="flex gap-2 mt-1">
                {DAY_NAMES.map((name, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const days = recurForm.days.includes(idx) ? recurForm.days.filter((d) => d !== idx) : [...recurForm.days, idx]
                      setRecurForm({ ...recurForm, days })
                    }}
                    className={cn(
                      'w-10 h-10 rounded text-xs font-medium transition-colors border',
                      recurForm.days.includes(idx) ? 'bg-accent text-background border-accent' : 'bg-card border-card-border text-muted hover:border-accent/30'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Time</Label><Input type="time" value={recurForm.startTime} onChange={(e) => setRecurForm({ ...recurForm, startTime: e.target.value })} className="mt-1" /></div>
              <div><Label>End Time</Label><Input type="time" value={recurForm.endTime} onChange={(e) => setRecurForm({ ...recurForm, endTime: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Capacity</Label><Input type="number" min={1} max={50} value={recurForm.capacity} onChange={(e) => setRecurForm({ ...recurForm, capacity: parseInt(e.target.value) || 6 })} className="mt-1" /></div>
              <div><Label>Weeks</Label><Input type="number" min={1} max={12} value={recurForm.weeks} onChange={(e) => setRecurForm({ ...recurForm, weeks: parseInt(e.target.value) || 4 })} className="mt-1" /></div>
              <div><Label>Start From</Label><Input type="date" value={recurForm.startDate} onChange={(e) => setRecurForm({ ...recurForm, startDate: e.target.value })} className="mt-1" /></div>
            </div>
            <p className="text-xs text-muted">
              This will create ~{recurForm.days.length * recurForm.weeks} classes ({recurForm.days.map((d) => DAY_NAMES[d]).join(', ')} for {recurForm.weeks} week{recurForm.weeks !== 1 ? 's' : ''})
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRecurringDialog(false)}>Cancel</Button>
            <Button onClick={handleRecurringCreate} disabled={submitting || recurForm.days.length === 0}>
              {submitting ? 'Creating...' : `Create ${recurForm.days.length * recurForm.weeks} Classes`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClassForm({ form, setForm, classTypes, instructors, showPrivate }) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <Label htmlFor="classType">Class Type</Label>
        <select id="classType" value={form.classTypeId} onChange={(e) => setForm((f) => ({ ...f, classTypeId: e.target.value }))} className="mt-1 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">Select class type</option>
          {classTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="instructor">Instructor</Label>
        <select id="instructor" value={form.instructorId} onChange={(e) => setForm((f) => ({ ...f, instructorId: e.target.value }))} className="mt-1 w-full rounded-md border border-card-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent">
          <option value="">Select instructor</option>
          {instructors.map((inst) => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
        </select>
      </div>
      <div><Label htmlFor="date">Date</Label><Input id="date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="startTime">Start Time</Label><Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="mt-1" /></div>
        <div><Label htmlFor="endTime">End Time</Label><Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="mt-1" /></div>
      </div>
      <div><Label htmlFor="capacity">Capacity</Label><Input id="capacity" type="number" min={1} max={50} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 6 }))} className="mt-1" /></div>
      <div><Label htmlFor="notes">Notes (optional)</Label><Input id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. Special event, substitute instructor" className="mt-1" /></div>
      {showPrivate && (
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPrivate}
            onChange={(e) => setForm((f) => ({ ...f, isPrivate: e.target.checked }))}
            className="w-4 h-4 rounded border-card-border bg-card accent-accent"
          />
          <div>
            <span className="text-sm text-foreground">Private class</span>
            <p className="text-xs text-muted">Hidden from public schedule. Only visible in admin panel.</p>
          </div>
        </label>
      )}
    </div>
  )
}
