import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { Product } from '@/hooks/useProducts';

type ProductCardProps = {
  product: Product;
  onPress: (id: string) => void;
};

function ProductCard({ product, onPress }: ProductCardProps) {
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
      <Pressable onPress={() => onPress(product.id)}>
        <Text>View Details</Text>
      </Pressable>
    </View>
  );
}

export default React.memo(ProductCard);
