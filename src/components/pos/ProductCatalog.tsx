import React, { useState, useMemo, useRef, useEffect } from 'react';
import { VariantDetail, CartItem } from '../../types/pos';
import { formatMoney } from '../../utils/formatters';
import {
  Search,
  Plus,
  AlertTriangle,
  Barcode,
  Layers,
  Sparkles,
  LayoutList,
  LayoutGrid,
} from 'lucide-react';

interface ProductCatalogProps {
  variants: VariantDetail[];
  cart: CartItem[];
  onAddToCart: (variant: VariantDetail) => void;
  onSimulateScan: (barcode: string) => void;
}

// Fallback cosmetic photo if image_url fails to load
const getCategoryFallbackImage = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('foundation')) {
    return 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=300&q=80';
  }
  if (cat.includes('lip') || cat.includes('gloss')) {
    return 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=300&q=80';
  }
  if (cat.includes('serum') || cat.includes('skincare')) {
    return 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=300&q=80';
  }
  if (cat.includes('cleanse')) {
    return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80';
  }
  if (cat.includes('shadow') || cat.includes('eye')) {
    return 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=300&q=80';
  }
  if (cat.includes('fragrance') || cat.includes('perfume')) {
    return 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=300&q=80';
  }
  return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80';
};

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  variants,
  cart,
  onAddToCart,
  onSimulateScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories and brands
  const categories = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.category));
    return ['All', ...Array.from(set)];
  }, [variants]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.brand));
    return ['All', ...Array.from(set)];
  }, [variants]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const matchesCat =
        selectedCategory === 'All' || v.category === selectedCategory;
      const matchesBrand =
        selectedBrand === 'All' || v.brand === selectedBrand;

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        v.product_name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.barcode.includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        (v.shade_name && v.shade_name.toLowerCase().includes(q)) ||
        (v.size_volume && v.size_volume.toLowerCase().includes(q));

      return matchesCat && matchesBrand && matchesQuery;
    });
  }, [variants, selectedCategory, selectedBrand, searchQuery]);

  // Global hotkey F1 or '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' || (e.key === '/' && (e.target as HTMLElement)?.tagName !== 'INPUT')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Top Search & Filter Bar */}
      <div className="p-3.5 bg-slate-900/95 border-b border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          {/* Search Box */}
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-pink-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, brand, shade, barcode... (F1)"
              className="w-full pl-10 pr-20 py-2.5 bg-slate-950 border border-slate-700/90 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all font-medium shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-12 text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 transition-colors"
              >
                Clear
              </button>
            )}
            <span className="absolute right-3 text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none">
              F1
            </span>
          </div>

          {/* List vs Grid Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              title="List View (Recommended)"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories & Brands Selector */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <div className="flex items-center space-x-1.5 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-slate-700 shrink-0 mx-1" />

          <div className="flex items-center space-x-1 shrink-0">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-2.5 py-1.5 rounded-xl font-medium text-[11px] transition-all shrink-0 ${
                  selectedBrand === b
                    ? 'bg-slate-800 text-pink-300 border border-pink-500/50 shadow-sm'
                    : 'bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800/50'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {/* ===================== LIST VIEW (DEFAULT) ===================== */}
        {viewMode === 'list' && (
          <div className="space-y-2">
            {filteredVariants.map((v) => {
              const cartItem = cart.find((c) => c.variant.id === v.id);
              const cartQty = cartItem ? cartItem.quantity : 0;
              const isLowStock = v.quantity_on_hand <= v.low_stock_threshold && v.quantity_on_hand > 0;
              const isOutOfStock = v.quantity_on_hand <= 0;
              const imgSrc = v.image_url || getCategoryFallbackImage(v.category);

              return (
                <div
                  key={v.id}
                  onClick={() => !isOutOfStock && onAddToCart(v)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-150 select-none ${
                    isOutOfStock
                      ? 'bg-slate-950/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                      : cartQty > 0
                      ? 'bg-slate-900/90 border-pink-500/60 shadow-md shadow-pink-500/5 cursor-pointer ring-1 ring-pink-500/20'
                      : 'bg-slate-950/80 hover:bg-slate-900/90 border-slate-800/90 hover:border-slate-700 cursor-pointer shadow-sm'
                  }`}
                >
                  {/* Left: Product Picture + Shade Swatch Indicator */}
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
                      <img
                        src={imgSrc}
                        alt={v.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryFallbackImage(v.category);
                        }}
                      />
                      {/* Shade Color Hex Dot overlay on photo */}
                      {v.shade_code && (
                        <div
                          className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-md"
                          style={{ backgroundColor: v.shade_code }}
                          title={`Shade Color: ${v.shade_name || v.shade_code}`}
                        />
                      )}
                    </div>

                    {/* Middle: Product Name, Brand, Shade & Size */}
                    <div className="min-w-0 flex-1 pr-3">
                      {/* Brand & Category */}
                      <div className="flex items-center space-x-2 text-[11px] mb-0.5">
                        <span className="font-bold text-pink-400 uppercase tracking-wider truncate">
                          {v.brand}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 truncate">{v.category}</span>
                      </div>

                      {/* Product Name */}
                      <h4 className="font-bold text-slate-100 text-sm leading-snug truncate group-hover:text-pink-200 transition-colors">
                        {v.product_name}
                      </h4>

                      {/* Shade Details & Size */}
                      <div className="flex items-center space-x-2 mt-1 text-xs text-slate-300">
                        {v.shade_name ? (
                          <span className="font-medium text-slate-300 truncate">
                            {v.shade_name}
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center space-x-1">
                            <Sparkles className="w-3 h-3 text-pink-400" />
                            <span>Standard</span>
                          </span>
                        )}
                        {v.size_volume && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400 font-mono text-[11px]">
                              {v.size_volume}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Available Stock, Price, and Big Plus Button */}
                  <div className="flex items-center space-x-4 shrink-0">
                    {/* Available Stock Badge */}
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          isOutOfStock
                            ? 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                            : isLowStock
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>
                          {isOutOfStock
                            ? '0 Out of stock'
                            : isLowStock
                            ? `${v.quantity_on_hand} Low stock`
                            : `${v.quantity_on_hand} in stock`}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="w-20 text-right">
                      <span className="text-base font-extrabold text-white tracking-tight">
                        {formatMoney(v.selling_price_cents)}
                      </span>
                    </div>

                    {/* Barcode Quick Trigger & Plus Button */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSimulateScan(v.barcode);
                        }}
                        title={`Simulate Hardware Laser Scan (${v.barcode})`}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-pink-300 border border-slate-800 transition-colors"
                      >
                        <Barcode className="w-4 h-4" />
                      </button>

                      {/* Prominent Plus (+) Action Button */}
                      <button
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) onAddToCart(v);
                        }}
                        title={isOutOfStock ? 'Item is out of stock' : 'Add to cart'}
                        className={`relative flex items-center justify-center w-10 h-10 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                          cartQty > 0
                            ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/30'
                            : 'bg-slate-800 hover:bg-pink-600 text-slate-200 hover:text-white border border-slate-700/80 hover:border-pink-500'
                        }`}
                      >
                        {cartQty > 0 ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-black">{cartQty}</span>
                            <Plus className="w-3 h-3 -mt-0.5" />
                          </div>
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== GRID VIEW (ALTERNATIVE) ===================== */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
            {filteredVariants.map((v) => {
              const cartItem = cart.find((c) => c.variant.id === v.id);
              const cartQty = cartItem ? cartItem.quantity : 0;
              const isLowStock = v.quantity_on_hand <= v.low_stock_threshold && v.quantity_on_hand > 0;
              const isOutOfStock = v.quantity_on_hand <= 0;
              const imgSrc = v.image_url || getCategoryFallbackImage(v.category);

              return (
                <div
                  key={v.id}
                  onClick={() => !isOutOfStock && onAddToCart(v)}
                  className={`group relative flex flex-col justify-between p-3 rounded-2xl border transition-all duration-150 select-none ${
                    isOutOfStock
                      ? 'bg-slate-900/30 border-slate-800/50 opacity-60 cursor-not-allowed'
                      : cartQty > 0
                      ? 'bg-slate-900/90 border-pink-500/50 shadow-md shadow-pink-500/10 cursor-pointer'
                      : 'bg-slate-950/80 hover:bg-slate-900/90 border-slate-800 hover:border-pink-500/40 cursor-pointer shadow-sm'
                  }`}
                >
                  {/* Cart Quantity Badge */}
                  {cartQty > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-pink-500/40 ring-2 ring-slate-950 z-10">
                      {cartQty}
                    </div>
                  )}

                  {/* Top Photo & Brand */}
                  <div>
                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-900 mb-2.5 border border-slate-800">
                      <img
                        src={imgSrc}
                        alt={v.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                      {v.shade_code && (
                        <div
                          className="absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-slate-950 shadow-md"
                          style={{ backgroundColor: v.shade_code }}
                          title={`Hex: ${v.shade_code}`}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-pink-400 uppercase tracking-wider truncate">
                        {v.brand}
                      </span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">
                        {v.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-xs leading-snug line-clamp-2 group-hover:text-pink-200 transition-colors">
                      {v.product_name}
                    </h4>

                    {v.shade_name && (
                      <p className="text-[11px] text-slate-300 truncate mt-1">
                        {v.shade_name}
                      </p>
                    )}
                  </div>

                  {/* Bottom: Stock & Price + Plus Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">
                        {formatMoney(v.selling_price_cents)}
                      </div>
                      <div
                        className={`text-[10px] font-bold ${
                          isOutOfStock
                            ? 'text-rose-400'
                            : isLowStock
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {isOutOfStock ? '0 in stock' : `${v.quantity_on_hand} in stock`}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSimulateScan(v.barcode);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-pink-300"
                      >
                        <Barcode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={isOutOfStock}
                        className="p-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white shadow-sm disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredVariants.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 text-sm">
            <AlertTriangle className="w-10 h-10 text-slate-600 mb-2" />
            <p className="font-bold text-slate-300 text-base">No products found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try searching with a different term or clear category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedBrand('All');
              }}
              className="mt-4 px-4 py-1.5 rounded-xl bg-pink-600 text-white text-xs font-bold hover:bg-pink-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
