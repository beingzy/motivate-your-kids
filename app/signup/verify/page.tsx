'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (verifyError) {
      setError(verifyError.message.includes('expired')
        ? 'Code expired. Please request a new one.'
        : 'Invalid code. Check your email and try again.')
      setLoading(false)
      return
    }

    // Verified — go to home, which redirects to /setup if no family yet
    router.replace('/')
  }

  async function handleResend() {
    if (!email) return
    setResending(true)
    setError('')
    setResendSuccess(false)

    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setResending(false)
    if (resendError) {
      setError('Could not resend. Please wait a moment and try again.')
    } else {
      setResendSuccess(true)
      setCode('')
      inputRef.current?.focus()
    }
  }

  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(val)
    setError('')
  }

  return (
    <main className="min-h-screen bg-page flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">✉️</div>
          <h1 className="text-2xl font-extrabold text-ink-primary">Check your email</h1>
          <p className="text-ink-secondary text-sm mt-2 leading-relaxed">
            We sent a 6-digit confirmation code to
            <br />
            <span className="font-bold text-ink-primary">{email || 'your email'}</span>
          </p>
        </div>

        {/* Code form */}
        <form onSubmit={handleVerify} className="bg-white rounded-3xl shadow-card p-6 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold text-ink-secondary mb-1.5 uppercase tracking-wide">
              Verification code
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength={6}
              className={`w-full rounded-xl border-2 px-4 py-4 text-center text-3xl font-extrabold tracking-[0.4em] text-ink-primary outline-none transition-colors ${
                error ? 'border-red-400' : code.length === 6 ? 'border-brand' : 'border-line focus:border-brand'
              }`}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-semibold bg-red-50 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {resendSuccess && (
            <p className="text-green-600 text-sm font-semibold bg-green-50 rounded-xl px-4 py-3">
              New code sent! Check your inbox.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-base shadow-brand transition-colors"
          >
            {loading ? 'Verifying…' : 'Verify & continue →'}
          </button>

          <div className="text-center flex flex-col gap-2">
            <p className="text-ink-muted text-sm">Didn&apos;t get a code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand font-bold text-sm hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          </div>
        </form>

        <p className="text-center text-ink-secondary text-sm mt-6">
          Wrong email?{' '}
          <Link href="/signup" className="text-brand font-bold hover:underline">
            Go back
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
