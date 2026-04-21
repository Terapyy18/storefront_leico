import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts, type Product } from '@/hooks/useProducts';

function ProductCard({ product }: { product: Product }) {
  const router = useRouter();

  return (
    <View>
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={{ width: '100%', height: 180 }}
          resizeMode="cover"
        />
      ) : null}
      <Text>{product.name}</Text>
      <Text>${product.price.toFixed(2)}</Text>
      {product.description ? (
        <Text numberOfLines={2}>{product.description}</Text>
      ) : null}
      <Pressable onPress={() => router.push(`/(tabs)/product/${product.id}`)}>
        <Text>View Details</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { products, loading, error } = useProducts();

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading products...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Failed to load products</Text>
        <Text>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={<Text>No products available.</Text>}
      />
    </SafeAreaView>
  );
}
