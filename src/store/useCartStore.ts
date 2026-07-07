import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem, Order, CustomerDetails, User, ProductVariant } from '../types';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Krupuk Ikan Tenggiri Super',
    description: 'Renyah, gurih, dibuat dengan daging ikan tenggiri asli pilihan dan resep tradisional.',
    imageUrl: '/krupuk_tenggiri.png',
    gallery: ['/krupuk_tenggiri.png', '/krupuk_bawang.png', '/krupuk_jengkol.png'],
    originalPrice: 150000,
    discountPrice: 127500,
    stock: 40,
    category: 'Krupuk Ikan',
    isFeatured: true,
    variants: [
      { id: 'var-1', name: 'Paket Besar 1 Kg', price: 150000, discountPrice: 127500, stock: 5 },
      { id: 'var-2', name: 'Paket Sedang 500 Gram', price: 80000, discountPrice: 68000, stock: 10 },
      { id: 'var-3', name: 'Pouch Eceran 100 Gram', price: 20000, discountPrice: 17000, stock: 25 },
    ]
  },
  {
    id: 'prod-2',
    name: 'Krupuk Jengkol Pedas Gurih',
    description: 'Paduan rasa jengkol khas dengan balutan bumbu pedas manis gurih yang bikin nagih.',
    imageUrl: '/krupuk_jengkol.png',
    gallery: ['/krupuk_jengkol.png', '/krupuk_tenggiri.png'],
    originalPrice: 120000,
    discountPrice: 99000,
    stock: 42,
    category: 'Krupuk Jengkol',
    isFeatured: true,
    variants: [
      { id: 'var-4', name: 'Paket Besar 1 Kg', price: 120000, discountPrice: 99000, stock: 4 },
      { id: 'var-5', name: 'Paket Sedang 500 Gram', price: 65000, discountPrice: 55000, stock: 8 },
      { id: 'var-6', name: 'Pouch Eceran 100 Gram', price: 15000, discountPrice: null, stock: 30 },
    ]
  },
  {
    id: 'prod-3',
    name: 'Krupuk Bawang Original Toples',
    description: 'Krupuk bawang klasik renyah dalam kemasan toples praktis, kedap udara, dan higienis.',
    imageUrl: '/krupuk_bawang.png',
    gallery: ['/krupuk_bawang.png', '/krupuk_hampers.png'],
    originalPrice: 110000,
    discountPrice: null,
    stock: 58,
    category: 'Krupuk Bawang',
    isFeatured: false,
    variants: [
      { id: 'var-7', name: 'Toples Besar (1.5 Kg)', price: 110000, discountPrice: null, stock: 6 },
      { id: 'var-8', name: 'Toples Sedang (800g)', price: 65000, discountPrice: null, stock: 12 },
      { id: 'var-9', name: 'Pouch Eceran (200g)', price: 18000, discountPrice: null, stock: 40 },
    ]
  },
  {
    id: 'prod-4',
    name: 'Paket Hampers Krupuk Asli',
    description: 'Hampers eksklusif berisi macam-macam krupuk khas Belitang terlaris untuk kerabat.',
    imageUrl: '/krupuk_hampers.png',
    gallery: ['/krupuk_hampers.png', '/krupuk_tenggiri.png', '/krupuk_bawang.png'],
    originalPrice: 220000,
    discountPrice: 187000,
    stock: 10,
    category: 'Hampers',
    isFeatured: true,
    variants: [
      { id: 'var-10', name: 'Hampers Premium (Isi 5)', price: 220000, discountPrice: 187000, stock: 3 },
      { id: 'var-11', name: 'Hampers Hemat (Isi 3)', price: 140000, discountPrice: 119000, stock: 7 },
    ]
  }
];

interface CartState {
  products: Product[];
  items: CartItem[];
  orders: Order[];
  currentUser: User | null;
  
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => boolean;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  
  // Auth Actions
  login: (username: string, role: 'customer' | 'admin') => void;
  logout: () => void;
  
  // Order Actions
  placeOrder: (customer: CustomerDetails, paymentMethod: 'qris' | 'cod') => Order | null;
  updateOrderStatus: (orderId: string, status: 'pending' | 'paid' | 'failed') => void;
  updateDeliveryStatus: (orderId: string, status: 'packing' | 'shipping' | 'completed') => void;
  
