import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'
import { AuthProvider } from '../context/AuthContext'
import { FamilyProvider } from '../context/FamilyContext'

export { ErrorBoundary } from 'expo-router'

// Keep splash screen visible until we're ready
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    // Hide splash after a brief delay to let contexts hydrate
    const timer = setTimeout(() => SplashScreen.hideAsync(), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AuthProvider>
      <FamilyProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <StatusBar style="dark" />
      </FamilyProvider>
    </AuthProvider>
  )
}
