import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ presentation: 'modal', title: 'Connexion' }} />
      <Stack.Screen name="signup" options={{ presentation: 'modal', title: 'Créer un compte' }} />
    </Stack>
  );
}
