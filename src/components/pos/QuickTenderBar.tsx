import React, { useEffect } from 'react';
import { PaymentMethod } from '../../types/pos';
import {
  Banknote,
  Smartphone,
  CreditCard,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

interface QuickTenderBarProps {
  totalCents?: number;
  disabled: boolean;
  onQuickPay: (method: PaymentMethod) => void;
  onOpenCheckoutModal: () => void;
}

export const QuickTenderBar: React.FC<QuickTenderBarProps> = ({
  disabled,
  onQuickPay,
  onOpenCheckoutModal,
}) => {
  // Global Hotkeys for cashier speed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'F8') {
        e.preventDefault();
        onOpenCheckoutModal();
      } else if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        onQuickPay('CASH');
      } else if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onQuickPay('MOMO');
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onQuickPay('CARD');
      } else if ((e.key === 'l' || e.key === 'L') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onQuickPay('CREDIT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onQuickPay, onOpenCheckoutModal]);

  return (
    <div className="space-y-2 select-none">
      {/* Primary Checkout Button */}
      <button
        disabled={disabled}
        onClick={onOpenCheckoutModal}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-pink-700 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-between transition-all transform active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <span className="flex items-center space-x-2">
          <span>CHECKOUT & PAY</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 font-bold">
            F8
          </span>
        </span>
        <div className="flex items-center space-x-1.5">
          <span>Complete Sale</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>

      {/* Quick Tender Method Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Cash */}
        <button
          disabled={disabled}
          onClick={() => onQuickPay('CASH')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 text-slate-200 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold group-hover:text-emerald-300">Exact Cash</div>
              <div className="text-[10px] text-slate-400">Cash tender</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-emerald-300">
            [Space]
          </span>
        </button>

        {/* Mobile Money (MoMo) */}
        <button
          disabled={disabled}
          onClick={() => onQuickPay('MOMO')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/50 text-slate-200 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold group-hover:text-amber-300">MoMo Pay</div>
              <div className="text-[10px] text-slate-400">Mobile Money</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-amber-300">
            [M]
          </span>
        </button>

        {/* Card */}
        <button
          disabled={disabled}
          onClick={() => onQuickPay('CARD')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-500/50 text-slate-200 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold group-hover:text-blue-300">Card POS</div>
              <div className="text-[10px] text-slate-400">Visa / Mastercard</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-blue-300">
            [C]
          </span>
        </button>

        {/* Store Credit */}
        <button
          disabled={disabled}
          onClick={() => onQuickPay('CREDIT')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 text-slate-200 transition-all group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold group-hover:text-purple-300">Store Credit</div>
              <div className="text-[10px] text-slate-400">Add to ledger</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-purple-300">
            [L]
          </span>
        </button>
      </div>
    </div>
  );
};
