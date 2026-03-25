import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFamily } from '../../../context/FamilyContext'
import { colors } from '../../../lib/theme'

export default function RewardsScreen() {
  const { store } = useFamily()
  const activeRewards = store.rewards.filter(r => r.isActive)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.title}>Rewards</Text>
        <Text style={s.subtitle}>{activeRewards.length} available rewards</Text>

        {activeRewards.map(reward => (
          <View key={reward.id} style={s.rewardCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.rewardName}>{reward.name}</Text>
              {reward.description ? (
                <Text style={s.rewardDesc} numberOfLines={1}>{reward.description}</Text>
              ) : null}
            </View>
            <View style={s.costBadge}>
              <Text style={s.costText}>{reward.pointsCost} ⭐</Text>
            </View>
          </View>
        ))}

        {activeRewards.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>🎁</Text>
            <Text style={s.emptyText}>No rewards yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.inkPrimary },
  subtitle: { fontSize: 14, color: colors.inkSecondary, fontWeight: '600', marginBottom: 24 },
  rewardCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  rewardName: { fontSize: 15, fontWeight: '700', color: colors.inkPrimary },
  rewardDesc: { fontSize: 13, color: colors.inkSecondary, marginTop: 2 },
  costBadge: {
    backgroundColor: colors.brandLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 12,
  },
  costText: { fontSize: 14, fontWeight: '800', color: colors.brand },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.inkSecondary, marginTop: 12 },
})
