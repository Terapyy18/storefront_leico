import type { Meta, StoryObj } from '@storybook/react';
import ProductCard from './ProductCard';
import type { Product } from '@/hooks/useProducts';

const meta = {
  title: 'Components/ProductCard',
  component: ProductCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseProduct: Product = {
  id: '1',
  name: 'Classic White T-Shirt',
  price: 29.99,
  description: 'A comfortable everyday essential made from 100% organic cotton.',
  image_url: 'https://picsum.photos/seed/tshirt/300/200',
  category_id: 'cat-1',
  category: 'T-Shirts',
  is_active: true,
};

export const WithImage: Story = {
  args: {
    product: baseProduct,
    onPress: () => {},
  },
};

export const WithoutImage: Story = {
  args: {
    product: { ...baseProduct, id: '2', image_url: null },
    onPress: () => {},
  },
};

export const LongDescription: Story = {
  args: {
    product: {
      ...baseProduct,
      id: '3',
      description: 'Very long description that should be truncated after two lines. '
        .repeat(4)
        .trim(),
    },
    onPress: () => {},
  },
};
