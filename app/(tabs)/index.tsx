import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, FlatList, Text, View, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProductsByCategory } from '@/hooks/useProductsByCategory';
import ProductCard from '@/components/ProductCard';
import { CartButton } from '@/components/CartButton';
import { CartModal } from '@/components/CartModal';

export default function HomeScreen() {
  const router = useRouter();
  const { sections, loading, error } = useProductsByCategory();

  const [isModalVisible, setModalVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const lowerQuery = searchQuery.toLowerCase();

    return sections
      .map((section) => ({
        ...section,
        data: section.data.filter(
          (product) =>
            product.name.toLowerCase().includes(lowerQuery) ||
            (product.description && product.description.toLowerCase().includes(lowerQuery)),
        ),
      }))
      .filter((section) => section.data.length > 0);
  }, [sections, searchQuery]);

  const handlePress = useCallback((id: string) => router.push(`/(tabs)/product/${id}`), [router]);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
        }}
      >
        <Pressable onPress={() => setModalVisible(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </Pressable>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333', letterSpacing: 1 }}>
          Leico
        </Text>
        <CartButton onPress={() => setCartModalVisible(true)} />
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#fff' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 16, color: '#333' }}
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Modal Menu */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' }}>
          <View style={{ width: '75%', backgroundColor: '#fff', padding: 20, paddingTop: 60 }}>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={{ alignSelf: 'flex-end', marginBottom: 20 }}
            >
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>

            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Menu</Text>

            <Pressable
              onPress={() => {
                setModalVisible(false);
              }}
              style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
            >
              <Text style={{ fontSize: 18 }}>Products</Text>
            </Pressable>

            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginTop: 24,
                marginBottom: 12,
                color: '#666',
              }}
            >
              Categories
            </Text>
            <FlatList
              data={sections}
              keyExtractor={(s) => s.category_id}
              renderItem={({ item: section }) => (
                <Pressable
                  onPress={() => {
                    setModalVisible(false);
                    router.push({
                      pathname: '/(tabs)/category/[id]',
                      params: { id: section.category_id, name: section.category_name },
                    });
                  }}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                >
                  <Text style={{ fontSize: 16 }}>{section.category_name}</Text>
                </Pressable>
              )}
            />
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
        </View>
      </Modal>

      <FlatList
        data={filteredSections}
        keyExtractor={(section) => section.category_id}
        renderItem={({ item: section }) => (
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{section.category_name}</Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/category/[id]',
                    params: { id: section.category_id, name: section.category_name },
                  })
                }
              >
                <Text style={{ color: '#007AFF', fontWeight: '500' }}>View all →</Text>
              </Pressable>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              data={section.data}
              keyExtractor={(product) => product.id}
              renderItem={({ item: product }) => (
                <View style={{ width: 160, marginRight: 16 }}>
                  <ProductCard product={product} onPress={handlePress} />
                </View>
              )}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No products available.</Text>
        }
        contentContainerStyle={{ paddingVertical: 16 }}
      />

      <CartModal visible={cartModalVisible} onClose={() => setCartModalVisible(false)} />
    </SafeAreaView>
  );
}
