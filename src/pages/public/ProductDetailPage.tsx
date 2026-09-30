import React, { useState } from 'react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingCart,
  Star,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle,
  Clock,
  RotateCcw,
  Share2,
  Plus,
  Minus,
} from 'lucide-react';

interface ProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onNavigate: (view: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onBack,
  onNavigate,
}) => {
  const { addToCart, settings } = useStore();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const priceNum = typeof product.price === 'number' && !isNaN(product.price) ? product.price : Number(product.price) || 0;
  const originalPriceNum = product.originalPrice != null ? (typeof product.originalPrice === 'number' && !isNaN(product.originalPrice) ? product.originalPrice : Number(product.originalPrice) || undefined) : undefined;
  const ratingNum = typeof product.rating === 'number' && !isNaN(product.rating) ? product.rating : 4.8;
  const reviewCountNum = typeof product.reviewCount === 'number' ? product.reviewCount : 12;
  const stockNum = typeof product.stock === 'number' ? product.stock : 10;
  const isOutOfStock = stockNum <= 0;
  const productImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'];

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-amber-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 shadow-sm transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="text-xs text-slate-500 hidden sm:block">
          Marketplace / <span className="text-amber-400 font-semibold">{product.categoryName || 'General'}</span> / {product.sku || product.id}
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Image Gallery (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <img
              src={
                productImages[selectedImageIndex] ||
                productImages[0] ||
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
              }
              alt={product.name || 'Product'}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {originalPriceNum && originalPriceNum > priceNum && (
              <div className="absolute top-3 right-3 px-2.5 py-1 bg-rose-600 text-white text-xs font-black rounded-lg shadow-sm">
                SAVE {Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100)}%
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {productImages.length > 1 && (
            <div className="flex items-center gap-3">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImageIndex === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/20 scale-105'
                      : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-100">Verified Authentic</span>
                <span className="text-[11px] text-slate-400">Quality tested specifications</span>
              </div>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-slate-100">Fast Order Dispatch</span>
                <span className="text-[11px] text-slate-400">Handled by certified seller</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Details & Buying Box (6 cols) */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Category & Status Badges */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wider">
                {product.categoryName || 'General'}
              </span>
              <span className="text-xs text-slate-500 font-mono">SKU: {product.sku}</span>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {product.name}
            </h1>

            {/* Ratings Bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(ratingNum)
                        ? 'fill-current'
                        : 'text-slate-700 fill-current'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-bold text-slate-200">
                  {ratingNum.toFixed(1)}
                </span>
              </div>
              <span className="text-slate-700">•</span>
              <span className="text-xs text-slate-400">{reviewCountNum} customer reviews</span>
            </div>

            {/* Price Row */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-baseline justify-between">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-amber-400">
                  {settings?.currencySymbol || '$'}
                  {priceNum.toFixed(2)}
                </span>
                {originalPriceNum && originalPriceNum > priceNum && (
                  <span className="text-base text-slate-500 line-through">
                    {settings?.currencySymbol || '$'}
                    {originalPriceNum.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold ${
                    stockNum > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {stockNum > 0 ? `In Stock (${stockNum} units)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Product Description
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>

          {/* Actions & Quantity */}
          <div className="space-y-4 pt-6 border-t border-slate-800">
            {addedToast && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Added {quantity} item(s) to your cart!</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Quantity Picker */}
              <div className="flex items-center justify-between border border-slate-800 rounded-xl p-1 bg-slate-950 w-full sm:w-36">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-slate-100">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                id="pdp-add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3.5 px-6 bg-amber-400 hover:bg-amber-300 active:scale-98 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{isOutOfStock ? 'Item Out of Stock' : 'Add to Shopping Cart'}</span>
              </button>
            </div>

            {/* Marketplace Information */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-slate-400 space-y-1">
              <span className="font-bold block flex items-center gap-1 text-slate-200">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> How is this fulfilled?
              </span>
              <p className="text-slate-400">
                When you place your order, the Admin dispatches this item to an authorized fulfillment seller who ships directly to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
