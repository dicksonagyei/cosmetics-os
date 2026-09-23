import React, { useState, useMemo } from 'react';
import {
  VariantDetail,
  MasterCatalogProduct,
  StockAdjustmentRequest,
  StockAdjustmentReason,
  CsvImportProductRow,
} from '../../types/pos';
import { formatMoney, getExpiryStatus } from '../../utils/formatters';
import { MasterCatalogModal } from './MasterCatalogModal';
import { CsvImportModal } from './CsvImportModal';
import { NewProductModal } from './NewProductModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { PendingApprovalsDrawer } from './PendingApprovalsDrawer';
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
  UploadCloud,
  Plus,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

interface InventoryViewProps {
  variants: VariantDetail[];
  masterProducts: MasterCatalogProduct[];
  stockAdjustmentRequests: StockAdjustmentRequest[];
  onImportMaster: (productIds: string[]) => Promise<number>;
  onImportCsv: (rows: CsvImportProductRow[]) => Promise<number>;
  onCreateProduct: (data: {
    product_name: string;
    brand: string;
    category: string;
    description?: string;
    image_url?: string;
    variants: {
      sku: string;
      barcode: string;
      shade_name?: string;
      shade_code?: string;
      size_volume?: string;
      cost_price_cents: number;
      selling_price_cents: number;
      expiry_date?: string;
      batch_number?: string;
      low_stock_threshold?: number;
      quantity_on_hand: number;
    }[];
  }) => Promise<VariantDetail[]>;
  onRequestStockAdjustment: (data: {
    variant_id: string;
    new_quantity: number;
    reason: StockAdjustmentReason;
    notes?: string;
    requested_by: string;
  }) => Promise<StockAdjustmentRequest>;
  onApproveStockAdjustment: (requestId: string, reviewerName: string) => Promise<void>;
  onRejectStockAdjustment: (requestId: string, reviewerName: string, reason?: string) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  variants,
  masterProducts,
  stockAdjustmentRequests,
  onImportMaster,
  onImportCsv,
  onCreateProduct,
  onRequestStockAdjustment,
  onApproveStockAdjustment,
  onRejectStockAdjustment,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal open states
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedVariantForAdj, setSelectedVariantForAdj] = useState<VariantDetail | null>(null);
  const [isApprovalsDrawerOpen, setIsApprovalsDrawerOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

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

  const pendingApprovalsCount = stockAdjustmentRequests.filter(
    (r) => r.status === 'PENDING_APPROVAL'
  ).length;

  const handleOpenAdjustment = (v: VariantDetail) => {
    setSelectedVariantForAdj(v);
    setIsAdjustmentModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3.5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl shadow-2xl border bg-emerald-950/90 text-emerald-300 border-emerald-500/50 flex items-center space-x-2 text-xs font-bold animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar & Superpowers */}
      <div className="flex items-center justify-between gap-3 shrink-0 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Store Inventory & Catalog Hub</h2>
            <div className="text-[11px] text-slate-400">
              {variants.length} Active SKUs • {pendingApprovalsCount} Stock Approvals Pending
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {/* Master Catalog Button */}
          <button
            onClick={() => setIsMasterModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Catalog</span>
          </button>

          {/* Excel / CSV Importer */}
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import CSV / Excel</span>
          </button>

          {/* New Custom Product */}
          <button
            onClick={() => setIsNewProductModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-pink-400" />
            <span>New Product</span>
          </button>

          {/* Stock Approvals Drawer Trigger */}
          <button
            onClick={() => setIsApprovalsDrawerOpen(true)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              pendingApprovalsCount > 0
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black animate-pulse'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Stock Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="bg-slate-950 text-amber-300 px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-4 gap-3.5 shrink-0">
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total SKUs & Variants
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {variants.length}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Inventory Cost Value
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {formatMoney(totalValueCents)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Projected Retail Value
            </div>
            <div className="text-xl font-black text-pink-400 font-mono mt-0.5">
              {formatMoney(totalRetailValueCents)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Low Stock Alerts
            </div>
            <div
              className={`text-xl font-black font-mono mt-0.5 ${
                lowStockCount > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {lowStockCount} Items
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by brand, product, shade, SKU or barcode..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
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
            <span>Low Stock ({lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Inventory Variants Table */}
      <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/90 sticky top-0 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 select-none">
              <tr>
                <th className="py-2.5 px-3">Product & Brand</th>
                <th className="py-2.5 px-3">Shade / Variant</th>
                <th className="py-2.5 px-3">SKU & Barcode</th>
                <th className="py-2.5 px-3">Cost Price</th>
                <th className="py-2.5 px-3">Retail Price</th>
                <th className="py-2.5 px-3">Margin %</th>
                <th className="py-2.5 px-3">Batch / Expiry</th>
                <th className="py-2.5 px-3 text-center">Stock On Hand</th>
                <th className="py-2.5 px-3 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((v) => {
                const isLowStock = v.quantity_on_hand <= v.low_stock_threshold && v.quantity_on_hand > 0;
                const isOutOfStock = v.quantity_on_hand <= 0;
                const marginPercent = Math.round(
                  ((v.selling_price_cents - v.cost_price_cents) / v.selling_price_cents) * 100
                );
                const expiryInfo = getExpiryStatus(v.expiry_date);

                // Check if this variant has a pending adjustment request
                const hasPending = stockAdjustmentRequests.some(
                  (r) => r.variant_id === v.id && r.status === 'PENDING_APPROVAL'
                );

                return (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2.5">
                        {v.image_url ? (
                          <img
                            src={v.image_url}
                            alt={v.product_name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-pink-400 shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-pink-400 text-[10px] uppercase">{v.brand}</div>
                          <div className="font-bold text-slate-100">{v.product_name}</div>
                          <div className="text-[10px] text-slate-500">{v.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
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

                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <div className="text-slate-300">{v.sku}</div>
                      <div className="text-slate-500 flex items-center space-x-1">
                        <Barcode className="w-3 h-3" />
                        <span>{v.barcode}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {formatMoney(v.cost_price_cents)}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-white">
                      {formatMoney(v.selling_price_cents)}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {marginPercent}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-[11px] font-mono">
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

                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`inline-flex items-center space-x-1 font-mono font-bold text-sm px-2.5 py-1 rounded-xl border ${
                            isOutOfStock
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : isLowStock
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{v.quantity_on_hand}</span>
                        </span>

                        {hasPending && (
                          <span className="text-[9px] font-bold text-amber-400 uppercase mt-0.5 animate-pulse">
                            Req Pending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleOpenAdjustment(v)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center space-x-1 ml-auto transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" />
                        <span>Adjust Stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Master Catalog Modal */}
      <MasterCatalogModal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        masterProducts={masterProducts}
        onImport={onImportMaster}
        onImportSuccess={async (count) => {
          showToast(`Successfully imported ${count} beauty variants from Master Catalog!`);
          await onRefreshData();
        }}
      />

      {/* CSV / Excel Ingestion Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportCsv={onImportCsv}
        onImportSuccess={async (count) => {
          showToast(`Successfully ingested ${count} products from spreadsheet!`);
          await onRefreshData();
        }}
      />

      {/* New Product Creator Modal */}
      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onCreateProduct={onCreateProduct}
        onProductCreated={async (items) => {
          showToast(`Created product with ${items.length} shade variants!`);
          await onRefreshData();
        }}
      />

      {/* Stock Adjustment Request Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setSelectedVariantForAdj(null);
        }}
        variant={selectedVariantForAdj}
        onRequestAdjustment={onRequestStockAdjustment}
        onAdjustmentRequested={async (req) => {
          showToast(`Stock adjustment request submitted for ${req.product_name} (${req.quantity_delta > 0 ? `+${req.quantity_delta}` : req.quantity_delta})!`);
          await onRefreshData();
        }}
      />

      {/* Pending Approvals Drawer */}
      <PendingApprovalsDrawer
        isOpen={isApprovalsDrawerOpen}
        onClose={() => setIsApprovalsDrawerOpen(false)}
        requests={stockAdjustmentRequests}
        onApprove={async (id, reviewer) => {
          await onApproveStockAdjustment(id, reviewer);
          showToast('Stock adjustment approved & live inventory updated!');
          await onRefreshData();
        }}
        onReject={async (id, reviewer, reason) => {
          await onRejectStockAdjustment(id, reviewer, reason);
          showToast('Stock adjustment request declined.');
          await onRefreshData();
        }}
      />
    </div>
  );
};
