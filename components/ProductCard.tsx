import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import type { Product } from '@/hooks/useProducts';

type ProductCardProps = {
  product: Product;
  onPress: (id: string) => void;
};

function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable onPress={() => onPress(product.id)} style={styles.card}>
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        {product.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 4,
  },
  image: {
    width: '100%',
    height: 140,
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333333',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  description: {
    fontSize: 12,
    color: '#666666',
  },
});

export default React.memo(ProductCard);
