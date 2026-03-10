'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview', label: 'Email Overview', icon: '📧' },
  { id: 'compose', label: 'Compose', icon: '✉️' },
]

// ─── Email events reference table ──────────────────────────────────────────

const EMAIL_EVENTS = [
  { id: 1, name: 'Booking confirmation', trigger: 'Member books a class', status: 'live', template: 'sendBookingConfirmation', calledFrom: '/api/bookings/create' },
  { id: 2, name: 'Class reminder (1hr)', trigger: 'Cron every 15min', status: 'live', template: 'sendClassReminder', calledFrom: '/api/cron/reminders' },
  { id: 3, name: 'Waitlist promotion', trigger: 'Spot opens (cancel/remove)', status: 'live', template: 'sendWaitlistPromotion', calledFrom: 'src/lib/waitlist.js' },
  { id: 4, name: 'Credit expiry warning', trigger: 'Cron daily midnight', status: 'live', template: 'sendCreditExpiryWarning', calledFrom: '/api/cron/expire-credits' },
  { id: 5, name: 'Welcome email', trigger: 'User registers', status: 'live', template: 'sendWelcomeEmail', calledFrom: '/api/auth/register' },
  { id: 6, name: 'Cancellation confirmation', trigger: 'Member cancels booking', status: 'live', template: 'sendCancellationConfirmation', calledFrom: '/api/bookings/cancel' },
  { id: 7, name: 'Class cancelled by admin', trigger: 'Admin cancels a class', status: 'live', template: 'sendClassCancelledByAdmin', calledFrom: '/api/admin/schedule/cancel' },
  { id: 8, name: 'Pack purchase confirmation', trigger: 'Stripe webhook success', status: 'live', template: 'sendPackPurchaseConfirmation', calledFrom: '/api/stripe/webhook' },
  { id: 9, name: 'Credits low warning', trigger: 'Credit drops to 1 remaining', status: 'live', template: 'sendCreditsLowWarning', calledFrom: '/api/bookings/create' },
  { id: 10, name: 'Class change notification', trigger: 'Admin edits class with bookings', status: 'live', template: 'sendClassChanged', calledFrom: '/api/admin/schedule/notify' },
  { id: 11, name: 'Removed from class', trigger: 'Admin removes member via roster', status: 'live', template: 'sendRemovedFromClass', calledFrom: '/api/admin/schedule/roster' },
  { id: 12, name: 'Admin cancels booking', trigger: 'Admin cancels on behalf', status: 'live', template: 'sendAdminCancelledBooking', calledFrom: '/api/admin/schedule/roster' },
  { id: 13, name: 'Admin direct email', trigger: 'Admin composes message', status: 'live', template: 'sendAdminDirectEmail', calledFrom: '/api/admin/emails' },
  { id: 14, name: 'Private class invitation', trigger: 'Admin adds member to private class', status: 'live', template: 'sendPrivateClassInvitation', calledFrom: '/api/admin/schedule/roster' },
  { id: 15, name: 'Password reset', trigger: 'User requests reset', status: 'not_built', template: '—', calledFrom: '—' },
  { id: 16, name: 'Payment failed', trigger: 'Stripe invoice.payment_failed', status: 'not_built', template: '—', calledFrom: '/api/stripe/webhook' },
]

const statusConfig = {
  live: { label: 'Live', className: 'bg-green-400/10 text-green-400 border-green-400/20' },
  not_built: { label: 'Not Built', className: 'bg-zinc-400/10 text-zinc-400 border-zinc-400/20' },
}

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Emails</h1>

      {/* Tab buttons */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors shrink-0',
              activeTab === tab.id
                ? 'bg-accent/10 text-accent'
                : 'text-muted hover:text-foreground hover:bg-white/5'
            )}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <EmailOverviewTab />}
      {activeTab === 'compose' && <ComposeTab />}
    </div>
  )
}

// ─── Email Overview Tab ──────────────────────────────────────────────────────

