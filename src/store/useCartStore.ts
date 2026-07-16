import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem, Order, CustomerDetails, User, ProductVariant } from '../types';
import { supabase } from '../lib/supabaseClient';

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
  
  // Supabase Load Actions
  fetchProducts: () => Promise<void>;
  fetchOrders: () => Promise<void>;

  // Order Actions
  placeOrder: (customer: CustomerDetails, paymentMethod: 'qris' | 'cod', customUniqueCode?: number) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: 'pending' | 'paid' | 'failed') => Promise<void>;
  updateDeliveryStatus: (orderId: string, status: 'packing' | 'shipping' | 'completed') => Promise<void>;
  
  // Admin Product Actions
  addProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProduct: (productId: string, updatedFields: Partial<Product>) => Promise<void>;
  toggleFeatured: (productId: string) => Promise<void>;
  updateVariantStock: (productId: string, variantId: string, stock: number) => Promise<void>;
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
          console.warn(`Cannot add ${quantity} of ${product.name} (${variant.name}). Insufficient stock.`);
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
          console.warn(`Cannot update quantity to ${quantity} for ${item.product.name}. Stock limit is ${storeVariant.stock}.`);
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

      // Helper to check if Supabase is fully configured
      fetchProducts: async () => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        if (!checkSupabase()) {
          console.log('Using local products storage (Supabase not configured)');
          return;
        }
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          if (data && data.length > 0) {
            const mappedProducts: Product[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              imageUrl: p.image_url,
              gallery: Array.isArray(p.gallery) ? p.gallery : [p.image_url],
              originalPrice: Number(p.original_price),
              discountPrice: p.discount_price !== null ? Number(p.discount_price) : null,
              stock: Number(p.stock),
              category: p.category,
              isFeatured: p.is_featured,
              variants: Array.isArray(p.variants) ? p.variants : []
            }));
            set({ products: mappedProducts });
          }
        } catch (err) {
          console.warn('Failed to fetch products from Supabase, using local fallback:', err);
        }
      },

      fetchOrders: async () => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        if (!checkSupabase()) {
          console.log('Using local orders storage (Supabase not configured)');
          return;
        }
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data) {
            const mappedOrders: Order[] = data.map((o: any) => ({
              id: o.id,
              customer: o.customer,
              items: o.items,
              totalAmount: Number(o.total_amount),
              paymentStatus: o.payment_status,
              paymentMethod: o.payment_method,
              deliveryStatus: o.delivery_status,
              uniqueCode: o.unique_code,
              createdAt: o.created_at
            }));
            set({ orders: mappedOrders });
          }
        } catch (err) {
          console.warn('Failed to fetch orders from Supabase, using local fallback:', err);
        }
      },

      // Order Actions
      placeOrder: async (customer: CustomerDetails, paymentMethod: 'qris' | 'cod', customUniqueCode?: number) => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        const cartItems = get().items;
        if (cartItems.length === 0) return null;

        const subtotal = get().getCartTotal();
        const uniqueCode = customUniqueCode !== undefined 
          ? customUniqueCode 
          : (paymentMethod === 'qris' ? Math.floor(Math.random() * 999) + 1 : 0);
        const total = subtotal + uniqueCode;
        
        const newOrder: Order = {
          id: `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          customer,
          items: [...cartItems],
          totalAmount: total,
          paymentStatus: 'pending',
          paymentMethod,
          deliveryStatus: 'packing',
          createdAt: new Date().toISOString(),
          uniqueCode
        };

        // Local stock reduction logic
        const reduceLocalStock = () => {
          const products = get().products;
          const updatedProducts = products.map((p) => {
            const item = cartItems.find((ci) => ci.product.id === p.id);
            if (item) {
              const updatedVariants = p.variants.map((v) => {
                if (v.id === item.selectedVariant.id) {
                  return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                }
                return v;
              });
              const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
              return { ...p, variants: updatedVariants, stock: totalStock };
            }
            return p;
          });
          set({ products: updatedProducts });
        };

        if (checkSupabase()) {
          try {
            // 1. Insert order into Supabase
            const { error: orderError } = await supabase
              .from('orders')
              .insert([{
                id: newOrder.id,
                customer: newOrder.customer,
                items: newOrder.items,
                total_amount: newOrder.totalAmount,
                payment_status: newOrder.paymentStatus,
                payment_method: newOrder.paymentMethod,
                delivery_status: newOrder.deliveryStatus,
                unique_code: newOrder.uniqueCode,
                created_at: newOrder.createdAt
              }]);

            if (orderError) throw orderError;

            // 2. Reduce specific variant stock in Supabase
            const products = get().products;
            for (const item of cartItems) {
              const product = products.find((p) => p.id === item.product.id);
              if (product) {
                const updatedVariants = product.variants.map((v) => {
                  if (v.id === item.selectedVariant.id) {
                    return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                  }
                  return v;
                });
                const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

                const { error: prodError } = await supabase
                  .from('products')
                  .update({
                    variants: updatedVariants,
                    stock: totalStock
                  })
                  .eq('id', product.id);

                if (prodError) throw prodError;
              }
            }
          } catch (err) {
            console.warn('Error placing order in Supabase, using local fallback:', err);
          }
        }

        // Always run local state updates so UX is instantaneous and works offline
        reduceLocalStock();
        set({
          orders: [newOrder, ...get().orders],
        });
        get().clearCart();
        return newOrder;
      },

      updateOrderStatus: async (orderId: string, status: 'pending' | 'paid' | 'failed') => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        // Update local state instantly
        set({
          orders: get().orders.map((order) =>
            order.id === orderId ? { ...order, paymentStatus: status } : order
          ),
        });

        if (checkSupabase()) {
          try {
            const { error } = await supabase
              .from('orders')
              .update({ payment_status: status })
              .eq('id', orderId);
            
            if (error) throw error;
          } catch (err) {
            console.warn('Error updating order status in Supabase:', err);
          }
        }
      },

      updateDeliveryStatus: async (orderId: string, status: 'packing' | 'shipping' | 'completed') => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        // Update local state instantly
        set({
          orders: get().orders.map((order) =>
            order.id === orderId ? { ...order, deliveryStatus: status } : order
          ),
        });

        if (checkSupabase()) {
          try {
            const { error } = await supabase
              .from('orders')
              .update({ delivery_status: status })
              .eq('id', orderId);
            
            if (error) throw error;
          } catch (err) {
            console.warn('Error updating delivery status in Supabase:', err);
          }
        }
      },

      // Admin Actions: Add New Product
      addProduct: async (product: Product) => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        // Update local state instantly
        set({
          products: [product, ...get().products],
        });

        if (checkSupabase()) {
          try {
            const { error } = await supabase
              .from('products')
              .insert([{
                id: product.id,
                name: product.name,
                description: product.description,
                image_url: product.imageUrl,
                gallery: product.gallery,
                original_price: product.originalPrice,
                discount_price: product.discountPrice,
                stock: product.stock,
                category: product.category,
                is_featured: product.isFeatured,
                variants: product.variants
              }]);

            if (error) throw error;
          } catch (err) {
            console.warn('Error adding product in Supabase:', err);
          }
        }
      },

      // Admin Actions: Delete Product
      deleteProduct: async (productId: string) => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        // Update local state instantly
        set({
          products: get().products.filter((p) => p.id !== productId),
        });

        if (checkSupabase()) {
          try {
            const { error } = await supabase
              .from('products')
              .delete()
              .eq('id', productId);

            if (error) throw error;
          } catch (err) {
            console.warn('Error deleting product from Supabase:', err);
          }
        }
      },

      // Admin Actions: Update Product
      updateProduct: async (productId: string, updatedFields: Partial<Product>) => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        // Update local state instantly
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, ...updatedFields } : p
          ),
        });

        if (checkSupabase()) {
          try {
            const dbFields: any = {};
            if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
            if (updatedFields.description !== undefined) dbFields.description = updatedFields.description;
            if (updatedFields.imageUrl !== undefined) dbFields.image_url = updatedFields.imageUrl;
            if (updatedFields.gallery !== undefined) dbFields.gallery = updatedFields.gallery;
            if (updatedFields.originalPrice !== undefined) dbFields.original_price = updatedFields.originalPrice;
            if (updatedFields.discountPrice !== undefined) dbFields.discount_price = updatedFields.discountPrice;
            if (updatedFields.stock !== undefined) dbFields.stock = updatedFields.stock;
            if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
            if (updatedFields.variants !== undefined) dbFields.variants = updatedFields.variants;

            const { error } = await supabase
              .from('products')
              .update(dbFields)
              .eq('id', productId);

            if (error) throw error;
          } catch (err) {
            console.warn('Error updating product in Supabase:', err);
          }
        }
      },

      // Admin Actions: Toggle Featured Customizer
      toggleFeatured: async (productId: string) => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        const nextFeatured = !product.isFeatured;

        // Update local state instantly
        set({
          products: get().products.map((p) =>
            p.id === productId ? { ...p, isFeatured: nextFeatured } : p
          ),
        });

        if (checkSupabase()) {
          try {
            const { error } = await supabase
              .from('products')
              .update({ is_featured: nextFeatured })
              .eq('id', productId);

            if (error) throw error;
          } catch (err) {
            console.warn('Error toggling featured in Supabase:', err);
          }
        }
      },

      // Admin Actions: Edit Specific Variant Stock
      updateVariantStock: async (productId: string, variantId: string, stock: number) => {
        const checkSupabase = () => {
          const url = import.meta.env.VITE_SUPABASE_URL || '';
          const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
          return url && !url.includes('your-project.supabase.co') && key && key !== 'your-anon-key-here';
        };

        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        const updatedVariants = product.variants.map((v) =>
          v.id === variantId ? { ...v, stock: Math.max(0, stock) } : v
        );
        const totalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

        // Update local state instantly
        set({
          products: get().products.map((p) => {
            if (p.id === productId) {
              return {
                ...p,
                variants: updatedVariants,
                stock: totalStock,
              };
            }
            return p;
          }),
        });

        if (checkSupabase()) {
          try {
            const { error } = await supabase
              .from('products')
              .update({
                variants: updatedVariants,
                stock: totalStock
              })
              .eq('id', productId);

            if (error) throw error;
          } catch (err) {
            console.warn('Error updating variant stock in Supabase:', err);
          }
        }
      }
    }),
    {
      name: 'krupuk-belitang-store',
      // Persist items, currentUser, products, and orders in localStorage
      // so the app remains fully functional and preserves state in local mode
      partialize: (state) => ({
        items: state.items,
        currentUser: state.currentUser,
        products: state.products,
        orders: state.orders
      }) as any
    }
  )
);
