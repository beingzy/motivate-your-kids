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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    authError === 'auth_failed' ? 'Authentication failed. Please try again.' : '',
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      // Give a friendly message instead of raw Supabase errors
      const msg = signInError.message.toLowerCase()
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        setError('Incorrect email or password.')
      } else if (msg.includes('confirmed') || msg.includes('verified')) {
        setError(
          'Please verify your email first. Check your inbox for a confirmation code.',
        )
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    router.replace(redirectTo)
  }

  return (
    <main className="min-h-screen bg-page flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⭐</div>
          <h1 className="text-2xl font-extrabold text-ink-primary">Kids Rewards</h1>
          <p className="text-ink-secondary text-sm mt-1">Sign in to your account</p>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-ink-secondary uppercase tracking-wide">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-xl border-2 border-line px-4 py-3 text-ink-primary outline-none focus:border-brand transition-colors text-base"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-semibold bg-red-50 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-base shadow-brand transition-colors mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="text-center text-ink-secondary text-sm mt-6">
          New here?{' '}
          <Link href="/signup" className="text-brand font-bold hover:underline">
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
