'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MemberRelationship } from '@/lib/supabase/types'

const RELATIONSHIPS: { value: MemberRelationship; label: string; emoji: string }[] = [
  { value: 'mother', label: 'Mom', emoji: '👩' },
  { value: 'father', label: 'Dad', emoji: '👨' },
  { value: 'grandma', label: 'Grandma', emoji: '👵' },
  { value: 'grandpa', label: 'Grandpa', emoji: '👴' },
  { value: 'aunt', label: 'Aunt', emoji: '👩‍🦰' },
  { value: 'uncle', label: 'Uncle', emoji: '👨‍🦰' },
  { value: 'other', label: 'Other', emoji: '🧑' },
]

interface Invite {
  id: string
  email: string | null
  token: string
  relationship: string
  status: string
  created_at: string
  expires_at: string
}

interface FamilyMember {
  id: string
  display_name: string
  email: string
  relationship: string
  is_owner: boolean
  joined_at: string
}

export default function InviteFamily({ familyId }: { familyId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [relationship, setRelationship] = useState<MemberRelationship>('mother')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const [members, setMembers] = useState<FamilyMember[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId])

  async function loadData() {
    const supabase = createClient()

    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('joined_at'),
      supabase
        .from('invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])

    if (membersRes.data) setMembers(membersRes.data)
    if (invitesRes.data) setInvites(invitesRes.data)
    setLoadingData(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setInviteLink('')

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyId, email: email || undefined, relationship }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error || 'Failed to create invite')
      setLoading(false)
      return
    }

    const { inviteLink: link } = await res.json()
    setInviteLink(link)
    setLoading(false)
    loadData()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getRelationshipLabel(value: string) {
    return RELATIONSHIPS.find(r => r.value === value)?.label || value
  }

  function getRelationshipEmoji(value: string) {
    return RELATIONSHIPS.find(r => r.value === value)?.emoji || '🧑'
  }

  function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date()
  }

  return (
    <section className="bg-white rounded-2xl p-5 shadow-card mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-brand uppercase tracking-wide">
          Family Members
        </h2>
        <button
          onClick={() => { setShowForm(v => !v); setInviteLink(''); setError('') }}
          className="text-sm text-brand hover:text-ink-secondary font-medium transition-colors"
        >
          {showForm ? 'Cancel' : '+ Invite'}
        </button>
      </div>

      {/* Current members */}
      {loadingData ? (
        <p className="text-ink-muted text-sm py-2">Loading...</p>
      ) : members.length === 0 ? (
        <p className="text-ink-muted text-sm py-2">No members yet (Supabase auth not configured).</p>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2 border-b border-line-subtle last:border-0">
              <span className="text-xl">{getRelationshipEmoji(m.relationship)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-ink-primary font-bold text-sm truncate">
                  {m.display_name}
                  {m.is_owner && (
                    <span className="ml-1.5 text-xs font-semibold text-brand bg-green-50 px-1.5 py-0.5 rounded">
                      Owner
                    </span>
                  )}
                </p>
                <p className="text-ink-muted text-xs truncate">
                  {getRelationshipLabel(m.relationship)} &middot; {m.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Pending Invites
          </p>
          {invites.map(inv => (
            <div key={inv.id} className={`flex items-center gap-3 py-2 text-sm ${
              isExpired(inv.expires_at) ? 'opacity-40' : ''
            }`}>
              <span className="text-lg">{getRelationshipEmoji(inv.relationship)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-ink-secondary font-medium truncate">
                  {inv.email || 'Link invite'}
                </p>
                <p className="text-ink-muted text-xs">
                  {isExpired(inv.expires_at) ? 'Expired' : `Expires ${new Date(inv.expires_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      {showForm && (
        <form onSubmit={handleInvite} className="border-t border-line-subtle pt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide block mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              placeholder="Their email — or leave blank for link-only"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border-2 border-line px-3 py-2.5 text-sm text-ink-primary outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide block mb-1.5">
              Their role
            </label>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIPS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRelationship(r.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    relationship === r.value
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-ink-secondary hover:bg-gray-200'
                  }`}
                >
                  {r.emoji} {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-hover text-white font-bold transition-colors text-sm disabled:opacity-50"
          >
            {loading ? 'Creating invite...' : email ? 'Send Invite Email' : 'Create Invite Link'}
          </button>

          {/* Show generated link */}
          {inviteLink && (
            <div className="bg-green-50 rounded-xl p-3 mt-2">
              <p className="text-xs font-semibold text-green-700 mb-1.5">
                {email ? 'Email sent! You can also share this link:' : 'Share this link (expires in 24h):'}
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-xs bg-white rounded-lg px-2 py-1.5 text-ink-secondary border border-green-200 truncate"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </section>
  )
}
