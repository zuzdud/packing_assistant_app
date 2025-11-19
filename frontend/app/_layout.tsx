import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false }}>
    {!isAuthenticated ? (<><Stack.Screen name="login" />
      <Stack.Screen name="register" /> </>) : (
      <Stack.Screen name="hi" />
    )}
  </Stack>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}