import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import type { Order } from '../types';
import { Search, Clock, Box, Truck, CheckCircle2, MapPin, User, Calendar, Wallet } from 'lucide-react';

export const OrderStatusPage: React.FC = () => {
  const { orders } = useCartStore();
  const [searchId, setSearchId] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSearchedOrder(null);

    if (!searchId.trim()) {
      setErrorMsg('Silakan masukkan Kode Invoice.');
      return;
    }

    const order = orders.find(
      (o) => o.id.toLowerCase() === searchId.trim().toLowerCase()
    );

    if (order) {
      setSearchedOrder(order);
    } else {
      setErrorMsg('Kode Invoice tidak ditemukan. Silakan cek kembali ejaan Anda.');
    }
  };

  const selectOrderDirectly = (order: Order) => {
    setSearchedOrder(order);
    setSearchId(order.id);
    setErrorMsg('');
  };

  // Helper to determine step status
  const getStepStatus = (
    currentStatus: 'packing' | 'shipping' | 'completed',
    step: 'created' | 'packing' | 'shipping' | 'completed'
  ) => {
    const statusMap = {
      packing: 1,
      shipping: 2,
      completed: 3,
    };

    const currentRank = statusMap[currentStatus] || 1;

    if (step === 'created') return 'completed';
    if (step === 'packing') {
      return currentRank >= 1 ? 'completed' : 'pending';
    }
    if (step === 'shipping') {
      return currentRank >= 2 ? 'completed' : 'pending';
    }
    if (step === 'completed') {
      return currentRank >= 3 ? 'completed' : 'pending';
    }
    return 'pending';
  };

  return (
    <div className="max-w-4xl w-full mx-auto px-6 py-8 flex-1 flex flex-col">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h2 className="text-3xl font-black text-[#2d2218] tracking-tight">Cek Status Pesanan</h2>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Pantau status pembayaran dan pengiriman paket krupuk Belitang Anda secara real-time.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="max-w-xl w-full mx-auto mb-8">
        <div className="flex gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-xs focus-within:border-[#e28743] transition-all">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Masukkan Kode Invoice (Contoh: ORD-178...)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full text-sm text-[#2d2218] pl-10 pr-4 py-3 bg-transparent border-none focus:outline-none"
            />
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Lacak
          </button>
        </div>
        {errorMsg && (
          <p className="text-red-500 text-xs font-semibold mt-2.5 ml-2">
            ⚠️ {errorMsg}
          </p>
        )}
      </form>

      {/* Conditional Rendering: Order details VS Recent orders list */}
      {searchedOrder ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 md:p-8 space-y-8 animate-fade-in">
          
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">ID Invoice</span>
              <h3 className="text-lg font-black text-[#7b2cbf]">{searchedOrder.id}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-medium">Status Bayar:</span>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                searchedOrder.paymentStatus === 'paid'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : searchedOrder.paymentStatus === 'failed'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {searchedOrder.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stepper tracking */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Progress Pengiriman</h4>
            
            <div className="grid grid-cols-4 relative max-w-2xl mx-auto py-4">
              
              {/* Stepper Connector Line */}
              <div className="absolute top-[2.1rem] left-[12.5%] right-[12.5%] h-1 bg-gray-100 z-0">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: 
                      searchedOrder.deliveryStatus === 'completed'
                        ? '100%'
                        : searchedOrder.deliveryStatus === 'shipping'
                        ? '66%'
                        : '33%'
                  }}
                />
              </div>

              {/* Step 1: Created */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-800 mt-2.5 block">Diterima</span>
                <span className="text-[9px] text-gray-400 font-medium mt-0.5 block">Pesanan Terbuat</span>
              </div>

              {/* Step 2: Packing */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                  getStepStatus(searchedOrder.deliveryStatus, 'packing') === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Box className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-800 mt-2.5 block">Dikemas</span>
                <span className="text-[9px] text-gray-400 font-medium mt-0.5 block">Sedang Diproses</span>
              </div>

              {/* Step 3: Shipping */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                  getStepStatus(searchedOrder.deliveryStatus, 'shipping') === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Truck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-800 mt-2.5 block">Dikirim</span>
                <span className="text-[9px] text-gray-400 font-medium mt-0.5 block">Dalam Perjalanan</span>
              </div>

              {/* Step 4: Completed */}
              <div className="flex flex-col items-center text-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                  getStepStatus(searchedOrder.deliveryStatus, 'completed') === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-800 mt-2.5 block">Selesai</span>
                <span className="text-[9px] text-gray-400 font-medium mt-0.5 block">Paket Diterima</span>
              </div>

            </div>
          </div>

          {/* Details & Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-b border-gray-100 py-6">
            
            {/* Customer info */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Informasi Pengiriman</h4>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-700 block">{searchedOrder.customer.name}</span>
                    <span className="text-gray-500 block">{searchedOrder.customer.phone}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 leading-relaxed">{searchedOrder.customer.address}</span>
                </div>
              </div>
            </div>

            {/* Invoice Metadata */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Metode Transaksi</h4>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    Tanggal: {new Date(searchedOrder.createdAt).toLocaleDateString('id-ID')} {new Date(searchedOrder.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 font-medium uppercase">
                    Metode Bayar: {searchedOrder.paymentMethod}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Items Table Summary */}
          <div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Daftar Krupuk Dibeli</h4>
            <div className="space-y-3">
              {searchedOrder.items.map((item) => {
                const activePrice = item.selectedVariant.discountPrice !== null ? item.selectedVariant.discountPrice : item.selectedVariant.price;
                return (
                  <div key={item.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 text-xs">
                    <div>
                      <span className="font-bold text-gray-700 block">{item.product.name}</span>
                      <span className="text-gray-400 block mt-0.5">{item.selectedVariant.name} (x{item.quantity})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-[#7b2cbf]">
                        Rp {(activePrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              <div className="flex justify-between items-center pt-4 font-black text-sm text-[#2d2218]">
                <span>Total Belanja:</span>
                <span className="text-[#7b2cbf] text-base">
                  Rp {searchedOrder.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-xs max-w-xl w-full mx-auto">
          {orders.length === 0 ? (
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-700">Belum Ada Transaksi</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                Anda belum melakukan pemesanan krupuk. Silakan belanja terlebih dahulu di halaman utama.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">
                Pilih Dari Riwayat Pesanan
              </span>
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-2">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => selectOrderDirectly(order)}
                    className="w-full flex justify-between items-center py-3 text-left hover:bg-gray-50 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-black text-[#7b2cbf] block">{order.id}</span>
                      <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('id-ID')} - {order.customer.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-gray-700 block">
                        Rp {order.totalAmount.toLocaleString()}
                      </span>
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border mt-0.5 ${
                        order.deliveryStatus === 'completed'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : order.deliveryStatus === 'shipping'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {order.deliveryStatus === 'completed' ? 'Selesai' : order.deliveryStatus === 'shipping' ? 'Dikirim' : 'Dikemas'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
export default OrderStatusPage;
