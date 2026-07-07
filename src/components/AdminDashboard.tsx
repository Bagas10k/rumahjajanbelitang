import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import type { Order, Product, ProductVariant } from '../types';
import { 
  ClipboardList, DollarSign, AlertTriangle, ArrowLeft, Star, PlusCircle, 
  X, Search, Eye, Edit, Trash2, TrendingUp, Package, ShieldCheck
} from 'lucide-react';

export interface AdminDashboardProps {
  onBackToCatalog: () => void;
}

interface NewVariantInput {
  id?: string;
  name: string;
  price: string;
  discountPrice: string;
  stock: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToCatalog }) => {
  const { 
    orders, 
    products, 
    updateOrderStatus, 
    updateDeliveryStatus,
    updateVariantStock,
    addProduct,
    deleteProduct,
    updateProduct,
    toggleFeatured
  } = useCartStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  
  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPayFilter, setOrderPayFilter] = useState<string>('all');
  const [orderShipFilter, setOrderShipFilter] = useState<string>('all');
  
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState<string>('all');

  // Modal / Form States
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrderForInspect, setSelectedOrderForInspect] = useState<Order | null>(null);

  // Form Fields States (Used for both Create and Edit)
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('Krupuk Ikan');
  const [formImg, setFormImg] = useState('/krupuk_tenggiri.png');
  const [formVariants, setFormVariants] = useState<NewVariantInput[]>([
    { name: 'Paket 1 Kg', price: '120000', discountPrice: '', stock: '10' }
  ]);

  // Analytics calculations
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingShipmentsCount = paidOrders.filter(
    (o) => o.deliveryStatus === 'packing' || o.deliveryStatus === 'shipping'
  ).length;

  const lowStockVariantsCount = products.reduce((count, p) => {
    const lowCount = p.variants.filter((v) => v.stock <= 5).length;
    return count + lowCount;
  }, 0);

  // Top Selling Products Calculation
  const productSalesMap: { [key: string]: { name: string; qty: number; sales: number } } = {};
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const activePrice = item.selectedVariant.discountPrice !== null 
        ? item.selectedVariant.discountPrice 
        : item.selectedVariant.price;
      if (!productSalesMap[item.product.id]) {
        productSalesMap[item.product.id] = { name: item.product.name, qty: 0, sales: 0 };
      }
      productSalesMap[item.product.id].qty += item.quantity;
      productSalesMap[item.product.id].sales += activePrice * item.quantity;
    });
  });
  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customer.phone.includes(orderSearch);
    const matchesPay = orderPayFilter === 'all' || order.paymentStatus === orderPayFilter;
    const matchesShip = orderShipFilter === 'all' || order.deliveryStatus === orderShipFilter;
    return matchesSearch && matchesPay && matchesShip;
  });

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          product.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = productCatFilter === 'all' || product.category === productCatFilter;
    return matchesSearch && matchesCat;
  });

  // Open Form for Adding New Product
  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDesc('');
    setFormCat('Krupuk Ikan');
    setFormImg('/krupuk_tenggiri.png');
    setFormVariants([{ name: 'Paket 1 Kg', price: '120000', discountPrice: '', stock: '10' }]);
    setIsAddFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const handleOpenEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description);
    setFormCat(product.category || 'Krupuk Ikan');
    setFormImg(product.imageUrl);
    setFormVariants(
      product.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: String(v.price),
        discountPrice: v.discountPrice !== null ? String(v.discountPrice) : '',
        stock: String(v.stock),
      }))
    );
    setIsAddFormOpen(true);
  };

  // Form Variant Rows Handlers
  const addVariantRow = () => {
    setFormVariants([...formVariants, { name: '', price: '', discountPrice: '', stock: '5' }]);
  };

  const removeVariantRow = (index: number) => {
    if (formVariants.length <= 1) return;
    setFormVariants(formVariants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: keyof NewVariantInput, value: string) => {
    setFormVariants(
      formVariants.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formDesc.trim()) {
      alert('Nama dan Deskripsi produk wajib diisi.');
      return;
    }

    // Format & Validate Variants
    const formattedVariants: ProductVariant[] = [];
    for (let i = 0; i < formVariants.length; i++) {
      const v = formVariants[i];
      if (!v.name.trim() || !v.price || Number(v.price) <= 0) {
        alert('Setiap varian wajib memiliki Nama dan Harga yang valid.');
        return;
      }
      formattedVariants.push({
        id: v.id || `var-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
        name: v.name,
        price: Number(v.price),
        discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
        stock: Number(v.stock) || 0
      });
    }

    const totalStock = formattedVariants.reduce((sum, v) => sum + v.stock, 0);
    const minPrice = Math.min(...formattedVariants.map((v) => v.price));
    const minDiscount = formattedVariants.some((v) => v.discountPrice !== null)
      ? Math.min(...formattedVariants.map((v) => v.discountPrice ?? Infinity))
      : null;

    const baseProductData = {
      name: formName,
      description: formDesc,
      imageUrl: formImg,
      gallery: [formImg],
      originalPrice: minPrice,
      discountPrice: minDiscount === Infinity ? null : minDiscount,
      stock: totalStock,
      category: formCat,
      variants: formattedVariants
    };

    if (editingProduct) {
      // Perform Edit
      updateProduct(editingProduct.id, baseProductData);
      alert(`Produk "${formName}" berhasil diperbarui!`);
    } else {
      // Perform Create
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        isFeatured: false,
        ...baseProductData
      };
      addProduct(newProduct);
      alert(`Produk baru "${formName}" berhasil ditambahkan!`);
    }

    setIsAddFormOpen(false);
  };

  // Delete Product Handler
  const handleDeleteProductClick = (productId: string, productName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus produk "${productName}" dari katalog? Tindakan ini tidak bisa dibatalkan.`)) {
      deleteProduct(productId);
      alert(`Produk "${productName}" berhasil dihapus.`);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-[#2d2218] tracking-tight font-serif">Admin Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Sistem Management Penjualan, Produk, &amp; Status Pengiriman.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Produk Baru
          </button>
          <button
            onClick={onBackToCatalog}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2d2218] hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Toko
          </button>
        </div>
      </div>

      {/* Grid KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-[#2e7d32] rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Omset Lunas (PAID)</span>
            <span className="text-lg font-black text-[#2e7d32]">Rp {totalSales.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Pemesanan</span>
            <span className="text-lg font-black text-blue-600">{totalOrders} Transaksi</span>
          </div>
        </div>

        {/* Pending Shipments */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pendingShipmentsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Antrean Kirim (PAID)</span>
            <span className={`text-lg font-black ${pendingShipmentsCount > 0 ? 'text-amber-600 font-extrabold' : 'text-gray-700'}`}>
              {pendingShipmentsCount} Paket
            </span>
          </div>
        </div>

        {/* Low Stock alert */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockVariantsCount > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Varian Kritis (&le; 5)</span>
            <span className={`text-lg font-black ${lowStockVariantsCount > 0 ? 'text-red-500 font-extrabold' : 'text-gray-700'}`}>
              {lowStockVariantsCount} Varian
            </span>
          </div>
        </div>

      </div>

      {/* Secondary Dashboard Grid: Analytics & Top Selling */}
      {orders.length > 0 && paidOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#e28743]" />
              Analisis Produk Terlaris (Berdasarkan Kuantitas)
            </h3>
            <div className="space-y-4">
              {topSellingProducts.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada transaksi lunas untuk dianalisis.</p>
              ) : (
                topSellingProducts.map((p, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-gray-700">
                      <span>{p.name}</span>
                      <span className="text-gray-500">{p.qty} pcs terjual (Rp {p.sales.toLocaleString()})</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#e28743] h-full rounded-full" 
                        style={{ width: `${Math.min(100, (p.qty / Math.max(...topSellingProducts.map(x => x.qty))) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Info Sistem Keamanan
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Sistem terhubung langsung ke **iPaymu Sandbox** untuk pemrosesan API. Semua konfigurasi tersimpan aman di file `.env` sistem.
              </p>
            </div>
            <div className="bg-emerald-50 text-[#2e7d32] p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3 mt-4">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black uppercase tracking-wider">iPaymu SDK Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-colors ${
            activeTab === 'orders'
              ? 'border-[#e28743] text-[#e28743]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Daftar Pesanan ({filteredOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-colors ${
            activeTab === 'inventory'
              ? 'border-[#e28743] text-[#e28743]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Kelola Produk &amp; Varian ({filteredProducts.length})
        </button>
      </div>

      {/* TAB 1: Orders Management */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          
          {/* Orders Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari ID, nama pembeli, telp..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-[#2d2218] pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
              />
            </div>

            {/* Pay status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Bayar:</span>
              <select
                value={orderPayFilter}
                onChange={(e) => setOrderPayFilter(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">PENDING</option>
                <option value="paid">PAID</option>
                <option value="failed">FAILED</option>
              </select>
            </div>

            {/* Shipping status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Kirim:</span>
              <select
                value={orderShipFilter}
                onChange={(e) => setOrderShipFilter(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
              >
                <option value="all">Semua Pengiriman</option>
                <option value="packing">DIKEMAS</option>
                <option value="shipping">DIKIRIM</option>
                <option value="completed">SELESAI</option>
              </select>
            </div>

          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold">Tidak ditemukan pesanan yang sesuai filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf9f6] border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                      <th className="px-6 py-4">ID Invoice</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Total &amp; Metode</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-[#2d2218]">
                    {filteredOrders.map((order: Order) => (
                      <tr key={order.id} className="hover:bg-[#faf9f6]/30 transition-colors">
                        {/* ID / Date */}
                        <td className="px-6 py-4 space-y-1">
                          <span className="font-extrabold text-[#7b2cbf] text-xs block">{order.id}</span>
                          <span className="text-xs text-gray-400 block font-medium">
                            {new Date(order.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </td>

                        {/* Customer Info */}
                        <td className="px-6 py-4 space-y-1">
                          <span className="font-bold block">{order.customer.name}</span>
                          <span className="text-xs text-gray-500 block">{order.customer.phone}</span>
                        </td>

                        {/* Total amount & Method */}
                        <td className="px-6 py-4 space-y-1">
                          <span className="font-black text-gray-700 block">Rp {order.totalAmount.toLocaleString()}</span>
                          <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                            {order.paymentMethod}
                          </span>
                        </td>

                        {/* Dual Status selectors */}
                        <td className="px-6 py-4 space-y-2">
                          {/* Payment status dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-400 font-bold w-10">Bayar:</span>
                            <select
                              value={order.paymentStatus}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value as 'pending' | 'paid' | 'failed')}
                              className={`text-xs font-extrabold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                order.paymentStatus === 'paid'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : order.paymentStatus === 'failed'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <option value="pending">PENDING</option>
                              <option value="paid">PAID</option>
                              <option value="failed">FAILED</option>
                            </select>
                          </div>

                          {/* Shipping status dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-400 font-bold w-10">Kirim:</span>
                            <select
                              value={order.deliveryStatus}
                              onChange={(e) => updateDeliveryStatus(order.id, e.target.value as 'packing' | 'shipping' | 'completed')}
                              className={`text-xs font-extrabold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                order.deliveryStatus === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : order.deliveryStatus === 'shipping'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}
                            >
                              <option value="packing">DIKEMAS</option>
                              <option value="shipping">DIKIRIM</option>
                              <option value="completed">SELESAI</option>
                            </select>
                          </div>
                        </td>

                        {/* Inspect action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedOrderForInspect(order)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-150 rounded-lg text-gray-500 hover:text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                            title="Detail Faktur"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Inventory Management */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          
          {/* Inventory Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama krupuk, deskripsi..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-[#2d2218] pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Kategori:</span>
              <select
                value={productCatFilter}
                onChange={(e) => setProductCatFilter(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
              >
                <option value="all">Semua Kategori</option>
                <option value="Krupuk Ikan">Krupuk Ikan</option>
                <option value="Krupuk Jengkol">Krupuk Jengkol</option>
                <option value="Krupuk Bawang">Krupuk Bawang</option>
                <option value="Hampers">Paket Hampers</option>
              </select>
            </div>
          </div>

          {/* Products Catalog Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf9f6] border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4 w-12 text-center">Unggulan</th>
                    <th className="px-6 py-4">Produk</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Kemasan &amp; Stok</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-[#2d2218]">
                  {filteredProducts.map((product: Product) => (
                    <tr key={product.id} className="hover:bg-[#faf9f6]/30 transition-colors">
                      {/* Featured star toggle */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleFeatured(product.id)}
                          className="focus:outline-none cursor-pointer animate-none"
                        >
                          <Star 
                            className={`w-5 h-5 transition-colors ${
                              product.isFeatured 
                                ? 'text-[#e28743] fill-[#e28743]' 
                                : 'text-gray-300 hover:text-gray-400'
                            }`} 
                          />
                        </button>
                      </td>

                      {/* Product details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-12 h-12 object-cover rounded-lg bg-gray-50 border border-gray-100"
                          />
                          <div>
                            <span className="font-bold block text-sm">{product.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium block">
                              Total Stok: {product.stock} pcs
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                        {product.category || '-'}
                      </td>

                      {/* Variant packages list */}
                      <td className="px-6 py-4">
                        <div className="space-y-2 py-1">
                          {product.variants.map((v) => (
                            <div key={v.id} className="flex items-center justify-between gap-4 max-w-sm text-xs bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <span className="font-semibold text-gray-700">{v.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">Stok:</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stock}
                                  onChange={(e) => updateVariantStock(product.id, v.id, Number(e.target.value))}
                                  className="w-16 text-center font-bold bg-white border border-gray-200 rounded-md py-1 px-1.5 focus:outline-none focus:border-[#e28743]"
                                />
                                {v.stock <= 5 && (
                                  <div title="Stok Kritis!">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* CRUD Edit / Delete Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleOpenEditForm(product)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer transition-colors"
                            title="Edit Produk"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProductClick(product.id, product.name)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 1: Order detailed invoice inspector */}
      {selectedOrderForInspect && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6]">
              <div>
                <h3 className="text-md font-bold text-[#2d2218] font-serif">Invoice Detail</h3>
                <span className="text-[10px] text-gray-400 font-extrabold">{selectedOrderForInspect.id}</span>
              </div>
              <button 
                onClick={() => setSelectedOrderForInspect(null)} 
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Customer summary */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mb-1">Penerima</span>
                  <span className="font-extrabold text-gray-700 block">{selectedOrderForInspect.customer.name}</span>
                  <span className="text-gray-500 block mt-0.5">{selectedOrderForInspect.customer.phone}</span>
                  <span className="text-gray-400 block mt-0.5">{selectedOrderForInspect.customer.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider mb-1">Alamat Kirim</span>
                  <span className="font-semibold text-gray-600 block leading-relaxed">{selectedOrderForInspect.customer.address}</span>
                </div>
              </div>

              {/* Items Purchased List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Item Yang Dipesan</h4>
                <div className="divide-y divide-gray-150 border border-gray-100 rounded-xl overflow-hidden">
                  {selectedOrderForInspect.items.map((item) => {
                    const price = item.selectedVariant.discountPrice !== null 
                      ? item.selectedVariant.discountPrice 
                      : item.selectedVariant.price;
                    return (
                      <div key={item.id} className="flex justify-between items-center p-3.5 text-xs bg-white">
                        <div>
                          <span className="font-bold text-gray-800 block">{item.product.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{item.selectedVariant.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-gray-700 block">Rp {price.toLocaleString()}</span>
                          <span className="text-gray-400 font-medium block text-[10px] mt-0.5">x{item.quantity}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals & Metadata */}
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Metode Pembayaran: <strong className="text-gray-700 uppercase">{selectedOrderForInspect.paymentMethod}</strong></span>
                  <span className="text-gray-400 block font-medium mt-0.5">Waktu Transaksi: <strong className="text-gray-700">{new Date(selectedOrderForInspect.createdAt).toLocaleString('id-ID')}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block font-bold">Total Tagihan</span>
                  <span className="text-lg font-black text-[#7b2cbf] block">Rp {selectedOrderForInspect.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Editable Status within inspector */}
              <div className="border-t border-gray-150 pt-4 space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Perbarui Status Pesanan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Status Pembayaran</label>
                    <select
                      value={selectedOrderForInspect.paymentStatus}
                      onChange={(e) => {
                        updateOrderStatus(selectedOrderForInspect.id, e.target.value as 'pending' | 'paid' | 'failed');
                        // update reference object in local state to refresh UI
                        setSelectedOrderForInspect({ ...selectedOrderForInspect, paymentStatus: e.target.value as any });
                      }}
                      className="w-full bg-[#faf9f6] text-xs font-bold text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                    >
                      <option value="pending">PENDING</option>
                      <option value="paid">PAID</option>
                      <option value="failed">FAILED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Status Pengiriman</label>
                    <select
                      value={selectedOrderForInspect.deliveryStatus}
                      onChange={(e) => {
                        updateDeliveryStatus(selectedOrderForInspect.id, e.target.value as 'packing' | 'shipping' | 'completed');
                        // update reference object in local state to refresh UI
                        setSelectedOrderForInspect({ ...selectedOrderForInspect, deliveryStatus: e.target.value as any });
                      }}
                      className="w-full bg-[#faf9f6] text-xs font-bold text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                    >
                      <option value="packing">DIKEMAS (PACKING)</option>
                      <option value="shipping">DIKIRIM (SHIPPING)</option>
                      <option value="completed">SELESAI (COMPLETED)</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-4 bg-[#faf9f6] text-right">
              <button
                onClick={() => setSelectedOrderForInspect(null)}
                className="px-5 py-2.5 bg-[#2d2218] hover:bg-gray-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Tutup Invoice
              </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP 2: Add or Edit Product Form */}
      {isAddFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6]">
              <h3 className="text-lg font-bold text-[#2d2218] font-serif">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h3>
              <button 
                onClick={() => setIsAddFormOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Krupuk Kemplang Asli"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Deskripsi Produk</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Deskripsikan kerenyahan dan bahan dasar pembuatannya..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] resize-none"
                />
              </div>

              {/* Grid: Category & Image Preset */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori</label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none cursor-pointer"
                  >
                    <option value="Krupuk Ikan">Krupuk Ikan</option>
                    <option value="Krupuk Jengkol">Krupuk Jengkol</option>
                    <option value="Krupuk Bawang">Krupuk Bawang</option>
                    <option value="Hampers">Paket Hampers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Preset Foto</label>
                  <select
                    value={formImg}
                    onChange={(e) => setFormImg(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none cursor-pointer"
                  >
                    <option value="/krupuk_tenggiri.png">Krupuk Tenggiri</option>
                    <option value="/krupuk_jengkol.png">Krupuk Jengkol</option>
                    <option value="/krupuk_bawang.png">Krupuk Bawang</option>
                    <option value="/krupuk_hampers.png">Hampers Paket</option>
                  </select>
                </div>
              </div>

              {/* Product Variants Inputs */}
              <div className="border-t border-gray-100 pt-4 mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Varian Ukuran / Kemasan
                  </h4>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-xs font-bold text-[#e28743] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Tambah Varian
                  </button>
                </div>

                <div className="space-y-3">
                  {formVariants.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 relative"
                    >
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(index)}
                          className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Hapus Varian"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Nama Varian</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Paket 500 Gram"
                            value={item.name}
                            onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Stok Awal</label>
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="10"
                            value={item.stock}
                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Harga Dasar (Rp)</label>
                          <input
                            type="number"
                            min="1000"
                            required
                            placeholder="80000"
                            value={item.price}
                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Harga Promo (Rp - Opsional)</label>
                          <input
                            type="number"
                            min="1000"
                            placeholder="Masukkan harga promo"
                            value={item.discountPrice}
                            onChange={(e) => handleVariantChange(index, 'discountPrice', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Footer */}
              <div className="border-t border-gray-100 pt-5 flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddFormOpen(false)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
