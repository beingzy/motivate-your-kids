import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFamily } from '../../../context/FamilyContext'
import { colors } from '../../../lib/theme'

export default function ActionsScreen() {
  const { store } = useFamily()
  const activeActions = store.actions.filter(a => a.isActive)

  // Group by category
  const byCategory = store.categories.map(cat => ({
    ...cat,
    actions: activeActions.filter(a => a.categoryId === cat.id),
  })).filter(c => c.actions.length > 0)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={s.title}>Actions</Text>
        <Text style={s.subtitle}>{activeActions.length} active actions</Text>

        {byCategory.map(cat => (
          <View key={cat.id} style={{ marginBottom: 24 }}>
            <Text style={s.catHeader}>{cat.icon} {cat.name}</Text>
            {cat.actions.map(action => (
              <View key={action.id} style={s.actionCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.actionName}>{action.name}</Text>
                  {action.description ? (
                    <Text style={s.actionDesc} numberOfLines={1}>{action.description}</Text>
                  ) : null}
                </View>
                <View style={[s.pointsBadge, action.isDeduction && { backgroundColor: '#FEF2F2' }]}>
                  <Text style={[s.pointsText, action.isDeduction && { color: colors.red }]}>
                    {action.isDeduction ? '-' : '+'}{action.pointsValue} ⭐
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {activeActions.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={s.emptyText}>No actions yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: colors.inkPrimary },
  subtitle: { fontSize: 14, color: colors.inkSecondary, fontWeight: '600', marginBottom: 24 },
  catHeader: { fontSize: 16, fontWeight: '800', color: colors.inkPrimary, marginBottom: 10 },
  actionCard: {
    backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  actionName: { fontSize: 15, fontWeight: '700', color: colors.inkPrimary },
  actionDesc: { fontSize: 13, color: colors.inkSecondary, marginTop: 2 },
  pointsBadge: {
    backgroundColor: '#FFFBEB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 12,
  },
  pointsText: { fontSize: 14, fontWeight: '800', color: colors.amber },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.inkSecondary, marginTop: 12 },
})
