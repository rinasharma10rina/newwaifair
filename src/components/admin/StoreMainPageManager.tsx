import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Category } from '../../types';
import {
  Store,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  Copy,
  AlertCircle,
  Package,
} from 'lucide-react';

interface StoreMainPageManagerProps {
  onNavigate?: (view: string) => void;
}

const SAMPLE_IMAGE_PRESETS = [
  {
    name: 'Mattress',
    url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4b70?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Bedding Pillow',
    url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Rug / Carpet',
    url: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sofa / Furniture',
    url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Earbuds',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Watch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
];

export const StoreMainPageManager: React.FC<StoreMainPageManagerProps> = ({ onNavigate }) => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductPublish,
    addCategory,
    settings,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    originalPrice: '',
    imageUrl: '',
    categoryId: '',
    newCategoryName: '',
    description: '',
    stock: '50',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT',
    featured: true,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      originalPrice: '',
      imageUrl: '',
      categoryId: categories[0]?.id || '',
      newCategoryName: '',
      description: '',
      stock: '50',
      status: 'PUBLISHED',
      featured: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
      imageUrl: product.images[0] || '',
      categoryId: product.categoryId || categories[0]?.id || '',
      newCategoryName: '',
      description: product.description || '',
      stock: (product.stock ?? 50).toString(),
      status: product.status === 'ARCHIVED' ? 'DRAFT' : product.status,
      featured: Boolean(product.featured),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.name.trim();
    const priceNum = parseFloat(formData.price);
    const imageUrl = formData.imageUrl.trim();

    if (!name) {
      setFormError('Product title is required.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid price greater than 0.');
      return;
    }
    if (!imageUrl) {
      setFormError('Image URL is required.');
      return;
    }

    let resolvedCategoryId = formData.categoryId;
    let resolvedCategoryName = '';

    // If admin is creating a new category
    if (formData.categoryId === '__new__') {
      const customCatName = formData.newCategoryName.trim();
      if (!customCatName) {
        setFormError('Please enter the name for your new category.');
        return;
      }
      const slug = customCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newCatId = `cat_${Date.now()}`;
      addCategory({
        name: customCatName,
        slug,
        description: `Items in ${customCatName}`,
        iconName: 'Sparkles',
        itemCount: 1,
      });
      resolvedCategoryId = newCatId;
      resolvedCategoryName = customCatName;
    } else {
      const found = categories.find((c) => c.id === resolvedCategoryId);
      resolvedCategoryName = found?.name || 'General';
    }

    const origPriceNum = formData.originalPrice ? parseFloat(formData.originalPrice) : undefined;
    const stockNum = parseInt(formData.stock, 10) || 50;

    if (editingProduct) {
      // Update existing
      updateProduct(editingProduct.id, {
        name,
        price: priceNum,
        originalPrice: origPriceNum && origPriceNum > priceNum ? origPriceNum : undefined,
        images: [imageUrl],
        categoryId: resolvedCategoryId,
        categoryName: resolvedCategoryName,
        description: formData.description.trim() || `${name} available on store main page.`,
        stock: stockNum,
        status: formData.status,
        featured: formData.featured,
      });
      showToast(`✓ "${name}" updated successfully!`);
    } else {
      // Add new
      const generatedSku = `SKU-MP-${Date.now().toString().slice(-6)}`;
      addProduct({
        sku: generatedSku,
        name,
        description: formData.description.trim() || `${name} available on store main page.`,
        categoryId: resolvedCategoryId,
        categoryName: resolvedCategoryName,
        price: priceNum,
        originalPrice: origPriceNum && origPriceNum > priceNum ? origPriceNum : undefined,
        stock: stockNum,
        images: [imageUrl],
        status: formData.status,
        sellerCommission: 15.0,
        customAdminCommissionPct: 15.0,
        associatedSellerIds: [],
        featured: formData.featured,
      });
      showToast(`✓ "${name}" added to Store Main Page!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the store?`)) {
      deleteProduct(id);
      showToast(`Removed "${name}" from store.`);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategoryFilter === 'all' ||
      p.categoryId === selectedCategoryFilter ||
      p.categoryName?.toLowerCase() === selectedCategoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && p.status === 'PUBLISHED') ||
      (statusFilter === 'draft' && p.status === 'DRAFT');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const publishedCount = products.filter((p) => p.status === 'PUBLISHED').length;
  const draftCount = products.filter((p) => p.status === 'DRAFT').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider border border-purple-500/30">
              <Store className="w-3.5 h-3.5" />
              <span>Storefront Products Manager</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Firebase Firestore Linked</span>
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Store Main Page Products</h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Control the products that appear on the customer store main page. Changes to titles, prices, image URLs, categories, or visibility persist directly to Firebase Firestore in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Main Page</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Main Page Product</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Total Products</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{products.length}</span>
            <span className="text-[11px] text-slate-500 font-medium">in catalog</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 block uppercase">Live on Main Page</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-600">{publishedCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">published</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 block uppercase">Draft / Inactive</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-600">{draftCount}</span>
            <span className="text-[11px] text-slate-500 font-medium">hidden</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-[#7F2282] block uppercase">Active Categories</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-[#7F2282]">{categories.length}</span>
            <span className="text-[11px] text-slate-500 font-medium">departments</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search main page products by title, category, or SKU..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white"
            />
          </div>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                statusFilter === 'published' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                statusFilter === 'draft' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoryFilter === cat.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Image</th>
                <th className="py-3 px-4">Product Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status on Store</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-500">No products found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try clearing search or filters, or click "Add Main Page Product"
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isPublished = p.status === 'PUBLISHED';
                  const mainImage = p.images[0] || '';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          )}
                        </div>
                      </td>

                      {/* Product Title + SKU + Image URL quick copy */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{p.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-slate-400">SKU: {p.sku}</span>
                          {mainImage && (
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(mainImage)}
                              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              title={mainImage}
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{copiedUrl === mainImage ? 'Copied URL!' : 'Copy Image URL'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-purple-50 text-[#7F2282] border border-purple-100 rounded-md font-bold text-[11px] inline-block">
                          {p.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-sm text-slate-900">
                          {settings.currencySymbol}
                          {p.price.toFixed(2)}
                        </div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div className="text-[10px] text-slate-400 line-through">
                            {settings.currencySymbol}
                            {p.originalPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => toggleProductPublish(p.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Click to toggle visibility on storefront"
                        >
                          {isPublished ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live on Store</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                              <span>Draft (Hidden)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit Title, Price, Image URL, Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ADD / EDIT PRODUCT MODAL (WITH LIVE IMAGE PREVIEW & CATEGORY SELECTOR) */}
      {/* ===================================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 sm:p-6 z-10 space-y-4 border border-slate-100 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-[#EE4932]" />
                  <span>{editingProduct ? 'Edit Main Page Product' : 'Add New Main Page Product'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set product title, price, category, and direct image URL for the customer store.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Scroll Body */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* 1. PRODUCT TITLE */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sleep by Wayfair 12 Cooling Gel Memory Foam Mattress"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white"
                />
              </div>

              {/* 2. PRICE & ORIGINAL PRICE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Price ($) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="149.99"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Original / Was Price ($) <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="219.99"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. IMAGE URL WITH LIVE PREVIEW */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Image URL <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/... or any image link"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white font-mono"
                    />
                  </div>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="px-2 py-2 text-slate-400 hover:text-slate-700 text-xs"
                      title="Clear"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Live Image Preview Container */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
                        }}
                      />
                    ) : (
                      <div className="text-center p-2 text-slate-400">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-[9px] block">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 block">Live Preview</span>
                    <p className="text-[10px] text-slate-500">
                      Or select one of our curated high-resolution sample image URLs below:
                    </p>
                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                          className="px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. CATEGORY SELECTOR OR NEW CATEGORY */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__new__">+ Create New Category...</option>
                </select>

                {formData.categoryId === '__new__' && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-bold text-purple-900">
                      New Category Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.newCategoryName}
                      onChange={(e) => setFormData({ ...formData, newCategoryName: e.target.value })}
                      placeholder="e.g., Dining Room, Kitchenware, Office Desks"
                      className="w-full px-3.5 py-2 bg-white border border-purple-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                )}
              </div>

              {/* 5. PUBLISHED STATUS & STOCK */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Storefront Visibility
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'PUBLISHED' | 'DRAFT' })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE4932]"
                  >
                    <option value="PUBLISHED">Published (Visible on Main Page)</option>
                    <option value="DRAFT">Draft (Hidden from Main Page)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE4932]"
                  />
                </div>
              </div>

              {/* 6. SHORT DESCRIPTION */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Description <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description shown on product details..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EE4932] hover:bg-[#d83a24] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{editingProduct ? 'Save Changes' : 'Publish to Store'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
