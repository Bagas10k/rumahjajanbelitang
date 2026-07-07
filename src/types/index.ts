export interface ProductVariant {
  id: string;
  name: string; // e.g. "Paket 1 Kg", "Paket 500 Gram", "Eceran Kecil"
  price: number;
  discountPrice: number | null;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  gallery: string[]; // List of gallery images
  originalPrice: number;
  discountPrice: number | null;
  stock: number; // total stock (or fallback)
  category?: string;
  variants: ProductVariant[];
  isFeatured: boolean; // "Produk Unggulan" toggle
}

export interface CartItem {
  id: string; // Compound ID: `${productId}-${variantId}`
  product: Product;
  selectedVariant: ProductVariant;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  customer: CustomerDetails;
  items: CartItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'qris' | 'cod';
  deliveryStatus: 'packing' | 'shipping' | 'completed';
  createdAt: string;
  uniqueCode?: number;
}

export interface User {
  id: string;
  username: string;
  role: 'customer' | 'admin';
}
