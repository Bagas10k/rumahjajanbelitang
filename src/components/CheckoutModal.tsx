import React, { useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import type { CustomerDetails, Order } from '../types';
import { X, CheckCircle, Truck, Wallet } from 'lucide-react';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { getCartTotal, placeOrder } = useCartStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'cod'>('qris');

  const [step, setStep] = useState<'form' | 'payment_detail' | 'success'>('form');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate a random 3-digit unique transfer code once per checkout session
  const [uniqueCode] = useState(() => Math.floor(Math.random() * 999) + 1);

  if (!isOpen) return null;

  const subtotal = getCartTotal();
  // Adjust total payment for QRIS manually using the unique code
  const totalAmount = paymentMethod === 'qris' ? subtotal + uniqueCode : subtotal;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address) {
      alert('Silakan isi Nama, Nomor Telepon, dan Alamat Anda.');
      return;
    }
    setStep('payment_detail');
  };

  const handleConfirmCheckout = async () => {
    setIsProcessing(true);

    try {
      const customer: CustomerDetails = {
        name,
        email: email || 'customer@email.com',
        phone,
        address,
      };

      // Place order and sync directly with Supabase
      // Pass the generated uniqueCode if QRIS, otherwise 0
      const activeUniqueCode = paymentMethod === 'qris' ? uniqueCode : 0;
      const order = await placeOrder(customer, paymentMethod, activeUniqueCode);
      
      setIsProcessing(false);
      
      if (order) {
        setCreatedOrder(order);
        setStep('success');
      } else {
        alert('Gagal membuat pesanan. Keranjang belanja Anda kosong.');
      }
    } catch (err: any) {
      setIsProcessing(false);
      console.error('Checkout Error:', err);
      alert(`Terjadi kesalahan saat memproses pesanan: ${err.message || 'Unknown Error'}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fade-in">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6]">
          <h2 className="text-lg font-bold text-[#2d2218] tracking-tight font-serif">Checkout Pemesanan</h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: Address Form & Payment Selection */}
          {step === 'form' && (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Informasi Pengiriman
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] focus:ring-1 focus:ring-[#e28743]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Nomor WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] focus:ring-1 focus:ring-[#e28743]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Email (Opsional)</label>
                  <input
                    type="email"
                    placeholder="customer@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] focus:ring-1 focus:ring-[#e28743]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Alamat Pengiriman Lengkap</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Masukkan alamat rumah lengkap, RT/RW, Kecamatan, Kabupaten"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#faf9f6] text-sm text-[#2d2218] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#e28743] focus:ring-1 focus:ring-[#e28743] resize-none"
                />
              </div>

              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mt-6 mb-2">
                Metode Pembayaran
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* QRIS Selector */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'qris'
                      ? 'border-[#e28743] bg-orange-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Wallet className={`w-6 h-6 ${paymentMethod === 'qris' ? 'text-[#e28743]' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold text-[#2d2218]">Scan QRIS</span>
                  <span className="text-[10px] text-gray-400 text-center">Transfer Otomatis / Manual</span>
                </button>

                {/* COD Selector */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#e28743] bg-orange-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Truck className={`w-6 h-6 ${paymentMethod === 'cod' ? 'text-[#e28743]' : 'text-gray-400'}`} />
                  <span className="text-sm font-bold text-[#2d2218]">COD</span>
                  <span className="text-[10px] text-gray-400 text-center">Bayar di Tempat</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-5 flex justify-between items-center mt-6">
                <div>
                  <span className="text-xs text-gray-400 block font-medium">Total Pembayaran</span>
                  <span className="text-lg font-black text-[#7b2cbf]">
                    Rp {subtotal.toLocaleString()}
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-xs transition-colors"
                >
                  Lanjut Pembayaran &rarr;
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Checkout Confirmation & Payment Simulation */}
          {step === 'payment_detail' && (
            <div className="text-center space-y-6">
              {paymentMethod === 'qris' ? (
                <div className="space-y-4 max-w-sm mx-auto py-2">
                  <div className="space-y-1">
                    <h3 className="text-md font-black text-[#2d2218]">Scan QRIS Toko Bagas</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                      Silakan scan QRIS di bawah ini. Harap transfer **TEPAT** sejumlah nominal total agar pembayaran terverifikasi otomatis.
                    </p>
                  </div>

                  {/* Render Static User QRIS Image */}
                  <div className="bg-white p-3 rounded-2xl border border-gray-150 shadow-md max-w-[260px] mx-auto overflow-hidden">
                    <img 
                      src="/qris_bagas.jpg" 
                      alt="QRIS Toko Bagas" 
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  </div>

                  <div className="bg-[#faf9f6] p-4 rounded-2xl border border-gray-100 text-left space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Subtotal Belanja:</span>
                      <span className="text-gray-700">Rp {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span className="font-medium">Kode Unik Transfer:</span>
                      <span>+ Rp {uniqueCode}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200/60 pt-2 text-[#7b2cbf]">
                      <span className="font-bold">Total Wajib Bayar:</span>
                      <span className="font-black text-sm">Rp {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-sm mx-auto py-4">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-[#e28743] mx-auto">
                    <Truck className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-[#2d2218]">Konfirmasi Pesanan COD</h3>
                    <p className="text-xs text-gray-500">
                      Anda memilih metode pembayaran **Cash on Delivery (COD)**. Pesanan Anda akan dikirim ke alamat yang dituju dan dibayar tunai saat kurir datang.
                    </p>
                  </div>
                  <div className="bg-[#faf9f6] p-4 rounded-2xl border border-gray-100 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Nama Penerima:</span>
                      <span className="font-bold text-gray-700">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Alamat:</span>
                      <span className="font-bold text-gray-700 line-clamp-1">{address}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200/60 pt-2">
                      <span className="text-gray-500 font-medium">Total Bayar:</span>
                      <span className="font-extrabold text-[#7b2cbf] text-sm">Rp {totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 max-w-sm mx-auto">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleConfirmCheckout}
                  disabled={isProcessing}
                  className="flex-1 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white"></div>
                      Memproses...
                    </>
                  ) : paymentMethod === 'qris' ? (
                    'Konfirmasi Pesanan'
                  ) : (
                    'Konfirmasi Pesanan'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Successful Order Display */}
          {step === 'success' && createdOrder && (
            <div className="text-center space-y-6 py-6 max-w-sm mx-auto">
              <div className="w-16 h-16 bg-[#e8f5e9] text-[#2e7d32] rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#2d2218]">Pesanan Berhasil Dibuat!</h3>
                <p className="text-xs text-gray-400">
                  Terima kasih atas pemesanan Anda di Pusat Krupuk Belitang.
                </p>
              </div>

              <div className="bg-[#faf9f6] p-5 rounded-2xl border border-gray-100 text-left space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Invoice ID:</span>
                  <span className="font-extrabold text-[#7b2cbf]">{createdOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Metode Bayar:</span>
                  <span className="font-bold text-gray-700 uppercase">
                    {createdOrder.paymentMethod === 'qris' ? 'QRIS / SCAN' : 'COD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Status Bayar:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold text-[10px] uppercase border border-amber-200">
                    {createdOrder.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-2">
                  <span className="text-gray-500 font-medium">Total Wajib Bayar:</span>
                  <span className="font-extrabold text-[#2d2218] text-sm">Rp {createdOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                {createdOrder.paymentMethod === 'qris'
                  ? 'Pembayaran akan diverifikasi otomatis oleh mutasi sistem bank kami. Simpan bukti transfer Anda.'
                  : 'Siapkan dana tunai sebesar nominal di atas untuk diserahkan ke kurir saat paket tiba.'}
              </p>

              <button
                onClick={() => {
                  onClose();
                  setStep('form');
                  setName('');
                  setPhone('');
                  setAddress('');
                }}
                className="w-full py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-sm rounded-xl cursor-pointer transition-colors shadow-xs"
              >
                Kembali ke Beranda
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
