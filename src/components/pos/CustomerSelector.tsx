import React, { useState } from 'react';
import { Customer } from '../../types/pos';
import { formatMoney } from '../../utils/formatters';
import {
  User,
  UserPlus,
  CreditCard,
  Phone,
  ChevronDown,
} from 'lucide-react';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onOpenNewCustomerModal: () => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onOpenNewCustomerModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const availableCreditCents = selectedCustomer
    ? Math.max(0, selectedCustomer.credit_limit_cents - selectedCustomer.outstanding_balance_cents)
    : 0;

  const isCreditAccount = selectedCustomer && selectedCustomer.credit_limit_cents > 0;
  const creditUsageRatio =
    selectedCustomer && selectedCustomer.credit_limit_cents > 0
      ? selectedCustomer.outstanding_balance_cents / selectedCustomer.credit_limit_cents
      : 0;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-3 select-none space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <User className="w-4 h-4 text-pink-400" />
          <span>Customer & Credit Status</span>
        </div>

        <button
          onClick={onOpenNewCustomerModal}
          className="flex items-center space-x-1 text-[11px] font-semibold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 px-2 py-0.5 rounded-lg border border-pink-500/30 transition-colors"
        >
          <UserPlus className="w-3 h-3" />
          <span>+ New Client</span>
        </button>
      </div>

      {/* Customer Selection Trigger Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-pink-500/50 transition-all text-left group"
        >
          <div className="flex items-center space-x-2.5 truncate">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                selectedCustomer && isCreditAccount
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {selectedCustomer ? selectedCustomer.full_name.charAt(0) : 'W'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                {selectedCustomer ? selectedCustomer.full_name : 'Walk-In Customer (Cash Only)'}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                {selectedCustomer && selectedCustomer.phone !== '+0000000000' ? (
                  <>
                    <Phone className="w-2.5 h-2.5 text-slate-500" />
                    <span>{selectedCustomer.phone}</span>
                  </>
                ) : (
                  <span>Standard Retail Sale</span>
                )}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-pink-400 transition-transform" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-64 flex flex-col">
            <div className="p-2 border-b border-slate-800 bg-slate-950">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                autoFocus
              />
            </div>

            <div className="overflow-y-auto divide-y divide-slate-800/60 p-1">
              {filtered.map((cust) => (
                <button
                  key={cust.id}
                  onClick={() => {
                    onSelectCustomer(cust.id === 'cust_walkin' ? null : cust);
                    setIsOpen(false);
                  }}
                  className="w-full p-2 text-left hover:bg-slate-800/80 rounded-lg flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-200">{cust.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{cust.phone}</div>
                  </div>
                  {cust.credit_limit_cents > 0 ? (
                    <div className="text-right">
                      <div className="text-[10px] font-semibold text-purple-300">
                        Credit: {formatMoney(cust.credit_limit_cents)}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        Owed: {formatMoney(cust.outstanding_balance_cents)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500">Retail</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Credit Status Card if credit account is assigned */}
      {selectedCustomer && isCreditAccount && (
        <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-300 flex items-center space-x-1">
              <CreditCard className="w-3.5 h-3.5 text-purple-400" />
              <span>Approved Credit Account</span>
            </span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded font-mono ${
                creditUsageRatio > 0.85
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {creditUsageRatio > 0.85 ? 'HIGH RISK' : 'HEALTHY'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 text-[11px] text-center font-mono">
            <div className="p-1 rounded bg-slate-900/80">
              <div className="text-[9px] text-slate-400 uppercase">Limit</div>
              <div className="font-bold text-slate-200">
                {formatMoney(selectedCustomer.credit_limit_cents)}
              </div>
            </div>
            <div className="p-1 rounded bg-slate-900/80">
              <div className="text-[9px] text-amber-400 uppercase">Debt Owed</div>
              <div className="font-bold text-amber-300">
                {formatMoney(selectedCustomer.outstanding_balance_cents)}
              </div>
            </div>
            <div className="p-1 rounded bg-slate-900/80">
              <div className="text-[9px] text-emerald-400 uppercase">Available</div>
              <div className="font-bold text-emerald-300">
                {formatMoney(availableCreditCents)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
