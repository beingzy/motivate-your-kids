import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useFamily } from '../../context/FamilyContext'
import { EMOJI_AVATARS, DEFAULT_KID_COLORS } from '@mkids/shared'
import type { FamilyRole } from '@mkids/shared'
import { colors } from '../../lib/theme'
import { styles as authStyles } from '../../lib/authStyles'

const ROLES: { value: FamilyRole; label: string; emoji: string }[] = [
  { value: 'mother', label: 'Mother', emoji: '👩' },
  { value: 'father', label: 'Father', emoji: '👨' },
  { value: 'grandma', label: 'Grandma', emoji: '👵' },
  { value: 'grandpa', label: 'Grandpa', emoji: '👴' },
  { value: 'aunt', label: 'Aunt', emoji: '👩‍🦰' },
  { value: 'uncle', label: 'Uncle', emoji: '👨‍🦱' },
  { value: 'nanny', label: 'Nanny', emoji: '🧑‍🍼' },
  { value: 'other', label: 'Other', emoji: '🧑' },
]

type Step = 'profile' | 'family' | 'kid' | 'done'

export default function SetupScreen() {
  const router = useRouter()
  const { createFamily, addKid } = useFamily()

  const [step, setStep] = useState<Step>('profile')

  // Profile
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('👤')
  const [role, setRole] = useState<FamilyRole>('mother')

  // Family
  const [familyName, setFamilyName] = useState('')

  // Kid
  const [kidName, setKidName] = useState('')
  const [kidAvatar, setKidAvatar] = useState('🧒')
  const [kidColor, setKidColor] = useState(DEFAULT_KID_COLORS[0])

  function handleCreateFamily() {
    if (!familyName.trim()) return
    createFamily(familyName.trim(), name.trim() || undefined, avatar, role)
    setStep('kid')
  }

  function handleAddKid() {
    if (!kidName.trim()) return
    addKid({ name: kidName.trim(), avatar: kidAvatar, colorAccent: kidColor })
    router.replace('/')
  }

  function handleSkipKid() {
    router.replace('/')
  }

  if (step === 'profile') {
    return (
      <ScrollView contentContainerStyle={authStyles.container}>
        <Text style={authStyles.logo}>👤</Text>
        <Text style={authStyles.title}>About you</Text>
        <Text style={authStyles.subtitle}>Set up your parent profile</Text>

        <View style={authStyles.card}>
          {/* Avatar picker */}
          <Text style={authStyles.label}>YOUR AVATAR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {['👤', ...EMOJI_AVATARS.slice(0, 14)].map(e => (
              <TouchableOpacity
                key={e}
                onPress={() => setAvatar(e)}
                style={{
                  width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
                  backgroundColor: avatar === e ? colors.brandLight : colors.lineSubtle,
                  borderWidth: avatar === e ? 2 : 0, borderColor: colors.brand, marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={authStyles.label}>YOUR NAME</Text>
          <TextInput
            style={authStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sarah"
            placeholderTextColor={colors.inkMuted}
          />

          <Text style={[authStyles.label, { marginTop: 16 }]}>YOUR ROLE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {ROLES.map(r => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setRole(r.value)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: role === r.value ? colors.brand : colors.lineSubtle,
                }}
              >
                <Text style={{ color: role === r.value ? colors.white : colors.inkPrimary, fontWeight: '700', fontSize: 13 }}>
                  {r.emoji} {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={authStyles.button} onPress={() => setStep('family')}>
            <Text style={authStyles.buttonText}>Continue →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  if (step === 'family') {
    return (
      <ScrollView contentContainerStyle={authStyles.container}>
        <Text style={authStyles.logo}>👨‍👩‍👧</Text>
        <Text style={authStyles.title}>Name your family</Text>
        <Text style={authStyles.subtitle}>This is how your family will appear in the app</Text>

        <View style={authStyles.card}>
          <Text style={authStyles.label}>FAMILY NAME</Text>
          <TextInput
            style={authStyles.input}
            value={familyName}
            onChangeText={setFamilyName}
            placeholder="e.g. The Smiths"
            placeholderTextColor={colors.inkMuted}
          />

          <TouchableOpacity
            style={[authStyles.button, !familyName.trim() && authStyles.buttonDisabled]}
            onPress={handleCreateFamily}
            disabled={!familyName.trim()}
          >
            <Text style={authStyles.buttonText}>Create family →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  if (step === 'kid') {
    return (
      <ScrollView contentContainerStyle={authStyles.container}>
        <Text style={authStyles.logo}>🧒</Text>
        <Text style={authStyles.title}>Add your first kid</Text>
        <Text style={authStyles.subtitle}>You can add more later</Text>

        <View style={authStyles.card}>
          <Text style={authStyles.label}>KID'S AVATAR</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {EMOJI_AVATARS.map(e => (
              <TouchableOpacity
                key={e}
                onPress={() => setKidAvatar(e)}
                style={{
                  width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
                  backgroundColor: kidAvatar === e ? colors.brandLight : colors.lineSubtle,
                  borderWidth: kidAvatar === e ? 2 : 0, borderColor: colors.brand, marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={authStyles.label}>KID'S NAME</Text>
          <TextInput
            style={authStyles.input}
            value={kidName}
            onChangeText={setKidName}
            placeholder="e.g. Emma"
            placeholderTextColor={colors.inkMuted}
          />

          <Text style={[authStyles.label, { marginTop: 16 }]}>ACCENT COLOR</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
            {DEFAULT_KID_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setKidColor(c)}
                style={{
                  width: 40, height: 40, borderRadius: 20, backgroundColor: c,
                  borderWidth: kidColor === c ? 3 : 0, borderColor: colors.inkPrimary,
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[authStyles.button, !kidName.trim() && authStyles.buttonDisabled]}
            onPress={handleAddKid}
            disabled={!kidName.trim()}
          >
            <Text style={authStyles.buttonText}>Add kid & start →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }} onPress={handleSkipKid}>
            <Text style={{ color: colors.inkSecondary, fontWeight: '600', fontSize: 14 }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return null
}
