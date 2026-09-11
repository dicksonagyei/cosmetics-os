import React, { useState, useEffect } from 'react';
import { Customer, CustomerLedgerEntry } from '../../types/pos';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import {
  Users,
  CreditCard,
  Phone,
  Mail,
  FileSpreadsheet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  DollarSign,
} from 'lucide-react';

interface CustomerLedgerViewProps {
  customers: Customer[];
  onRecordPayment: (data: {
    customerId: string;
    amountCents: number;
    recordedBy: string;
    referenceNo?: string;
  }) => Promise<void>;
  onFetchLedger: (customerId: string) => Promise<CustomerLedgerEntry[]>;
  onOpenNewCustomerModal: () => void;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  customers,
  onRecordPayment,
  onFetchLedger,
  onOpenNewCustomerModal,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers.find((c) => c.credit_limit_cents > 0)?.id || customers[0]?.id || ''
  );
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [search, setSearch] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmountDollars, setPaymentAmountDollars] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Load ledger when selected customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      onFetchLedger(selectedCustomerId).then((entries) => {
        setLedgerEntries(entries);
      });
    }
  }, [selectedCustomerId, onFetchLedger]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const totalOutstandingCreditCents = customers.reduce(
    (sum, c) => sum + c.outstanding_balance_cents,
    0
  );
  const totalApprovedCreditLimitCents = customers.reduce(
    (sum, c) => sum + c.credit_limit_cents,
    0
  );

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amountCents = Math.round((parseFloat(paymentAmountDollars) || 0) * 100);
    if (amountCents <= 0) return;

    setIsSubmittingPayment(true);
    try {
      await onRecordPayment({
        customerId: selectedCustomer.id,
        amountCents,
        recordedBy: 'Pius (Cashier)',
        referenceNo: paymentRef || undefined,
      });

      // Reload ledger
      const updated = await onFetchLedger(selectedCustomer.id);
      setLedgerEntries(updated);
      setIsPaymentModalOpen(false);
      setPaymentAmountDollars('');
      setPaymentRef('');
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden space-y-4">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Outstanding Debt
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-0.5">
              {formatMoney(totalOutstandingCreditCents)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Approved Credit Line
            </div>
            <div className="text-2xl font-black text-purple-400 font-mono mt-0.5">
              {formatMoney(totalApprovedCreditLimitCents)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Registered Clients
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {customers.length} Accounts
            </div>
          </div>
          <button
            onClick={onOpenNewCustomerModal}
            className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/30 transition-colors flex items-center space-x-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ New Client</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Customer List | Right Customer Ledger Statement */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Left Customer Directory */}
        <div className="col-span-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients by name or phone..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {filteredCustomers.map((c) => {
              const isSelected = c.id === selectedCustomerId;
              const hasDebt = c.outstanding_balance_cents > 0;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-900/40 to-slate-900 border border-pink-500/50 shadow-md'
                      : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-bold text-xs text-slate-100 group-hover:text-pink-300 truncate">
                      {c.full_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.phone}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs font-mono font-bold ${
                        hasDebt ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {hasDebt ? `Owes ${formatMoney(c.outstanding_balance_cents)}` : '$0.00 Owed'}
                    </div>
                    {c.credit_limit_cents > 0 && (
                      <div className="text-[9px] text-purple-300 font-mono">
                        Limit: {formatMoney(c.credit_limit_cents)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Customer Ledger Statement */}
        <div className="col-span-8 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          {selectedCustomer ? (
            <>
              {/* Customer Account Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow">
                    {selectedCustomer.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm text-white">
                        {selectedCustomer.full_name}
                      </h3>
                      {selectedCustomer.credit_limit_cents > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Credit Client
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-1 font-mono">
                        <Phone className="w-3 h-3 text-pink-400" />
                        <span>{selectedCustomer.phone}</span>
                      </span>
                      {selectedCustomer.email && (
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{selectedCustomer.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      Balance Owed
                    </div>
                    <div
                      className={`text-lg font-black font-mono ${
                        selectedCustomer.outstanding_balance_cents > 0
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatMoney(selectedCustomer.outstanding_balance_cents)}
                    </div>
                  </div>

                  {selectedCustomer.outstanding_balance_cents > 0 && (
                    <button
                      onClick={() => {
                        setPaymentAmountDollars(
                          (selectedCustomer.outstanding_balance_cents / 100).toFixed(2)
                        );
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 transition-transform active:scale-95 flex items-center space-x-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ledger Statement Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 select-none">
                    <tr>
                      <th className="py-2.5 px-4">Date & Time</th>
                      <th className="py-2.5 px-4">Transaction Type</th>
                      <th className="py-2.5 px-4">Ref / Order ID</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-right">Balance After</th>
                      <th className="py-2.5 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          {entry.transaction_type === 'DEBIT_SALE' ? (
                            <span className="inline-flex items-center space-x-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded font-bold text-[10px] border border-rose-500/20">
                              <ArrowUpRight className="w-3 h-3" />
                              <span>DEBIT SALE (Credit POS)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-500/20">
                              <ArrowDownLeft className="w-3 h-3" />
                              <span>CREDIT PAYMENT (Settlement)</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {entry.order_id ? entry.order_id.slice(0, 16) : 'DIRECT_SETTLEMENT'}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-bold ${
                            entry.transaction_type === 'DEBIT_SALE'
                              ? 'text-rose-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {entry.transaction_type === 'DEBIT_SALE' ? '+' : '-'}
                          {formatMoney(entry.amount_cents)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {formatMoney(entry.balance_after_cents)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{entry.recorded_by}</td>
                      </tr>
                    ))}

                    {ledgerEntries.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500 text-xs">
                          No transaction history recorded yet on this customer ledger account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <Users className="w-8 h-8 text-slate-600 mb-2" />
              <p>Select a customer account to inspect transaction ledger statement.</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Debt Payment Modal */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Record Debt Settlement Payment</span>
            </h3>
            <p className="text-xs text-slate-400">
              Customer: <strong>{selectedCustomer.full_name}</strong>
              <br />
              Current Balance: <strong>{formatMoney(selectedCustomer.outstanding_balance_cents)}</strong>
            </p>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmountDollars}
                  onChange={(e) => setPaymentAmountDollars(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-lg font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Payment Reference / Cheque / MoMo Ref (Optional)
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. CASH_COUNTER / MTN_889210"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-transform active:scale-95"
                >
                  {isSubmittingPayment ? 'Processing...' : 'Apply Credit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
