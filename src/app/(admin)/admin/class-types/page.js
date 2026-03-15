'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { X, Upload, Trash2, ImageIcon, Plus, Check, ChevronDown, ChevronUp, Camera, Tag } from 'lucide-react'
import Image from 'next/image'

const COLOR_OPTIONS = [
  { label: 'Gold', value: '#c8a750' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Purple', value: '#a855f7' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Teal', value: '#14b8a6' },
]

export default function ClassTypesPage() {
  const [classTypes, setClassTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)

  // Inline create
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '', duration_mins: 60, color: '#c8a750', icon: '', is_private: false })
  const [createMore, setCreateMore] = useState(false)
  const [createImageFile, setCreateImageFile] = useState(null)
  const [createImagePreview, setCreateImagePreview] = useState(null)
  const createNameRef = useRef(null)

  // Inline edit
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', duration_mins: 60, color: '#c8a750', icon: '', is_private: false, image_url: null })
  const [editMore, setEditMore] = useState(false)
  const [editImageFile, setEditImageFile] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const editNameRef = useRef(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchClassTypes() {
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/class-types')
      if (res.ok) {
        const data = await res.json()
        setClassTypes(data.classTypes || [])
      } else {
        setFetchError('Failed to load events')
      }
    } catch {
      setFetchError('Unable to connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClassTypes() }, [])
  useEffect(() => { if (showCreate) setTimeout(() => createNameRef.current?.focus(), 50) }, [showCreate])
  useEffect(() => { if (editingId) setTimeout(() => editNameRef.current?.focus(), 50) }, [editingId])

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(e) {
      if (showCreate) {
        const el = document.querySelector('[data-event-create]')
        if (el && !el.contains(e.target)) cancelCreate()
      }
      if (editingId) {
        const el = document.querySelector('[data-event-edit]')
        if (el && !el.contains(e.target)) cancelEdit()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCreate, editingId])

  function startCreate() {
    setCreateForm({ name: '', description: '', duration_mins: 60, color: '#c8a750', icon: '', is_private: false })
    setCreateMore(false)
    setCreateImageFile(null)
    setCreateImagePreview(null)
    setShowCreate(true)
    setEditingId(null)
  }

  function cancelCreate() {
    setShowCreate(false)
    setCreateMore(false)
    setCreateImageFile(null)
    setCreateImagePreview(null)
  }

  function startEdit(ct) {
    setEditForm({
      name: ct.name,
      description: ct.description || '',
      duration_mins: ct.duration_mins || 60,
      color: ct.color || '#c8a750',
      icon: ct.icon || '',
      is_private: ct.is_private || false,
      image_url: ct.image_url || null,
    })
    setEditMore(true)
    setEditImageFile(null)
    setEditImagePreview(null)
    setEditingId(ct.id)
    setShowCreate(false)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditMore(false)
    setEditImageFile(null)
    setEditImagePreview(null)
  }

  async function uploadClassImage(classTypeId, file) {
    const fd = new FormData()
    fd.append('image', file)
    fd.append('classTypeId', classTypeId)
    try {
      const res = await fetch('/api/admin/class-types/image', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        setToast({ message: data.error || 'Image upload failed', type: 'error' })
      }
    } catch {
      setToast({ message: 'Image upload failed', type: 'error' })
    }
  }

  async function deleteClassImage(classTypeId) {
    try {
      const res = await fetch('/api/admin/class-types/image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classTypeId }),
      })
      if (res.ok) {
        setEditForm((f) => ({ ...f, image_url: null }))
        setToast({ message: 'Image removed', type: 'success' })
        fetchClassTypes()
      }
    } catch {
      setToast({ message: 'Failed to remove image', type: 'error' })
    }
  }

  const [formError, setFormError] = useState(null)

  async function handleCreate() {
    if (!createForm.name.trim()) { setFormError('Name is required'); return }
    setFormError(null)

    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId, ...createForm, is_active: true, active: true, image_url: createImagePreview || null, _optimistic: true,
    }
    setClassTypes((prev) => [...prev, optimistic])
    const savedFile = createImageFile
    cancelCreate()

    try {
      const res = await fetch('/api/admin/class-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || undefined,
          duration_mins: createForm.duration_mins,
          color: createForm.color,
          icon: createForm.icon || undefined,
          is_private: createForm.is_private,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setClassTypes((prev) => prev.filter((ct) => ct.id !== tempId))
        setToast({ message: data.error || 'Failed to create', type: 'error' })
        return
      }
      if (savedFile && data.classType?.id) await uploadClassImage(data.classType.id, savedFile)
      setToast({ message: `"${data.classType.name}" created`, type: 'success' })
      fetchClassTypes()
    } catch {
      setClassTypes((prev) => prev.filter((ct) => ct.id !== tempId))
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function handleUpdate() {
    if (!editForm.name.trim()) { setFormError('Name is required'); return }
    setFormError(null)
    const id = editingId
    const savedImageFile = editImageFile
    const prev = [...classTypes]
    setClassTypes((list) => list.map((ct) => ct.id === id ? { ...ct, ...editForm } : ct))
    cancelEdit()

    try {
      const res = await fetch('/api/admin/class-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editForm.name, description: editForm.description || null, duration_mins: editForm.duration_mins, color: editForm.color, icon: editForm.icon || null, is_private: editForm.is_private }),
      })
      const data = await res.json()
      if (!res.ok) {
        setClassTypes(prev)
        setToast({ message: data.error || 'Failed to update', type: 'error' })
        return
      }
      if (savedImageFile) await uploadClassImage(id, savedImageFile)
      setToast({ message: `"${data.classType.name}" updated`, type: 'success' })
      fetchClassTypes()
    } catch {
      setClassTypes(prev)
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function handleDelete(ct) {
    setDeleteDialog(null)
    setClassTypes((prev) => prev.filter((c) => c.id !== ct.id))
    try {
      const res = await fetch('/api/admin/class-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ct.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        fetchClassTypes()
        setToast({ message: data.error || 'Failed to delete', type: 'error' })
        return
      }
      setToast({ message: `"${ct.name}" deleted`, type: 'success' })
    } catch {
      fetchClassTypes()
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function toggleActive(ct) {
    setClassTypes((prev) => prev.map((c) => c.id === ct.id ? { ...c, active: !c.active, is_active: !c.active } : c))
    try {
      const res = await fetch('/api/admin/class-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ct.id, active: !ct.active }),
      })
      if (!res.ok) {
        setClassTypes((prev) => prev.map((c) => c.id === ct.id ? { ...c, active: ct.active, is_active: ct.active } : c))
        setToast({ message: 'Failed to update', type: 'error' })
        return
      }
      setToast({ message: ct.active ? 'Event deactivated' : 'Event activated', type: 'success' })
    } catch {
      setClassTypes((prev) => prev.map((c) => c.id === ct.id ? { ...c, active: ct.active, is_active: ct.active } : c))
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  function handleKeyDown(e, mode) {
    if (e.key === 'Enter') { e.preventDefault(); mode === 'create' ? handleCreate() : handleUpdate() }
    else if (e.key === 'Escape') { e.preventDefault(); mode === 'create' ? cancelCreate() : cancelEdit() }
  }

  function renderColorPicker(form, setForm) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setForm((f) => ({ ...f, color: c.value }))}
            className={cn('w-6 h-6 rounded-full border-2 transition-all', form.color === c.value ? 'border-foreground scale-110' : 'border-transparent hover:border-card-border')}
            style={{ backgroundColor: c.value }}
            title={c.label}
          />
        ))}
      </div>
    )
  }

  function renderMoreFields(form, setForm, mode, imagePreview, onImageSelect, onImageDelete) {
    return (
      <div className="space-y-3 mt-3 pt-3 border-t border-card-border/50">
        <div>
          <Label className="text-xs text-muted">Description</Label>
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description"
            className="mt-1 h-8 text-sm bg-background border-card-border"
            onKeyDown={(e) => handleKeyDown(e, mode)}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_private}
            onChange={(e) => setForm((f) => ({ ...f, is_private: e.target.checked }))}
            className="w-3.5 h-3.5 rounded border-card-border bg-card accent-accent"
          />
          <span className="text-xs text-foreground">Private</span>
        </label>
        <div>
          {(imagePreview || form.image_url) ? (
            <div className="relative rounded-lg overflow-hidden h-20 bg-card border border-card-border group">
              <Image src={imagePreview || form.image_url} alt="Preview" fill className="object-cover" sizes="400px" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <label className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-white" />
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onImageSelect(f)
                  }} />
                </label>
                <button
                  type="button"
                  onClick={() => { onImageSelect(null); if (onImageDelete) onImageDelete() }}
                  className="w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex items-center gap-2 text-xs text-muted hover:text-foreground cursor-pointer transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <span>Add image</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImageSelect(f)
              }} />
            </label>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted mt-1">Manage your class types and event categories</p>
        </div>
        <button onClick={startCreate} className="px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 px-4 py-3 rounded-lg border flex items-center gap-3 shadow-lg backdrop-blur-sm sm:max-w-sm',
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
        )}>
          <span className="text-sm flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Delete dialog */}
      {deleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-foreground font-semibold mb-2">Delete Event</h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete <span className="text-foreground font-medium">{deleteDialog.name}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancel</Button>
              <Button size="sm" onClick={() => handleDelete(deleteDialog)} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {fetchError && !loading ? (
        <div className="bg-card border border-card-border rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">{fetchError}</p>
          <Button variant="outline" onClick={fetchClassTypes} className="gap-2">Retry</Button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card border border-card-border rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {classTypes.length === 0 && !showCreate && (
            <div className="border border-card-border rounded-lg py-12 text-center">
              <Tag className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">No events yet</p>
              <p className="text-sm text-muted mb-4">Add your first event type to get started</p>
              <Button onClick={startCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Event</Button>
            </div>
          )}

          {classTypes.map((ct) => {
            const isActive = ct.active !== undefined ? ct.active : ct.is_active
            const isEditing = editingId === ct.id

            if (isEditing) {
              return (
                <div key={ct.id} data-event-edit className="border border-accent/40 rounded-lg p-3 sm:p-4 bg-card">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: `${editForm.color}25` }}>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: editForm.color }} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <Input
                        ref={editNameRef}
                        value={editForm.name}
                        onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); setFormError(null) }}
                        placeholder="Event name"
                        className={cn("h-8 text-sm bg-background border-card-border", formError && "border-red-500/50")}
                        onKeyDown={(e) => handleKeyDown(e, 'edit')}
                      />
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-muted">Duration</Label>
                          <Input type="number" min={1} max={300} value={editForm.duration_mins} onChange={(e) => setEditForm((f) => ({ ...f, duration_mins: parseInt(e.target.value) || 60 }))} className="h-7 text-xs w-16 bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, 'edit')} />
                          <span className="text-xs text-muted">min</span>
                        </div>
                        {renderColorPicker(editForm, setEditForm)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setEditMore(!editMore)} className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mt-3">
                    {editMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {editMore ? 'Fewer options' : 'More options'}
                  </button>
                  {editMore && renderMoreFields(editForm, setEditForm, 'edit', editImagePreview, (f) => { setEditImageFile(f); setEditImagePreview(f ? URL.createObjectURL(f) : null) }, editForm.image_url ? () => deleteClassImage(ct.id) : null)}
                  {formError && <p className="text-[11px] text-red-400 mt-2">{formError}</p>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { cancelEdit(); setFormError(null) }} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                    <button onClick={handleUpdate} className="flex-1 h-10 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save</button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={ct.id}
                onClick={(e) => { if (e.target.closest('[data-no-edit]')) return; startEdit(ct) }}
                className={cn('border border-card-border rounded-lg p-3 sm:p-4 transition-colors hover:bg-white/[0.03] cursor-pointer', !isActive && 'opacity-50')}
              >
                <div className="flex items-center gap-3">
                  {/* Color indicator */}
                  <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: `${ct.color || '#c8a750'}25` }}>
                    {ct.icon ? <span className="text-base">{ct.icon}</span> : <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ct.color || '#c8a750' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{ct.name}</p>
                      {ct.is_private && <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded shrink-0">Private</span>}
                      {!isActive && <span className="text-[10px] font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded shrink-0">Inactive</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {ct.duration_mins} min
                      {ct.description && <span> · {ct.description}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" data-no-edit>
                    <Switch checked={isActive} onCheckedChange={() => toggleActive(ct)} />
                    <button onClick={() => setDeleteDialog(ct)} className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete event">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Inline create */}
          {showCreate ? (
            <div data-event-create className="border border-dashed border-accent/40 rounded-lg p-3 sm:p-4 bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: `${createForm.color}25` }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: createForm.color }} />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <Input
                    ref={createNameRef}
                    value={createForm.name}
                    onChange={(e) => { setCreateForm((f) => ({ ...f, name: e.target.value })); setFormError(null) }}
                    placeholder="Event name"
                    className="h-8 text-sm bg-background border-card-border"
                    onKeyDown={(e) => handleKeyDown(e, 'create')}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted">Duration</Label>
                      <Input type="number" min={1} max={300} value={createForm.duration_mins} onChange={(e) => setCreateForm((f) => ({ ...f, duration_mins: parseInt(e.target.value) || 60 }))} className="h-7 text-xs w-16 bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, 'create')} />
                      <span className="text-xs text-muted">min</span>
                    </div>
                    {renderColorPicker(createForm, setCreateForm)}
                  </div>
                </div>
              </div>
              <button onClick={() => setCreateMore(!createMore)} className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mt-3">
                {createMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {createMore ? 'Fewer options' : 'More options'}
              </button>
              {createMore && renderMoreFields(createForm, setCreateForm, 'create', createImagePreview, (f) => { setCreateImageFile(f); setCreateImagePreview(f ? URL.createObjectURL(f) : null) }, null)}
              {formError && <p className="text-[11px] text-red-400 mt-2">{formError}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => { cancelCreate(); setFormError(null) }} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={handleCreate} className="flex-1 h-10 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save</button>
              </div>
            </div>
          ) : (
            (classTypes.length > 0 || showCreate) && (
              <button onClick={startCreate} className="w-full py-3 rounded-lg border border-dashed border-card-border text-sm text-muted hover:text-accent hover:border-accent/30 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add event
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
