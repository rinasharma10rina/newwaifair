import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from '../../components/storefront/ProductCard';
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  Sparkles,
  Store,
  CheckCircle2,
  Award,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Star,
  Zap,
  Percent,
  Check,
  Tag,
  BedDouble,
  Home,
  Layers,
  Laptop,
  Compass,
  LayoutGrid,
  Cpu,
  Smartphone,
  Gamepad2,
  Headphones,
  Coffee,
  Watch,
} from 'lucide-react';
import { Product } from '../../types';

interface HomePageProps {
  onNavigate: (view: string, id?: string) => void;
  onSelectProduct: (product: Product) => void;
}

const HERO_SLIDES = [
  {
    id: 1,
    badge: 'MEGA TECH & HARDWARE LAUNCH',
    title: 'UP TO 40% OFF',
    subtitle: 'Laptops, GPUs & Next-Gen Tech',
    description: 'Supercharge your workstation with Apple MacBook Pro M3, ASUS ROG gaming laptops, and NVIDIA GeForce RTX 40-Series GPUs.',
    tags: ['Flagship Laptops & GPUs', 'Official Warranties', 'Verified 24-48h Dispatch'],
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=80',
    primaryCta: 'Shop Laptops & PCs',
    catSlug: 'laptops',
    accentColor: 'from-[#0f172a] to-[#1e1b4b]',
  },
  {
    id: 2,
    badge: 'POWER YOUR RIG',
    title: 'RTX 4090 / 4080 IN STOCK',
    subtitle: 'Graphics Cards & PC Components',
    description: 'Dominate 4K gaming, AI modeling, and creative workflows with founders edition GPUs, blazing NVMe SSDs, and processors.',
    tags: ['DLSS 3.5 & Ray Tracing', 'In Stock Ready to Ship', 'Guaranteed Authentic'],
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&auto=format&fit=crop&q=80',
    primaryCta: 'Explore Graphic Cards',
    catSlug: 'graphic-cards',
    accentColor: 'from-[#064e3b] to-[#022c22]',
  },
  {
    id: 3,
    badge: 'ALL-IN-ONE MEGASTORE',
    title: 'PHONES, AUDIO & LIVING',
    subtitle: 'Everything You Need in One Place',
    description: 'Discover iPhone 16 Pro Max, Sony WH-1000XM5 audio, Dyson cordless vacuums, smart air fryers, and luxury watches.',
    tags: ['Save up to 50%', 'Over 10,000 Verified Items', 'Free Express Delivery'],
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80',
    primaryCta: 'Explore All Departments',
    catSlug: 'shop',
    accentColor: 'from-[#1e1b4b] to-[#312e81]',
  },
];

const CIRCLE_CATEGORIES = [
  {
    id: 'cat_laptops',
    name: 'Laptops & PCs',
    slug: 'laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_gpus',
    name: 'Graphic Cards',
    slug: 'graphic-cards',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_smartphones',
    name: 'Phones & Tablets',
    slug: 'smartphones',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_electronics',
    name: 'Tech & Audio',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_gaming',
    name: 'Gaming & VR',
    slug: 'gaming',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_appliances',
    name: 'Smart Appliances',
    slug: 'appliances',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_fashion',
    name: 'Watches & Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_furniture',
    name: 'Furniture & Living',
    slug: 'furniture',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'cat_mattresses',
    name: 'Bedding & Sleep',
    slug: 'mattresses',
    image: 'https://assets.wfcdn.com/im/85643861/resize-h800-p1-w800%5Ecompr-r85/4065/406538952/Sleep+by+Wayfair%E2%84%A2+12%22+Medium+Cooling+Gel+Memory+Foam+Mattress-1617056086.jpg',
  },
];

const TRUSTED_BRANDS = [
  'Apple',
  'NVIDIA',
  'ASUS ROG',
  'Samsung',
  'Sony',
  'MSI Gaming',
  'Lenovo Legion',
  'Dyson',
  'Intel',
  'Ninja Kitchen',
];

