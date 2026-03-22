'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Redirect to verify page — user will get a 6-digit code by email
    router.push(`/signup/verify?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="min-h-screen bg-page flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⭐</div>
          <h1 className="text-2xl font-extrabold text-ink-primary">Kids Rewards</h1>
          <p className="text-ink-secondary text-sm mt-1">Create your parent account</p>
        </div>

        {/* Method tabs — phone disabled */}
        <div className="flex rounded-2xl overflow-hidden border-2 border-line mb-6 bg-white">
          <button
            type="button"
            className="flex-1 py-2.5 text-sm font-bold bg-brand text-white"
          >
            📧 Email
          </button>
          <button
            type="button"
            disabled
            className="flex-1 py-2.5 text-sm font-bold text-ink-muted cursor-not-allowed relative"
          >
            📱 Phone
            <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full leading-none">
              Soon
            </span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-card p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
              Confirm password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Same password again"
              className={`w-full rounded-xl border-2 px-4 py-3 text-ink-primary outline-none transition-colors text-base ${
                confirm && confirm !== password
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-line focus:border-brand'
              }`}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-semibold bg-red-50 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || !confirm}
            className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-base shadow-brand transition-colors mt-1"
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p className="text-center text-ink-secondary text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
