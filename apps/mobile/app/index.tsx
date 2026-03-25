import { Redirect } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'
import { ActivityIndicator, View } from 'react-native'
import { colors } from '../lib/theme'

export default function Index() {
  const { user, loading: authLoading } = useAuth()
  const { store, hydrated } = useFamily()

  if (authLoading || !hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.page }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />
  }

  if (!store.family) {
    return <Redirect href="/(auth)/setup" />
  }

  return <Redirect href="/(app)/(parent)" />
}
