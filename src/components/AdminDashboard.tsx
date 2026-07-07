import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import type { Order, Product, ProductVariant } from '../types';
import { ClipboardList, DollarSign, AlertTriangle, ArrowLeft, Star, PlusCircle, Trash, X } from 'lucide-react';

export interface AdminDashboardProps {
  onBackToCatalog: () => void;
}

interface NewVariantInput {
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
    toggleFeatured
  } = useCartStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // New Product Form States
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductCat, setNewProductCat] = useState('Krupuk Ikan');
  const [newProductImg, setNewProductImg] = useState('/krupuk_tenggiri.png');
  const [newVariants, setNewVariants] = useState<NewVariantInput[]>([
    { name: 'Paket 1 Kg', price: '120000', discountPrice: '', stock: '10' }
  ]);

  // Stats Calculations
  const totalOrders = orders.length;
  const totalSales = orders
    .filter((o) => o.paymentStatus === 'paid')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Low stock checks for variants
  const lowStockVariantsCount = products.reduce((count, p) => {
    const lowCount = p.variants.filter((v) => v.stock <= 5).length;
    return count + lowCount;
  }, 0);

  // Add variant row in product creator form
  const addVariantInputRow = () => {
    setNewVariants([...newVariants, { name: '', price: '', discountPrice: '', stock: '5' }]);
  };

  const removeVariantInputRow = (index: number) => {
    if (newVariants.length <= 1) return;
    setNewVariants(newVariants.filter((_, i) => i !== index));
  };

  const handleVariantInputChange = (index: number, field: keyof NewVariantInput, value: string) => {
    setNewVariants(
      newVariants.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProductName.trim() || !newProductDesc.trim()) {
      alert('Silakan isi Nama dan Deskripsi produk.');
      return;
    }

    // Validate and format variants list
    const formattedVariants: ProductVariant[] = [];
    for (let i = 0; i < newVariants.length; i++) {
      const v = newVariants[i];
      if (!v.name.trim() || !v.price || Number(v.price) <= 0) {
        alert('Setiap varian wajib memiliki Nama Varian dan Harga yang valid.');
        return;
      }
      formattedVariants.push({
        id: `var-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
        name: v.name,
        price: Number(v.price),
        discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
        stock: Number(v.stock) || 0
      });
    }

    // Fallback base values calculated from variants
    const totalStock = formattedVariants.reduce((sum, v) => sum + v.stock, 0);
    const minPrice = Math.min(...formattedVariants.map((v) => v.price));
    const minDiscount = formattedVariants.some((v) => v.discountPrice !== null)
      ? Math.min(...formattedVariants.map((v) => v.discountPrice ?? Infinity))
      : null;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: newProductName,
      description: newProductDesc,
      imageUrl: newProductImg,
      gallery: [newProductImg],
      originalPrice: minPrice,
      discountPrice: minDiscount === Infinity ? null : minDiscount,
      stock: totalStock,
      category: newProductCat,
      isFeatured: false,
      variants: formattedVariants
    };

    addProduct(newProduct);
    alert(`Produk "${newProductName}" berhasil ditambahkan ke menu catalog!`);

    // Reset Form
    setNewProductName('');
    setNewProductDesc('');
    setNewProductImg('/krupuk_tenggiri.png');
    setNewProductCat('Krupuk Ikan');
    setNewVariants([{ name: 'Paket 1 Kg', price: '120000', discountPrice: '', stock: '10' }]);
    setIsAddFormOpen(false);
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-6 py-8">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-[#2d2218] tracking-tight">Admin Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Ubah inventaris, status pesanan, dan kelola produk unggulan.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddFormOpen(true)}
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        
        {/* KPI 1: Total Sales */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-[#e8f5e9] text-[#2e7d32] rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Penjualan (Paid)</span>
            <span className="text-xl font-black text-[#2e7d32]">Rp {totalSales.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Pesanan</span>
            <span className="text-xl font-black text-blue-600">{totalOrders} Transaksi</span>
          </div>
        </div>

        {/* KPI 3: Low Stock Alert */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockVariantsCount > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Varian Kritis (Stok &le; 5)</span>
            <span className={`text-xl font-black ${lowStockVariantsCount > 0 ? 'text-red-500 font-extrabold' : 'text-gray-700'}`}>
              {lowStockVariantsCount} Varian
            </span>
          </div>
        </div>

      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-colors ${
            activeTab === 'orders'
              ? 'border-[#e28743] text-[#e28743]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Daftar Pesanan ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-colors ${
            activeTab === 'inventory'
              ? 'border-[#e28743] text-[#e28743]'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Kelola Produk & Varian ({products.length})
        </button>
      </div>

      {/* TAB CONTENT: Orders Management */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold">Belum ada pesanan masuk.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf9f6] border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4">ID Invoice</th>
                    <th className="px-6 py-4">Informasi Customer</th>
                    <th className="px-6 py-4">Item & Varian</th>
                    <th className="px-6 py-4">Total & Metode</th>
                    <th className="px-6 py-4">Status Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-[#2d2218]">
                  {orders.map((order: Order) => (
                    <tr key={order.id} className="hover:bg-[#faf9f6]/30 transition-colors">
                      {/* ID / Date */}
                      <td className="px-6 py-4 space-y-1">
                        <span className="font-extrabold text-[#7b2cbf] text-xs block">{order.id}</span>
                        <span className="text-xs text-gray-400 block font-medium">
                          {new Date(order.createdAt).toLocaleDateString('id-ID')} {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="px-6 py-4 space-y-1">
                        <span className="font-bold block">{order.customer.name}</span>
                        <span className="text-xs text-gray-500 block">{order.customer.phone}</span>
                        <span className="text-[11px] text-gray-400 block line-clamp-1 max-w-[180px]" title={order.customer.address}>
                          {order.customer.address}
                        </span>
                      </td>

                      {/* Purchased Items */}
                      <td className="px-6 py-4 text-xs font-medium space-y-1 max-w-[200px]">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between gap-4">
                            <span className="text-gray-600 truncate">{item.product.name} ({item.selectedVariant.name})</span>
                            <span className="text-gray-500 font-bold">x{item.quantity}</span>
                          </div>
                        ))}
                      </td>

                      {/* Amount & Method */}
                      <td className="px-6 py-4 space-y-1">
                        <span className="font-black text-gray-700 block">Rp {order.totalAmount.toLocaleString()}</span>
                        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                          {order.paymentMethod}
                        </span>
                      </td>

                      {/* Dual Status Selectors (Payment and Delivery) */}
                      <td className="px-6 py-4 space-y-2">
                        {/* Payment Status Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold w-12">Bayar:</span>
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

                        {/* Delivery Status Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-bold w-12">Kirim:</span>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Inventory Management & Customizer */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf9f6] border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="px-6 py-4 w-12">Unggulan</th>
                  <th className="px-6 py-4">Nama Produk</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Daftar Paket / Varian &amp; Pengaturan Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-[#2d2218]">
                {products.map((product: Product) => (
                  <tr key={product.id} className="hover:bg-[#faf9f6]/30 transition-colors">
                    {/* Featured star toggle */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleFeatured(product.id)}
                        className="focus:outline-none cursor-pointer"
                        title={product.isFeatured ? "Hapus dari Unggulan" : "Jadikan Produk Unggulan"}
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

                    {/* Product Name & Photo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-12 h-12 object-cover rounded-lg bg-gray-50 border border-gray-100"
                        />
                        <div>
                          <span className="font-bold block">{product.name}</span>
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

                    {/* Package variants stock management */}
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

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPUP PANEL: Add New Product Form */}
      {isAddFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fade-in">
            
            {/* Form Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6]">
              <h3 className="text-lg font-bold text-[#2d2218]">Tambah Produk Baru</h3>
              <button 
                onClick={() => setIsAddFormOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nama Produk</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Krupuk Kemplang Asli"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
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
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] resize-none"
                />
              </div>

              {/* Grid: Category & Image Preset */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori</label>
                  <select
                    value={newProductCat}
                    onChange={(e) => setNewProductCat(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
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
                    value={newProductImg}
                    onChange={(e) => setNewProductImg(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none"
                  >
                    <option value="/krupuk_tenggiri.png">Krupuk Tenggiri</option>
                    <option value="/krupuk_jengkol.png">Krupuk Jengkol</option>
                    <option value="/krupuk_bawang.png">Krupuk Bawang</option>
                    <option value="/krupuk_hampers.png">Hampers Paket</option>
                  </select>
                </div>
              </div>

              {/* Product variants packages inputs list */}
              <div className="border-t border-gray-100 pt-4 mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Varian Ukuran / Kemasan
                  </h4>
                  <button
                    type="button"
                    onClick={addVariantInputRow}
                    className="text-xs font-bold text-[#e28743] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    + Tambah Varian
                  </button>
                </div>

                <div className="space-y-3">
                  {newVariants.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 relative"
                    >
                      {newVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantInputRow(index)}
                          className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 cursor-pointer"
                          title="Hapus Varian"
                        >
                          <Trash className="w-4 h-4" />
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
                            onChange={(e) => handleVariantInputChange(index, 'name', e.target.value)}
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
                            onChange={(e) => handleVariantInputChange(index, 'stock', e.target.value)}
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
                            onChange={(e) => handleVariantInputChange(index, 'price', e.target.value)}
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
                            onChange={(e) => handleVariantInputChange(index, 'discountPrice', e.target.value)}
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
                  Simpan Produk
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
