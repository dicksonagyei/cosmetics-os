import React, { useState } from 'react';
import { StockAdjustmentRequest } from '../../types/pos';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  History,
} from 'lucide-react';

interface PendingApprovalsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requests: StockAdjustmentRequest[];
  onApprove: (requestId: string, reviewerName: string) => Promise<void>;
  onReject: (requestId: string, reviewerName: string, reason?: string) => Promise<void>;
}

export const PendingApprovalsDrawer: React.FC<PendingApprovalsDrawerProps> = ({
  isOpen,
  onClose,
  requests,
  onApprove,
  onReject,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingList = requests.filter((r) => r.status === 'PENDING_APPROVAL');
  const historyList = requests.filter((r) => r.status !== 'PENDING_APPROVAL');

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onApprove(id, 'Pius (Head Cashier / Store Admin)');
    } catch (err) {
      alert(`Approval error: ${err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (id: string) => {
    setProcessingId(id);
    try {
      await onReject(id, 'Pius (Head Cashier / Store Admin)', rejectReason);
      setRejectingRequestId(null);
      setRejectReason('');
    } catch (err) {
      alert(`Rejection error: ${err}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-xl h-full flex flex-col shadow-2xl overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  Stock Authorization & Approvals
                </h3>
                {pendingList.length > 0 && (
                  <span className="text-[10px] uppercase font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
                    {pendingList.length} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Dual-control review center to authorize or decline store stock count modifications.
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

        {/* Tab Switcher */}
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Authorizations ({pendingList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'history'
                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History ({historyList.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {activeSubTab === 'pending' && (
            <>
              {pendingList.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-pink-400 uppercase">
                        {req.brand}
                      </div>
                      <h4 className="font-bold text-white text-sm">{req.product_name}</h4>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2 font-mono">
                        <span>{req.shade_name || 'Standard'}</span>
                        <span>•</span>
                        <span className="text-slate-500">{req.sku}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Proposed Count
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono">
                        <span className="text-slate-400 text-xs line-through">
                          {req.previous_quantity}
                        </span>
                        <span className="text-white font-black text-base">➔</span>
                        <span className="text-white font-black text-base">{req.new_quantity}</span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            req.quantity_delta > 0
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {req.quantity_delta > 0
                            ? `+${req.quantity_delta}`
                            : req.quantity_delta}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason & Notes */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Reason:</span>
                      <span className="font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                        {req.reason.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {req.notes && (
                      <p className="text-slate-300 italic text-[11px] pl-1 border-l-2 border-slate-700">
                        "{req.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span>Submitted by: <strong>{req.requested_by}</strong></span>
                      <span>{new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Reject Reason Form if active */}
                  {rejectingRequestId === req.id ? (
                    <div className="p-3 bg-rose-950/40 rounded-xl border border-rose-800/50 space-y-2">
                      <label className="block text-[10px] font-bold text-rose-300 uppercase">
                        Reason for Rejection:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Please recount physically, stock doesn't match..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full bg-slate-950 border border-rose-700 rounded-lg p-2 text-xs text-white"
                      />
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setRejectingRequestId(null)}
                          className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmReject(req.id)}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Approval Action Buttons */
                    <div className="flex items-center justify-end space-x-2.5 pt-1">
                      <button
                        disabled={processingId === req.id}
                        onClick={() => setRejectingRequestId(req.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>

                      <button
                        disabled={processingId === req.id}
                        onClick={() => handleApprove(req.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all"
                      >
                        {processingId === req.id ? (
                          <Layers className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Authorize Adjustment</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {pendingList.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                  <p className="font-bold text-white text-sm">All Adjustments Cleared!</p>
                  <p className="text-xs text-slate-400 mt-1">
                    No pending stock adjustment authorizations at this moment.
                  </p>
                </div>
              )}
            </>
          )}

          {activeSubTab === 'history' && (
            <div className="space-y-3">
              {historyList.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 opacity-90"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">{req.product_name}</span>
                      <div className="text-[10px] text-slate-400">
                        {req.brand} • {req.shade_name || 'Standard'}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        req.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-lg">
                    <span>
                      {req.previous_quantity} ➔ {req.new_quantity} ({req.quantity_delta > 0 ? `+${req.quantity_delta}` : req.quantity_delta})
                    </span>
                    <span className="text-[10px] text-slate-500">{req.reason}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Reviewed by: {req.reviewed_by}</span>
                    <span>{req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              ))}

              {historyList.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                  <p className="text-xs">No historical adjustment records yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
