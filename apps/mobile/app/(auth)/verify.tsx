import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../lib/theme'
import { styles } from '../../lib/authStyles'
import { supabase } from '../../lib/supabase'

export default function VerifyScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ email: string }>()
  const email = params.email ?? ''
  const { verifyOtp, resendVerification } = useAuth()

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  // Listen for auth state change (user clicked email link elsewhere)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.replace('/')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  async function handleVerify() {
    if (code.length !== 6) return
    setError('')
    setVerifying(true)

    const { error: err } = await verifyOtp(email, code)
    setVerifying(false)

    if (err) {
      setError(
        err.toLowerCase().includes('expired')
          ? 'Code expired. Tap "Resend email" to get a new one.'
          : 'Invalid code — double-check and try again.',
      )
      return
    }

    router.replace('/')
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setResendSuccess(false)

    const { error: err } = await resendVerification(email)
    setResending(false)

    if (err) {
      setError('Could not resend — please wait a moment and try again.')
    } else {
      setResendSuccess(true)
      setCode('')
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>✉️</Text>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a confirmation to{'\n'}
          <Text style={{ fontWeight: '700', color: colors.inkPrimary }}>{email || 'your address'}</Text>
        </Text>

        <View style={styles.card}>
          {/* Hint */}
          <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <Text style={{ color: '#92400E', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
              Open your email and click the confirmation link
            </Text>
            <Text style={{ color: '#A16207', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              Or enter the 6-digit code below
            </Text>
          </View>

          <Text style={styles.label}>VERIFICATION CODE</Text>
          <TextInput
            style={[styles.input, { textAlign: 'center', fontSize: 28, fontWeight: '800', letterSpacing: 8 }]}
            value={code}
            onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError('') }}
            placeholder="000000"
            placeholderTextColor={colors.inkMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {resendSuccess ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>New email sent! Check your inbox.</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, (verifying || code.length !== 6) && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={verifying || code.length !== 6}
          >
            <Text style={styles.buttonText}>
              {verifying ? 'Verifying...' : 'Verify & continue →'}
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>Didn't receive anything?</Text>
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={[styles.footerLink, { marginTop: 4 }, resending && { opacity: 0.5 }]}>
                {resending ? 'Sending...' : 'Resend email'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
