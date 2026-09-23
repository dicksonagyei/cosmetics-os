import React, { useState } from 'react';
import { VariantDetail, StockAdjustmentReason, StockAdjustmentRequest } from '../../types/pos';
import {
  ShieldAlert,
  X,
  ArrowRight,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: VariantDetail | null;
  onRequestAdjustment: (data: {
    variant_id: string;
    new_quantity: number;
    reason: StockAdjustmentReason;
    notes?: string;
    requested_by: string;
  }) => Promise<StockAdjustmentRequest>;
  onAdjustmentRequested: (request: StockAdjustmentRequest) => void;
}

const REASON_LABELS: Record<StockAdjustmentReason, { label: string; desc: string }> = {
  DAMAGED_TESTER: {
    label: '💄 Counter Tester / Display Sample',
    desc: 'Product converted to floor sample/tester for customer swatching.',
  },
  EXPIRED: {
    label: '⏳ Expired Batch Discard',
    desc: 'Product past PAO (Period After Opening) or batch expiry date.',
  },
  AUDIT_DISCREPANCY: {
    label: '📋 Physical Count Variance / Audit',
    desc: 'Discovered difference between shelf physical count and system count.',
  },
  RESTOCK_SHIPMENT: {
    label: '📦 Supplier Restock Shipment Delivery',
    desc: 'Direct replenishment received into stockroom.',
  },
  THEFT_LOSS: {
    label: '⚠️ Breakage / Shrinkage / Loss',
    desc: 'Product broken on shop floor or unrecorded shrinkage.',
  },
  SUPPLIER_RETURN: {
    label: '↩️ Return to Beauty Vendor',
    desc: 'Faulty pump or incorrect batch returned to distributor.',
  },
  OTHER: {
    label: '📝 General Inventory Correction',
    desc: 'Other administrative stock correction.',
  },
};

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  variant,
  onRequestAdjustment,
  onAdjustmentRequested,
}) => {
  const [newQuantity, setNewQuantity] = useState<number>(variant?.quantity_on_hand ?? 0);
  const [reason, setReason] = useState<StockAdjustmentReason>('DAMAGED_TESTER');
  const [notes, setNotes] = useState('');
  const [requestedBy, setRequestedBy] = useState('Floor Staff (Ama)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync initial state when variant changes
  React.useEffect(() => {
    if (variant) {
      setNewQuantity(variant.quantity_on_hand);
    }
  }, [variant]);

  if (!isOpen || !variant) return null;

  const currentQty = variant.quantity_on_hand;
  const delta = newQuantity - currentQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (delta === 0) {
      alert('New quantity is the same as current stock.');
      return;
    }

    setIsSubmitting(true);
    try {
      const req = await onRequestAdjustment({
        variant_id: variant.id,
        new_quantity: newQuantity,
        reason,
        notes,
        requested_by: requestedBy,
      });
      onAdjustmentRequested(req);
      onClose();
    } catch (err) {
      alert(`Adjustment request error: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-white">Stock Adjustment Request</h3>
                <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Dual-Control Governance
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                To prevent unauthorized stock alterations, this adjustment requires Manager / Cashier authorization.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Variant Card */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-pink-400 uppercase">{variant.brand}</div>
              <div className="font-bold text-white text-xs">{variant.product_name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                {variant.shade_name && (
                  <span className="flex items-center space-x-1">
                    {variant.shade_code && (
                      <span
                        className="w-2 h-2 rounded-full border border-white/20 inline-block"
                        style={{ backgroundColor: variant.shade_code }}
                      />
                    )}
                    <span>{variant.shade_name}</span>
                  </span>
                )}
                <span>•</span>
                <span className="font-mono text-slate-500">{variant.sku}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Current Stock</div>
              <div className="text-lg font-mono font-black text-slate-200">
                {variant.quantity_on_hand}
              </div>
            </div>
          </div>

          {/* Quantity Adjustment Diff */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase">
              New Count on Hand & Variance
            </label>

            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value || '0', 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-black text-white focus:outline-none focus:border-amber-500 text-center"
                />
              </div>

              <div className="text-slate-500">
                <ArrowRight className="w-5 h-5" />
              </div>

              <div className="flex-1 bg-slate-900 p-2 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Net Variance</div>
                <div
                  className={`text-base font-mono font-black ${
                    delta > 0
                      ? 'text-emerald-400'
                      : delta < 0
                      ? 'text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Audit Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjustmentReason)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {Object.entries(REASON_LABELS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1">{REASON_LABELS[reason].desc}</p>
          </div>

          {/* Notes / Reason Memo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Audit Notes / Incident Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 2 damaged bottles opened for customer counter sampling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Requestor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
              Submitted By
            </label>
            <input
              type="text"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          {/* Security Alert Footnote */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl flex items-start space-x-2 text-[11px] text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Submitting creates a pending request. Stock counts will <strong>not</strong> change until reviewed and approved by the Store Manager.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || delta === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Manager Approval'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
