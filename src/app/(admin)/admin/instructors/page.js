'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X, Check, User, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [deletingInst, setDeletingInst] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Inline create state
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', bio: '' })
  const [createShowBio, setCreateShowBio] = useState(false)
  const createNameRef = useRef(null)

  // Inline edit state
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', bio: '' })
  const [editShowBio, setEditShowBio] = useState(false)
  const editNameRef = useRef(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchInstructors() {
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/instructors')
      if (res.ok) {
        const data = await res.json()
        setInstructors(data.instructors || [])
      } else {
        setFetchError('Failed to load instructors')
      }
    } catch (err) {
      console.error(err)
      setFetchError('Unable to connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchInstructors() }, [])

  // Focus name input when create row appears
  useEffect(() => {
    if (showCreate && createNameRef.current) {
      createNameRef.current.focus()
    }
  }, [showCreate])

  // Focus name input when edit row appears
  useEffect(() => {
    if (editingId && editNameRef.current) {
      editNameRef.current.focus()
    }
  }, [editingId])

  function startCreate() {
    setEditingId(null)
    setCreateForm({ name: '', bio: '' })
    setCreateShowBio(false)
    setShowCreate(true)
  }

  function cancelCreate() {
    setShowCreate(false)
    setCreateForm({ name: '', bio: '' })
    setCreateShowBio(false)
  }

  function startEdit(inst) {
    setShowCreate(false)
    setEditForm({ name: inst.name, bio: inst.bio || '' })
    setEditShowBio(!!inst.bio)
    setEditingId(inst.id)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({ name: '', bio: '' })
    setEditShowBio(false)
  }

  async function handleSaveCreate() {
    if (!createForm.name.trim() || submitting) return

    // Optimistic: add immediately, close form
    const tempId = `temp-${Date.now()}`
    const optimisticInst = {
      id: tempId,
      name: createForm.name,
      bio: createForm.bio || null,
      active: true,
      photo_url: null,
      _optimistic: true,
    }
    setInstructors((prev) => [...prev, optimisticInst])
    cancelCreate()

    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          bio: createForm.bio || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInstructors((prev) => prev.filter((i) => i.id !== tempId))
        setToast({ message: data.error || 'Failed to save', type: 'error' })
        return
      }
      setToast({ message: 'Instructor added', type: 'success' })
      fetchInstructors()
    } catch {
      setInstructors((prev) => prev.filter((i) => i.id !== tempId))
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function handleSaveEdit() {
    if (!editForm.name.trim() || submitting) return

    // Optimistic: update immediately, close form
    const prevInstructors = [...instructors]
    const editId = editingId
    setInstructors((prev) => prev.map((i) => i.id === editId ? { ...i, name: editForm.name, bio: editForm.bio || null } : i))
    cancelEdit()

    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editId,
          name: editForm.name,
          bio: editForm.bio || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setInstructors(prevInstructors)
        setToast({ message: data.error || 'Failed to save', type: 'error' })
        return
      }
      setToast({ message: 'Instructor updated', type: 'success' })
      fetchInstructors()
    } catch {
      setInstructors(prevInstructors)
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function handleToggleActive(e, inst) {
    e.stopPropagation()
    // Optimistic toggle
    setInstructors((prev) => prev.map((i) => i.id === inst.id ? { ...i, active: !i.active } : i))
    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inst.id, active: !inst.active }),
      })
      if (res.ok) {
        setToast({ message: inst.active ? 'Instructor deactivated' : 'Instructor activated', type: 'success' })
      } else {
        // Revert
        setInstructors((prev) => prev.map((i) => i.id === inst.id ? { ...i, active: inst.active } : i))
        setToast({ message: 'Failed to update', type: 'error' })
      }
    } catch {
      setInstructors((prev) => prev.map((i) => i.id === inst.id ? { ...i, active: inst.active } : i))
      setToast({ message: 'Failed to update', type: 'error' })
    }
  }

  async function handleDelete(inst) {
    setDeleteSubmitting(true)
    // Optimistic remove
    setInstructors((prev) => prev.filter((i) => i.id !== inst.id))
    setDeletingInst(null)
    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: inst.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        fetchInstructors()
        setToast({ message: data.error || 'Failed to delete', type: 'error' })
        return
      }
      setToast({ message: 'Instructor deleted', type: 'success' })
    } catch {
      fetchInstructors()
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setDeleteSubmitting(false)
    }
  }

  const handleCreateKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveCreate()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelCreate()
    }
  }, [createForm, submitting])

  const handleEditKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }, [editForm, submitting, editingId])

  // Click outside to close inline forms
  useEffect(() => {
    function handleClickOutside(e) {
      if (showCreate) {
        const createEl = document.querySelector('[data-instructor-create]')
        if (createEl && !createEl.contains(e.target)) cancelCreate()
      }
      if (editingId) {
        const editEl = document.querySelector('[data-instructor-edit]')
        if (editEl && !editEl.contains(e.target)) cancelEdit()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCreate, editingId])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Instructors</h1>
        <p className="text-sm text-muted mt-1">Manage your team of instructors and coaches</p>
      </div>

      {/* Toast */}
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
      {deletingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-foreground font-semibold mb-2">Delete Instructor</h3>
            <p className="text-sm text-muted mb-4">
              Are you sure you want to delete <span className="text-foreground font-medium">{deletingInst.name}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingInst(null)}
                disabled={deleteSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleDelete(deletingInst)}
                disabled={deleteSubmitting}
                className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
              >
                {deleteSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {fetchError && !loading ? (
        <div className="border border-card-border rounded-lg py-12 text-center">
          <p className="text-red-400 font-medium">{fetchError}</p>
          <button
            onClick={fetchInstructors}
            className="mt-3 px-3 py-1.5 text-sm border border-card-border rounded-md text-foreground hover:bg-white/[0.03] transition-colors"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-card border border-card-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Empty state (but still show add button below) */}
          {instructors.length === 0 && !showCreate && (
            <div className="border border-card-border rounded-lg py-12 text-center">
              <p className="text-muted">No instructors yet.</p>
            </div>
          )}

          {/* Instructor rows */}
          {instructors.map((inst) => (
            editingId === inst.id ? (
              /* Inline edit row */
              <div
                key={inst.id}
                data-instructor-edit
                className="border border-accent/40 rounded-lg p-3 sm:p-4 bg-card animate-in fade-in duration-200"
                onKeyDown={handleEditKeyDown}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {inst.photo_url ? (
                      <Image src={inst.photo_url} alt="" width={44} height={44} className="object-cover rounded-full" unoptimized />
                    ) : (
                      <span className="text-accent text-sm font-medium">
                        {(editForm.name?.[0] || inst.name?.[0] || '?').toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <Input
                      ref={editNameRef}
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Instructor name"
                      className="h-8 text-sm bg-background border-card-border"
                    />
                    {editShowBio ? (
                      <Input
                        value={editForm.bio}
                        onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                        placeholder="Short bio..."
                        className="h-8 text-sm bg-background border-card-border"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setEditShowBio(!editShowBio)}
                      className="flex items-center gap-1 text-[11px] text-muted hover:text-accent transition-colors"
                    >
                      {editShowBio ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {editShowBio ? 'Hide bio' : 'More'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={cancelEdit} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                  <button onClick={handleSaveEdit} disabled={submitting || !editForm.name.trim()} className={cn('flex-1 h-10 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center justify-center gap-2', (submitting || !editForm.name.trim()) && 'opacity-50 cursor-not-allowed')}><Check className="w-4 h-4" /> Save</button>
                </div>
              </div>
            ) : (
              /* Normal display row */
              <div
                key={inst.id}
                onClick={(e) => {
                  if (e.target.closest('[data-no-edit]')) return
                  startEdit(inst)
                }}
                className={cn(
                  'w-full text-left border border-card-border rounded-lg p-3 sm:p-4 transition-colors hover:bg-white/[0.03] cursor-pointer',
                  !inst.active && 'opacity-50'
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Photo */}
                  <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {inst.photo_url ? (
                      <Image src={inst.photo_url} alt="" width={44} height={44} className="object-cover rounded-full" unoptimized />
                    ) : (
                      <span className="text-accent text-sm font-medium">
                        {inst.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{inst.name}</p>
                      {!inst.active && (
                        <span className="text-[10px] font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded shrink-0">
                          Inactive
                        </span>
                      )}
                    </div>
                    {inst.bio && <p className="text-xs text-muted truncate mt-0.5">{inst.bio}</p>}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0" data-no-edit>
                    <Switch
                      checked={inst.active}
                      onCheckedChange={() => handleToggleActive({ stopPropagation: () => {} }, inst)}
                    />
                    <button
                      onClick={() => setDeletingInst(inst)}
                      className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete instructor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}

          {/* Inline create row */}
          {showCreate ? (
            <div
              data-instructor-create
              className="border border-dashed border-accent/40 rounded-lg p-3 sm:p-4 bg-card animate-in slide-in-from-bottom-2 fade-in duration-300"
              onKeyDown={handleCreateKeyDown}
            >
              <div className="flex items-center gap-3">
                {/* Placeholder avatar */}
                <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-accent/50" />
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0 space-y-2">
                  <Input
                    ref={createNameRef}
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Instructor name"
                    className="h-8 text-sm bg-background border-card-border"
                  />
                  {createShowBio ? (
                    <Input
                      value={createForm.bio}
                      onChange={(e) => setCreateForm((f) => ({ ...f, bio: e.target.value }))}
                      placeholder="Short bio..."
                      className="h-8 text-sm bg-background border-card-border"
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCreateShowBio(!createShowBio)}
                    className="flex items-center gap-1 text-[11px] text-muted hover:text-accent transition-colors"
                  >
                    {createShowBio ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {createShowBio ? 'Hide bio' : 'More'}
                  </button>
                </div>

              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={cancelCreate} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={handleSaveCreate} disabled={submitting || !createForm.name.trim()} className={cn('flex-1 h-10 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center justify-center gap-2', (submitting || !createForm.name.trim()) && 'opacity-50 cursor-not-allowed')}><Check className="w-4 h-4" /> Save</button>
              </div>
            </div>
          ) : (
            /* Add instructor button */
            <button
              onClick={startCreate}
              className="w-full border-2 border-dashed border-card-border rounded-lg p-4 text-muted hover:text-accent hover:border-accent/30 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <span className="text-lg leading-none group-hover:text-accent transition-colors">+</span>
              <span className="text-sm">Add instructor</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
