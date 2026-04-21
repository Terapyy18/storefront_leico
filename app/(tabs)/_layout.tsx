import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CartButton } from '@/components/CartButton';
import { CartModal } from '@/components/CartModal';

export default function TabLayout() {
  const [cartModalVisible, setCartModalVisible] = useState(false);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Products',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol size={26} name={focused ? 'heart.fill' : 'heart'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="compte"
          options={{
            title: 'Account',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={26} name="person.fill" color={color} />
            ),
          }}
        />
        {/* Routes cachées */}
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="product/[id]" options={{ href: null }} />
      </Tabs>

      {/* Bouton panier flottant */}
      <View style={styles.fab} pointerEvents="box-none">
        <CartButton onPress={() => setCartModalVisible(true)} />
      </View>

      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 90,   // au-dessus de la tab bar (~50px) + marge
    right: 16,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    backgroundColor: '#fff',
    borderRadius: 24,
  },
});
