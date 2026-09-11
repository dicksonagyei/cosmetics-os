import React from 'react';
import { formatMoney } from '../../utils/formatters';
import { Calculator } from 'lucide-react';

interface TotalsSummaryProps {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
}

export const TotalsSummary: React.FC<TotalsSummaryProps> = ({
  subtotalCents,
  discountCents,
  taxCents,
  totalCents,
}) => {
  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 select-none space-y-2.5 shadow-xl">
      <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800/80">
        <Calculator className="w-3.5 h-3.5 text-pink-400" />
        <span>Cart Totals Breakdown</span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span>Subtotal</span>
          <span className="font-mono font-semibold">{formatMoney(subtotalCents)}</span>
        </div>

        {discountCents > 0 && (
          <div className="flex items-center justify-between text-rose-400 font-semibold">
            <span>Discounts</span>
            <span className="font-mono">-{formatMoney(discountCents)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-400 text-[11px]">
          <span>VAT / Tax (15%)</span>
          <span className="font-mono">{formatMoney(taxCents)}</span>
        </div>
      </div>

      {/* Grand Total Box */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
        <div>
          <div className="text-[10px] uppercase font-extrabold tracking-wider text-pink-400">
            Payable Amount
          </div>
          <div className="text-xs text-slate-400 font-medium">Net Grand Total</div>
        </div>
        <div className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 font-mono">
          {formatMoney(totalCents)}
        </div>
      </div>
    </div>
  );
};
