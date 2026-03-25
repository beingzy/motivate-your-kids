import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFamily } from '../../../context/FamilyContext'
import { colors } from '../../../lib/theme'

export default function ParentHome() {
  const { store, getBalance, getPendingCount } = useFamily()
  const pendingTotal = getPendingCount()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <Text style={s.greeting}>
          {store.family?.name ?? 'My Family'}
        </Text>
        <Text style={s.familyCode}>
          Code: {store.family?.displayCode ?? '—'}
        </Text>

        {/* Pending approvals */}
        {pendingTotal > 0 && (
          <View style={s.pendingBanner}>
            <Text style={s.pendingText}>
              🔔 {pendingTotal} pending {pendingTotal === 1 ? 'approval' : 'approvals'}
            </Text>
          </View>
        )}

        {/* Kid cards */}
        {store.kids.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🧒</Text>
            <Text style={s.emptyTitle}>No kids yet</Text>
            <Text style={s.emptySubtitle}>Add your first kid in Settings</Text>
          </View>
        ) : (
          store.kids.map(kid => {
            const balance = getBalance(kid.id)
            return (
              <View key={kid.id} style={[s.kidCard, { borderLeftColor: kid.colorAccent }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 40, marginRight: 16 }}>{kid.avatar}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.kidName}>{kid.name}</Text>
                    <Text style={s.kidBalance}>⭐ {balance} stars</Text>
                  </View>
                </View>
              </View>
            )
          })
        )}

        {/* Quick stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{store.kids.length}</Text>
            <Text style={s.statLabel}>Kids</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{store.actions.filter(a => a.isActive).length}</Text>
            <Text style={s.statLabel}>Actions</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNumber}>{store.rewards.filter(r => r.isActive).length}</Text>
            <Text style={s.statLabel}>Rewards</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.inkPrimary,
    marginBottom: 4,
  },
  familyCode: {
    fontSize: 14,
    color: colors.inkSecondary,
    fontWeight: '600',
    marginBottom: 20,
  },
  pendingBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  pendingText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  kidCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  kidName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.inkPrimary,
  },
  kidBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.amber,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.inkPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.inkSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.brand,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSecondary,
    marginTop: 4,
  },
})