function EmailOverviewTab() {
  const liveCount = EMAIL_EVENTS.filter((e) => e.status === 'live').length
  const notBuiltCount = EMAIL_EVENTS.filter((e) => e.status === 'not_built').length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4 px-4 text-center">
            <p className="text-2xl font-bold text-foreground">{EMAIL_EVENTS.length}</p>
            <p className="text-xs text-muted mt-1">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4 text-center">
            <p className="text-2xl font-bold text-green-400">{liveCount}</p>
            <p className="text-xs text-muted mt-1">Live</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="py-4 px-4 text-center">
            <p className="text-2xl font-bold text-zinc-400">{notBuiltCount}</p>
            <p className="text-xs text-muted mt-1">Not Built</p>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      <div className="p-3 sm:p-4 bg-amber-600/10 border border-amber-600/20 rounded-lg">
        <p className="text-amber-400 text-sm font-medium">RESEND_API_KEY required</p>
        <p className="text-amber-400/70 text-xs mt-1">All email templates are coded and wired into their trigger points. Set the RESEND_API_KEY environment variable to activate email delivery.</p>
      </div>

      {/* Email events reference table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Events Reference</CardTitle>
          <CardDescription>All automated email notifications and their triggers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left">
                  <th className="pb-2 pr-3 text-xs text-muted font-medium">#</th>
                  <th className="pb-2 pr-3 text-xs text-muted font-medium">Email Event</th>
                  <th className="pb-2 pr-3 text-xs text-muted font-medium hidden sm:table-cell">Trigger</th>
                  <th className="pb-2 pr-3 text-xs text-muted font-medium">Status</th>
                  <th className="pb-2 text-xs text-muted font-medium hidden md:table-cell">Template</th>
                </tr>
              </thead>
              <tbody>
                {EMAIL_EVENTS.map((event) => {
                  const config = statusConfig[event.status]
                  return (
                    <tr key={event.id} className="border-b border-card-border/50 last:border-0">
                      <td className="py-2.5 pr-3 text-muted text-xs">{event.id}</td>
                      <td className="py-2.5 pr-3">
                        <p className="text-foreground font-medium">{event.name}</p>
                        <p className="text-xs text-muted sm:hidden mt-0.5">{event.trigger}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-muted hidden sm:table-cell">{event.trigger}</td>
                      <td className="py-2.5 pr-3">
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', config.className)}>
                          {config.label}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-muted font-mono hidden md:table-cell">{event.template}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Template info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Email Template</CardTitle>
          <CardDescription>All emails use a shared branded template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-background/50 border border-card-border/50">
              <p className="text-xs text-muted mb-1">Theme</p>
              <p className="text-foreground">Dark luxury (matches website)</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-card-border/50">
              <p className="text-xs text-muted mb-1">Sender</p>
              <p className="text-foreground">BOXX Thailand &lt;noreply@boxxthailand.com&gt;</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-card-border/50">
              <p className="text-xs text-muted mb-1">Design</p>
              <p className="text-foreground">Gold accent bar, logo header, card layout, social footer</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-card-border/50">
              <p className="text-xs text-muted mb-1">CTA Buttons</p>
              <p className="text-foreground">Gold (#c8a750) with dark text, rounded</p>
            </div>
          </div>
          <p className="text-xs text-muted">Template source: <code className="text-accent/80">src/lib/email.js</code></p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Compose Tab ─────────────────────────────────────────────────────────────

function ComposeTab() {
  const [members, setMembers] = useState([])
  const [selectedEmail, setSelectedEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMembers, setLoadingMembers] = useState(true)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch('/api/admin/members')
        if (res.ok) {
          const data = await res.json()
          setMembers(data.members || [])
        }
      } catch (err) {
        console.error('Failed to load members:', err)
      } finally {
        setLoadingMembers(false)
      }
    }
    fetchMembers()
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    if (!selectedEmail || !subject.trim() || !body.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      return
    }

    setSending(true)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedEmail, subject: subject.trim(), body: body.trim() }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: 'Email sent successfully!' })
        setSubject('')
        setBody('')
        setSelectedEmail('')
        setSearchQuery('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send email' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to send email. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  const filteredMembers = searchQuery
    ? members.filter((m) =>
        (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Send Email</CardTitle>
        <CardDescription>Send a direct email to a member using the BOXX branded template</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSend} className="space-y-4">
          {/* Recipient */}
          <div className="space-y-1.5">
            <Label htmlFor="recipient">To</Label>
            {selectedEmail ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-card-border text-sm text-foreground">
                  {selectedEmail}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedEmail(''); setSearchQuery('') }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  id="recipient"
                  placeholder="Search members by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {loadingMembers ? (
                  <div className="text-xs text-muted py-2">Loading members...</div>
                ) : searchQuery && (
                  <div className="max-h-48 overflow-y-auto border border-card-border rounded-lg">
                    {filteredMembers.length === 0 ? (
                      <p className="text-xs text-muted p-3">No members found</p>
                    ) : (
                      filteredMembers.slice(0, 10).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setSelectedEmail(m.email); setSearchQuery('') }}
                          className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors border-b border-card-border/50 last:border-0"
                        >
                          <p className="text-sm text-foreground">{m.name || 'Unnamed'}</p>
                          <p className="text-xs text-muted">{m.email}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <textarea
              id="body"
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={8}
              className="w-full rounded-lg bg-background/50 border border-card-border/60 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted/50 transition-colors focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/30 resize-y"
            />
            <p className="text-xs text-muted text-right">{body.length}/5000</p>
          </div>

          {/* Feedback */}
          {message && (
            <p className={cn('text-sm', message.type === 'success' ? 'text-green-400' : 'text-red-400')}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={sending || !selectedEmail || !subject.trim() || !body.trim()}>
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