const CUSTOMER_REVIEWS = [
  {
    id: 1,
    name: 'Alex D.',
    location: 'San Francisco, CA',
    rating: 5,
    date: 'Yesterday',
    title: 'The RTX 4090 arrived brand new and sealed!',
    comment:
      'I was looking for a legitimate RTX 4090 Founders Edition without inflated scalper prices. Fast overnight shipping, authentic sealed box, and incredible 4K performance in Cyberpunk!',
    product: 'NVIDIA GeForce RTX 4090 Founders Edition',
  },
  {
    id: 2,
    name: 'Sarah M.',
    location: 'Austin, TX',
    rating: 5,
    date: '2 days ago',
    title: 'MacBook Pro M3 Max is a creative dream',
    comment:
      'Ordered the 16" Space Black model with 36GB memory. Video rendering in 4K ProRes is instantaneous, battery lasts literally all day. Outstanding customer service!',
    product: 'Apple MacBook Pro 16" (M3 Max)',
  },
  {
    id: 3,
    name: 'David K.',
    location: 'Seattle, WA',
    rating: 5,
    date: '3 days ago',
    title: 'Sony WH-1000XM5 noise cancelling is unmatched',
    comment:
      'Got these for my daily commute and office focus. The sound clarity is pristine and phone call microphones filter out ambient chatter completely.',
    product: 'Sony WH-1000XM5 Wireless Headphones',
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSelectProduct }) => {
  const { products, categories } = useStore();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<'all' | 'under50' | 'under200' | 'under800' | 'under1500'>('all');
  const [catalogViewMode, setCatalogViewMode] = useState<'grid' | 'departments'>('grid');

  // Auto-advance hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const publishedProducts = products.filter((p) => p.status === 'PUBLISHED');

  // Apply price filter
  const priceFilteredProducts = publishedProducts.filter((p) => {
    if (selectedPriceFilter === 'under50') return p.price <= 50;
    if (selectedPriceFilter === 'under200') return p.price <= 200;
    if (selectedPriceFilter === 'under800') return p.price <= 800;
    if (selectedPriceFilter === 'under1500') return p.price <= 1500;
    return true;
  });

  // Category Icon resolver
  const getCategoryIcon = (nameOrSlug: string) => {
    const lower = (nameOrSlug || '').toLowerCase();
    if (lower.includes('laptop') || lower.includes('computer') || lower.includes('pc')) return Laptop;
    if (lower.includes('gpu') || lower.includes('graphic') || lower.includes('card') || lower.includes('cpu')) return Cpu;
    if (lower.includes('phone') || lower.includes('smart') || lower.includes('tablet')) return Smartphone;
    if (lower.includes('gaming') || lower.includes('console') || lower.includes('vr')) return Gamepad2;
    if (lower.includes('tech') || lower.includes('electron') || lower.includes('audio') || lower.includes('headphone') || lower.includes('earbud')) return Headphones;
    if (lower.includes('appliance') || lower.includes('kitchen') || lower.includes('coffee')) return Coffee;
    if (lower.includes('watch') || lower.includes('fashion') || lower.includes('cloth') || lower.includes('wear')) return Watch;
    if (lower.includes('mattress') || lower.includes('sleep') || lower.includes('bed')) return BedDouble;
    if (lower.includes('rug') || lower.includes('pad') || lower.includes('floor')) return Layers;
    if (lower.includes('furnitur') || lower.includes('living') || lower.includes('sofa') || lower.includes('desk')) return Home;
    if (lower.includes('light') || lower.includes('lamp')) return Compass;
    return Tag;
  };

  // Build category groups with products
  const categoryGroups = (categories || []).map((cat) => {
    const catNameLower = (cat?.name || '').toLowerCase();
    const catProducts = priceFilteredProducts.filter(
      (p) =>
        p.categoryId === cat.id ||
        p.categoryId === cat.slug ||
        (p.categoryName && p.categoryName.toLowerCase() === catNameLower)
    );
    return {
      category: cat,
      products: catProducts,
    };
  });

  // Check for any products under custom categories created by admin
  const assignedIds = new Set(categoryGroups.flatMap((g) => g.products.map((p) => p.id)));
  const extraProducts = priceFilteredProducts.filter((p) => !assignedIds.has(p.id));
  const extraCategoryMap = new Map<string, Product[]>();
  extraProducts.forEach((p) => {
    const cName = p.categoryName || 'Curated Essentials';
    if (!extraCategoryMap.has(cName)) {
      extraCategoryMap.set(cName, []);
    }
    extraCategoryMap.get(cName)!.push(p);
  });

  const allCategoryGroups = [
    ...categoryGroups,
    ...Array.from(extraCategoryMap.entries()).map(([cName, prods]) => ({
      category: {
        id: `custom_${cName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        name: cName,
        slug: cName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `Featured collections in ${cName}`,
        iconName: 'Tag',
        itemCount: prods.length,
      },
      products: prods,
    })),
  ];

  // Filter groups according to selected category filter
  const displayedCategoryGroups = allCategoryGroups.filter((group) => {
    if (selectedCategoryFilter === 'all') {
      return group.products.length > 0;
    }
    const filterLower = selectedCategoryFilter.toLowerCase();
    const groupNameLower = (group.category?.name || '').toLowerCase();
    return (
      (group.category.id === selectedCategoryFilter ||
        group.category.slug === selectedCategoryFilter ||
        groupNameLower === filterLower) &&
      group.products.length > 0
    );
  });

  const totalFilteredProducts = displayedCategoryGroups.reduce((acc, g) => acc + g.products.length, 0);

  // Curated Flash Deals for direct main-page spotlight
  const featuredDeals = publishedProducts
    .filter((p) => p.featured || (p.originalPrice && p.originalPrice > p.price))
    .slice(0, 8);

  // Products matching the active category filter for the direct storefront grid
  const filteredGridProducts = priceFilteredProducts.filter((p) => {
    if (selectedCategoryFilter === 'all') return true;
    const catSlug = selectedCategoryFilter.toLowerCase();
    const pName = (p.name || '').toLowerCase();
    const pCatName = (p.categoryName || '').toLowerCase();
    const pCatId = (p.categoryId || '').toLowerCase();

    return (
      p.categoryId === selectedCategoryFilter ||
      pCatId === catSlug ||
      pCatName === catSlug ||
      pCatName.includes(catSlug) ||
      (catSlug.includes('laptop') && (pName.includes('laptop') || pName.includes('macbook') || pName.includes('rog') || pName.includes('dell') || pName.includes('lenovo') || pCatId.includes('laptop'))) ||
      ((catSlug.includes('graphic') || catSlug.includes('gpu')) && (pName.includes('rtx') || pName.includes('radeon') || pName.includes('gpu') || pName.includes('processor') || pName.includes('ssd') || pCatId.includes('gpu'))) ||
      ((catSlug.includes('phone') || catSlug.includes('tablet')) && (pName.includes('iphone') || pName.includes('galaxy') || pName.includes('ipad') || pCatId.includes('phone') || pCatId.includes('smartphones'))) ||
      (catSlug.includes('gaming') && (pName.includes('playstation') || pName.includes('gaming') || pName.includes('controller') || pCatId.includes('gaming'))) ||
      (catSlug.includes('appliance') && (pName.includes('air fry') || pName.includes('dyson') || pName.includes('vacuum') || pName.includes('coffee') || pCatId.includes('appliances'))) ||
      (catSlug.includes('fashion') && (pName.includes('watch') || pName.includes('ring') || pName.includes('jewelry') || pName.includes('sneaker') || pCatId.includes('fashion'))) ||
      (catSlug.includes('furnitur') && (pCatId.includes('furnitur') || pName.includes('desk') || pName.includes('chair') || pName.includes('sofa'))) ||
      (catSlug.includes('mattress') && (pName.includes('mattress') || pCatId.includes('mattress'))) ||
      (catSlug.includes('rug') && (pName.includes('rug') || pCatId.includes('rug'))) ||
      (catSlug.includes('bedding') && (pName.includes('pillow') || pName.includes('bedding') || pCatId.includes('bedding'))) ||
      (catSlug.includes('electron') && (pCatId.includes('electron') || pName.includes('audio') || pName.includes('headphone') || pName.includes('earbud') || pName.includes('monitor')))
    );
  });

  const activeSlide = HERO_SLIDES[currentSlide];

  return (
    <div className="space-y-8 sm:space-y-12 pb-24 md:pb-16">
      {/* 1. Hero Carousel Banner */}
      <section className="relative mx-2 sm:mx-6 lg:mx-8 mt-2 sm:mt-4">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-900 min-h-[360px] sm:min-h-[460px] flex items-center">
          {/* Background Image with Gradient Overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 transform scale-105"
            style={{ backgroundImage: `url(${activeSlide.image})` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${activeSlide.accentColor} opacity-90 mix-blend-multiply`} />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-12 py-8 sm:py-16 text-white grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center z-10 w-full">
            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] sm:text-xs font-black tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{activeSlide.badge}</span>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight">
                  {activeSlide.title}
                </h1>
                <h2 className="text-base sm:text-2xl font-bold text-purple-200">
                  {activeSlide.subtitle}
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                {activeSlide.description}
              </p>

              {/* Coupon / Promo Badges */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
                {activeSlide.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/30 border border-white/20 text-white text-[10px] sm:text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3 pt-2 sm:pt-3">
                <button
                  id="hero-primary-cta"
                  onClick={() => onNavigate(`shop?cat=${activeSlide.catSlug}`)}
                  className="px-5 py-2.5 sm:px-6 sm:py-3.5 bg-white text-[#7F2282] hover:bg-slate-100 active:scale-98 font-black text-xs sm:text-sm rounded-full shadow-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>{activeSlide.primaryCta}</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Right micro badge/countdown */}
            <div className="hidden lg:flex lg:col-span-4 justify-end">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center text-white space-y-3 max-w-xs shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black mx-auto shadow-md">
                  <Zap className="w-6 h-6 fill-slate-950" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Waifair Flash Dispatch</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Orders assigned directly to certified top-tier sellers within 2 hours
                  </p>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-around text-center text-[11px] font-bold">
                  <div>
                    <span className="block text-base text-amber-300">100%</span>
                    <span className="text-[10px] text-slate-300 font-normal">Authentic</span>
                  </div>
                  <div>
                    <span className="block text-base text-amber-300">4.9★</span>
                    <span className="text-[10px] text-slate-300 font-normal">Top Rating</span>
                  </div>
                  <div>
                    <span className="block text-base text-amber-300">Fast</span>
                    <span className="text-[10px] text-slate-300 font-normal">Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="hidden sm:flex absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center backdrop-blur-sm transition-all z-20"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="hidden sm:flex absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center backdrop-blur-sm transition-all z-20"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Carousel Dots */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-20">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 sm:h-2 rounded-full transition-all ${
                  currentSlide === idx ? 'w-6 sm:w-8 bg-white' : 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Shop By Category (Iconic Circular Avatars) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-2xl font-serif font-black text-white tracking-tight">
              Shop by Category
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">Explore authentic premium departments</p>
          </div>
          <button
            onClick={() => {
              setSelectedCategoryFilter('all');
              document.getElementById('catalog-products-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex sm:grid sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-6 overflow-x-auto scrollbar-none pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          {CIRCLE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoryFilter(cat.slug);
                document.getElementById('catalog-products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center group text-center focus:outline-none cursor-pointer shrink-0 w-20 sm:w-auto"
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-amber-400 shadow-md group-hover:shadow-amber-400/20 transition-all p-0.5 sm:p-1 bg-slate-900">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-amber-400 mt-1.5 sm:mt-2 line-clamp-2 transition-colors">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Value Props Bar */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center font-bold shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-100 leading-tight">Fast Free Shipping</h4>
              <p className="text-[9px] sm:text-[11px] text-slate-400">On orders over $35</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-100 leading-tight">100% Quality Vetted</h4>
              <p className="text-[9px] sm:text-[11px] text-slate-400">Authentic items</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-100 leading-tight">Certified Network</h4>
              <p className="text-[9px] sm:text-[11px] text-slate-400">Direct fulfillment</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-100 leading-tight">Escrow Protected</h4>
              <p className="text-[9px] sm:text-[11px] text-slate-400">Secure wallet</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Deals & Top Sellers Spotlight */}
      {featuredDeals.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-slate-950" />
                  Top Deals
                </span>
                <h2 className="text-lg sm:text-2xl font-serif font-black text-white tracking-tight">
                  Featured & Best Sellers
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 line-clamp-1 sm:line-clamp-none">
                Deep discounts on gaming laptops, graphics cards, smartphones, tech audio, and verified essentials
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedCategoryFilter('all');
                document.getElementById('catalog-products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 self-start sm:self-center transition-colors cursor-pointer"
            >
              <span>View All ({publishedProducts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {featuredDeals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => onSelectProduct(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. Complete Storefront Catalog */}
      <section id="catalog-products-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8 scroll-mt-20">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Full Catalog
                </span>
                <h2 className="text-lg sm:text-2xl font-serif font-black text-white tracking-tight">
                  Explore Store Products
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Browse our complete collection of verified authentic items across all departments
              </p>
            </div>

            {/* Controls: View Mode & Price Filter */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl shrink-0">
                <button
                  onClick={() => setCatalogViewMode('grid')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    catalogViewMode === 'grid'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Show all products in a unified grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setCatalogViewMode('departments')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    catalogViewMode === 'departments'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Group products by department"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Departments</span>
                </button>
              </div>

              {/* Price Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 sm:p-1 rounded-lg sm:rounded-xl shrink-0 overflow-x-auto scrollbar-none max-w-full">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1.5 hidden sm:inline">
                  Price:
                </span>
                <button
                  onClick={() => setSelectedPriceFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedPriceFilter === 'all'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedPriceFilter('under50')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedPriceFilter === 'under50'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  &lt;$50
                </button>
                <button
                  onClick={() => setSelectedPriceFilter('under200')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedPriceFilter === 'under200'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  &lt;$200
                </button>
                <button
                  onClick={() => setSelectedPriceFilter('under800')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedPriceFilter === 'under800'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  &lt;$800
                </button>
                <button
                  onClick={() => setSelectedPriceFilter('under1500')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedPriceFilter === 'under1500'
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  &lt;$1.5k
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategoryFilter === 'all'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
              <span>All Products</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {priceFilteredProducts.length}
              </span>
            </button>

            {allCategoryGroups
              .filter((g) => g.products.length > 0)
              .map(({ category, products: gProds }) => {
                const isSelected =
                  selectedCategoryFilter === category.id ||
                  selectedCategoryFilter === category.slug ||
                  selectedCategoryFilter.toLowerCase() === category.name.toLowerCase();
                const Icon = getCategoryIcon(category.slug || category.name);

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategoryFilter(category.slug || category.id)}
                    className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                    <span>{category.name}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {gProds.length}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Empty State */}
        {filteredGridProducts.length === 0 ? (
          <div className="bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-800 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-3 shadow-md">
            <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No products match this filter</h3>
            <p className="text-xs text-slate-400">
              No products found for the selected category and price range. Try clearing your filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategoryFilter('all');
                setSelectedPriceFilter('all');
              }}
              className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold rounded-full shadow-sm hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : catalogViewMode === 'grid' || selectedCategoryFilter !== 'all' ? (
          /* Unified Responsive Grid View (2-column on mobile, 4-column on desktop) */
          <div className="space-y-4">
            {selectedCategoryFilter !== 'all' && (
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                  Showing {filteredGridProducts.length} item{filteredGridProducts.length === 1 ? '' : 's'} in{' '}
                  <span className="text-amber-400 font-black uppercase">
                    {allCategoryGroups.find(
                      (g) =>
                        g.category.id === selectedCategoryFilter ||
                        g.category.slug === selectedCategoryFilter ||
                        g.category.name.toLowerCase() === selectedCategoryFilter.toLowerCase()
                    )?.category.name || selectedCategoryFilter}
                  </span>
                </span>
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                >
                  Show All Products
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
              {filteredGridProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(p) => onSelectProduct(p)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Grouped by Department View */
          <div className="space-y-8 sm:space-y-12">
            {displayedCategoryGroups.map(({ category, products: groupProducts }) => {
              const Icon = getCategoryIcon(category.slug || category.name);

              return (
                <div
                  key={category.id}
                  className="space-y-4 sm:space-y-5 bg-slate-900/60 backdrop-blur-xs p-3.5 sm:p-7 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-md"
                >
                  {/* Category Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center font-bold shrink-0">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-xl font-serif font-black text-white tracking-tight">
                            {category.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-bold text-[10px] sm:text-[11px]">
                            {groupProducts.length} {groupProducts.length === 1 ? 'Product' : 'Products'}
                          </span>
                        </div>
                        {category.description && (
                          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">{category.description}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCategoryFilter(category.slug || category.id);
                        setCatalogViewMode('grid');
                      }}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 self-start sm:self-center transition-colors cursor-pointer"
                    >
                      <span>Focus Department</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Product Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
                    {groupProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onSelect={(p) => onSelectProduct(p)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Brand Trust Strip */}
      <section className="bg-slate-900/80 border-y border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-5">
            Trusted Brands & Certified Manufacturing Partners
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-400 font-bold text-sm">
            {TRUSTED_BRANDS.map((brand, idx) => (
              <span
                key={idx}
                className="hover:text-amber-400 transition-colors cursor-default tracking-wide font-black"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Verified Customer Reviews & Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400" />
            ))}
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-white">
            Real Reviews from Verified Customers
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Over 10,000+ satisfied buyers shopping smarter on Waifair
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CUSTOMER_REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(Math.max(1, Math.min(5, Math.floor(rev.rating || 5))))].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500">{rev.date}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-100">{rev.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed italic">"{rev.comment}"</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-200 block">{rev.name}</span>
                  <span className="text-[10px] text-slate-500">{rev.location}</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified Buyer
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
