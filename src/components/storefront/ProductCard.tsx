import React from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { ShoppingCart, Star, CheckCircle, ShieldCheck, Truck } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart, settings } = useStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const priceNum = typeof product.price === 'number' && !isNaN(product.price) ? product.price : Number(product.price) || 0;
  const originalPriceNum = product.originalPrice != null ? (typeof product.originalPrice === 'number' && !isNaN(product.originalPrice) ? product.originalPrice : Number(product.originalPrice) || undefined) : undefined;
  const ratingNum = typeof product.rating === 'number' && !isNaN(product.rating) ? product.rating : 4.8;
  const reviewCountNum = typeof product.reviewCount === 'number' ? product.reviewCount : 12;
  const imageUrl = (Array.isArray(product.images) && product.images[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80';
  const isOutOfStock = (product.stock ?? 10) <= 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-800 hover:border-amber-400/60 shadow-lg hover:shadow-2xl hover:shadow-black/60 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Product Image Container */}
      <div className="relative aspect-4/3 bg-slate-950 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name || 'Product'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 items-start">
          {product.featured && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] font-black tracking-wide uppercase bg-amber-400 text-slate-950 shadow-sm">
              Choice
            </span>
          )}
          <span className="px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold bg-slate-950/80 text-slate-200 backdrop-blur-xs flex items-center gap-1 border border-slate-700/50">
            <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Verified Authentic</span>
            <span className="sm:hidden">Verified</span>
          </span>
        </div>

        {/* Discount Badge */}
        {originalPriceNum && originalPriceNum > priceNum && (
          <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 px-1.5 sm:px-2 py-0.5 bg-rose-600 text-white text-[9px] sm:text-[11px] font-black rounded shadow-sm">
            -{Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100)}%
          </div>
        )}

        {/* Stock warning */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center">
            <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] sm:text-xs font-bold rounded uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between bg-slate-900">
        <div>
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="font-bold text-amber-400/90 uppercase tracking-wider text-[9px] sm:text-[10px] truncate max-w-[70%]">
              {product.categoryName || 'General'}
            </span>
            <span className="hidden sm:inline font-mono text-slate-500 text-[10px]">SKU: {product.sku || product.id}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-xs sm:text-sm text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug min-h-[2rem]">
            {product.name || 'Authentic Product'}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 sm:mt-2">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              <span className="ml-1 text-[11px] sm:text-xs font-bold text-slate-200">
                {ratingNum.toFixed(1)}
              </span>
            </div>
            <span className="text-slate-400 text-[10px] sm:text-xs">({reviewCountNum})</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-800 flex items-center justify-between gap-1">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-sm sm:text-lg font-black text-amber-400">
                {settings?.currencySymbol || '$'}
                {priceNum.toFixed(2)}
              </span>
              {originalPriceNum && originalPriceNum > priceNum && (
                <span className="text-[10px] sm:text-xs text-slate-500 line-through">
                  {settings?.currencySymbol || '$'}
                  {originalPriceNum.toFixed(2)}
                </span>
              )}
            </div>
            <span className="hidden sm:flex text-[10px] text-slate-400 items-center gap-1 font-medium mt-0.5">
              <Truck className="w-3 h-3 text-emerald-400" /> Free 2-Day Delivery
            </span>
          </div>

          {/* Add To Cart */}
          <button
            id={`add-to-cart-btn-${product.id}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="p-2 sm:p-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-lg sm:rounded-xl shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shrink-0"
            title="Add to cart"
          >
            <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
