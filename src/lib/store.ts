import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.product.id === product.id
          );
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'snippy-cart',
    }
  )
);

// Sample products data
export const products: Product[] = [
  {
    id: '1',
    name: 'Netflix Premium',
    description: '4K Ultra HD streaming with 4 screens. Watch anywhere, anytime.',
    price: 9.99,
    oldPrice: 15.99,
    image: '/placeholder.svg',
    category: 'Streaming',
  },
  {
    id: '2',
    name: 'Spotify Premium',
    description: 'Ad-free music streaming with offline downloads and high quality audio.',
    price: 4.99,
    oldPrice: 9.99,
    image: '/placeholder.svg',
    category: 'Music',
  },
  {
    id: '3',
    name: 'ChatGPT Plus',
    description: 'Access to GPT-4, faster responses, and priority access to new features.',
    price: 12.99,
    oldPrice: 20.00,
    image: '/placeholder.svg',
    category: 'AI Tools',
  },
  {
    id: '4',
    name: 'Canva Pro',
    description: 'Premium design tools, templates, and brand kit for professionals.',
    price: 6.99,
    oldPrice: 12.99,
    image: '/placeholder.svg',
    category: 'Design',
  },
  {
    id: '5',
    name: 'YouTube Premium',
    description: 'Ad-free videos, background play, and YouTube Music included.',
    price: 5.99,
    oldPrice: 11.99,
    image: '/placeholder.svg',
    category: 'Streaming',
  },
  {
    id: '6',
    name: 'Adobe Creative Cloud',
    description: 'Full access to Photoshop, Illustrator, Premiere Pro, and more.',
    price: 24.99,
    oldPrice: 54.99,
    image: '/placeholder.svg',
    category: 'Design',
  },
  {
    id: '7',
    name: 'Disney+ Premium',
    description: 'Marvel, Star Wars, Pixar, and Disney classics in 4K HDR.',
    price: 6.99,
    oldPrice: 10.99,
    image: '/placeholder.svg',
    category: 'Streaming',
  },
  {
    id: '8',
    name: 'Grammarly Premium',
    description: 'Advanced writing assistance with tone detection and plagiarism checker.',
    price: 7.99,
    oldPrice: 14.99,
    image: '/placeholder.svg',
    category: 'Productivity',
  },
];

// Generate order ID
export const generateOrderId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `SNIP-${year}-${random}`;
};
