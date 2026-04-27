import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';

export default function CategoryScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();

  const { products, loading, error, hasMore, loadMore } = useProducts(id);

  const handlePress = useCallback(
    (productId: string) => router.push(`/(tabs)/product/${productId}`),
    [router],
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333',
            marginRight: 32,
          }}
        >
          {name ?? 'Catégorie'}
        </Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingVertical: 16 }}
        renderItem={({ item }) => (
          <View style={{ width: '48%', marginBottom: 16 }}>
            <ProductCard product={item} onPress={handlePress} />
          </View>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ flex: 1, alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="cube-outline" size={48} color="#ccc" />
              <Text style={{ marginTop: 12, fontSize: 16, color: '#666' }}>
                Aucun produit dans cette catégorie.
              </Text>
            </View>
          )
        }
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && products.length > 0 ? <ActivityIndicator style={{ padding: 16 }} /> : null
        }
      />
    </SafeAreaView>
  );
}
