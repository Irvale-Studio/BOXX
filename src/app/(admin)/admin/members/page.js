'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { X, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react'

export default function AdminMembersPage() {
  const { data: session } = useSession()
  const myRole = session?.user?.role
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [creditsFilter, setCreditsFilter] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [toast, setToast] = useState(null)

  // Inline expand
  const [expandedId, setExpandedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Edit dialog
  const [editDialog, setEditDialog] = useState(null) // member object or null
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: 'member' })
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Delete dialog
  const [freezeDialog, setFreezeDialog] = useState(null)
  const [freezeSubmitting, setFreezeSubmitting] = useState(false)

  // Grant credits dialog
  const [grantDialog, setGrantDialog] = useState(null)
  const [packs, setPacks] = useState([])
  const [grantPackId, setGrantPackId] = useState('')
  const [grantNotes, setGrantNotes] = useState('')
  const [grantSubmitting, setGrantSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  // Inline add member
  const [showAddMember, setShowAddMember] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '' })
  const [addSubmitting, setAddSubmitting] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '30' })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (creditsFilter) params.set('hasCredits', creditsFilter)
      if (sortBy) params.set('sort', sortBy)
      const res = await fetch(`/api/admin/members?${params}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.members || [])
        setTotal(data.total || 0)
      } else {
        setFetchError('Failed to load members')
      }
    } catch {
      setFetchError('Unable to connect. Check your internet and try again.')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter, creditsFilter, sortBy])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  useEffect(() => {
    fetch('/api/admin/packs')
      .then((res) => res.ok ? res.json() : { packs: [] })
      .then((data) => setPacks(data.packs || []))
      .catch(() => {})
  }, [])

  async function toggleExpand(member) {
    if (expandedId === member.id) {
      setExpandedId(null)
      setDetail(null)
      return
    }
    setExpandedId(member.id)
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await fetch(`/api/admin/members/${member.id}`)
      if (res.ok) setDetail(await res.json())
    } catch {} finally {
      setDetailLoading(false)
    }
  }

  async function refreshDetail(memberId) {
    try {
      const res = await fetch(`/api/admin/members/${memberId}`)
      if (res.ok) setDetail(await res.json())
    } catch {}
  }

  function openEdit(member, det) {
    setEditForm({
      name: det?.member?.name || member.name || '',
      email: det?.member?.email || member.email || '',
      phone: det?.member?.phone || '',
      role: det?.member?.role || member.role || 'member',
    })
    setEditDialog(member)
  }

  async function handleEdit() {
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/admin/members/${editDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to update', type: 'error' }); return }
      setToast({ message: 'Member updated', type: 'success' })
      setEditDialog(null)
      refreshDetail(editDialog.id)
      fetchMembers()
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleFreeze(member) {
    setFreezeSubmitting(true)
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to freeze', type: 'error' }); return }
      setToast({ message: `Member frozen. ${data.cancelled_bookings || 0} booking(s) cancelled.`, type: 'success' })
      setFreezeDialog(null)
      setExpandedId(null)
      setDetail(null)
      fetchMembers()
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setFreezeSubmitting(false)
    }
  }

  async function handleUnfreeze(member) {
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'member' }),
      })
      if (res.ok) {
        setToast({ message: 'Member unfrozen', type: 'success' })
        refreshDetail(member.id)
        fetchMembers()
      }
    } catch {
      setToast({ message: 'Failed to unfreeze', type: 'error' })
    }
  }

  async function handleGrant() {
    if (!grantPackId) return
    setGrantSubmitting(true)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: grantDialog.id, packId: grantPackId, notes: grantNotes || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to grant credits', type: 'error' }); return }
      setToast({ message: 'Product granted', type: 'success' })
      setGrantDialog(null)
      refreshDetail(grantDialog.id)
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setGrantSubmitting(false)
    }
  }

  async function handleBookingAction(memberId, bookingId, action, refundCredit) {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, action, refundCredit }),
      })
      if (!res.ok) {
        const data = await res.json()
        setToast({ message: data.error || 'Action failed', type: 'error' })
        return
      }
      setToast({ message: 'Booking cancelled', type: 'success' })
      refreshDetail(memberId)
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  async function handleAddMember() {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) return
    setAddSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addForm.name, email: addForm.email, password: addForm.password }),
      })
      const data = await res.json()
      if (!res.ok) { setToast({ message: data.error || 'Failed to add member', type: 'error' }); return }
      setToast({ message: 'Member added', type: 'success' })
      setShowAddMember(false)
      setAddForm({ name: '', email: '', password: '' })
      fetchMembers()
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally {
      setAddSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / 30)

  function roleBadge(role) {
    const map = {
      owner: { text: 'Owner', cls: 'text-purple-400 bg-purple-400/10' },
      admin: { text: 'Admin', cls: 'text-accent bg-accent/10' },
      employee: { text: 'Staff', cls: 'text-sky-400 bg-sky-400/10' },
      frozen: { text: 'Frozen', cls: 'text-blue-400 bg-blue-400/10' },
    }
    const b = map[role]
    return b ? <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0', b.cls)}>{b.text}</span> : null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted mt-1">{total} total</p>
        </div>
        <button onClick={() => setShowAddMember(true)} className="px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add</button>
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

      {/* Search & Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input placeholder="Search by name or email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="flex-1 sm:max-w-sm" />
          <Button type="submit" variant="outline" className="shrink-0">Search</Button>
          {search && <Button variant="outline" className="shrink-0" onClick={() => { setSearchInput(''); setSearch(''); setPage(1) }}>Clear</Button>}
        </form>
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          <div>
            <label className="text-xs text-muted block mb-1">Role</label>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="rounded-lg bg-background/50 border border-card-border/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
              <option value="">All Roles</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Credits</label>
            <select value={creditsFilter} onChange={(e) => { setCreditsFilter(e.target.value); setPage(1) }} className="rounded-lg bg-background/50 border border-card-border/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
              <option value="">All</option>
              <option value="yes">Has Credits</option>
              <option value="no">No Credits</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">Sort</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1) }} className="rounded-lg bg-background/50 border border-card-border/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="most_credits">Most Credits</option>
              <option value="most_bookings">Most Bookings</option>
            </select>
          </div>
          {(roleFilter || creditsFilter || sortBy !== 'newest') && (
            <Button variant="outline" className="text-xs" onClick={() => { setRoleFilter(''); setCreditsFilter(''); setSortBy('newest'); setPage(1) }}>Reset</Button>
          )}
        </div>
      </div>

      {/* Inline add member */}
      {showAddMember && (
        <div className="border border-dashed border-accent/40 rounded-lg p-3 sm:p-4 bg-card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-muted block mb-1">Name *</label>
              <Input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="h-8 text-sm bg-background border-card-border" autoFocus />
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Email *</label>
              <Input type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="h-8 text-sm bg-background border-card-border" />
            </div>
            <div>
              <label className="text-[11px] text-muted block mb-1">Password *</label>
              <Input type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" className="h-8 text-sm bg-background border-card-border" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => { setShowAddMember(false); setAddForm({ name: '', email: '', password: '' }) }} className="flex-1 h-10 rounded-lg border border-card-border text-muted hover:text-foreground hover:bg-white/[0.03] text-sm transition-colors flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
            <button onClick={handleAddMember} disabled={addSubmitting || !addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()} className={cn('flex-1 h-10 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center justify-center gap-2', (addSubmitting || !addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) && 'opacity-50 cursor-not-allowed')}><Check className="w-4 h-4" /> {addSubmitting ? 'Adding...' : 'Add Member'}</button>
          </div>
        </div>
      )}

      {/* List */}
      {fetchError && !loading ? (
        <div className="border border-card-border rounded-lg py-12 text-center">
          <p className="text-red-400 font-medium">{fetchError}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={fetchMembers}>Retry</Button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-card border border-card-border rounded-lg animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="border border-card-border rounded-lg py-12 text-center">
          <p className="text-muted">No members found.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {members.map((member) => {
              const isExpanded = expandedId === member.id
              return (
                <div key={member.id}>
                  {/* Row */}
                  <div
                    onClick={() => toggleExpand(member)}
                    className={cn(
                      'border border-card-border rounded-lg p-3 sm:p-4 transition-colors hover:bg-white/[0.03] cursor-pointer',
                      isExpanded && 'border-accent/30 bg-card',
                      member.role === 'frozen' && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {member.avatar_url ? (
                          <Image src={member.avatar_url} alt="" width={40} height={40} className="object-cover rounded-full" unoptimized />
                        ) : (
                          <span className="text-accent text-sm font-medium">{(member.name || member.email)?.[0]?.toUpperCase() || '?'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{member.name || 'No name'}</p>
                          {roleBadge(member.role)}
                        </div>
                        <p className="text-xs text-muted truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-xs text-muted">
                        <span className="hidden sm:block">{member.activeCredits} credits</span>
                        <span className="hidden sm:block">{member.totalBookings} bookings</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="ml-4 sm:ml-6 pl-4 sm:pl-5 border-l-2 border-card-border mt-1 mb-3 space-y-4 py-3">
                      {detailLoading ? (
                        <div className="space-y-3">
                          <div className="h-20 bg-card-border/30 rounded-lg animate-pulse" />
                          <div className="h-16 bg-card-border/30 rounded-lg animate-pulse" />
                        </div>
                      ) : detail ? (
                        <>
                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => openEdit(member, detail)} className="px-3 py-1.5 text-xs rounded-md border border-card-border hover:bg-white/[0.03] text-foreground transition-colors">Edit</button>
                            <button onClick={() => { setGrantDialog(member); setGrantPackId(packs[0]?.id || ''); setGrantNotes('') }} className="px-3 py-1.5 text-xs rounded-md border border-card-border hover:bg-white/[0.03] text-foreground transition-colors">Grant Product</button>
                            {(myRole === 'owner' || (detail.member.role !== 'admin' && detail.member.role !== 'owner')) && (
                              detail.member.role === 'frozen' ? (
                                <button onClick={() => handleUnfreeze(member)} className="px-3 py-1.5 text-xs rounded-md border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-colors">Unfreeze</button>
                              ) : (
                                <button onClick={() => setFreezeDialog(member)} className="px-3 py-1.5 text-xs rounded-md border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">Freeze</button>
                              )
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              { label: 'Active Credits', value: detail.stats.activeCredits },
                              { label: 'Total Bookings', value: detail.stats.totalBookings },
                              { label: 'Cancelled', value: detail.stats.cancelledBookings },
                            ].map((s) => (
                              <div key={s.label} className="bg-card/50 rounded-lg p-3 border border-card-border/50">
                                <p className="text-[11px] text-muted">{s.label}</p>
                                <p className="text-lg font-bold text-foreground">{s.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Info */}
                          <div className="text-xs text-muted space-y-1">
                            {detail.member.phone && <p>Phone: <span className="text-foreground">{detail.member.phone}</span></p>}
                            <p>Joined: <span className="text-foreground">{new Date(detail.member.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></p>
                            {detail.stats.lastVisit && <p>Last visit: <span className="text-foreground">{new Date(detail.stats.lastVisit).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></p>}
                          </div>

                          {/* Credits */}
                          {detail.credits.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted mb-2">Credits ({detail.credits.length})</p>
                              <div className="space-y-1.5">
                                {detail.credits.map((c) => {
                                  const isActive = c.status === 'active' && new Date(c.expires_at) > new Date()
                                  const isComp = c.stripe_payment_id?.startsWith('admin_grant')
                                  return (
                                    <div key={c.id} className={cn('flex items-center justify-between p-2.5 rounded-md border border-card-border/50', !isActive && 'opacity-40')}>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-medium text-foreground truncate">{c.class_packs?.name || 'Pack'}</span>
                                          {isComp && <Badge variant="outline" className="text-[9px] px-1 py-0">Comp</Badge>}
                                        </div>
                                        <p className="text-[11px] text-muted">{c.credits_remaining ?? '∞'}/{c.credits_total ?? '∞'} · exp {new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Bookings */}
                          {detail.bookings.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted mb-2">Recent Bookings ({detail.bookings.length})</p>
                              <div className="space-y-1.5">
                                {detail.bookings.slice(0, 10).map((b) => {
                                  const cls = b.class_schedule
                                  const isUpcoming = cls && new Date(cls.starts_at) > new Date()
                                  return (
                                    <div key={b.id} className="flex items-center justify-between p-2.5 rounded-md border border-card-border/50">
                                      <div className="flex items-center gap-2 min-w-0">
                                        {cls?.class_types?.color && <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cls.class_types.color }} />}
                                        <div className="min-w-0">
                                          <span className="text-xs font-medium text-foreground truncate block">{cls?.class_types?.name || 'Class'}</span>
                                          <p className="text-[11px] text-muted">
                                            {cls ? new Date(cls.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—'}
                                            {cls?.instructors?.name && ` · ${cls.instructors.name}`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn('text-[11px] font-medium capitalize', b.status === 'confirmed' ? 'text-green-400' : 'text-red-400')}>{b.status}</span>
                                        {b.status === 'confirmed' && isUpcoming && (
                                          <button onClick={(e) => { e.stopPropagation(); handleBookingAction(member.id, b.id, 'cancel', true) }} className="text-[10px] px-2 py-1 rounded border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">Cancel</button>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Waitlist */}
                          {detail.waitlist.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted mb-2">Waitlist ({detail.waitlist.length})</p>
                              <div className="space-y-1.5">
                                {detail.waitlist.map((w) => (
                                  <div key={w.id} className="flex items-center justify-between p-2.5 rounded-md border border-card-border/50">
                                    <span className="text-xs font-medium text-foreground">{w.class_schedule?.class_types?.name || 'Class'}</span>
                                    <span className="text-[11px] text-muted">#{w.position}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted">Failed to load details.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-xs">Previous</Button>
              <span className="text-sm text-muted">Page {page} of {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs">Next</Button>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={(open) => !open && setEditDialog(null)}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update {editDialog?.name || 'member'}&apos;s profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1" /></div>
            <div><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Role</Label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="mt-1 w-full rounded-lg bg-background/50 border border-card-border/60 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Freeze Dialog */}
      <Dialog open={!!freezeDialog} onOpenChange={(open) => !open && setFreezeDialog(null)}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Freeze Member</DialogTitle>
            <DialogDescription>This will cancel future bookings (credits returned), remove from waitlists, and block login. Data is preserved.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFreezeDialog(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => handleFreeze(freezeDialog)} disabled={freezeSubmitting}>{freezeSubmitting ? 'Freezing...' : 'Freeze Member'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Product Dialog */}
      <Dialog open={!!grantDialog} onOpenChange={(open) => !open && setGrantDialog(null)}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Grant Product</DialogTitle>
            <DialogDescription>Add a complimentary product to {grantDialog?.name || grantDialog?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Pack</Label>
              <select value={grantPackId} onChange={(e) => setGrantPackId(e.target.value)} className="mt-1 w-full rounded-lg bg-background/50 border border-card-border/60 px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent/50">
                {packs.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.credits || '∞'} credits, {p.validity_days}d)</option>)}
              </select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={grantNotes} onChange={(e) => setGrantNotes(e.target.value)} placeholder="e.g. Comp for referral" className="mt-1" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setGrantDialog(null)}>Cancel</Button>
            <Button onClick={handleGrant} disabled={grantSubmitting || !grantPackId}>{grantSubmitting ? 'Granting...' : 'Grant Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
