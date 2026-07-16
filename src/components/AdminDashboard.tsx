import React, { useState, useMemo } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useFinancialStore } from '../store/useFinancialStore';
import type { Order, Product, ProductVariant } from '../types';
import { 
  ClipboardList, DollarSign, AlertTriangle, ArrowLeft, Star, PlusCircle, 
  X, Search, Eye, Edit, Trash2, TrendingUp, Package, ShieldCheck,
  Wallet, Receipt, FileText, PieChart, ArrowUpRight, ArrowDownRight,
  Download, Printer, Plus, BarChart3
} from 'lucide-react';
import { ReceiptPrinter } from './ReceiptPrinter';

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

// Helpers
const formatRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
const formatDateTime = (iso: string) => new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const EXPENSE_LABELS: Record<string, string> = {
  bahan_baku: 'Bahan Baku',
  operasional: 'Operasional',
  gaji: 'Gaji Karyawan',
  pengiriman: 'Ongkos Kirim',
  lainnya: 'Lainnya',
};

const EXPENSE_COLORS: Record<string, string> = {
  bahan_baku: '#e28743',
  operasional: '#2563eb',
  gaji: '#7b2cbf',
  pengiriman: '#0891b2',
  lainnya: '#6b7280',
};

type TabKey = 'overview' | 'orders' | 'inventory' | 'finance' | 'expenses' | 'receipts';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToCatalog }) => {
  const { 
    orders, products, 
    updateOrderStatus, updateDeliveryStatus, updateVariantStock,
    addProduct, deleteProduct, updateProduct, toggleFeatured
  } = useCartStore();

  const financial = useFinancialStore();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  
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
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Finance tab states
  const [financeTypeFilter, setFinanceTypeFilter] = useState<string>('all');
  const [financeDateStart, setFinanceDateStart] = useState('');
  const [financeDateEnd, setFinanceDateEnd] = useState('');

  // Expense form states
  const [expCategory, setExpCategory] = useState<string>('bahan_baku');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  // Product Form Fields States
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('Krupuk Ikan');
  const [formImg, setFormImg] = useState('/krupuk_tenggiri.png');
  const [formVariants, setFormVariants] = useState<NewVariantInput[]>([
    { name: 'Paket 1 Kg', price: '120000', discountPrice: '', stock: '10' }
  ]);

  // ===== Analytics calculations =====
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalSales = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingShipmentsCount = paidOrders.filter(
    (o) => o.deliveryStatus === 'packing' || o.deliveryStatus === 'shipping'
  ).length;
  const lowStockVariantsCount = products.reduce((count, p) => {
    return count + p.variants.filter((v) => v.stock <= 5).length;
  }, 0);

  // Today's stats
  const todayStr = new Date().toISOString().substring(0, 10);
  const yesterdayStr = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().substring(0, 10); })();
  const todayIncome = financial.getTotalIncome(todayStr, todayStr);
  const yesterdayIncome = financial.getTotalIncome(yesterdayStr, yesterdayStr);
  const incomeChange = yesterdayIncome > 0 ? ((todayIncome - yesterdayIncome) / yesterdayIncome * 100) : 0;

  const monthStart = todayStr.substring(0, 7) + '-01';
  const monthIncome = financial.getTotalIncome(monthStart, todayStr);
  const monthExpense = financial.getTotalExpense(monthStart, todayStr);
  const monthProfit = monthIncome - monthExpense;

  // Daily stats for chart
  const dailyStats = financial.getDailyStats(14);

  // Top selling products
  const productSalesMap = useMemo(() => {
    const map: Record<string, { name: string; qty: number; sales: number }> = {};
    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const p = item.selectedVariant.discountPrice !== null 
          ? item.selectedVariant.discountPrice 
          : item.selectedVariant.price;
        if (!map[item.product.id]) {
          map[item.product.id] = { name: item.product.name, qty: 0, sales: 0 };
        }
        map[item.product.id].qty += item.quantity;
        map[item.product.id].sales += p * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [paidOrders]);

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

  // Financial transactions (filtered)
  const filteredTransactions = financial.getTransactions({
    type: financeTypeFilter !== 'all' ? financeTypeFilter : undefined,
    startDate: financeDateStart || undefined,
    endDate: financeDateEnd || undefined,
  });

  // Expense categories
  const expensesByCategory = financial.getExpensesByCategory();

  // ===== Product form handlers =====
  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setFormName(''); setFormDesc(''); setFormCat('Krupuk Ikan'); setFormImg('/krupuk_tenggiri.png');
    setFormVariants([{ name: 'Paket 1 Kg', price: '120000', discountPrice: '', stock: '10' }]);
    setIsAddFormOpen(true);
  };

  const handleOpenEditForm = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name); setFormDesc(product.description);
    setFormCat(product.category || 'Krupuk Ikan'); setFormImg(product.imageUrl);
    setFormVariants(product.variants.map((v) => ({
      id: v.id, name: v.name, price: String(v.price),
      discountPrice: v.discountPrice !== null ? String(v.discountPrice) : '',
      stock: String(v.stock),
    })));
    setIsAddFormOpen(true);
  };

  const addVariantRow = () => setFormVariants([...formVariants, { name: '', price: '', discountPrice: '', stock: '5' }]);
  const removeVariantRow = (i: number) => { if (formVariants.length <= 1) return; setFormVariants(formVariants.filter((_, idx) => idx !== i)); };
  const handleVariantChange = (i: number, field: keyof NewVariantInput, value: string) => {
    setFormVariants(formVariants.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDesc.trim()) { alert('Nama dan Deskripsi produk wajib diisi.'); return; }
    const formattedVariants: ProductVariant[] = [];
    for (let i = 0; i < formVariants.length; i++) {
      const v = formVariants[i];
      if (!v.name.trim() || !v.price || Number(v.price) <= 0) {
        alert('Setiap varian wajib memiliki Nama dan Harga yang valid.'); return;
      }
      formattedVariants.push({
        id: v.id || `var-${Date.now()}-${i}-${Math.floor(Math.random() * 100)}`,
        name: v.name, price: Number(v.price),
        discountPrice: v.discountPrice ? Number(v.discountPrice) : null,
        stock: Number(v.stock) || 0
      });
    }
    const totalStock = formattedVariants.reduce((s, v) => s + v.stock, 0);
    const minPrice = Math.min(...formattedVariants.map((v) => v.price));
    const minDiscount = formattedVariants.some((v) => v.discountPrice !== null)
      ? Math.min(...formattedVariants.map((v) => v.discountPrice ?? Infinity)) : null;

    const base = {
      name: formName, description: formDesc, imageUrl: formImg, gallery: [formImg],
      originalPrice: minPrice, discountPrice: minDiscount === Infinity ? null : minDiscount,
      stock: totalStock, category: formCat, variants: formattedVariants
    };

    if (editingProduct) { updateProduct(editingProduct.id, base); }
    else { addProduct({ id: `prod-${Date.now()}`, isFeatured: false, ...base }); }
    setIsAddFormOpen(false);
  };

  const handleDeleteProductClick = (id: string, name: string) => {
    if (confirm(`Hapus produk "${name}"?`)) deleteProduct(id);
  };

  // ===== Expense submit =====
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount || Number(expAmount) <= 0) { alert('Deskripsi dan Jumlah wajib diisi.'); return; }
    financial.addExpense({
      category: expCategory as any,
      description: expDesc,
      amount: Number(expAmount),
      createdBy: 'admin',
    });
    // Also record as financial transaction
    financial.addTransaction({
      orderId: null,
      type: 'expense',
      category: expCategory,
      description: expDesc,
      amount: Number(expAmount),
      paymentMethod: 'cash',
      referenceNumber: '',
      createdBy: 'admin',
    });
    setExpDesc(''); setExpAmount('');
  };

  // ===== CSV Export =====
  const handleExportCSV = () => {
    const header = 'Tanggal,Tipe,Kategori,Deskripsi,Jumlah,Metode Bayar,Referensi\n';
    const rows = filteredTransactions.map((tx) =>
      `${formatDate(tx.createdAt)},${tx.type},${tx.category},"${tx.description}",${tx.amount},${tx.paymentMethod},${tx.referenceNumber}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `laporan-keuangan-${todayStr}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ===== TAB DEFINITIONS =====
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: 'Ringkasan', icon: <PieChart className="w-4 h-4" /> },
    { key: 'orders', label: 'Pesanan', icon: <ClipboardList className="w-4 h-4" />, count: filteredOrders.length },
    { key: 'inventory', label: 'Inventaris', icon: <Package className="w-4 h-4" />, count: filteredProducts.length },
    { key: 'finance', label: 'Laporan', icon: <FileText className="w-4 h-4" /> },
    { key: 'expenses', label: 'Pengeluaran', icon: <Wallet className="w-4 h-4" /> },
    { key: 'receipts', label: 'Resi & Struk', icon: <Receipt className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#2d2218] tracking-tight font-serif">Dashboard Keuangan</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Kelola pesanan, keuangan, inventaris, dan cetak resi.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleOpenAddForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer shadow-xs">
            <PlusCircle className="w-4 h-4" /> Tambah Produk
          </button>
          <button onClick={onBackToCatalog}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2d2218] hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-6 pb-px">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs border-b-[2.5px] cursor-pointer transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[#e28743] text-[#e28743]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                activeTab === tab.key ? 'bg-orange-100 text-[#e28743]' : 'bg-gray-100 text-gray-500'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ================= TAB: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Income */}
            <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-50 text-[#2e7d32] rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                {incomeChange !== 0 && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-extrabold px-2 py-1 rounded-lg ${
                    incomeChange > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {incomeChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(incomeChange).toFixed(0)}%
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Omset Hari Ini</span>
              <span className="text-xl font-black text-[#2e7d32]">{formatRp(todayIncome)}</span>
            </div>

            {/* Monthly Income */}
            <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Omset Bulan Ini</span>
              <span className="text-xl font-black text-blue-600">{formatRp(monthIncome)}</span>
            </div>

            {/* Net Profit */}
            <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${monthProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Laba Bersih Bulan Ini</span>
              <span className={`text-xl font-black ${monthProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatRp(monthProfit)}</span>
            </div>

            {/* Quick Stats */}
            <div className="kpi-card bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-orange-50 text-[#e28743] rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Pesanan</span>
              <span className="text-xl font-black text-[#2d2218]">{orders.length} <span className="text-sm font-bold text-gray-400">transaksi</span></span>
            </div>
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Omset (Lunas)</span>
              <span className="text-sm font-black text-[#2e7d32]">{formatRp(totalSales)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Pengeluaran Bulan Ini</span>
              <span className="text-sm font-black text-red-500">{formatRp(monthExpense)}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Antrean Kirim</span>
              <span className={`text-sm font-black ${pendingShipmentsCount > 0 ? 'text-amber-600' : 'text-gray-500'}`}>{pendingShipmentsCount} Paket</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs text-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Varian Kritis (≤5)</span>
              <span className={`text-sm font-black ${lowStockVariantsCount > 0 ? 'text-red-500' : 'text-gray-500'}`}>{lowStockVariantsCount} Varian</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#e28743]" /> Tren Pendapatan 14 Hari Terakhir
              </h3>
              {dailyStats.length > 0 ? (
                <div className="space-y-2">
                  {dailyStats.slice(-7).map((day, i) => {
                    const maxVal = Math.max(...dailyStats.slice(-7).map(d => Math.max(d.income, d.expense)), 1);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                          <span>{new Date(day.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                          <span>{formatRp(day.income)}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#e28743] h-full rounded-full transition-all duration-700" 
                            style={{ width: `${Math.min(100, (day.income / maxVal) * 100)}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Belum ada data pendapatan.</p>
              )}
            </div>

            {/* Top Selling */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#e28743] fill-[#e28743]" /> Produk Terlaris
              </h3>
              {productSalesMap.length > 0 ? (
                <div className="space-y-3">
                  {productSalesMap.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-orange-50 text-[#e28743] rounded-lg flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-gray-700 block truncate">{p.name}</span>
                        <span className="text-[10px] text-gray-400">{p.qty} terjual</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#2e7d32]">{formatRp(p.sales)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Belum ada data penjualan.</p>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-gray-700 block">Sistem Terhubung</span>
                <span className="text-[10px] text-gray-400">iPaymu SDK Active • Data tersimpan di localStorage</span>
              </div>
            </div>
            <div className="bg-emerald-50 text-[#2e7d32] px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB: ORDERS ================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fade-in">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Cari ID, nama, telepon..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-[#2d2218] pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Bayar:</span>
              <select value={orderPayFilter} onChange={(e) => setOrderPayFilter(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none">
                <option value="all">Semua Status</option>
                <option value="pending">PENDING</option>
                <option value="paid">PAID</option>
                <option value="failed">FAILED</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Kirim:</span>
              <select value={orderShipFilter} onChange={(e) => setOrderShipFilter(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none">
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
                <p className="text-sm font-semibold">Tidak ditemukan pesanan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf9f6] border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                      <th className="px-5 py-3.5">Invoice</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Total</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-[#2d2218]">
                    {filteredOrders.map((order: Order) => (
                      <tr key={order.id} className="hover:bg-[#faf9f6]/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-extrabold text-[#7b2cbf] text-xs block">{order.id}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{formatDate(order.createdAt)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold block text-sm">{order.customer.name}</span>
                          <span className="text-xs text-gray-500">{order.customer.phone}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-black text-gray-700 block">{formatRp(order.totalAmount)}</span>
                          <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">{order.paymentMethod}</span>
                        </td>
                        <td className="px-5 py-3.5 space-y-1.5">
                          <select value={order.paymentStatus} onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                            className={`text-xs font-extrabold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer w-full ${
                              order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                              order.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            <option value="pending">PENDING</option>
                            <option value="paid">PAID</option>
                            <option value="failed">FAILED</option>
                          </select>
                          <select value={order.deliveryStatus} onChange={(e) => updateDeliveryStatus(order.id, e.target.value as any)}
                            className={`text-xs font-extrabold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer w-full ${
                              order.deliveryStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              order.deliveryStatus === 'shipping' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-orange-50 text-orange-700 border-orange-200'}`}>
                            <option value="packing">DIKEMAS</option>
                            <option value="shipping">DIKIRIM</option>
                            <option value="completed">SELESAI</option>
                          </select>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex gap-1.5 justify-center">
                            <button onClick={() => setSelectedOrderForInspect(order)}
                              className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 border border-gray-200 transition-colors cursor-pointer" title="Detail">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setReceiptOrder(order)}
                              className="p-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg text-[#e28743] border border-orange-200 transition-colors cursor-pointer" title="Cetak Resi">
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ================= TAB: INVENTORY ================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Cari nama, deskripsi..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-[#2d2218] pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-bold whitespace-nowrap">Kategori:</span>
              <select value={productCatFilter} onChange={(e) => setProductCatFilter(e.target.value)}
                className="w-full bg-[#faf9f6] text-xs text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none">
                <option value="all">Semua</option>
                <option value="Krupuk Ikan">Krupuk Ikan</option>
                <option value="Krupuk Jengkol">Krupuk Jengkol</option>
                <option value="Krupuk Bawang">Krupuk Bawang</option>
                <option value="Hampers">Hampers</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf9f6] border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-5 py-3.5 w-12 text-center">★</th>
                    <th className="px-5 py-3.5">Produk</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5">Kemasan & Stok</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-[#2d2218]">
                  {filteredProducts.map((product: Product) => (
                    <tr key={product.id} className="hover:bg-[#faf9f6]/50 transition-colors">
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => toggleFeatured(product.id)} className="focus:outline-none cursor-pointer">
                          <Star className={`w-5 h-5 transition-colors ${product.isFeatured ? 'text-[#e28743] fill-[#e28743]' : 'text-gray-300 hover:text-gray-400'}`} />
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-lg bg-gray-50 border border-gray-100" />
                          <div>
                            <span className="font-bold block text-sm">{product.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium">Stok: {product.stock}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-gray-400 uppercase">{product.category || '-'}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-1.5">
                          {product.variants.map((v) => (
                            <div key={v.id} className="flex items-center justify-between gap-3 max-w-xs text-xs bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                              <span className="font-semibold text-gray-700 truncate">{v.name}</span>
                              <div className="flex items-center gap-1.5">
                                <input type="number" min="0" value={v.stock} onChange={(e) => updateVariantStock(product.id, v.id, Number(e.target.value))}
                                  className="w-14 text-center font-bold bg-white border border-gray-200 rounded-md py-1 px-1 text-xs focus:outline-none focus:border-[#e28743]" />
                                {v.stock <= 5 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button onClick={() => handleOpenEditForm(product)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 cursor-pointer transition-colors" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteProductClick(product.id, product.name)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 cursor-pointer transition-colors" title="Hapus">
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

      {/* ================= TAB: FINANCE (Laporan) ================= */}
      {activeTab === 'finance' && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Total Pemasukan</span>
              <span className="text-lg font-black text-[#2e7d32]">{formatRp(
                filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
              )}</span>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <span className="text-[10px] font-bold text-red-600 uppercase block mb-1">Total Pengeluaran</span>
              <span className="text-lg font-black text-red-600">{formatRp(
                filteredTransactions.filter(t => t.type === 'expense' || t.type === 'refund').reduce((s, t) => s + t.amount, 0)
              )}</span>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">Saldo Bersih</span>
              <span className="text-lg font-black text-blue-600">{formatRp(
                filteredTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
              )}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-xs items-end">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipe</label>
              <select value={financeTypeFilter} onChange={(e) => setFinanceTypeFilter(e.target.value)}
                className="bg-[#faf9f6] text-xs text-gray-600 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none">
                <option value="all">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
                <option value="refund">Refund</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Dari Tanggal</label>
              <input type="date" value={financeDateStart} onChange={(e) => setFinanceDateStart(e.target.value)}
                className="bg-[#faf9f6] text-xs text-gray-600 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sampai Tanggal</label>
              <input type="date" value={financeDateEnd} onChange={(e) => setFinanceDateEnd(e.target.value)}
                className="bg-[#faf9f6] text-xs text-gray-600 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none" />
            </div>
            <button onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2d2218] hover:bg-gray-800 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors ml-auto">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-semibold">Belum ada transaksi tercatat.</p>
                <p className="text-xs text-gray-400 mt-1">Transaksi akan tercatat otomatis saat ada order masuk atau pengeluaran ditambahkan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#faf9f6] border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Deskripsi</th>
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5">Tipe</th>
                      <th className="px-5 py-3.5 text-right">Jumlah</th>
                      <th className="px-5 py-3.5">Metode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#faf9f6]/50 transition-colors">
                        <td className="px-5 py-3 text-xs text-gray-500 font-medium">{formatDateTime(tx.createdAt)}</td>
                        <td className="px-5 py-3 text-xs font-medium text-gray-700 max-w-[200px] truncate">{tx.description}</td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">{tx.category}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                            tx.type === 'income' ? 'bg-green-50 text-green-700 border border-green-200' :
                            tx.type === 'expense' ? 'bg-red-50 text-red-600 border border-red-200' :
                            'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>{tx.type === 'income' ? 'MASUK' : tx.type === 'expense' ? 'KELUAR' : 'REFUND'}</span>
                        </td>
                        <td className={`px-5 py-3 text-xs font-black text-right ${tx.type === 'income' ? 'text-[#2e7d32]' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatRp(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase">{tx.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB: EXPENSES ================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expense Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#e28743]" /> Tambah Pengeluaran
              </h3>
              <form onSubmit={handleExpenseSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Kategori</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-[#faf9f6] text-xs text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none">
                    <option value="bahan_baku">🥚 Bahan Baku</option>
                    <option value="operasional">⚙️ Operasional</option>
                    <option value="gaji">👤 Gaji Karyawan</option>
                    <option value="pengiriman">🚚 Ongkos Kirim</option>
                    <option value="lainnya">📦 Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Deskripsi</label>
                  <input type="text" placeholder="Contoh: Beli tepung 50kg" value={expDesc} onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full bg-[#faf9f6] text-xs text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743]" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Jumlah (Rp)</label>
                  <input type="number" min="1000" placeholder="50000" value={expAmount} onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-[#faf9f6] text-xs text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743]" required />
                </div>
                <button type="submit"
                  className="w-full py-2.5 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors">
                  Simpan Pengeluaran
                </button>
              </form>
            </div>

            {/* Expense Summary by Category */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Ringkasan Per Kategori</h3>
              {expensesByCategory.length === 0 ? (
                <p className="text-xs text-gray-400">Belum ada pengeluaran tercatat.</p>
              ) : (
                <div className="space-y-3">
                  {expensesByCategory.map((cat) => {
                    const maxAmount = Math.max(...expensesByCategory.map(c => c.total), 1);
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: EXPENSE_COLORS[cat.category] || '#6b7280' }}></div>
                            <span className="font-bold text-gray-700">{EXPENSE_LABELS[cat.category] || cat.category}</span>
                          </div>
                          <span className="font-extrabold text-gray-600">{formatRp(cat.total)} <span className="text-gray-400 font-medium">({cat.count}x)</span></span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" 
                            style={{ width: `${(cat.total / maxAmount) * 100}%`, backgroundColor: EXPENSE_COLORS[cat.category] || '#6b7280' }}></div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between text-xs font-black">
                    <span className="text-gray-500 uppercase">Total Pengeluaran</span>
                    <span className="text-red-500">{formatRp(expensesByCategory.reduce((s, c) => s + c.total, 0))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-[#faf9f6]">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Riwayat Pengeluaran</h3>
            </div>
            {financial.expenses.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold">Belum ada data pengeluaran.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-gray-500 uppercase border-b border-gray-100">
                      <th className="px-5 py-3">Tanggal</th>
                      <th className="px-5 py-3">Kategori</th>
                      <th className="px-5 py-3">Deskripsi</th>
                      <th className="px-5 py-3 text-right">Jumlah</th>
                      <th className="px-5 py-3 text-center">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {financial.expenses.slice(0, 20).map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#faf9f6]/50 transition-colors">
                        <td className="px-5 py-3 text-gray-500 font-medium">{formatDateTime(exp.createdAt)}</td>
                        <td className="px-5 py-3">
                          <span className="font-bold px-2 py-0.5 rounded text-[10px] text-white" style={{ backgroundColor: EXPENSE_COLORS[exp.category] || '#6b7280' }}>
                            {EXPENSE_LABELS[exp.category] || exp.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-700 font-medium">{exp.description}</td>
                        <td className="px-5 py-3 text-right font-black text-red-500">{formatRp(exp.amount)}</td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => financial.deleteExpense(exp.id)}
                            className="p-1 bg-red-50 text-red-500 hover:bg-red-100 rounded cursor-pointer transition-colors">
                            <Trash2 className="w-3 h-3" />
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

      {/* ================= TAB: RECEIPTS ================= */}
      {activeTab === 'receipts' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#e28743]" /> Cetak Resi Pesanan
            </h3>
            <p className="text-xs text-gray-500 mb-4">Pilih pesanan di bawah untuk melihat preview resi dan mencetaknya.</p>
          </div>

          {/* Orders for Receipt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.slice(0, 12).map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer group"
                onClick={() => setReceiptOrder(order)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold text-[#7b2cbf]">{order.id}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                    order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' :
                    order.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>{order.paymentStatus.toUpperCase()}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#2d2218] block">{order.customer.name}</span>
                  <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm font-black text-[#2d2218]">{formatRp(order.totalAmount)}</span>
                  <span className="text-[10px] font-bold text-[#e28743] group-hover:underline flex items-center gap-1">
                    <Printer className="w-3 h-3" /> Cetak Resi
                  </span>
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-xs text-center text-gray-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-semibold">Belum ada pesanan.</p>
              <p className="text-xs mt-1">Resi akan tersedia setelah ada pesanan masuk.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= POPUP: Order Inspector ================= */}
      {selectedOrderForInspect && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6]">
              <div>
                <h3 className="text-md font-bold text-[#2d2218] font-serif">Invoice Detail</h3>
                <span className="text-[10px] text-gray-400 font-extrabold">{selectedOrderForInspect.id}</span>
              </div>
              <button onClick={() => setSelectedOrderForInspect(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
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
              <div className="space-y-2">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Item Yang Dipesan</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {selectedOrderForInspect.items.map((item) => {
                    const price = item.selectedVariant.discountPrice ?? item.selectedVariant.price;
                    return (
                      <div key={item.id} className="flex justify-between items-center p-3 text-xs bg-white">
                        <div>
                          <span className="font-bold text-gray-800 block">{item.product.name}</span>
                          <span className="text-[10px] text-gray-400 font-medium">{item.selectedVariant.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-gray-700 block">{formatRp(price)}</span>
                          <span className="text-gray-400 font-medium text-[10px]">x{item.quantity}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Metode: <strong className="text-gray-700 uppercase">{selectedOrderForInspect.paymentMethod}</strong></span>
                  <span className="text-gray-400 block font-medium mt-0.5">Waktu: <strong className="text-gray-700">{formatDateTime(selectedOrderForInspect.createdAt)}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block font-bold">Total</span>
                  <span className="text-lg font-black text-[#7b2cbf]">{formatRp(selectedOrderForInspect.totalAmount)}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Perbarui Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Pembayaran</label>
                    <select value={selectedOrderForInspect.paymentStatus}
                      onChange={(e) => { updateOrderStatus(selectedOrderForInspect.id, e.target.value as any); setSelectedOrderForInspect({ ...selectedOrderForInspect, paymentStatus: e.target.value as any }); }}
                      className="w-full bg-[#faf9f6] text-xs font-bold text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none">
                      <option value="pending">PENDING</option>
                      <option value="paid">PAID</option>
                      <option value="failed">FAILED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Pengiriman</label>
                    <select value={selectedOrderForInspect.deliveryStatus}
                      onChange={(e) => { updateDeliveryStatus(selectedOrderForInspect.id, e.target.value as any); setSelectedOrderForInspect({ ...selectedOrderForInspect, deliveryStatus: e.target.value as any }); }}
                      className="w-full bg-[#faf9f6] text-xs font-bold text-gray-600 px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none">
                      <option value="packing">DIKEMAS</option>
                      <option value="shipping">DIKIRIM</option>
                      <option value="completed">SELESAI</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 p-4 bg-[#faf9f6] flex gap-3 justify-end">
              <button onClick={() => { setReceiptOrder(selectedOrderForInspect); setSelectedOrderForInspect(null); }}
                className="px-4 py-2.5 bg-[#e28743] hover:bg-[#c97435] text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Cetak Resi
              </button>
              <button onClick={() => setSelectedOrderForInspect(null)}
                className="px-4 py-2.5 bg-[#2d2218] hover:bg-gray-800 text-white font-bold text-xs rounded-xl cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= POPUP: Add/Edit Product Form ================= */}
      {isAddFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6]">
              <h3 className="text-lg font-bold text-[#2d2218] font-serif">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
              <button onClick={() => setIsAddFormOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nama Produk</label>
                <input type="text" required placeholder="Contoh: Krupuk Kemplang Asli" value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Deskripsi Produk</label>
                <textarea required rows={2} placeholder="Deskripsikan produk..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Kategori</label>
                  <select value={formCat} onChange={(e) => setFormCat(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none cursor-pointer">
                    <option value="Krupuk Ikan">Krupuk Ikan</option>
                    <option value="Krupuk Jengkol">Krupuk Jengkol</option>
                    <option value="Krupuk Bawang">Krupuk Bawang</option>
                    <option value="Hampers">Paket Hampers</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Preset Foto</label>
                  <select value={formImg} onChange={(e) => setFormImg(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none cursor-pointer">
                    <option value="/krupuk_tenggiri.png">Krupuk Tenggiri</option>
                    <option value="/krupuk_jengkol.png">Krupuk Jengkol</option>
                    <option value="/krupuk_bawang.png">Krupuk Bawang</option>
                    <option value="/krupuk_hampers.png">Hampers Paket</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Varian Kemasan</h4>
                  <button type="button" onClick={addVariantRow} className="text-xs font-bold text-[#e28743] hover:underline cursor-pointer">+ Tambah Varian</button>
                </div>
                <div className="space-y-3">
                  {formVariants.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 relative">
                      {formVariants.length > 1 && (
                        <button type="button" onClick={() => removeVariantRow(index)}
                          className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-2 pr-6">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Nama Varian</label>
                          <input type="text" required placeholder="Paket 500 Gram" value={item.name} onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Stok</label>
                          <input type="number" min="0" required placeholder="10" value={item.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Harga (Rp)</label>
                          <input type="number" min="1000" required placeholder="80000" value={item.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1">Harga Promo (Opsional)</label>
                          <input type="number" min="1000" placeholder="Promo" value={item.discountPrice} onChange={(e) => handleVariantChange(index, 'discountPrice', e.target.value)}
                            className="w-full bg-white text-xs text-[#2d2218] px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-5 flex gap-4 mt-4">
                <button type="button" onClick={() => setIsAddFormOpen(false)}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer">Batal</button>
                <button type="submit"
                  className="flex-1 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-colors">
                  {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Printer Modal */}
      <ReceiptPrinter order={receiptOrder} isOpen={!!receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  );
};
