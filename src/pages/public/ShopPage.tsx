import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../../components/storefront/ProductCard';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, X, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';

interface ShopPageProps {
  initialCategory?: string;
  initialQuery?: string;
  onSelectProduct: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  initialCategory,
  initialQuery = '',
  onSelectProduct,
}) => {
  const { products, categories, settings } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.status === 'PUBLISHED')
      .filter((p) => {
        if (selectedCategory !== 'ALL' && p.categoryId !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchCat = (p.categoryName || '').toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchDesc && !matchCat) return false;
        }
        if (p.price > priceRange) {
          return false;
        }
        if (onlyInStock && p.stock <= 0) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, priceRange, sortBy, onlyInStock]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Admin Curated Marketplace Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Marketplace Shop</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Browse all verified and approved products. Orders are routed directly by the Platform Admin to authorized fulfillment sellers.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-700/60 text-xs font-semibold text-slate-300">
          <span>Total Products Available:</span>
          <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-lg font-bold">
            {filteredProducts.length}
          </span>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filters Sidebar */}
        <aside className="space-y-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md h-fit">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Filters</span>
            </div>
            {(selectedCategory !== 'ALL' || searchQuery || priceRange < 5000 || onlyInStock) && (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setPriceRange(5000);
                  setOnlyInStock(false);
                }}
                className="text-xs text-rose-400 hover:underline font-semibold"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Search Keywords
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Product name, SKU..."
                className="w-full pl-8 pr-8 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>All Departments</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === 'ALL' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {products.filter((p) => p.status === 'PUBLISHED').length}
                </span>
              </button>
              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.status === 'PUBLISHED' && p.categoryId === cat.id
                ).length;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              <span>Max Price:</span>
              <span className="text-amber-400 text-sm font-black">
                {settings.currencySymbol}
                {priceRange}
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="5000"
              step="50"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>$20</span>
              <span>$5,000</span>
            </div>
          </div>

          {/* Stock Filter Checkbox */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="rounded text-amber-400 focus:ring-amber-400 bg-slate-950 border-slate-700 w-4 h-4"
              />
              <span>Only In-Stock Products</span>
            </label>
          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Sort & Summary Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <span className="text-xs text-slate-400 font-medium">
              Showing <strong className="text-slate-100">{filteredProducts.length}</strong> products
            </span>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Grid or Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl p-12 text-center border border-slate-800 shadow-md space-y-3">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">No products match your criteria</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try widening your price filter or clearing the search query to explore other catalog items.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                  setPriceRange(600);
                  setOnlyInStock(false);
                }}
                className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => onSelectProduct(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
