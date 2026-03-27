'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const router = useRouter()
  const redirectTo = searchParams.redirect ?? ''
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
    console.log('[auth]', JSON.stringify({ event: 'signup_attempt' }))

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      console.error('[auth]', JSON.stringify({
        event: 'signup_failure',
        error: signUpError.message,
        code: signUpError.code ?? 'unknown',
      }))
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Supabase returns empty identities for repeated signups of
    // already-confirmed accounts — no email is sent, so verify would be a dead end.
    if (data.user?.identities?.length === 0) {
      console.log('[auth]', JSON.stringify({ event: 'signup_existing_account' }))
      router.push('/login?existing=1')
      return
    }

    console.log('[auth]', JSON.stringify({ event: 'signup_success' }))
    const verifyParams = new URLSearchParams({ email })
    if (redirectTo) verifyParams.set('redirect', redirectTo)
    router.push(`/signup/verify?${verifyParams.toString()}`)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⭐</div>
          <h1 className="text-[28px] font-extrabold text-ink-primary leading-tight">
            Kids Rewards
          </h1>
          <p className="text-ink-secondary text-[15px] font-semibold mt-1">
            Create your parent account
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-[20px] shadow-card p-4 flex flex-col gap-4"
        >
          <div>
            <label className="block text-[11px] font-bold text-ink-muted mb-1.5 uppercase tracking-[1.5px]">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-[14px] border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-[15px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-muted mb-1.5 uppercase tracking-[1.5px]">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-[14px] border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-[15px] font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-muted mb-1.5 uppercase tracking-[1.5px]">
              Confirm password
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Same password again"
              className={`w-full rounded-[14px] border-2 px-4 py-3 text-ink-primary outline-none transition-colors text-[15px] font-semibold ${
                confirm && confirm !== password
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-line focus:border-brand'
              }`}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-semibold bg-red-50 rounded-[12px] px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || !confirm}
            className="w-full h-12 rounded-[14px] bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-[15px] shadow-brand transition-colors mt-1"
          >
            {loading ? 'Creating account…' : 'Create account →'}
          </button>
        </form>

        <p className="text-center text-ink-secondary text-sm mt-6">
          Already have an account?{' '}
          <Link href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'} className="text-brand font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
