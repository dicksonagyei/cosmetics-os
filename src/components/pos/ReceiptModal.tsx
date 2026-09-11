import React, { useState } from 'react';
import { CreateOrderResponse } from '../../types/pos';
import { formatMoney } from '../../utils/formatters';
import {
  X,
  Printer,
  FileCode,
  Check,
  Scissors,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: CreateOrderResponse | null;
  onPrintRaw: (bytes: number[]) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  orderData,
  onPrintRaw,
}) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'hex' | 'commands'>('receipt');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !orderData) return null;

  const { order, items, payments, customer, raw_escpos_bytes } = orderData;

  const handlePrint = () => {
    if (raw_escpos_bytes && raw_escpos_bytes.length > 0) {
      onPrintRaw(raw_escpos_bytes);
    }
  };

  const hexDump = raw_escpos_bytes
    ? raw_escpos_bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
    : '';

  const handleCopyHex = () => {
    navigator.clipboard.writeText(hexDump);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">ESC/POS Thermal Receipt</h3>
              <p className="text-[11px] text-slate-400 font-mono">Order: {order.id.slice(0, 16)}</p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'receipt'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Paper Receipt
            </button>
            <button
              onClick={() => setActiveTab('hex')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'hex'
                  ? 'bg-pink-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Hex Byte Stream
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-950/40">
          {activeTab === 'receipt' ? (
            /* Thermal Paper Simulation */
            <div className="w-[340px] thermal-receipt p-5 shadow-2xl rounded-sm border-t-4 border-slate-300 text-slate-900 text-xs select-text">
              {/* Receipt Header */}
              <div className="text-center space-y-0.5">
                <div className="font-black text-sm tracking-tight uppercase">
                  COSMETICS OS BEAUTY STORE
                </div>
                <div className="text-[11px] font-semibold">Accra Mall Branch #01</div>
                <div className="text-[11px] text-slate-600">Tel: +233 (0) 302 123 456</div>
                <div className="text-[10px] text-slate-500">TIN: GH-902148-B</div>
              </div>

              <div className="my-2 border-t border-dashed border-slate-400" />

              {/* Order Metadata */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">RECEIPT #:</span>
                  <span className="font-bold">{order.id.slice(0, 16)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">DATE:</span>
                  <span>{order.created_at.slice(0, 19).replace('T', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">CASHIER:</span>
                  <span>{order.cashier_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">REGISTER:</span>
                  <span>{order.register_id}</span>
                </div>
                {customer && (
                  <>
                    <div className="flex justify-between font-semibold pt-0.5">
                      <span className="text-slate-600">CUSTOMER:</span>
                      <span>{customer.full_name}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-600">PHONE:</span>
                      <span>{customer.phone}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="my-2 border-t border-dashed border-slate-400" />

              {/* Items Table */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-slate-700 pb-0.5 border-b border-slate-300">
                  <span>ITEM / SHADE</span>
                  <span>TOTAL</span>
                </div>

                {items.map((it) => (
                  <div key={it.id} className="pt-0.5">
                    <div className="font-bold">
                      {it.product_name || 'Item'}
                      {it.shade_name && <span className="font-normal text-slate-700"> [{it.shade_name}]</span>}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>
                        {it.quantity}x @ {formatMoney(it.unit_price_cents)}
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatMoney(it.total_cents)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-2 border-t border-dashed border-slate-400" />

              {/* Totals */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-mono">{formatMoney(order.subtotal_cents)}</span>
                </div>
                {order.discount_cents > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatMoney(order.discount_cents)}</span>
                  </div>
                )}
                {order.tax_cents > 0 && (
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>VAT (15%):</span>
                    <span className="font-mono">{formatMoney(order.tax_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-800 text-slate-950 font-mono">
                  <span>TOTAL DUE:</span>
                  <span>{formatMoney(order.total_cents)}</span>
                </div>
              </div>

              <div className="my-2 border-t border-dashed border-slate-400" />

              {/* Payments */}
              <div className="space-y-0.5 text-[11px]">
                <div className="font-bold text-slate-700 mb-0.5">PAYMENT METHOD(S):</div>
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <span>
                      {p.payment_method === 'CASH'
                        ? 'Cash Tendered'
                        : p.payment_method === 'MOMO'
                        ? `Mobile Money (${p.reference_no || 'Direct'})`
                        : p.payment_method === 'CARD'
                        ? `Card (${p.reference_no || 'POS'})`
                        : 'Store Credit Ledger'}
                    </span>
                    <span className="font-bold font-mono">{formatMoney(p.amount_cents)}</span>
                  </div>
                ))}
              </div>

              {/* Customer Credit Account Statement */}
              {customer && (customer.outstanding_balance_cents > 0 || order.payment_status === 'CREDIT') && (
                <>
                  <div className="my-2 border-t border-dashed border-slate-400" />
                  <div className="space-y-0.5 text-[10px] bg-slate-100 p-1.5 rounded">
                    <div className="font-bold text-purple-900">CUSTOMER CREDIT ACCOUNT:</div>
                    <div className="flex justify-between">
                      <span>Approved Credit Limit:</span>
                      <span className="font-mono">{formatMoney(customer.credit_limit_cents)}</span>
                    </div>
                    <div className="flex justify-between text-rose-700 font-bold">
                      <span>Current Balance Owed:</span>
                      <span className="font-mono">{formatMoney(customer.outstanding_balance_cents)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-800">
                      <span>Remaining Available Credit:</span>
                      <span className="font-mono">
                        {formatMoney(
                          Math.max(0, customer.credit_limit_cents - customer.outstanding_balance_cents)
                        )}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Footer */}
              <div className="my-3 border-t border-dashed border-slate-400" />
              <div className="text-center text-[10px] text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-800">Thank you for shopping with us!</div>
                <div>Beauty is Confidence.</div>
                <div>Unopened items returnable in 7 days</div>
                <div>with receipt and intact factory seal.</div>
                <div className="pt-2 text-[9px] text-slate-500 font-mono">
                  Powered by Cosmetics OS Edge POS
                </div>
              </div>

              {/* Jagged Cut Indicator */}
              <div className="mt-4 pt-2 border-t border-dotted border-slate-400 flex items-center justify-center space-x-1 text-[9px] text-slate-400">
                <Scissors className="w-3 h-3" />
                <span>[ESC/POS FULL PAPER CUT: GS V 65 0]</span>
              </div>
            </div>
          ) : (
            /* Hex Raw Byte Inspector */
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Raw ESC/POS Uint8Array Buffer ({raw_escpos_bytes?.length || 0} bytes)
                </span>
                <button
                  onClick={handleCopyHex}
                  className="flex items-center space-x-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FileCode className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Hex' : 'Copy Hex String'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400/90 leading-relaxed max-h-96 overflow-y-auto select-all">
                {hexDump || 'No raw byte sequence generated.'}
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-bold text-pink-400">Included ESC/POS Byte Controls:</div>
                <div className="font-mono text-[11px] text-slate-400">
                  • 1B 40 (ESC @ - Initialize Printer)
                  <br />
                  • 1B 70 00 19 FA (ESC p - Cash Drawer Kick Pulse)
                  <br />
                  • 1B 61 01 (ESC a 1 - Center Align)
                  <br />
                  • 1D 21 11 (GS ! - Double Height/Width Header)
                  <br />
                  • 1D 56 41 00 (GS V 65 0 - Full Paper Cut)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close / New Sale (Esc)
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 transition-transform active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Native Thermal Print (F9)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
