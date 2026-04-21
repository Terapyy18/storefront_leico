import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminHome() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerSubtitle}>Tableau de bord</Text>
      <Text style={styles.headerTitle}>Administration</Text>
      
      <View style={styles.grid}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/admin/products')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="shirt-outline" size={28} color="#007AFF" />
          </View>
          <Text style={styles.cardTitle}>Produits</Text>
          <Text style={styles.cardDesc}>Gérer le stock et les prix</Text>
        </TouchableOpacity>

        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 30, backgroundColor: '#FBFCFD', flex: 1 },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#1C1C1E', marginBottom: 30 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  card: { 
    backgroundColor: 'white', 
    width: '48%', 
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  iconContainer: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  cardDesc: { fontSize: 12, color: '#8E8E93', marginTop: 4 }
});