import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../../context/AuthContext'
import { useFamily } from '../../../context/FamilyContext'
import { clearStore } from '../../../lib/storage'
import { colors } from '../../../lib/theme'

export default function SettingsScreen() {
  const router = useRouter()
  const { signOut, user } = useAuth()
  const { store } = useFamily()

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/')
        },
      },
    ])
  }

  function handleResetData() {
    Alert.alert('Reset all data', 'This cannot be undone. All family data will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          clearStore()
          router.replace('/')
        },
      },
    ])
  }

  const owner = store.familyMembers.find(m => m.isOwner)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.title}>Settings</Text>

        {/* Account */}
        <View style={s.section}>
          <Text style={s.sectionHeader}>My Account</Text>
          <View style={s.card}>
            {owner && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 40, marginRight: 16 }}>{owner.avatar}</Text>
                <View>
                  <Text style={s.memberName}>{owner.name}</Text>
                  <Text style={s.memberRole}>{owner.role}</Text>
                </View>
              </View>
            )}
            <Text style={s.email}>{user?.email ?? '—'}</Text>
          </View>
        </View>

        {/* Family */}
        <View style={s.section}>
          <Text style={s.sectionHeader}>Family</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowLabel}>Name</Text>
              <Text style={s.rowValue}>{store.family?.name ?? '—'}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Code</Text>
              <Text style={[s.rowValue, { fontWeight: '800', color: colors.brand }]}>
                {store.family?.displayCode ?? '—'}
              </Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Members</Text>
              <Text style={s.rowValue}>{store.familyMembers.length}</Text>
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowLabel}>Kids</Text>
              <Text style={s.rowValue}>{store.kids.length}</Text>
            </View>
          </View>
        </View>

        {/* Danger zone */}
        <View style={s.section}>
          <TouchableOpacity style={s.dangerButton} onPress={handleResetData}>
            <Text style={s.dangerText}>Reset all data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.signOutButton} onPress={handleSignOut}>
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.inkPrimary, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: colors.inkSecondary, letterSpacing: 1, marginBottom: 8 },
  card: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  memberName: { fontSize: 18, fontWeight: '800', color: colors.inkPrimary },
  memberRole: { fontSize: 14, color: colors.inkSecondary, fontWeight: '600', textTransform: 'capitalize' },
  email: { fontSize: 14, color: colors.inkSecondary },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSubtle,
  },
  rowLabel: { fontSize: 15, color: colors.inkSecondary, fontWeight: '600' },
  rowValue: { fontSize: 15, color: colors.inkPrimary, fontWeight: '700' },
  dangerButton: {
    backgroundColor: '#FEF2F2', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12,
  },
  dangerText: { color: colors.red, fontWeight: '700', fontSize: 15 },
  signOutButton: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 2, borderColor: colors.line,
  },
  signOutText: { color: colors.inkPrimary, fontWeight: '700', fontSize: 15 },
})
