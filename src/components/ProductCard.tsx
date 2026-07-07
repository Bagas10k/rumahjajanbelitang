import React from 'react';
import type { Product } from '../types';
import { Star } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const isOutOfStock = product.stock <= 0;
  
  // Calculate lowest active price of the variants for catalog display
  const prices = product.variants.map((v) => {
    return v.discountPrice !== null ? v.discountPrice : v.price;
  });
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : product.originalPrice;

  return (
    <div 
      onClick={() => onSelect?.(product)}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-full group cursor-pointer"
    >
      
      {/* Product Image Wrapper */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50/50">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />
        
        {/* Dynamic Featured / Unggulan Badge */}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 bg-[#e28743] text-white text-[9px] font-black px-2.5 py-1 rounded-md shadow-xs uppercase tracking-wider flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-white" />
            Unggulan
          </span>
        )}
      </div>

      {/* Product Body */}
      <div className="p-4 flex flex-col flex-1">
        
        {/* Category tag */}
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">
          {product.category || 'Menu Utama'}
        </span>

        {/* Title */}
        <h3 className="text-sm font-bold text-[#2d2218] mb-1 line-clamp-1 group-hover:text-[#e28743] transition-colors">
          {product.name}
        </h3>
        
        <p className="text-gray-400 text-xs line-clamp-2 mb-4 flex-grow font-medium">
          {product.description}
        </p>

        {/* Catalog Footer: Price & Stock status */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto">
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider">Mulai Dari</span>
            <span className="text-sm font-extrabold text-[#7b2cbf]">
              Rp {lowestPrice.toLocaleString()}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(product);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isOutOfStock 
                ? 'bg-gray-50 text-gray-400 border border-gray-200' 
                : 'bg-orange-50 text-[#e28743] border border-orange-100 hover:bg-[#e28743] hover:text-white'
            }`}
          >
            {isOutOfStock ? 'Habis' : 'Pesan'}
          </button>
        </div>

      </div>
    </div>
  );
};
