import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../lib/theme'
import { styles } from '../../lib/authStyles'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    const { error: err, needsVerification } = await signUp(email, password)
    setLoading(false)

    if (err) {
      if (err.includes('already exists')) {
        router.push('/(auth)/login')
        return
      }
      setError(err)
      return
    }

    if (needsVerification) {
      router.push({ pathname: '/(auth)/verify', params: { email } })
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>⭐</Text>
        <Text style={styles.title}>Kids Rewards</Text>
        <Text style={styles.subtitle}>Create your parent account</Text>

        <View style={styles.card}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.inkMuted}
            secureTextEntry
            autoComplete="new-password"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>CONFIRM PASSWORD</Text>
          <TextInput
            style={[styles.input, confirm && confirm !== password ? { borderColor: colors.red } : undefined]}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Same password again"
            placeholderTextColor={colors.inkMuted}
            secureTextEntry
            autoComplete="new-password"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, (!email || !password || !confirm || loading) && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!email || !password || !confirm || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Create account →'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
