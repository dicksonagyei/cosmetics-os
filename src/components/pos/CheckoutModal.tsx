import React, { useState, useEffect } from 'react';
import { Customer, PaymentItem, PaymentMethod } from '../../types/pos';
import { formatMoney } from '../../utils/formatters';
import {
  X,
  Banknote,
  Smartphone,
  CreditCard,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalCents: number;
  customer: Customer | null;
  onCompleteCheckout: (payments: PaymentItem[], shouldPrintReceipt: boolean) => void;
  initialMethod?: PaymentMethod;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  totalCents,
  customer,
  onCompleteCheckout,
  initialMethod = 'CASH',
}) => {
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [tenderAmountDollars, setTenderAmountDollars] = useState<string>(
    (totalCents / 100).toFixed(2)
  );
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [momoProvider, setMomoProvider] = useState<'MTN' | 'TELECEL' | 'AIRTELTIGO'>('MTN');
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState<boolean>(true);

  // Sync initial method when modal opens
  useEffect(() => {
    if (isOpen) {
      setMethod(initialMethod);
      setTenderAmountDollars((totalCents / 100).toFixed(2));
      setReferenceNo('');
    }
  }, [isOpen, initialMethod, totalCents]);

  if (!isOpen) return null;

  const tenderCents = Math.round((parseFloat(tenderAmountDollars) || 0) * 100);
  const changeCents = Math.max(0, tenderCents - totalCents);

  // Credit validations
  const isCredit = method === 'CREDIT';
  const availableCreditCents = customer
    ? Math.max(0, customer.credit_limit_cents - customer.outstanding_balance_cents)
    : 0;
  const isOverCreditLimit = isCredit && (!customer || totalCents > availableCreditCents);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOverCreditLimit) return;

    let finalRef = referenceNo;
    if (method === 'MOMO') {
      finalRef = `${momoProvider}-${referenceNo || 'APP'}`;
    }

    const payments: PaymentItem[] = [
      {
        payment_method: method,
        amount_cents: isCredit ? totalCents : Math.min(tenderCents, totalCents),
        reference_no: finalRef || undefined,
      },
    ];

    onCompleteCheckout(payments, shouldPrintReceipt);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Payment & Checkout Tender</h3>
              <p className="text-[11px] text-slate-400">Select payment method & complete transaction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Total Amount Display */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Total Amount Due
              </span>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 font-mono">
                {formatMoney(totalCents)}
              </div>
            </div>

            {customer ? (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-purple-400">Customer Account</span>
                <div className="text-xs font-bold text-slate-200">{customer.full_name}</div>
                {customer.credit_limit_cents > 0 && (
                  <div className="text-[10px] text-emerald-400 font-mono">
                    Avail Credit: {formatMoney(availableCreditCents)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-right text-xs text-slate-400 font-medium">
                Walk-In Retail Customer
              </div>
            )}
          </div>

          {/* Payment Method Selector Pills */}
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setMethod('CASH')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                method === 'CASH'
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span className="text-[11px] font-bold">Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('MOMO')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                method === 'MOMO'
                  ? 'bg-amber-950/40 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[11px] font-bold">MoMo</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('CARD')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                method === 'CARD'
                  ? 'bg-blue-950/40 border-blue-500 text-blue-300 shadow-md shadow-blue-950'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[11px] font-bold">Card</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('CREDIT')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                method === 'CREDIT'
                  ? 'bg-purple-950/40 border-purple-500 text-purple-300 shadow-md shadow-purple-950'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-[11px] font-bold">Credit</span>
            </button>
          </div>

          {/* Conditional Inputs per Payment Method */}
          {method === 'CASH' && (
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Cash Tendered ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tenderAmountDollars}
                  onChange={(e) => setTenderAmountDollars(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-lg font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex items-center space-x-2">
                {['Exact', '20', '50', '100', '200'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (preset === 'Exact') {
                        setTenderAmountDollars((totalCents / 100).toFixed(2));
                      } else {
                        setTenderAmountDollars(preset);
                      }
                    }}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 transition-colors"
                  >
                    {preset === 'Exact' ? 'Exact' : `$${preset}`}
                  </button>
                ))}
              </div>

              {/* Change Calculation */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="font-bold text-slate-400">Change Due to Customer:</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    changeCents > 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {formatMoney(changeCents)}
                </span>
              </div>
            </div>
          )}

          {method === 'MOMO' && (
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Mobile Network Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MTN', 'TELECEL', 'AIRTELTIGO'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setMomoProvider(prov)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                        momoProvider === prov
                          ? 'bg-amber-600 text-slate-950 font-extrabold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  MoMo Transaction ID / Phone (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. TXN-984210 / 0244123456"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {method === 'CARD' && (
            <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  POS Terminal Authorization Code / STAN (Optional)
                </label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. AUTH-882103"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {method === 'CREDIT' && (
            <div className="space-y-2 bg-purple-950/30 p-3.5 rounded-xl border border-purple-800/60 text-xs">
              {!customer ? (
                <div className="flex items-center space-x-2 text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">
                    No customer selected! Assign an approved customer to bill to store credit.
                  </span>
                </div>
              ) : isOverCreditLimit ? (
                <div className="flex items-center space-x-2 text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold">Credit Limit Exceeded!</div>
                    <div className="text-[11px] text-slate-300">
                      Order total {formatMoney(totalCents)} exceeds available credit{' '}
                      {formatMoney(availableCreditCents)}.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-purple-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>Customer Approved for Credit Sale</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This sale will automatically append a <strong>DEBIT_SALE</strong> entry of{' '}
                    <strong>{formatMoney(totalCents)}</strong> to {customer.full_name}&apos;s customer
                    ledger.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Thermal Receipt Print Switch */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-2">
              <Printer className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-semibold text-slate-200">
                Trigger ESC/POS Thermal Receipt & Drawer
              </span>
            </div>
            <input
              type="checkbox"
              checked={shouldPrintReceipt}
              onChange={(e) => setShouldPrintReceipt(e.target.checked)}
              className="w-4 h-4 accent-pink-600 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel (Esc)
          </button>

          <button
            type="button"
            disabled={isOverCreditLimit}
            onClick={() => handleSubmit()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg shadow-pink-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
          >
            COMPLETE SALE (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
