import React, { useState, useMemo } from 'react';
import { VariantDetail } from '../../types/pos';
import { formatMoney, getExpiryStatus } from '../../utils/formatters';
import {
  Package,
  Search,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  DollarSign,
  Barcode,
} from 'lucide-react';

interface InventoryViewProps {
  variants: VariantDetail[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({ variants }) => {
  const [search, setSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.category));
    return ['All', ...Array.from(set)];
  }, [variants]);

  const filtered = useMemo(() => {
    return variants.filter((v) => {
      const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
      const matchesLowStock = !filterLowStockOnly || v.quantity_on_hand <= v.low_stock_threshold;
      const q = search.toLowerCase().trim();
      const matchesQuery =
        !q ||
        v.product_name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        v.barcode.includes(q) ||
        (v.shade_name && v.shade_name.toLowerCase().includes(q));

      return matchesCat && matchesLowStock && matchesQuery;
    });
  }, [variants, selectedCategory, filterLowStockOnly, search]);

  const totalValueCents = variants.reduce(
    (sum, v) => sum + v.cost_price_cents * v.quantity_on_hand,
    0
  );
  const totalRetailValueCents = variants.reduce(
    (sum, v) => sum + v.selling_price_cents * v.quantity_on_hand,
    0
  );
  const lowStockCount = variants.filter(
    (v) => v.quantity_on_hand <= v.low_stock_threshold
  ).length;

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden space-y-4">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total SKUs & Variants
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {variants.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Inventory Cost Value
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {formatMoney(totalValueCents)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Projected Retail Value
            </div>
            <div className="text-2xl font-black text-pink-400 font-mono mt-0.5">
              {formatMoney(totalRetailValueCents)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Low Stock Alerts
            </div>
            <div
              className={`text-2xl font-black font-mono mt-0.5 ${
                lowStockCount > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {lowStockCount} Items
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by product, shade, SKU or barcode..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-pink-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Low stock toggle */}
          <button
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
              filterLowStockOnly
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Inventory Variants Table */}
      <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 select-none">
              <tr>
                <th className="py-3 px-4">Brand & Product</th>
                <th className="py-3 px-4">Shade / Variant</th>
                <th className="py-3 px-4">SKU / Barcode</th>
                <th className="py-3 px-4">Cost Price</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Margin %</th>
                <th className="py-3 px-4">Batch / Expiry</th>
                <th className="py-3 px-4 text-right">Stock On Hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((v) => {
                const isLowStock = v.quantity_on_hand <= v.low_stock_threshold;
                const marginPercent = Math.round(
                  ((v.selling_price_cents - v.cost_price_cents) / v.selling_price_cents) * 100
                );
                const expiryInfo = getExpiryStatus(v.expiry_date);

                return (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-pink-400 text-[10px] uppercase">{v.brand}</div>
                      <div className="font-bold text-slate-100">{v.product_name}</div>
                      <div className="text-[10px] text-slate-500">{v.category}</div>
                    </td>

                    <td className="py-3 px-4">
                      {v.shade_name ? (
                        <div className="flex items-center space-x-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 w-fit">
                          {v.shade_code ? (
                            <span
                              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: v.shade_code }}
                            />
                          ) : (
                            <Sparkles className="w-3 h-3 text-pink-400" />
                          )}
                          <span className="font-semibold text-slate-200">{v.shade_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">Standard</span>
                      )}
                      {v.size_volume && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {v.size_volume}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-slate-300">{v.sku}</div>
                      <div className="text-slate-500 flex items-center space-x-1">
                        <Barcode className="w-3 h-3" />
                        <span>{v.barcode}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatMoney(v.cost_price_cents)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {formatMoney(v.selling_price_cents)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {marginPercent}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[11px] font-mono">
                      <div className="text-slate-400">{v.batch_number || 'N/A'}</div>
                      {expiryInfo.status !== 'none' && (
                        <div
                          className={`flex items-center space-x-1 mt-0.5 ${
                            expiryInfo.status === 'expired'
                              ? 'text-rose-400 font-bold'
                              : expiryInfo.status === 'expiring_soon'
                              ? 'text-amber-400 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{v.expiry_date}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center space-x-1 font-mono font-bold text-sm px-2.5 py-1 rounded-xl border ${
                          v.quantity_on_hand <= 0
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : isLowStock
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{v.quantity_on_hand}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
