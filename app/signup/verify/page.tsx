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
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showCodeInput) inputRef.current?.focus()
  }, [showCodeInput])

  // Poll for session — user may have clicked the link in another tab
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setError('')
    setVerifying(true)

    const supabase = createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (verifyError) {
      setError(
        verifyError.message.toLowerCase().includes('expired')
          ? 'Code expired. Click "Resend email" to get a new one.'
          : 'Invalid code — double-check and try again.',
      )
      setVerifying(false)
      return
    }

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
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setResending(false)
    if (resendError) {
      setError('Could not resend — please wait a moment and try again.')
    } else {
      setResendSuccess(true)
      setCode('')
    }
  }

  return (
    <main className="min-h-screen bg-page flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">✉️</div>
          <h1 className="text-2xl font-extrabold text-ink-primary">Check your email</h1>
          <p className="text-ink-secondary text-sm mt-2 leading-relaxed">
            We sent a confirmation email to
            <br />
            <span className="font-bold text-ink-primary">{email || 'your address'}</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-6 flex flex-col gap-5">

          {/* Primary action — click the link */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-amber-800 font-bold text-sm mb-1">Open your email and click the confirmation link</p>
            <p className="text-amber-700 text-xs">This page will update automatically once confirmed.</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-ink-muted text-xs font-semibold">
            <div className="flex-1 h-px bg-line-subtle" />
            or
            <div className="flex-1 h-px bg-line-subtle" />
          </div>

          {/* Secondary — code entry toggle */}
          {!showCodeInput ? (
            <button
              type="button"
              onClick={() => setShowCodeInput(true)}
              className="text-brand font-bold text-sm hover:underline text-center"
            >
              Enter a 6-digit code instead
            </button>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
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
                  onChange={e => {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
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

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-extrabold text-base shadow-brand transition-colors"
              >
                {verifying ? 'Verifying…' : 'Verify & continue →'}
              </button>
            </form>
          )}

          {resendSuccess && (
            <p className="text-green-600 text-sm font-semibold bg-green-50 rounded-xl px-4 py-3 text-center">
              New email sent! Check your inbox.
            </p>
          )}

          {/* Resend */}
          <div className="text-center">
            <p className="text-ink-muted text-sm mb-1">Didn&apos;t receive anything?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand font-bold text-sm hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend email'}
            </button>
          </div>
        </div>

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
