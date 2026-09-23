import React, { useState, useMemo } from 'react';
import { MasterCatalogProduct } from '../../types/pos';
import { formatMoney } from '../../utils/formatters';
import {
  Sparkles,
  X,
  Search,
  CheckSquare,
  Square,
  PackagePlus,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MasterCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterProducts: MasterCatalogProduct[];
  onImport: (selectedProductIds: string[]) => Promise<number>;
  onImportSuccess: (count: number) => void;
}

export const MasterCatalogModal: React.FC<MasterCatalogModalProps> = ({
  isOpen,
  onClose,
  masterProducts,
  onImport,
  onImportSuccess,
}) => {
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const brands = useMemo(() => {
    const set = new Set<string>();
    masterProducts.forEach((p) => set.add(p.brand));
    return ['All', ...Array.from(set)];
  }, [masterProducts]);

  const filtered = useMemo(() => {
    return masterProducts.filter((p) => {
      const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
      const q = search.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.variants.some((v) => v.shade_name?.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q));

      return matchBrand && matchQuery;
    });
  }, [masterProducts, selectedBrand, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const handleExecuteImport = async () => {
    if (selectedIds.length === 0) return;
    setIsImporting(true);
    try {
      const totalVariants = await onImport(selectedIds);
      setSuccessCount(totalVariants);
      onImportSuccess(totalVariants);
      setTimeout(() => {
        setSuccessCount(null);
        setSelectedIds([]);
        onClose();
      }, 1500);
    } catch (err) {
      alert(`Import error: ${err}`);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  Master Beauty Catalog Onboarding
                </h3>
                <span className="text-[10px] uppercase font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  1-Click Store Setup
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Select industry-standard beauty brands, shades, barcodes, and MSRP pricing to populate your inventory.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-pink-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search master catalog (Rare Beauty, Huda, Dior, NARS, shades)..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Brand Filter */}
          <div className="flex items-center space-x-1.5 overflow-x-auto max-w-md no-scrollbar">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 ${
                  selectedBrand === b
                    ? 'bg-pink-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Select All */}
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors"
          >
            {selectedIds.length === filtered.length && filtered.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-pink-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Select All ({filtered.length})</span>
          </button>
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((prod) => {
            const isSelected = selectedIds.includes(prod.id);
            const totalStock = prod.variants.reduce((sum, v) => sum + v.initial_stock, 0);

            return (
              <div
                key={prod.id}
                onClick={() => toggleSelect(prod.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/90 border-pink-500 ring-2 ring-pink-500/30 shadow-lg shadow-pink-500/10'
                    : 'bg-slate-950/70 hover:bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                      <div>
                        <div className="flex items-center space-x-2 text-[10px] mb-0.5">
                          <span className="font-bold text-pink-400 uppercase tracking-wider">
                            {prod.brand}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{prod.category}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm leading-snug">
                          {prod.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {prod.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-pink-500" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                  </div>

                  {/* Pre-configured Variants & Shade Swatches */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>{prod.variants.length} Pre-configured Shades / Sizes</span>
                      <span className="text-emerald-400 font-mono">
                        ~{totalStock} Initial Units
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {prod.variants.map((v) => (
                        <div
                          key={v.sku}
                          className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300"
                        >
                          {v.shade_code && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: v.shade_code }}
                            />
                          )}
                          <span className="font-medium truncate max-w-[140px]">
                            {v.shade_name || v.size_volume}
                          </span>
                          <span className="text-slate-500 text-[10px] font-mono">
                            {formatMoney(v.suggested_retail_cents)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-slate-600 mb-2" />
              <p className="font-bold text-slate-300">No matching master catalog items</p>
              <p className="text-xs text-slate-500 mt-1">Try another search term or reset brand filters.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Selected: <span className="font-bold text-pink-400 font-mono">{selectedIds.length}</span> products (
            {masterProducts
              .filter((p) => selectedIds.includes(p.id))
              .reduce((sum, p) => sum + p.variants.length, 0)}{' '}
            total shade variants)
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              disabled={selectedIds.length === 0 || isImporting}
              onClick={handleExecuteImport}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {successCount !== null ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Imported {successCount} Variants!</span>
                </>
              ) : isImporting ? (
                <>
                  <Layers className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4" />
                  <span>Import {selectedIds.length} Selected Products</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