  // Admin Product Actions
  addProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateProduct: (productId: string, updatedFields: Partial<Product>) => void;
  toggleFeatured: (productId: string) => void;
  updateVariantStock: (productId: string, variantId: string, stock: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
  products: INITIAL_PRODUCTS,
  items: [],
  orders: [],
  currentUser: null,

  addToCart: (product: Product, variant: ProductVariant, quantity = 1) => {
    if (quantity <= 0) return false;

    // Retrieve active variant stock from store product list
    const products = get().products;
    const storeProduct = products.find((p) => p.id === product.id);
    const storeVariant = storeProduct?.variants.find((v) => v.id === variant.id);
    
    if (!storeVariant) return false;

    const cartItemId = `${product.id}-${variant.id}`;
    const items = get().items;
    const existingItem = items.find((item) => item.id === cartItemId);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > storeVariant.stock) {
      console.warn(
        `Cannot add ${quantity} of ${product.name} (${variant.name}). Insufficient stock.`
      );
      return false;
    }

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.id === cartItemId ? { ...item, quantity: newQty } : item
        ),
      });
    } else {
      set({
        items: [...items, { id: cartItemId, product, selectedVariant: variant, quantity }],
      });
    }
    return true;
  },

  removeFromCart: (cartItemId: string) => {
    set({
      items: get().items.filter((item) => item.id !== cartItemId),
    });
  },

  updateQuantity: (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(cartItemId);
      return true;
    }

    const items = get().items;
    const item = items.find((i) => i.id === cartItemId);
    if (!item) return false;

    const products = get().products;
    const storeProduct = products.find((p) => p.id === item.product.id);
    const storeVariant = storeProduct?.variants.find((v) => v.id === item.selectedVariant.id);
    
    if (!storeVariant) return false;

    if (quantity > storeVariant.stock) {
      console.warn(
        `Cannot update quantity to ${quantity} for ${item.product.name} (${item.selectedVariant.name}). Stock limit is ${storeVariant.stock}.`
      );
      return false;
    }

    set({
      items: items.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)),
    });
    return true;
  },

  clearCart: () => {
    set({ items: [] });
  },

  getCartTotal: () => {
    return get().items.reduce((total, item) => {
      const activeVariant = item.selectedVariant;
      const price = activeVariant.discountPrice !== null ? activeVariant.discountPrice : activeVariant.price;
      return total + price * item.quantity;
    }, 0);
  },

  getCartItemsCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },

  // Auth Actions
  login: (username: string, role: 'customer' | 'admin') => {
    set({
      currentUser: {
        id: `user-${Date.now()}`,
        username,
        role,
      },
    });
  },

  logout: () => {
    set({ currentUser: null });
  },

  // Order Actions
  placeOrder: (customer: CustomerDetails, paymentMethod: 'qris' | 'cod') => {
    const cartItems = get().items;
    if (cartItems.length === 0) return null;

    const total = get().getCartTotal();
    
    // Create new Order
    const newOrder: Order = {
      id: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customer,
      items: [...cartItems],
      totalAmount: total,
      paymentStatus: 'pending',
      paymentMethod,
      deliveryStatus: 'packing', // Starts as packing (Diproses/Dikemas)
      createdAt: new Date().toISOString(),
    };

    // Reduce specific variant stock reactively
    const products = get().products;
    const updatedProducts = products.map((p) => {
      const updatedVariants = p.variants.map((v) => {
        const cartItem = cartItems.find(
          (item) => item.product.id === p.id && item.selectedVariant.id === v.id
        );
        if (cartItem) {
          return {
            ...v,
            stock: Math.max(0, v.stock - cartItem.quantity),
          };
        }
        return v;
      });

      // Total stock is the sum of all variant stocks
      const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

      return {
        ...p,
        variants: updatedVariants,
        stock: totalStock,
      };
    });

    set({
      products: updatedProducts,
      orders: [newOrder, ...get().orders],
    });

    get().clearCart();
    return newOrder;
  },

  updateOrderStatus: (orderId: string, status: 'pending' | 'paid' | 'failed') => {
    set({
      orders: get().orders.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: status } : order
      ),
    });
  },

  updateDeliveryStatus: (orderId: string, status: 'packing' | 'shipping' | 'completed') => {
    set({
      orders: get().orders.map((order) =>
        order.id === orderId ? { ...order, deliveryStatus: status } : order
      ),
    });
  },

  // Admin Actions: Add New Product
  addProduct: (product: Product) => {
    set({
      products: [product, ...get().products],
    });
  },

  deleteProduct: (productId: string) => {
    set({
      products: get().products.filter((p) => p.id !== productId),
    });
  },

  updateProduct: (productId: string, updatedFields: Partial<Product>) => {
    set({
      products: get().products.map((p) =>
        p.id === productId ? { ...p, ...updatedFields } : p
      ),
    });
  },

  // Admin Actions: Toggle Featured Customizer
  toggleFeatured: (productId: string) => {
    set({
      products: get().products.map((p) =>
        p.id === productId ? { ...p, isFeatured: !p.isFeatured } : p
      ),
    });
  },

  // Admin Actions: Edit Specific Variant Stock
  updateVariantStock: (productId: string, variantId: string, stock: number) => {
    set({
      products: get().products.map((p) => {
        if (p.id === productId) {
          const updatedVariants = p.variants.map((v) =>
            v.id === variantId ? { ...v, stock: Math.max(0, stock) } : v
          );
          const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
          return {
            ...p,
            variants: updatedVariants,
            stock: totalStock,
          };
        }
        return p;
      }),
    });
  }
    }),
    {
      name: 'krupuk-belitang-store',
    }
  )
);
