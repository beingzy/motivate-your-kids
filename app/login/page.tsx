'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'
  const authError = searchParams.get('error')
  const existing = searchParams.get('existing')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState(
    existing === '1' ? 'An account with this email already exists. Please sign in.' : '',
  )
  const [error, setError] = useState(
    authError === 'auth_failed' ? 'Authentication failed. Please try again.' : '',
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    console.log('[auth]', JSON.stringify({ event: 'login_attempt' }))

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      const msg = signInError.message.toLowerCase()
      let friendlyMsg: string

      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        friendlyMsg = 'Incorrect email or password.'
      } else if (msg.includes('confirmed') || msg.includes('verified')) {
        friendlyMsg = 'Please verify your email first. Check your inbox for a confirmation code.'
      } else {
        friendlyMsg = signInError.message
      }

      console.error('[auth]', JSON.stringify({
        event: 'login_failure',
        error: signInError.message,
        code: signInError.code ?? 'unknown',
      }))

      setError(friendlyMsg)
      setLoading(false)
      return
    }

    console.log('[auth]', JSON.stringify({ event: 'login_success' }))
    router.replace(redirectTo)
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
            Sign in to your account
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
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-[14px] border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-[15px] font-semibold"
            />
          </div>

          {info && (
            <p className="text-blue-600 text-sm font-semibold bg-blue-50 rounded-[12px] px-4 py-3">
              {info}
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm font-semibold bg-red-50 rounded-[12px] px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-12 rounded-[14px] bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-[15px] shadow-brand transition-colors mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="text-center text-ink-secondary text-sm mt-6">
          New here?{' '}
          <Link href={redirectTo !== '/' ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : '/signup'} className="text-brand font-bold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
