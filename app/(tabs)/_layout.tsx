import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Tabs } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          // ── Cache toute la barre de navigation sur web ──────────────────
          tabBarStyle: isWeb ? { display: 'none' } : undefined,
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

        {/* Routes cachées — accessibles via router.push() mais sans onglet */}
        <Tabs.Screen name="product/[id]"       options={{ href: null }} />
        <Tabs.Screen name="category/[id]"      options={{ href: null }} />
        <Tabs.Screen name="checkout"           options={{ href: null, title: 'Checkout' }} />
        <Tabs.Screen name="order-confirmation" options={{ href: null, title: 'Order Confirmed' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});