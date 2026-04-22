import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CARDS = [
  {
    title: 'Produits',
    desc: 'Gérer le stock et les prix',
    icon: 'shirt-outline' as const,
    iconColor: '#007AFF',
    iconBg: '#E0F2FE',
    route: '/admin/products',
  },
  {
    title: 'Catégories',
    desc: 'Organiser les collections',
    icon: 'folder-outline' as const,
    iconColor: '#8B5CF6',
    iconBg: '#EDE9FE',
    route: '/admin/categories',
  },
  {
    title: 'Commandes',
    desc: 'Suivre et gérer les commandes',
    icon: 'bag-outline' as const,
    iconColor: '#F59E0B',
    iconBg: '#FEF3C7',
    route: '/admin/orders',
  },
  {
    title: 'Clients',
    desc: 'Voir les comptes clients',
    icon: 'people-outline' as const,
    iconColor: '#10B981',
    iconBg: '#D1FAE5',
    route: '/admin/customers',
  },
];

export default function AdminHome() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerSubtitle}>Tableau de bord</Text>
      <Text style={styles.headerTitle}>Administration</Text>

      <View style={styles.grid}>
        {CARDS.map((card) => (
          <TouchableOpacity
            key={card.title}
            style={styles.card}
            onPress={() => router.push(card.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconContainer, { backgroundColor: card.iconBg }]}>
              <Ionicons name={card.icon} size={28} color={card.iconColor} />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#FBFCFD',
    flexGrow: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 30,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  cardDesc:  { fontSize: 12, color: '#8E8E93', marginTop: 4 },
});