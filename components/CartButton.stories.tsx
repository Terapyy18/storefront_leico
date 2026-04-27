import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CartButton } from './CartButton';
import { CartContext, type CartContextType } from '@/context/CartContext';

const mockCart = (totalItems: number): CartContextType => ({
  items: [],
  totalItems,
  totalPrice: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
});

const CartButtonStory = ({ totalItems, onPress }: { totalItems: number; onPress: () => void }) => (
  <CartContext.Provider value={mockCart(totalItems)}>
    <CartButton onPress={onPress} />
  </CartContext.Provider>
);

const meta = {
  title: 'Components/CartButton',
  component: CartButtonStory,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CartButtonStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyCart: Story = {
  args: { totalItems: 0, onPress: () => {} },
};

export const WithItems: Story = {
  args: { totalItems: 5, onPress: () => {} },
};

export const OverflowCount: Story = {
  args: { totalItems: 100, onPress: () => {} },
};
