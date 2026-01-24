import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  /** Base product UUID from `public.products.id` */
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;

  /** Optional pricing plan selection */
  plan_id?: string;
  plan_name?: string;
}

export interface CartItem {
  /** Unique key for cart line item (product + optional plan) */
  id: string;
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const getCartItemId = (product: Product) => {
  // Keep base product UUID intact; include plan_id if present.
  return `${product.id}${product.plan_id ? `:${product.plan_id}` : ''}`;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mergeItemsById = (items: CartItem[]) => {
  const map = new Map<string, CartItem>();
  for (const item of items) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    map.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
  }
  return Array.from(map.values());
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const cartItemId = getCartItemId(product);
        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartItemId);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
              ),
            };
          }
          return { items: [...state.items, { id: cartItemId, product, quantity: 1 }] };
        });
      },
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }));
      },
      updateQuantity: (cartItemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) => (item.id === cartItemId ? { ...item, quantity } : item)),
        }));
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'snippy-cart',
      version: 2,
      migrate: (persistedState: any) => {
        const state = (persistedState?.state ?? persistedState) as any;
        const items = Array.isArray(state?.items) ? state.items : [];

        const migrated = items.map((raw: any) => {
          const legacyProduct = raw?.product ?? {};

          // Legacy shape was { product, quantity } and legacy product.id was "<productUuid>-<planUuid>".
          let baseId = String(legacyProduct.id ?? '');
          let plan_id: string | undefined = legacyProduct.plan_id;
          let plan_name: string | undefined = legacyProduct.plan_name;
          let name: string = String(legacyProduct.name ?? '');

          if (baseId.length > 36 && baseId[36] === '-') {
            const maybeProductId = baseId.slice(0, 36);
            const maybePlanId = baseId.slice(37, 73);
            if (UUID_RE.test(maybeProductId) && UUID_RE.test(maybePlanId)) {
              baseId = maybeProductId;
              plan_id = plan_id ?? maybePlanId;

              if (!plan_name) {
                const m = name.match(/\(([^)]+)\)\s*$/);
                if (m?.[1]) plan_name = m[1];
              }

              // Remove "(Plan)" suffix from display name if present.
              name = name.replace(/\s*\([^)]+\)\s*$/, '');
            }
          }

          const product: Product = {
            id: baseId,
            name,
            description: String(legacyProduct.description ?? ''),
            price: Number(legacyProduct.price ?? 0),
            oldPrice: legacyProduct.oldPrice ?? undefined,
            image: String(legacyProduct.image ?? ''),
            category: String(legacyProduct.category ?? ''),
            plan_id,
            plan_name,
          };

          const id = getCartItemId(product);
          return {
            id,
            product,
            quantity: Number(raw?.quantity ?? 1),
          } satisfies CartItem;
        });

        return {
          ...state,
          items: mergeItemsById(migrated),
        };
      },
    }
  )
);

// Note: formatPrice and CURRENCY have been moved to useCurrency hook 
// for dynamic location-based currency conversion.

// Sample products data (prices in LKR)
export const products: Product[] = [
  {
    id: '1',
    name: 'Netflix Premium',
    description: '4K Ultra HD streaming with 4 screens. Watch anywhere, anytime.',
    price: 2999,
    oldPrice: 4799,
    image: '/placeholder.svg',
    category: 'Streaming',
  },
  {
    id: '2',
    name: 'Spotify Premium',
    description: 'Ad-free music streaming with offline downloads and high quality audio.',
    price: 1499,
    oldPrice: 2999,
    image: '/placeholder.svg',
    category: 'Music',
  },
  {
    id: '3',
    name: 'ChatGPT Plus',
    description: 'Access to GPT-4, faster responses, and priority access to new features.',
    price: 3899,
    oldPrice: 5999,
    image: '/placeholder.svg',
    category: 'AI Tools',
  },
  {
    id: '4',
    name: 'Canva Pro',
    description: 'Premium design tools, templates, and brand kit for professionals.',
    price: 2099,
    oldPrice: 3899,
    image: '/placeholder.svg',
    category: 'Design',
  },
  {
    id: '5',
    name: 'YouTube Premium',
    description: 'Ad-free videos, background play, and YouTube Music included.',
    price: 1799,
    oldPrice: 3599,
    image: '/placeholder.svg',
    category: 'Streaming',
  },
  {
    id: '6',
    name: 'Adobe Creative Cloud',
    description: 'Full access to Photoshop, Illustrator, Premiere Pro, and more.',
    price: 7499,
    oldPrice: 16499,
    image: '/placeholder.svg',
    category: 'Design',
  },
  {
    id: '7',
    name: 'Disney+ Premium',
    description: 'Marvel, Star Wars, Pixar, and Disney classics in 4K HDR.',
    price: 2099,
    oldPrice: 3299,
    image: '/placeholder.svg',
    category: 'Streaming',
  },
  {
    id: '8',
    name: 'Grammarly Premium',
    description: 'Advanced writing assistance with tone detection and plagiarism checker.',
    price: 2399,
    oldPrice: 4499,
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
