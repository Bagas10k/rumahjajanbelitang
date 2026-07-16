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

export interface FinancialTransaction {
  id: string;
  orderId: string | null;
  type: 'income' | 'expense' | 'refund';
  category: string; // 'product_sale' | 'shipping' | 'operational' | 'material' | 'salary' | 'other'
  description: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'bahan_baku' | 'operasional' | 'gaji' | 'pengiriman' | 'lainnya';
  description: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

export interface DailySummary {
  id: string;
  date: string;
  totalIncome: number;
  totalExpense: number;
  totalOrders: number;
  totalItemsSold: number;
  netProfit: number;
}

export interface ReceiptData {
  order: Order;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  printedAt: string;
  printedBy: string;
}
