import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = useCartStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300">
      
      {/* Drawer Container */}
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
        
        {/* Drawer Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#2d2218] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#e28743]" />
            Keranjang Belanja
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Tutup Keranjang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body (Items List) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Keranjang Anda masih kosong.</p>
              <button 
                onClick={onClose} 
                className="text-xs text-[#e28743] font-bold hover:underline cursor-pointer"
              >
                Mulai Belanja &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const activeVariant = item.selectedVariant;
                const activePrice = activeVariant.discountPrice !== null ? activeVariant.discountPrice : activeVariant.price;
                return (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-3 border border-gray-100 rounded-xl items-center hover:border-gray-200 transition-colors"
                  >
                    {/* Item Thumbnail */}
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-16 h-16 object-cover rounded-lg bg-gray-50 border border-gray-100"
                    />

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-[#2d2218] truncate">
                        {item.product.name}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-semibold block -mt-0.5">
                        {activeVariant.name}
                      </span>
                      <p className="text-xs text-[#7b2cbf] font-semibold mt-1">
                        Rp {activePrice.toLocaleString()}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-200 text-gray-500 cursor-pointer"
                            aria-label="Kurangi kuantitas"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-gray-800">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 text-gray-500 cursor-pointer"
                            aria-label="Tambah kuantitas"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                          aria-label="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 bg-[#faf9f6]">
            
            {/* Subtotal Display */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-500">Subtotal</span>
              <span className="text-lg font-black text-[#7b2cbf]">
                Rp {getCartTotal().toLocaleString()}
              </span>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button 
                onClick={onCheckout}
                className="w-full py-3 bg-[#e28743] hover:bg-[#c97435] text-white font-bold text-sm rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                Lanjutkan ke Pembayaran
              </button>
              
              <button 
                onClick={clearCart}
                className="w-full py-2 bg-transparent hover:bg-red-50 text-gray-400 hover:text-red-500 font-semibold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Kosongkan Keranjang
              </button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
};
