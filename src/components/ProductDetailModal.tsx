import React, { useState, useEffect } from 'react';
import type { Product, ProductVariant } from '../types';
import { useCartStore } from '../store/useCartStore';
import { X, ShoppingBag, Check, ShieldCheck } from 'lucide-react';

export interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addToCart } = useCartStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Initialize selected variant and active image when a product is opened
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0] || null);
      setActiveImage(product.imageUrl);
      setQuantity(1);
      setIsSuccess(false);
    }
  }, [product]);

  if (!isOpen || !product || !selectedVariant) return null;

  // Sync active variant stock from store products list
  const currentStoreProducts = useCartStore.getState().products;
  const storeProduct = currentStoreProducts.find((p) => p.id === product.id);
  const storeVariant = storeProduct?.variants.find((v) => v.id === selectedVariant.id) || selectedVariant;

  const isOutOfStock = storeVariant.stock <= 0;
  const hasDiscount = storeVariant.discountPrice !== null;
  const activePrice = hasDiscount ? storeVariant.discountPrice! : storeVariant.price;

  const handleVariantSelect = (v: ProductVariant) => {
    setSelectedVariant(v);
    setQuantity(1);
    setIsSuccess(false);
  };

  const incrementQty = () => {
    if (quantity < storeVariant.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const added = addToCart(product, storeVariant, quantity);
    if (added) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } else {
      alert('Gagal menambahkan ke keranjang. Stok tidak mencukupi.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      
      {/* Modal Container */}
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] animate-fade-in relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 bg-white/80 hover:bg-white rounded-full transition-all border border-gray-100 shadow-sm cursor-pointer"
          aria-label="Tutup Detail"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image Gallery & Previews */}
        <div className="w-full md:w-1/2 bg-gray-50/50 p-6 flex flex-col justify-center items-center border-r border-gray-100">
          
          {/* Main Viewer */}
          <div className="aspect-[4/3] w-full max-w-sm rounded-2xl overflow-hidden shadow-xs border border-gray-100 bg-white flex items-center justify-center">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Gallery Thumbnails */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto py-1 max-w-sm">
              {product.gallery.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white transition-all flex-shrink-0 cursor-pointer ${
                    activeImage === imgUrl ? 'border-[#e28743] scale-105' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} preview ${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quality Guarantee Tag */}
          <div className="flex items-center gap-2 mt-6 text-gray-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Garansi Kualitas & Kerenyahan Khas Belitang</span>
          </div>

        </div>

        {/* Column 2: Details & Variant Selection */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col max-h-[50vh] md:max-h-none overflow-y-auto">
          
          {/* Tag & Category */}
          <div className="mb-2">
            <span className="bg-orange-50 text-[#e28743] border border-orange-100 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider">
              {product.category || 'Menu Utama'}
            </span>
          </div>

          {/* Product Header */}
          <h2 className="text-2xl font-black text-[#2d2218] mb-2 leading-tight">
            {product.name}
          </h2>
          
          <p className="text-gray-500 text-xs leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Variants Selector */}
          <div className="mb-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
              Pilih Paket Ukuran
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              {product.variants.map((v) => {
                const isSelected = selectedVariant.id === v.id;
                const vHasDiscount = v.discountPrice !== null;
                const vStoreProduct = storeProduct?.variants.find((sv) => sv.id === v.id) || v;
                const vIsOutOfStock = vStoreProduct.stock <= 0;

                return (
                  <button
                    key={v.id}
                    disabled={vIsOutOfStock}
                    onClick={() => handleVariantSelect(v)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      vIsOutOfStock 
                        ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-[#e28743] bg-orange-50/20 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${isSelected ? 'text-[#e28743]' : 'text-gray-800'}`}>
                        {v.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                        {vIsOutOfStock ? 'Stok Habis' : `Tersedia: ${vStoreProduct.stock} Pcs`}
                      </span>
                    </div>

                    <div className="text-right">
                      {vHasDiscount ? (
                        <>
                          <span className="text-[10px] text-gray-400 line-through block">
                            Rp {v.price.toLocaleString()}
                          </span>
                          <span className="text-sm font-extrabold text-[#7b2cbf] block">
                            Rp {v.discountPrice?.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-extrabold text-[#7b2cbf] block">
                          Rp {v.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector & Add Button */}
          <div className="border-t border-gray-100 pt-6 mt-auto">
            <div className="flex items-center justify-between gap-4 mb-4">
              
              {/* Quantity selectors */}
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <button
                  onClick={decrementQty}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-3 text-gray-500 hover:bg-gray-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Kurangi kuantitas"
                >
                  <X className="w-3.5 h-3.5 rotate-45" />
                </button>
                <span className="px-5 text-sm font-black text-gray-800 select-none">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  onClick={incrementQty}
                  disabled={quantity >= storeVariant.stock || isOutOfStock}
                  className="p-3 text-gray-500 hover:bg-gray-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Tambah kuantitas"
                >
                  <Check className="w-3.5 h-3.5 scale-y-75 hidden" />
                  <span className="text-sm font-bold">+</span>
                </button>
              </div>

              {/* Total Price preview */}
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Harga</span>
                <span className="text-lg font-black text-[#7b2cbf]">
                  Rp {(activePrice * (isOutOfStock ? 0 : quantity)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSuccess
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : isOutOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#e28743] hover:bg-[#c97435] text-white shadow-xs active:scale-98'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Berhasil Ditambahkan!
                </>
              ) : isOutOfStock ? (
                'Stok Paket Habis'
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Tambah ke Keranjang
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
