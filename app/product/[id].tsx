// Cette route est gérée dans app/(tabs)/product/[id].tsx
// pour afficher la tab bar sur la page de détail.
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ProductRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/product/${id}` as never} />;
}
