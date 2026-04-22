import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductsByCategory } from '@/hooks/useProductsByCategory';
import ProductCard from '@/components/ProductCard';

export default function HomeScreen() {
  const router = useRouter();
  const { sections, loading, error } = useProductsByCategory();

  const handlePress = useCallback(
    (id: string) => router.push(`/(tabs)/product/${id}`),
    [router]
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading categories...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Failed to load</Text>
        <Text>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={handlePress} />
        )}
        renderSectionHeader={({ section: { category_id, category_name } }) => (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text>{category_name}</Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/category/[id]',
                  params: { id: category_id, name: category_name },
                })
              }
            >
              <Text>View all →</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text>No products available.</Text>}
        scrollEnabled
      />
    </SafeAreaView>
  );
}
