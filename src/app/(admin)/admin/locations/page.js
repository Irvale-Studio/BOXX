'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { MapPin, Plus, ChevronDown, Layers, RefreshCw, Check, X, ChevronUp, Trash2, Info } from 'lucide-react'

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [toast, setToast] = useState(null)

  // Inline location create/edit
  const [showCreateLoc, setShowCreateLoc] = useState(false)
  const [editingLocId, setEditingLocId] = useState(null)
  const [locForm, setLocForm] = useState({ name: '', address: '', city: '', country: '', phone: '', timezone: '', buffer_mins: 0 })
  const [locMoreOptions, setLocMoreOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Inline zone create/edit
  const [creatingZoneForLoc, setCreatingZoneForLoc] = useState(null)
  const [editingZoneId, setEditingZoneId] = useState(null)
  const [editingZoneLocId, setEditingZoneLocId] = useState(null)
  const [zoneForm, setZoneForm] = useState({ name: '', capacity: '', description: '' })
  const [zoneMoreOptions, setZoneMoreOptions] = useState(false)

  // Expanded locations (for zone visibility)
  const [expanded, setExpanded] = useState(new Set())

  // Validation errors
  const [locError, setLocError] = useState(null)
  const [zoneError, setZoneError] = useState(null)

  // Delete confirmation
  const [deletingLoc, setDeletingLoc] = useState(null)
  const [deletingZone, setDeletingZone] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const createLocNameRef = useRef(null)
  const editLocNameRef = useRef(null)
  const createZoneNameRef = useRef(null)
  const editZoneNameRef = useRef(null)
  const locFormRef = useRef(null)
  const zoneFormRef = useRef(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Click outside to close create forms only (edit uses Cancel/Esc)
  useEffect(() => {
    function handleClickOutside(e) {
      if (showCreateLoc && locFormRef.current && !locFormRef.current.contains(e.target)) {
        cancelCreateLocation()
      }
      if (creatingZoneForLoc && zoneFormRef.current && !zoneFormRef.current.contains(e.target)) {
        cancelCreateZone()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCreateLoc, creatingZoneForLoc])

  async function fetchLocations() {
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/locations')
      if (res.ok) {
        const data = await res.json()
        setLocations(data.locations || [])
      } else {
        setFetchError('Failed to load locations')
      }
    } catch {
      setFetchError('Unable to connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLocations() }, [])

  // Focus name input when inline forms appear
  useEffect(() => {
    if (showCreateLoc) setTimeout(() => createLocNameRef.current?.focus(), 50)
  }, [showCreateLoc])

  useEffect(() => {
    if (editingLocId) setTimeout(() => editLocNameRef.current?.focus(), 50)
  }, [editingLocId])

  useEffect(() => {
    if (creatingZoneForLoc) setTimeout(() => createZoneNameRef.current?.focus(), 50)
  }, [creatingZoneForLoc])

  useEffect(() => {
    if (editingZoneId) setTimeout(() => editZoneNameRef.current?.focus(), 50)
  }, [editingZoneId])

  function startCreateLocation() {
    setLocForm({ name: '', address: '', city: '', country: '', phone: '', timezone: '', buffer_mins: 0 })
    setLocMoreOptions(false)
    setLocError(null)
    setShowCreateLoc(true)
    setEditingLocId(null)
  }

  function cancelCreateLocation() {
    setShowCreateLoc(false)
    setLocMoreOptions(false)
    setLocError(null)
  }

  function startEditLocation(loc) {
    setLocForm({
      name: loc.name || '',
      address: loc.address || '',
      city: loc.city || '',
      country: loc.country || '',
      phone: loc.phone || '',
      timezone: loc.timezone || '',
      buffer_mins: loc.buffer_mins || 0,
    })
    setLocMoreOptions(true)
    setEditingLocId(loc.id)
    setShowCreateLoc(false)
  }

  function cancelEditLocation() {
    setEditingLocId(null)
    setLocMoreOptions(false)
  }

  async function saveLocation(mode) {
    if (!locForm.name.trim()) {
      setLocError('Name is required')
      return
    }
    setLocError(null)
    const isCreate = mode === 'create'

    if (isCreate) {
      // Optimistic: add immediately, close form
      const tempId = `temp-${Date.now()}`
      const optimisticLoc = {
        id: tempId,
        ...locForm,
        is_active: true,
        zones: [],
        _optimistic: true,
      }
      setLocations((prev) => [...prev, optimisticLoc])
      setShowCreateLoc(false)
      setLocMoreOptions(false)

      try {
        const res = await fetch('/api/admin/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(locForm),
        })
        const data = await res.json()
        if (!res.ok) {
          setLocations((prev) => prev.filter((l) => l.id !== tempId))
          setToast({ message: data.error || 'Failed to save', type: 'error' })
          return
        }
        setToast({ message: 'Location created', type: 'success' })
        fetchLocations()
      } catch {
        setLocations((prev) => prev.filter((l) => l.id !== tempId))
        setToast({ message: 'Something went wrong', type: 'error' })
      }
    } else {
      // Edit: optimistic update in place
      const prevLocations = [...locations]
      setLocations((prev) => prev.map((l) => l.id === editingLocId ? { ...l, ...locForm } : l))
      setEditingLocId(null)
      setLocMoreOptions(false)

      try {
        const res = await fetch('/api/admin/locations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingLocId, ...locForm }),
        })
        const data = await res.json()
        if (!res.ok) {
          setLocations(prevLocations)
          setToast({ message: data.error || 'Failed to save', type: 'error' })
          return
        }
        setToast({ message: 'Location updated', type: 'success' })
        fetchLocations()
      } catch {
        setLocations(prevLocations)
        setToast({ message: 'Something went wrong', type: 'error' })
      }
    }
  }

  async function deleteLocation(loc) {
    setDeleteSubmitting(true)
    try {
      const res = await fetch('/api/admin/locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loc.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Cannot delete location', type: 'error' })
        return
      }
      setToast({ message: 'Location deleted', type: 'success' })
      setDeletingLoc(null)
      fetchLocations()
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  async function deleteZone(locationId, zone) {
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/admin/locations/${locationId}/zones`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: zone.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ message: data.error || 'Cannot delete zone', type: 'error' })
        return
      }
      setToast({ message: 'Zone deleted', type: 'success' })
      setDeletingZone(null)
      fetchLocations()
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  async function toggleLocationActive(loc) {
    // Optimistic update
    setLocations((prev) => prev.map((l) => l.id === loc.id ? { ...l, is_active: !l.is_active } : l))
    const res = await fetch('/api/admin/locations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: loc.id, is_active: !loc.is_active }),
    })
    const data = await res.json()
    if (!res.ok) {
      // Revert
      setLocations((prev) => prev.map((l) => l.id === loc.id ? { ...l, is_active: loc.is_active } : l))
      setToast({ message: data.error || 'Failed to update', type: 'error' })
      return
    }
    setToast({ message: !loc.is_active ? 'Location activated' : 'Location deactivated', type: 'success' })
  }

  function toggleExpanded(id) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Zone handlers
  function startCreateZone(locationId) {
    setZoneForm({ name: '', capacity: '', description: '' })
    setZoneMoreOptions(false)
    setZoneError(null)
    setCreatingZoneForLoc(locationId)
    setEditingZoneId(null)
    setEditingZoneLocId(null)
  }

  function cancelCreateZone() {
    setCreatingZoneForLoc(null)
    setZoneMoreOptions(false)
    setZoneError(null)
  }

  function startEditZone(locationId, zone) {
    setZoneForm({
      name: zone.name || '',
      capacity: zone.capacity == null ? '' : String(zone.capacity),
      description: zone.description || '',
    })
    setZoneMoreOptions(!!zone.description)
    setEditingZoneId(zone.id)
    setEditingZoneLocId(locationId)
    setCreatingZoneForLoc(null)
  }

  function cancelEditZone() {
    setEditingZoneId(null)
    setEditingZoneLocId(null)
    setZoneMoreOptions(false)
  }

  async function saveZone(mode) {
    if (!zoneForm.name.trim()) {
      setZoneError('Name is required')
      return
    }
    setZoneError(null)
    const locationId = mode === 'create' ? creatingZoneForLoc : editingZoneLocId
    const isCreate = mode === 'create'
    const rawCapacity = zoneForm.capacity.trim()
    const parsedCapacity = rawCapacity === '' ? null : parseInt(rawCapacity, 10)
    const payload = {
      name: zoneForm.name,
      capacity: Number.isNaN(parsedCapacity) ? null : parsedCapacity,
      description: zoneForm.description || null,
    }

    if (isCreate) {
      // Optimistic: add zone to location immediately
      const tempId = `temp-${Date.now()}`
      const optimisticZone = { id: tempId, ...payload, is_active: true, _optimistic: true }
      setLocations((prev) => prev.map((l) => l.id === locationId
        ? { ...l, zones: [...(l.zones || []), optimisticZone] }
        : l
      ))
      setCreatingZoneForLoc(null)
      setZoneMoreOptions(false)

      try {
        const res = await fetch(`/api/admin/locations/${locationId}/zones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          setLocations((prev) => prev.map((l) => l.id === locationId
            ? { ...l, zones: (l.zones || []).filter((z) => z.id !== tempId) }
            : l
          ))
          setToast({ message: data.error || 'Failed to save zone', type: 'error' })
          return
        }
        setToast({ message: 'Zone created', type: 'success' })
        fetchLocations()
      } catch {
        setLocations((prev) => prev.map((l) => l.id === locationId
          ? { ...l, zones: (l.zones || []).filter((z) => z.id !== tempId) }
          : l
        ))
        setToast({ message: 'Something went wrong', type: 'error' })
      }
    } else {
      // Optimistic edit
      const prevLocations = [...locations.map((l) => ({ ...l, zones: [...(l.zones || [])] }))]
      setLocations((prev) => prev.map((l) => l.id === locationId
        ? { ...l, zones: (l.zones || []).map((z) => z.id === editingZoneId ? { ...z, ...payload } : z) }
        : l
      ))
      setEditingZoneId(null)
      setEditingZoneLocId(null)
      setZoneMoreOptions(false)

      try {
        const res = await fetch(`/api/admin/locations/${locationId}/zones`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingZoneId, ...payload }),
        })
        const data = await res.json()
        if (!res.ok) {
          setLocations(prevLocations)
          setToast({ message: data.error || 'Failed to save zone', type: 'error' })
          return
        }
        setToast({ message: 'Zone updated', type: 'success' })
        fetchLocations()
      } catch {
        setLocations(prevLocations)
        setToast({ message: 'Something went wrong', type: 'error' })
      }
    }
  }

  async function toggleZoneActive(locationId, zone) {
    // Optimistic update
    setLocations((prev) => prev.map((l) => l.id === locationId
      ? { ...l, zones: (l.zones || []).map((z) => z.id === zone.id ? { ...z, is_active: !z.is_active } : z) }
      : l
    ))
    const res = await fetch(`/api/admin/locations/${locationId}/zones`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: zone.id, is_active: !zone.is_active }),
    })
    const data = await res.json()
    if (!res.ok) {
      // Revert
      setLocations((prev) => prev.map((l) => l.id === locationId
        ? { ...l, zones: (l.zones || []).map((z) => z.id === zone.id ? { ...z, is_active: zone.is_active } : z) }
        : l
      ))
      setToast({ message: data.error || 'Failed to update', type: 'error' })
      return
    }
    setToast({ message: !zone.is_active ? 'Zone activated' : 'Zone deactivated', type: 'success' })
  }

  function handleLocKeyDown(e, mode) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveLocation(mode)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (mode === 'create') cancelCreateLocation()
      else cancelEditLocation()
    }
  }

  function handleZoneKeyDown(e, mode) {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveZone(mode)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      if (mode === 'create') cancelCreateZone()
      else cancelEditZone()
    }
  }

  // Timezone options
  const timezones = [
    'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam', 'Europe/Madrid', 'Europe/Rome',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto',
    'America/Sao_Paulo', 'America/Mexico_City',
    'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland',
    'Africa/Johannesburg', 'Africa/Cairo',
    'UTC',
  ]

  // Shared optional fields for location form
  function renderLocOptionalFields() {
    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <Label className="text-xs text-muted">Address</Label>
          <Input
            value={locForm.address}
            onChange={(e) => setLocForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="123 Sukhumvit Road"
            className="mt-1 h-8 text-sm bg-background border-card-border"
            onKeyDown={(e) => handleLocKeyDown(e, editingLocId ? 'edit' : 'create')}
          />
        </div>
        <div>
          <Label className="text-xs text-muted">City</Label>
          <Input
            value={locForm.city}
            onChange={(e) => setLocForm((f) => ({ ...f, city: e.target.value }))}
            placeholder="Bangkok"
            className="mt-1 h-8 text-sm bg-background border-card-border"
            onKeyDown={(e) => handleLocKeyDown(e, editingLocId ? 'edit' : 'create')}
          />
        </div>
        <div>
          <Label className="text-xs text-muted">Country</Label>
          <Input
            value={locForm.country}
            onChange={(e) => setLocForm((f) => ({ ...f, country: e.target.value }))}
            placeholder="Thailand"
            className="mt-1 h-8 text-sm bg-background border-card-border"
            onKeyDown={(e) => handleLocKeyDown(e, editingLocId ? 'edit' : 'create')}
          />
        </div>
        <div>
          <Label className="text-xs text-muted">Phone</Label>
          <Input
            value={locForm.phone}
            onChange={(e) => setLocForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+66 2 123 4567"
            className="mt-1 h-8 text-sm bg-background border-card-border"
            onKeyDown={(e) => handleLocKeyDown(e, editingLocId ? 'edit' : 'create')}
          />
        </div>
        <div>
          <Label className="text-xs text-muted">Timezone</Label>
          <select
            value={locForm.timezone}
            onChange={(e) => setLocForm((f) => ({ ...f, timezone: e.target.value }))}
            className="mt-1 w-full rounded-md bg-background border border-card-border px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent h-8"
          >
            <option value="">Select timezone</option>
            {timezones.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs text-muted flex items-center gap-1.5">
            Buffer Time
            <span className="relative group">
              <Info className="w-3 h-3 text-muted/50 cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[11px] text-foreground bg-card border border-card-border rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
                Gap between appointments for cleanup or travel
              </span>
            </span>
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              type="number"
              min={0}
              max={120}
              step={5}
              value={locForm.buffer_mins}
              onChange={(e) => setLocForm((f) => ({ ...f, buffer_mins: parseInt(e.target.value) || 0 }))}
              className="h-8 text-sm w-20 bg-background border-card-border"
              onKeyDown={(e) => handleLocKeyDown(e, editingLocId ? 'edit' : 'create')}
            />
            <span className="text-xs text-muted">min</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-sm text-muted mt-1">Manage your studio locations and areas within them</p>
        </div>
        <button onClick={startCreateLocation} className="px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
      </div>

      {/* Toast — fixed position */}
      {toast && (
        <div className={cn(
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 px-4 py-3 rounded-lg border flex items-center gap-3 shadow-lg backdrop-blur-sm sm:max-w-sm',
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-green-500/10 border-green-500/20 text-green-400'
        )}>
          <span className="text-sm flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {(deletingLoc || deletingZone) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-foreground font-semibold mb-2">
              Delete {deletingLoc ? 'Location' : 'Zone'}
            </h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete <span className="text-foreground font-medium">{deletingLoc?.name || deletingZone?.zone?.name}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setDeletingLoc(null); setDeletingZone(null) }}
                disabled={deleteSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => deletingLoc ? deleteLocation(deletingLoc) : deleteZone(deletingZone.locationId, deletingZone.zone)}
                disabled={deleteSubmitting}
                className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                {deleteSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="bg-card border border-card-border rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">{fetchError}</p>
          <Button variant="outline" onClick={fetchLocations} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && !fetchError && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg p-5 animate-pulse">
              <div className="h-5 w-48 bg-card-border rounded" />
              <div className="h-4 w-32 bg-card-border rounded mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && locations.length === 0 && !showCreateLoc && (
        <div className="bg-card border border-card-border rounded-lg p-12 text-center">
          <MapPin className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No locations yet</p>
          <p className="text-sm text-muted mb-4">Add your first studio location to get started</p>
          <Button onClick={startCreateLocation} className="gap-2">
            <Plus className="w-4 h-4" /> Add Location
          </Button>
        </div>
      )}

      {/* Locations list */}
      {!loading && !fetchError && (locations.length > 0 || showCreateLoc) && (
        <div className="space-y-2">
          {locations.map((loc) => {
            const isExpanded = expanded.has(loc.id)
            const isEditing = editingLocId === loc.id
            const zones = loc.zones || []

            if (isEditing) {
              return (
                <div key={loc.id} ref={locFormRef} className="border border-accent/40 rounded-lg p-3 sm:p-4 bg-card">
                  <div>
                    <Label className="text-xs text-muted">Name *</Label>
                    <Input
                      ref={editLocNameRef}
                      value={locForm.name}
                      onChange={(e) => { setLocForm((f) => ({ ...f, name: e.target.value })); setLocError(null) }}
                      placeholder="Location name"
                      className={cn('mt-1 h-8 text-sm bg-background border-card-border', locError && 'border-red-500/50')}
                      onKeyDown={(e) => handleLocKeyDown(e, 'edit')}
                    />
                    {locError && <p className="text-[11px] text-red-400 mt-1">{locError}</p>}
                  </div>

                  <button
                    onClick={() => setLocMoreOptions(!locMoreOptions)}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mt-3"
                  >
                    {locMoreOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {locMoreOptions ? 'Fewer options' : 'More options'}
                  </button>

                  {locMoreOptions && renderLocOptionalFields()}
                  <div className="flex gap-2 mt-4">
                    <button onClick={cancelEditLocation} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                    <button onClick={() => saveLocation('edit')} className="flex-1 h-10 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save</button>
                  </div>
                </div>
              )
            }

            return (
              <div key={loc.id}>
                <div
                  onClick={(e) => {
                    if (e.target.closest('[data-no-edit]')) return
                    toggleExpanded(loc.id)
                  }}
                  className={cn(
                    'border border-card-border rounded-lg p-3 sm:p-4 transition-colors hover:bg-white/[0.03] cursor-pointer',
                    !loc.is_active && 'opacity-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{loc.name}</p>
                        {!loc.is_active && <span className="text-[10px] font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded shrink-0">Inactive</span>}
                        {zones.length > 0 && (
                          <span className="text-[10px] text-muted bg-card-border/50 px-1.5 py-0.5 rounded shrink-0">
                            {zones.filter((z) => z.is_active).length} zone{zones.filter((z) => z.is_active).length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {(loc.address || loc.city || loc.country) && (
                        <p className="text-xs text-muted mt-0.5">
                          {[loc.address, loc.city, loc.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0" data-no-edit>
                      <Switch checked={loc.is_active} onCheckedChange={() => toggleLocationActive(loc)} />
                      <button onClick={(e) => { e.stopPropagation(); startEditLocation(loc) }} className="px-2 py-1 text-xs rounded-md border border-card-border hover:bg-white/[0.03] transition-colors">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); setDeletingLoc(loc) }} className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete location"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>

                {/* Zones section (expanded) */}
                {isExpanded && (
                  <div className="ml-8 mt-1 pl-5 border-l-2 border-card-border space-y-2 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted mb-1">
                      <Layers className="w-3 h-3" />
                      <span>Zones</span>
                    </div>

                    {zones.length === 0 && creatingZoneForLoc !== loc.id && (
                      <p className="text-xs text-muted/50 py-2">No zones. Add zones to organize different areas within this location.</p>
                    )}

                    {zones.map((zone) => {
                      const isZoneEditing = editingZoneId === zone.id
                      return (
                        <div key={zone.id}>
                          <div className={cn(
                            'flex items-center justify-between py-2 px-3 rounded-md bg-card/50 border border-card-border/50',
                            !zone.is_active && 'opacity-50'
                          )}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground">{zone.name}</span>
                                <span className="text-[10px] text-muted px-1.5 py-0.5 bg-card-border/50 rounded">
                                  {zone.capacity == null ? 'Unlimited' : `Cap: ${zone.capacity}`}
                                </span>
                                {!zone.is_active && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Inactive</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={zone.is_active}
                                onCheckedChange={() => toggleZoneActive(loc.id, zone)}
                              />
                              <button
                                className={cn('px-2 py-1 text-xs rounded-md border border-card-border hover:bg-white/[0.03] transition-colors', isZoneEditing && 'text-accent border-accent/30')}
                                onClick={() => isZoneEditing ? cancelEditZone() : startEditZone(loc.id, zone)}
                              >
                                {isZoneEditing ? 'Cancel' : 'Edit'}
                              </button>
                              <button
                                onClick={() => setDeletingZone({ locationId: loc.id, zone })}
                                className="p-1 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete zone"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Inline zone edit */}
                          {isZoneEditing && (
                            <div ref={zoneFormRef} className="mt-1 px-3 py-3 rounded-md bg-background/50 border border-card-border/50">
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <Label className="text-xs text-muted">Name *</Label>
                                  <Input
                                    ref={editZoneNameRef}
                                    value={zoneForm.name}
                                    onChange={(e) => { setZoneForm((f) => ({ ...f, name: e.target.value })); setZoneError(null) }}
                                    placeholder="Zone name"
                                    className={cn('mt-1 h-7 text-sm bg-background border-card-border', zoneError && 'border-red-500/50')}
                                    onKeyDown={(e) => handleZoneKeyDown(e, 'edit')}
                                  />
                                  {zoneError && <p className="text-[11px] text-red-400 mt-1">{zoneError}</p>}
                                </div>
                                <div className="w-24">
                                  <Label className="text-xs text-muted">Capacity</Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={zoneForm.capacity}
                                    onChange={(e) => setZoneForm((f) => ({ ...f, capacity: e.target.value }))}
                                    placeholder="Unlimited"
                                    className="mt-1 h-7 text-sm bg-background border-card-border"
                                    onKeyDown={(e) => handleZoneKeyDown(e, 'edit')}
                                  />
                                </div>
                              </div>

                              {/* Zone more options */}
                              <button
                                onClick={() => setZoneMoreOptions(!zoneMoreOptions)}
                                className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors mt-2"
                              >
                                {zoneMoreOptions ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                {zoneMoreOptions ? 'Fewer options' : 'More options'}
                              </button>

                              {zoneMoreOptions && (
                                <div className="mt-2">
                                  <Label className="text-xs text-muted">Description</Label>
                                  <Input
                                    value={zoneForm.description}
                                    onChange={(e) => setZoneForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Optional description"
                                    className="mt-1 h-7 text-sm bg-background border-card-border"
                                    onKeyDown={(e) => handleZoneKeyDown(e, 'edit')}
                                  />
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <button onClick={cancelEditZone} className="flex-1 h-9 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-xs transition-colors flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</button>
                                <button onClick={() => saveZone('edit')} className="flex-1 h-9 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" /> Save</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Inline zone create */}
                    {creatingZoneForLoc === loc.id && (
                      <div ref={zoneFormRef} className="px-3 py-3 rounded-md border border-dashed border-card-border bg-background/50">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label className="text-xs text-muted">Name *</Label>
                            <Input
                              ref={createZoneNameRef}
                              value={zoneForm.name}
                              onChange={(e) => { setZoneForm((f) => ({ ...f, name: e.target.value })); setZoneError(null) }}
                              placeholder="e.g. Ring A, Studio 2"
                              className={cn('mt-1 h-7 text-sm bg-background border-card-border', zoneError && 'border-red-500/50')}
                              onKeyDown={(e) => handleZoneKeyDown(e, 'create')}
                            />
                            {zoneError && <p className="text-[11px] text-red-400 mt-1">{zoneError}</p>}
                          </div>
                          <div className="w-24">
                            <Label className="text-xs text-muted">Capacity</Label>
                            <Input
                              type="number"
                              min={1}
                              value={zoneForm.capacity}
                              onChange={(e) => setZoneForm((f) => ({ ...f, capacity: e.target.value }))}
                              placeholder="Unlimited"
                              className="mt-1 h-7 text-sm bg-background border-card-border"
                              onKeyDown={(e) => handleZoneKeyDown(e, 'create')}
                            />
                          </div>
                        </div>

                        {/* Zone more options */}
                        <button
                          onClick={() => setZoneMoreOptions(!zoneMoreOptions)}
                          className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors mt-2"
                        >
                          {zoneMoreOptions ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                          {zoneMoreOptions ? 'Fewer options' : 'More options'}
                        </button>

                        {zoneMoreOptions && (
                          <div className="mt-2">
                            <Label className="text-xs text-muted">Description</Label>
                            <Input
                              value={zoneForm.description}
                              onChange={(e) => setZoneForm((f) => ({ ...f, description: e.target.value }))}
                              placeholder="Optional description"
                              className="mt-1 h-7 text-sm bg-background border-card-border"
                              onKeyDown={(e) => handleZoneKeyDown(e, 'create')}
                            />
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button onClick={cancelCreateZone} className="flex-1 h-9 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-xs transition-colors flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" /> Cancel</button>
                          <button onClick={() => saveZone('create')} className="flex-1 h-9 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" /> Save</button>
                        </div>
                      </div>
                    )}

                    {/* Dashed add zone button */}
                    {creatingZoneForLoc !== loc.id && (
                      <button
                        onClick={() => startCreateZone(loc.id)}
                        className="w-full py-2 rounded-md border border-dashed border-card-border text-xs text-muted hover:text-accent hover:border-accent/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" />
                        Add zone
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Inline create location form */}
          {showCreateLoc && (
            <div ref={locFormRef} className="bg-card border border-dashed border-card-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <div className="flex-1">
                  <Input
                    ref={createLocNameRef}
                    value={locForm.name}
                    onChange={(e) => { setLocForm((f) => ({ ...f, name: e.target.value })); setLocError(null) }}
                    placeholder="Location name"
                    className={cn('h-8 text-sm bg-background border-card-border', locError && 'border-red-500/50')}
                    onKeyDown={(e) => handleLocKeyDown(e, 'create')}
                  />
                  {locError && <p className="text-[11px] text-red-400 mt-1">{locError}</p>}
                </div>
              </div>

              <button
                onClick={() => setLocMoreOptions(!locMoreOptions)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mt-3 ml-7"
              >
                {locMoreOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {locMoreOptions ? 'Fewer options' : 'More options'}
              </button>

              {locMoreOptions && (
                <div className="ml-7">
                  {renderLocOptionalFields()}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={cancelCreateLocation} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={() => saveLocation('create')} className="flex-1 h-10 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save</button>
              </div>
            </div>
          )}

          {/* Dashed add location button */}
          {!showCreateLoc && (
            <button
              onClick={startCreateLocation}
              className="w-full py-3 rounded-lg border border-dashed border-card-border text-sm text-muted hover:text-accent hover:border-accent/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add location
            </button>
          )}
        </div>
      )}
    </div>
  )
}
