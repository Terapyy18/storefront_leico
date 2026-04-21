import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';

export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();

  const { products, loading, error, hasMore, loadMore } = useProducts(id);

  const handlePress = useCallback(
    (productId: string) => router.push(`/(tabs)/product/${productId}`),
    [router]
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading {name}...</Text>
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
      <Text>{name ?? 'Category'}</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={handlePress} />
        )}
        ListEmptyComponent={loading ? null : <Text>No products in this category.</Text>}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && products.length > 0
            ? <ActivityIndicator style={{ padding: 16 }} />
            : null
        }
      />
    </SafeAreaView>
  );
}
