import type { CheckoutProduct } from '@/lib/types';

export const IMAGE_ANALYSIS_COST = 10;
export const TEXT_ANALYSIS_COST = 5;

export const CREDIT_PACKS: CheckoutProduct[] = [
  {
    id: 'pack_50',
    title: '50 credits',
    priceLabel: '$4.99',
    description: 'Perfect for testing a few product ideas.',
    mode: 'payment',
    badge: 'Starter pack',
  },
  {
    id: 'pack_150',
    title: '150 credits',
    priceLabel: '$11.99',
    description: 'Better value for regular resellers.',
    mode: 'payment',
    badge: 'Most popular',
  },
  {
    id: 'pack_500',
    title: '500 credits',
    priceLabel: '$29.99',
    description: 'Best value for heavier product research.',
    mode: 'payment',
    badge: 'Best value',
  },
];
