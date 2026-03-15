'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/ThemeProvider'
import { getCurrencySymbol } from '@/lib/currency'
import { X, ExternalLink, Trash2, Tag, Check, ChevronDown, ChevronUp, Plus, Package } from 'lucide-react'

export default function AdminPacksPage() {
  const { theme } = useTheme()
  const cs = getCurrencySymbol(theme?.currency)
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [fetchError, setFetchError] = useState(null)
  const [deleteDialog, setDeleteDialog] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Inline create
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '', credits: '', validity_days: 30, price_thb: 0, is_membership: false, is_intro: false, badge_text: '', display_order: 0, stripe_price_id: '' })
  const [createMore, setCreateMore] = useState(false)
  const createNameRef = useRef(null)

  // Inline edit
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', credits: '', validity_days: 30, price_thb: 0, is_membership: false, is_intro: false, badge_text: '', display_order: 0, stripe_price_id: '' })
  const [editMore, setEditMore] = useState(false)
  const editNameRef = useRef(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchPacks() {
    setFetchError(null)
    try {
      const res = await fetch('/api/admin/packs')
      if (res.ok) {
        const data = await res.json()
        setPacks(data.packs || [])
      } else {
        setFetchError('Failed to load products')
      }
    } catch {
      setFetchError('Unable to connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPacks() }, [])
  useEffect(() => { if (showCreate) setTimeout(() => createNameRef.current?.focus(), 50) }, [showCreate])
  useEffect(() => { if (editingId) setTimeout(() => editNameRef.current?.focus(), 50) }, [editingId])

  // Click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (showCreate) {
        const el = document.querySelector('[data-pack-create]')
        if (el && !el.contains(e.target)) cancelCreate()
      }
      if (editingId) {
        const el = document.querySelector('[data-pack-edit]')
        if (el && !el.contains(e.target)) cancelEdit()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCreate, editingId])

  function startCreate() {
    setCreateForm({ name: '', description: '', credits: '', validity_days: 30, price_thb: 0, is_membership: false, is_intro: false, badge_text: '', display_order: 0, stripe_price_id: '' })
    setCreateMore(false)
    setShowCreate(true)
    setEditingId(null)
  }
  function cancelCreate() { setShowCreate(false); setCreateMore(false) }

  function startEdit(pack) {
    setEditForm({
      name: pack.name,
      description: pack.description || '',
      credits: pack.credits === null ? '' : pack.credits.toString(),
      validity_days: pack.validity_days,
      price_thb: pack.price_thb,
      is_membership: pack.is_membership,
      is_intro: pack.is_intro,
      badge_text: pack.badge_text || '',
      display_order: pack.display_order || 0,
      stripe_price_id: pack.stripe_price_id || '',
    })
    setEditMore(true)
    setEditingId(pack.id)
    setShowCreate(false)
  }
  function cancelEdit() { setEditingId(null); setEditMore(false) }

  function buildPayload(form, id) {
    return {
      ...(id && { id }),
      name: form.name,
      description: form.description || null,
      credits: form.credits === '' ? null : parseInt(form.credits),
      validity_days: parseInt(form.validity_days),
      price_thb: parseInt(form.price_thb),
      is_membership: form.is_membership,
      is_intro: form.is_intro,
      badge_text: form.badge_text || null,
      display_order: parseInt(form.display_order) || 0,
      stripe_price_id: form.stripe_price_id || null,
    }
  }

  async function handleCreate() {
    if (!createForm.name.trim()) return
    const payload = buildPayload(createForm)
    const tempId = `temp-${Date.now()}`
    setPacks((prev) => [...prev, { id: tempId, ...payload, active: true, _optimistic: true }])
    cancelCreate()

    try {
      const res = await fetch('/api/admin/packs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setPacks((prev) => prev.filter((p) => p.id !== tempId)); setToast({ message: data.error || 'Failed to create', type: 'error' }); return }
      setToast({ message: 'Product created', type: 'success' })
      fetchPacks()
    } catch {
      setPacks((prev) => prev.filter((p) => p.id !== tempId))
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function handleUpdate() {
    if (!editForm.name.trim()) return
    const id = editingId
    const payload = buildPayload(editForm, id)
    const prev = [...packs]
    setPacks((list) => list.map((p) => p.id === id ? { ...p, ...payload } : p))
    cancelEdit()

    try {
      const res = await fetch('/api/admin/packs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setPacks(prev); setToast({ message: data.error || 'Failed to update', type: 'error' }); return }
      setToast({ message: 'Product updated', type: 'success' })
      fetchPacks()
    } catch {
      setPacks(prev)
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function handleDelete(pack) {
    setDeleteDialog(null)
    setPacks((prev) => prev.filter((p) => p.id !== pack.id))
    try {
      const res = await fetch('/api/admin/packs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pack.id }) })
      const data = await res.json()
      if (!res.ok) { fetchPacks(); setToast({ message: data.error || 'Failed to delete', type: 'error' }); return }
      setToast({ message: `"${pack.name}" deleted`, type: 'success' })
    } catch {
      fetchPacks()
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  async function toggleActive(pack) {
    setPacks((prev) => prev.map((p) => p.id === pack.id ? { ...p, active: !p.active } : p))
    try {
      const res = await fetch('/api/admin/packs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pack.id, active: !pack.active }) })
      if (!res.ok) {
        setPacks((prev) => prev.map((p) => p.id === pack.id ? { ...p, active: pack.active } : p))
        setToast({ message: 'Failed to update', type: 'error' })
        return
      }
      setToast({ message: pack.active ? 'Product deactivated' : 'Product activated', type: 'success' })
    } catch {
      setPacks((prev) => prev.map((p) => p.id === pack.id ? { ...p, active: pack.active } : p))
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  function handleKeyDown(e, mode) {
    if (e.key === 'Enter') { e.preventDefault(); mode === 'create' ? handleCreate() : handleUpdate() }
    else if (e.key === 'Escape') { e.preventDefault(); mode === 'create' ? cancelCreate() : cancelEdit() }
  }

  function renderPrimaryFields(form, setForm, mode, nameRef) {
    return (
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <Label className="text-xs text-muted">Name *</Label>
          <Input ref={nameRef} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Pack name" className="mt-1 h-8 text-sm bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
        </div>
        <div className="w-20">
          <Label className="text-xs text-muted">Credits</Label>
          <Input type="number" value={form.credits} onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))} placeholder="∞" className="mt-1 h-8 text-sm bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
        </div>
        <div className="w-20">
          <Label className="text-xs text-muted">Days</Label>
          <Input type="number" value={form.validity_days} onChange={(e) => setForm((f) => ({ ...f, validity_days: e.target.value }))} className="mt-1 h-8 text-sm bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
        </div>
        <div className="w-24">
          <Label className="text-xs text-muted">Price ({theme?.currency || 'THB'})</Label>
          <Input type="number" value={form.price_thb} onChange={(e) => setForm((f) => ({ ...f, price_thb: e.target.value }))} className="mt-1 h-8 text-sm bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
        </div>
      </div>
    )
  }

  function renderMoreFields(form, setForm, mode) {
    return (
      <div className="space-y-3 mt-3 pt-3 border-t border-card-border/50">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-muted">Description</Label>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="mt-1 h-8 text-sm bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
          </div>
          <div className="w-20">
            <Label className="text-xs text-muted">Order</Label>
            <Input type="number" value={form.display_order} onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))} className="mt-1 h-8 text-sm bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
          </div>
          <div className="w-32">
            <Label className="text-xs text-muted">Badge</Label>
            <Input value={form.badge_text} onChange={(e) => setForm((f) => ({ ...f, badge_text: e.target.value }))} placeholder="e.g. Best Value" className="mt-1 h-8 text-sm bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted">Stripe Product</Label>
          <Input value={form.stripe_price_id} onChange={(e) => setForm((f) => ({ ...f, stripe_price_id: e.target.value }))} placeholder="Paste product ID, price ID, or Stripe URL" className="mt-1 h-8 text-sm font-mono bg-background border-card-border" onKeyDown={(e) => handleKeyDown(e, mode)} />
          <p className="text-[10px] text-muted mt-1">Product ID (prod_...), Price ID (price_...), or product URL</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_intro} onCheckedChange={(v) => setForm((f) => ({ ...f, is_intro: v }))} />
            <Label className="text-xs">Intro Pack</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_membership} onCheckedChange={(v) => setForm((f) => ({ ...f, is_membership: v }))} />
            <Label className="text-xs">Membership</Label>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted mt-1">Manage your class packs and memberships</p>
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
            <h3 className="text-foreground font-semibold mb-2">Delete Product</h3>
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
          <Button variant="outline" onClick={fetchPacks} className="gap-2">Retry</Button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-card border border-card-border rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {packs.length === 0 && !showCreate && (
            <div className="border border-card-border rounded-lg py-12 text-center">
              <Package className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">No products yet</p>
              <p className="text-sm text-muted mb-4">Add your first class pack or membership</p>
              <Button onClick={startCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
            </div>
          )}

          {packs.map((pack) => {
            const isEditing = editingId === pack.id

            if (isEditing) {
              return (
                <div key={pack.id} data-pack-edit className="border border-accent/40 rounded-lg p-3 sm:p-4 bg-card">
                  {renderPrimaryFields(editForm, setEditForm, 'edit', editNameRef)}
                  <button onClick={() => setEditMore(!editMore)} className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mt-3">
                    {editMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {editMore ? 'Fewer options' : 'More options'}
                  </button>
                  {editMore && renderMoreFields(editForm, setEditForm, 'edit')}
                  <div className="flex gap-2 mt-4">
                    <button onClick={cancelEdit} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                    <button onClick={handleUpdate} className="flex-1 h-10 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save</button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={pack.id}
                onClick={(e) => { if (e.target.closest('[data-no-edit]')) return; startEdit(pack) }}
                className={cn('border border-card-border rounded-lg p-3 sm:p-4 transition-colors hover:bg-white/[0.03] cursor-pointer', !pack.active && 'opacity-50')}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{pack.name}</p>
                      {pack.badge_text && <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">{pack.badge_text}</span>}
                      {pack.is_intro && <span className="text-[10px] font-medium text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded shrink-0">Intro</span>}
                      {pack.is_membership && <span className="text-[10px] font-medium text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded shrink-0">Membership</span>}
                      {!pack.active && <span className="text-[10px] font-medium text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded shrink-0">Inactive</span>}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {pack.credits === null ? 'Unlimited' : `${pack.credits} credit${pack.credits !== 1 ? 's' : ''}`} · {pack.validity_days} days · {cs}{(pack.price_thb || 0).toLocaleString()}
                    </p>
                    {pack.stripe_price_id ? (
                      <span className="text-[10px] text-green-400/70 mt-0.5 font-mono inline-flex items-center gap-1">
                        Stripe linked <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-red-400/70 mt-0.5">No Stripe product linked</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0" data-no-edit>
                    <Switch checked={pack.active} onCheckedChange={() => toggleActive(pack)} />
                    <button onClick={() => setDeleteDialog(pack)} className="p-1.5 rounded-md text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete product">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Inline create */}
          {showCreate ? (
            <div data-pack-create className="border border-dashed border-accent/40 rounded-lg p-3 sm:p-4 bg-card">
              {renderPrimaryFields(createForm, setCreateForm, 'create', createNameRef)}
              <button onClick={() => setCreateMore(!createMore)} className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mt-3">
                {createMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {createMore ? 'Fewer options' : 'More options'}
              </button>
              {createMore && renderMoreFields(createForm, setCreateForm, 'create')}
              <div className="flex gap-2 mt-4">
                <button onClick={cancelCreate} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                <button onClick={handleCreate} className="flex-1 h-10 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Save</button>
              </div>
            </div>
          ) : (
            (packs.length > 0 || showCreate) && (
              <button onClick={startCreate} className="w-full py-3 rounded-lg border border-dashed border-card-border text-sm text-muted hover:text-accent hover:border-accent/30 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add product
              </button>
            )
          )}
        </div>
      )}

      {/* Promo Codes Guide */}
      <div className="border border-card-border rounded-lg bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Promo Codes</h2>
        </div>
        <p className="text-sm text-muted mb-3">
          Promo codes are managed through your Stripe Dashboard. When a customer checks out, they can enter a promo code to get a discount.
        </p>
        <div className="space-y-2 text-sm text-muted">
          <div className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5 shrink-0">1.</span>
            <span>Go to your <a href="https://dashboard.stripe.com/coupons" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Stripe Dashboard &rarr; Coupons</a></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5 shrink-0">2.</span>
            <span>Click <strong className="text-foreground">&quot;+ New&quot;</strong> to create a coupon</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5 shrink-0">3.</span>
            <span>Under the coupon, click <strong className="text-foreground">&quot;Add promotion code&quot;</strong> to create a customer-facing code (e.g. <code className="text-accent bg-accent/10 px-1.5 py-0.5 rounded text-xs">WELCOME20</code>)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5 shrink-0">4.</span>
            <span>Set limits: max redemptions, first-time customers only, specific products, expiry date</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-accent font-bold mt-0.5 shrink-0">5.</span>
            <span>Share the code with your members — they&apos;ll see a <strong className="text-foreground">&quot;Add promotion code&quot;</strong> field on the checkout page</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-card-border">
          <p className="text-xs text-muted">
            All promo code usage, redemptions, and revenue impact are tracked automatically in your Stripe Dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
