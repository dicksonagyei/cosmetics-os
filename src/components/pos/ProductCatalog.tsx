import React, { useState, useMemo, useRef, useEffect } from 'react';
import { VariantDetail, CartItem } from '../../types/pos';
import { formatMoney, getExpiryStatus } from '../../utils/formatters';
import {
  Search,
  Plus,
  AlertTriangle,
  Barcode,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProductCatalogProps {
  variants: VariantDetail[];
  cart: CartItem[];
  onAddToCart: (variant: VariantDetail) => void;
  onSimulateScan: (barcode: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  variants,
  cart,
  onAddToCart,
  onSimulateScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
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
    <div className="flex flex-col h-full bg-slate-900/50 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Search & Quick Filter Bar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 space-y-2.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, shades, SKU, or scan barcode... (Press F1)"
            className="w-full pl-10 pr-24 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-12 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
          <span className="absolute right-3 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
            F1
          </span>
        </div>

        {/* Categories & Brands Horizontal Scroll */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <div className="flex items-center space-x-1 shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-pink-600 text-white shadow-sm shadow-pink-600/30'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all shrink-0 ${
                  selectedBrand === b
                    ? 'bg-slate-700 text-pink-300 border border-pink-500/40'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-max">
        {filteredVariants.map((v) => {
          const cartItem = cart.find((c) => c.variant.id === v.id);
          const cartQty = cartItem ? cartItem.quantity : 0;
          const isLowStock = v.quantity_on_hand <= v.low_stock_threshold;
          const isOutOfStock = v.quantity_on_hand <= 0;
          const expiryInfo = getExpiryStatus(v.expiry_date);

          return (
            <div
              key={v.id}
              onClick={() => !isOutOfStock && onAddToCart(v)}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all duration-150 select-none ${
                isOutOfStock
                  ? 'bg-slate-900/30 border-slate-800/50 opacity-60 cursor-not-allowed'
                  : 'bg-slate-950/70 hover:bg-slate-900/90 border-slate-800 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/5 cursor-pointer'
              }`}
            >
              {/* Cart Quantity Badge */}
              {cartQty > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pink-500 text-white font-bold text-xs flex items-center justify-center shadow-lg shadow-pink-500/40 ring-2 ring-slate-950 z-10 animate-scale-up">
                  {cartQty}
                </div>
              )}

              {/* Top: Brand & Category */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-pink-400 uppercase tracking-wider truncate">
                    {v.brand}
                  </span>
                  <span className="text-[10px] bg-slate-800/80 px-1.5 py-0.2 rounded font-mono text-slate-300 shrink-0 ml-1">
                    {v.category}
                  </span>
                </div>

                {/* Product Name */}
                <h4 className="font-bold text-slate-100 text-xs leading-snug line-clamp-2 group-hover:text-pink-300 transition-colors">
                  {v.product_name}
                </h4>

                {/* Shade Swatch & Volume */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {v.shade_name && (
                    <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800 text-[11px] text-slate-300 max-w-full">
                      {v.shade_code ? (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: v.shade_code }}
                          title={`Hex: ${v.shade_code}`}
                        />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5 text-pink-400 shrink-0" />
                      )}
                      <span className="truncate font-medium">{v.shade_name}</span>
                    </div>
                  )}

                  {v.size_volume && (
                    <span className="text-[10px] bg-slate-800/60 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {v.size_volume}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom: Stock, Expiry & Price */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-end justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-base font-extrabold text-white tracking-tight">
                      {formatMoney(v.selling_price_cents)}
                    </span>
                  </div>

                  {/* Stock & Expiry indicators */}
                  <div className="flex items-center space-x-2 mt-1 text-[10px]">
                    <span
                      className={`font-semibold flex items-center space-x-0.5 ${
                        isOutOfStock
                          ? 'text-rose-400'
                          : isLowStock
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      <Layers className="w-2.5 h-2.5" />
                      <span>{isOutOfStock ? 'Out of stock' : `${v.quantity_on_hand} in stock`}</span>
                    </span>

                    {expiryInfo.status !== 'none' && (
                      <span
                        className={`font-mono flex items-center space-x-0.5 ${
                          expiryInfo.status === 'expired'
                            ? 'text-rose-400 font-bold'
                            : expiryInfo.status === 'expiring_soon'
                            ? 'text-amber-400 font-semibold'
                            : 'text-slate-400'
                        }`}
                        title={`Expiry Date: ${v.expiry_date}`}
                      >
                        <Calendar className="w-2.5 h-2.5" />
                        <span>{expiryInfo.label}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Add or Barcode Trigger */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimulateScan(v.barcode);
                    }}
                    title={`Scan Barcode: ${v.barcode}`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-pink-300 transition-colors"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={isOutOfStock}
                    className="p-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredVariants.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 text-sm">
            <AlertTriangle className="w-8 h-8 text-slate-600 mb-2" />
            <p className="font-semibold text-slate-400">No cosmetics products matched your search.</p>
            <p className="text-xs text-slate-500 mt-1">
              Try searching by shade, barcode, or change selected brand/category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
