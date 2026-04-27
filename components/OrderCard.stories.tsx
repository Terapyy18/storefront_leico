import type { Meta, StoryObj } from '@storybook/react';
import OrderCard from './OrderCard';
import type { Order } from '@/hooks/useOrders';

const meta = {
  title: 'Components/OrderCard',
  component: OrderCard,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof OrderCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseOrder: Order = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: 'user-123',
  total_amount: 89.97,
  shipping_address: '123 Main St, Paris, France',
  status: 'paid',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:31:00Z',
};

export const PaidOrder: Story = {
  args: {
    order: baseOrder,
    onPress: () => {},
  },
};

export const PendingOrder: Story = {
  args: {
    order: { ...baseOrder, status: 'pending', total_amount: 49.99 },
    onPress: () => {},
  },
};

export const HighValueOrder: Story = {
  args: {
    order: { ...baseOrder, total_amount: 349.95 },
    onPress: () => {},
  },
};
