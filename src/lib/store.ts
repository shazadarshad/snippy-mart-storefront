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

  /** Optional variant selection (sub-plan) */
  variant_id?: string;
  variant_name?: string;

  /** Reseller auto-delivery product id (if set, this is an Auto product) */
  reseller_product_id?: string | null;
  /** Live stock from reseller panel (when known) */
  reseller_stock?: number | null;
  stock_status?: 'in_stock' | 'limited' | 'out_of_stock' | string | null;
  manual_fulfillment?: boolean | null;

  requirements?: {
    require_email?: boolean;
    require_password?: boolean;
    require_username?: boolean;
  } | null;
}

function maxQtyForProduct(product: Product): number | null {
  const n = product.reseller_stock;
  if (n == null || !Number.isFinite(Number(n))) return null;
  const q = Math.floor(Number(n));
  return q > 0 ? q : null;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  min_order_amount?: number;
  max_discount?: number;
}

export interface CartItem {
  /** Unique key for cart line item (product + optional plan) */
  id: string;
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  appliedCoupon: Coupon | null;
  addItem: (product: Product) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number; // Returns subtotal
  getItemCount: () => number;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  getDiscountAmount: () => number;
  getFinalTotal: () => number;
}

const getCartItemId = (product: Product) => {
  // Keep base product UUID intact; include plan_id and variant_id if present.
  return `${product.id}${product.plan_id ? `:${product.plan_id}` : ''}${product.variant_id ? `:${product.variant_id}` : ''}`;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Drop coupon when cart subtotal no longer meets min_order_amount */
function revalidateCoupon(items: CartItem[], coupon: Coupon | null): Coupon | null {
  if (!coupon) return null;
  if (!coupon.min_order_amount) return coupon;
  const subtotal = items.reduce((t, i) => t + i.product.price * i.quantity, 0);
  if (subtotal < coupon.min_order_amount) return null;
  return coupon;
}

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
      appliedCoupon: null,
      addItem: (product) => {
        const cartItemId = getCartItemId(product);
        const maxQ = maxQtyForProduct(product);
        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartItemId);
          if (existingItem) {
            const next = existingItem.quantity + 1;
            const qty = maxQ != null ? Math.min(next, maxQ) : next;
            return {
              items: state.items.map((item) =>
                item.id === cartItemId
                  ? {
                      ...item,
                      quantity: qty,
                      // refresh stock fields if product re-added with newer data
                      product: {
                        ...item.product,
                        reseller_product_id:
                          product.reseller_product_id ?? item.product.reseller_product_id,
                        reseller_stock: product.reseller_stock ?? item.product.reseller_stock,
                        stock_status: product.stock_status ?? item.product.stock_status,
                      },
                    }
                  : item,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { id: cartItemId, product, quantity: maxQ != null ? Math.min(1, maxQ) : 1 },
            ],
          };
        });
      },
      removeItem: (cartItemId) => {
        set((state) => {
          const items = state.items.filter((item) => item.id !== cartItemId);
          return { items, appliedCoupon: revalidateCoupon(items, state.appliedCoupon) };
        });
      },
      updateQuantity: (cartItemId, quantity) => {
        set((state) => {
          const items = state.items.map((item) => {
            if (item.id !== cartItemId) return item;
            const maxQ = maxQtyForProduct(item.product);
            let q = Math.max(1, Math.floor(quantity) || 1);
            if (maxQ != null) q = Math.min(q, maxQ);
            return { ...item, quantity: q };
          });
          return { items, appliedCoupon: revalidateCoupon(items, state.appliedCoupon) };
        });
      },
      clearCart: () => set({ items: [], appliedCoupon: null }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
      getDiscountAmount: () => {
        const { items, appliedCoupon } = get();
        // Coupon revalidation runs on removeItem/updateQuantity/clearCart (no set() during render)
        if (!appliedCoupon) return 0;

        const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0);
        if (appliedCoupon.min_order_amount && subtotal < appliedCoupon.min_order_amount) {
          return 0;
        }

        if (appliedCoupon.type === 'fixed') {
          return Math.min(appliedCoupon.value, subtotal);
        } else {
          let discount = subtotal * (appliedCoupon.value / 100);
          if (appliedCoupon.max_discount) {
            discount = Math.min(discount, appliedCoupon.max_discount);
          }
          return discount;
        }
      },
      getFinalTotal: () => {
        const subtotal = get().getTotal();
        const discount = get().getDiscountAmount();
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'snippy-cart',
      version: 4,
      migrate: (persistedState: any) => {
        const state = (persistedState?.state ?? persistedState) as any;
        const items = Array.isArray(state?.items) ? state.items : [];

        const migrated = items.map((raw: any) => {
          const legacyProduct = raw?.product ?? {};

          // Legacy shape was { product, quantity } and legacy product.id was "<productUuid>-<planUuid>".
          let baseId = String(legacyProduct.id ?? '');
          let plan_id: string | undefined = legacyProduct.plan_id;
          let plan_name: string | undefined = legacyProduct.plan_name;
          let variant_id: string | undefined = legacyProduct.variant_id;
          let variant_name: string | undefined = legacyProduct.variant_name;
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
            variant_id,
            variant_name,
            // Keep Auto product identity across reloads / version bumps
            reseller_product_id: legacyProduct.reseller_product_id ?? null,
            reseller_stock:
              legacyProduct.reseller_stock != null
                ? Number(legacyProduct.reseller_stock)
                : null,
            stock_status: legacyProduct.stock_status ?? null,
            manual_fulfillment: legacyProduct.manual_fulfillment ?? null,
            requirements: legacyProduct.requirements ?? null,
          };

          const id = getCartItemId(product);
          let quantity = Math.max(1, Number(raw?.quantity ?? 1) || 1);
          const maxQ = maxQtyForProduct(product);
          if (maxQ != null) quantity = Math.min(quantity, maxQ);

          return {
            id,
            product,
            quantity,
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
