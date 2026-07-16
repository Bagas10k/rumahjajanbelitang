import React from 'react';
import type { Order } from '../types';
import { X, Printer } from 'lucide-react';
import '../receipt-print.css';

export interface ReceiptPrinterProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number): string =>
  `Rp ${amount.toLocaleString('id-ID')}`;

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getStatusBadge = (status: Order['paymentStatus']) => {
  const map: Record<Order['paymentStatus'], { label: string; bg: string; text: string; border: string }> = {
    pending: { label: 'Menunggu', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    paid: { label: 'Lunas', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    failed: { label: 'Gagal', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  };
  return map[status];
};

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  // Calculate subtotal from items (without unique code)
  const itemsSubtotal = order.items.reduce((sum, item) => {
    const price = item.selectedVariant.discountPrice ?? item.selectedVariant.price;
    return sum + price * item.quantity;
  }, 0);

  const uniqueCode = order.uniqueCode ?? 0;
  const statusBadge = getStatusBadge(order.paymentStatus);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 no-print">
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-fade-in"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        {/* Modal Header - no-print */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#faf9f6] no-print">
          <h2 className="text-lg font-bold text-[#2d2218] tracking-tight font-serif">
            Cetak Resi Pesanan
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 no-print">
          <div className="mx-auto" style={{ maxWidth: 400 }}>
            {/* Receipt Content - This is what gets printed */}
            <div
              id="receipt-content"
              style={{
                background: '#ffffff',
                padding: '24px 20px',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                color: '#1a1a1a',
                fontSize: '13px',
                lineHeight: 1.5,
              }}
            >
              {/* ===== HEADER ===== */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                {/* Store Logo */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e28743, #c97435)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                  }}
                >
                  <span
                    style={{
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '16px',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    PKB
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '16px',
                    color: '#2d2218',
                    letterSpacing: '-0.3px',
                  }}
                >
                  Pusat Krupuk Belitang
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Belitang, OKU Timur, Sumatera Selatan
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  +62 812-XXXX-XXXX
                </div>

                {/* Dashed Separator */}
                <div
                  style={{
                    borderTop: '2px dashed #d1d5db',
                    margin: '14px 0',
                  }}
                />
              </div>

              {/* ===== INVOICE INFO ===== */}
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    letterSpacing: '0.8px',
                    marginBottom: '8px',
                  }}
                >
                  Detail Invoice
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>No. Invoice</span>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#7b2cbf' }}>
                    {order.id}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Tanggal</span>
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Metode Bayar</span>
                  <span style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
                    {order.paymentMethod === 'qris' ? 'QRIS' : 'COD'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Status</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: statusBadge.bg,
                      color: statusBadge.text,
                      border: `1px solid ${statusBadge.border}`,
                    }}
                  >
                    {statusBadge.label}
                  </span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div style={{ borderTop: '1px dashed #d1d5db', margin: '12px 0' }} />

              {/* ===== CUSTOMER INFO ===== */}
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    letterSpacing: '0.8px',
                    marginBottom: '8px',
                  }}
                >
                  Data Pelanggan
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Nama</span>
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>{order.customer.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px' }}>Telepon</span>
                  <span style={{ fontWeight: 600, fontSize: '12px' }}>{order.customer.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280', fontSize: '12px', flexShrink: 0 }}>Alamat</span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '12px',
                      textAlign: 'right',
                      maxWidth: '60%',
                      wordBreak: 'break-word',
                    }}
                  >
                    {order.customer.address}
                  </span>
                </div>
              </div>

              {/* Dashed Separator */}
              <div style={{ borderTop: '1px dashed #d1d5db', margin: '12px 0' }} />

              {/* ===== ITEMS TABLE ===== */}
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                    letterSpacing: '0.8px',
                    marginBottom: '10px',
                  }}
                >
                  Daftar Produk
                </div>

                {/* Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 36px 72px 80px',
                    gap: '4px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid #e5e7eb',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280' }}>Produk</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textAlign: 'center' }}>Qty</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textAlign: 'right' }}>Harga</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textAlign: 'right' }}>Subtotal</span>
                </div>

                {/* Item Rows */}
                {order.items.map((item) => {
                  const unitPrice = item.selectedVariant.discountPrice ?? item.selectedVariant.price;
                  const subtotal = unitPrice * item.quantity;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 36px 72px 80px',
                        gap: '4px',
                        padding: '5px 0',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#2d2218', lineHeight: 1.3 }}>
                          {item.product.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                          {item.selectedVariant.name}
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', color: '#374151' }}>
                        {item.quantity}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 500, textAlign: 'right', color: '#374151' }}>
                        {formatCurrency(unitPrice)}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 700, textAlign: 'right', color: '#2d2218' }}>
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dashed Separator */}
              <div style={{ borderTop: '2px dashed #d1d5db', margin: '12px 0' }} />

              {/* ===== TOTALS ===== */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Subtotal</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{formatCurrency(itemsSubtotal)}</span>
                </div>

                {uniqueCode > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#e28743' }}>Kode Unik</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#e28743' }}>
                      +{formatCurrency(uniqueCode)}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#2d2218' }}>Total</span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#7b2cbf' }}>
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* ===== FOOTER ===== */}
              <div
                style={{
                  borderTop: '2px dashed #d1d5db',
                  paddingTop: '14px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#2d2218',
                    marginBottom: '6px',
                  }}
                >
                  Terima kasih telah berbelanja
                  <br />
                  di Pusat Krupuk Belitang!
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    lineHeight: 1.5,
                    marginBottom: '10px',
                  }}
                >
                  Barang yang sudah dibeli tidak dapat
                  <br />
                  ditukar/dikembalikan kecuali ada cacat produksi.
                </div>
                <div
                  style={{
                    fontSize: '9px',
                    color: '#d1d5db',
                    marginTop: '8px',
                  }}
                >
                  Dicetak pada: {formatDateTime(new Date().toISOString())}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden during print */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-[#faf9f6] no-print">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#2d2218] hover:bg-[#3d3228] text-white font-bold text-sm rounded-xl cursor-pointer transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-extrabold text-sm rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak Resi
          </button>
        </div>
      </div>
    </div>
  );
};
