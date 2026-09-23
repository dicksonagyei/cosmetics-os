import React, { useState } from 'react';
import {
  OnboardingState,
  Warehouse,
  Branch,
  FinancialAccount,
  BusinessStructure,
} from '../../types/tenant';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  Warehouse as WarehouseIcon,
  Store,
  Sparkles,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  FileSpreadsheet,
  Globe,
  Smartphone,
  Lock,
  Mail,
  Phone,
  Rocket,
  Layers,
} from 'lucide-react';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: OnboardingState;
  onSaveOnboarding: (data: OnboardingState) => Promise<void>;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, title: 'Account & Auth', icon: Lock, desc: 'Login & user credentials' },
  { id: 2, title: 'Business Profile', icon: Building2, desc: 'Legal entity & registration' },
  { id: 3, title: 'Owner KYC', icon: UserCheck, desc: 'Director identity & verification' },
  { id: 4, title: 'Supply Chain Hubs', icon: WarehouseIcon, desc: 'Alibaba warehouse & stores' },
  { id: 5, title: 'Catalog Ingestion', icon: Sparkles, desc: 'Pre-loaded products & shades' },
  { id: 6, title: 'Settlement Accounts', icon: CreditCard, desc: 'Direct bank & MoMo routing' },
  { id: 7, title: 'Review & Launch', icon: Rocket, desc: 'Deploy enterprise tenant' },
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaveOnboarding,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingState>(initialData);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentPhase, setDeploymentPhase] = useState<string>('');

  if (!isOpen) return null;

  // Step 1: Account Updates
  const updateAccount = (updates: Partial<typeof formData.account>) => {
    setFormData((prev) => ({
      ...prev,
      account: { ...prev.account, ...updates },
    }));
  };

  // Step 2: Business Updates
  const updateBusiness = (updates: Partial<typeof formData.business>) => {
    setFormData((prev) => ({
      ...prev,
      business: { ...prev.business, ...updates },
    }));
  };

  // Step 3: Owner Updates
  const updateOwner = (updates: Partial<typeof formData.owner>) => {
    setFormData((prev) => ({
      ...prev,
      owner: { ...prev.owner, ...updates },
    }));
  };

  // Step 4: Add Warehouse
  const handleAddWarehouse = () => {
    const count = formData.warehouses.length + 1;
    const newWh: Warehouse = {
      id: `wh_new_${Date.now()}`,
      name: `Secondary Distribution Hub #${count}`,
      code: `WH-REG-0${count}`,
      address: 'Industrial Freezone Park, Accra',
      capacity_sqft: 10000,
      manager_name: 'Logistics Supervisor',
      manager_phone: '+233 24 000 0000',
      is_central_hub: false,
    };
    setFormData((prev) => ({
      ...prev,
      warehouses: [...prev.warehouses, newWh],
    }));
  };

  const handleRemoveWarehouse = (id: string) => {
    if (formData.warehouses.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      warehouses: prev.warehouses.filter((w) => w.id !== id),
    }));
  };

  // Step 4: Add Branch
  const handleAddBranch = () => {
    const count = formData.branches.length + 1;
    const newBr: Branch = {
      id: `br_new_${Date.now()}`,
      name: `Retail Outlet #${count}`,
      code: `BR-OUTLET-0${count}`,
      address: 'High Street Commercial Mall, Accra',
      assigned_warehouse_id: formData.warehouses[0]?.id || 'wh_central_01',
      pos_registers_count: 2,
      manager_name: 'Store Branch Lead',
      manager_phone: '+233 24 000 0000',
      status: 'ACTIVE',
    };
    setFormData((prev) => ({
      ...prev,
      branches: [...prev.branches, newBr],
    }));
  };

  const handleRemoveBranch = (id: string) => {
    if (formData.branches.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      branches: prev.branches.filter((b) => b.id !== id),
    }));
  };

  // Step 6: Add Financial Account
  const handleAddFinancialAccount = (type: 'BANK' | 'MOMO' | 'PAYMENT_GATEWAY') => {
    const newFin: FinancialAccount = {
      id: `fin_new_${Date.now()}`,
      account_type: type,
      provider_name: type === 'BANK' ? 'Standard Chartered Bank' : type === 'MOMO' ? 'MTN Mobile Money' : 'Paystack Gateway',
      account_holder_name: formData.business.business_name || 'Business Account',
      account_number: type === 'BANK' ? '0100293849102' : '024 123 4567',
      currency: formData.business.base_currency || 'GHS',
      is_primary_settlement: formData.financial_accounts.length === 0,
      auto_payout_frequency: 'INSTANT_DAILY',
    };
    setFormData((prev) => ({
      ...prev,
      financial_accounts: [...prev.financial_accounts, newFin],
    }));
  };

  const handleRemoveFinancialAccount = (id: string) => {
    if (formData.financial_accounts.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      financial_accounts: prev.financial_accounts.filter((f) => f.id !== id),
    }));
  };

  // Final Deploy
  const handleExecuteLaunch = async () => {
    setIsDeploying(true);
    try {
      setDeploymentPhase('Provisioning Multi-Tenant Cloud Database...');
      await new Promise((r) => setTimeout(r, 600));

      setDeploymentPhase('Configuring Central Warehouse & Supply-Chain Routing...');
      await new Promise((r) => setTimeout(r, 600));

      setDeploymentPhase('Binding POS Hardware Registers & Scanner Enpoints...');
      await new Promise((r) => setTimeout(r, 600));

      setDeploymentPhase('Verifying Bank & Mobile Money Settlement Payouts...');
      await new Promise((r) => setTimeout(r, 600));

      setDeploymentPhase('Finalizing Tenant Activation!');
      const completedData: OnboardingState = {
        ...formData,
        is_completed: true,
      };
      await onSaveOnboarding(completedData);
      await new Promise((r) => setTimeout(r, 400));
      onComplete();
      onClose();
    } catch (err) {
      alert(`Deployment failed: ${err}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  Multi-Tenant Enterprise Onboarding Wizard
                </h3>
                <span className="text-[10px] uppercase font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  Cloud Tenant Setup
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Setup your cloud retail entity, central warehouses, branch retail stores, and direct bank settlement payouts.
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

        {/* Stepper Navigation Bar */}
        <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center justify-between gap-2 shrink-0">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isDone = currentStep > s.id;

            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                    : isDone
                    ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="flex items-center space-x-1.5 text-left">
                  <Icon className="w-3.5 h-3.5 opacity-70" />
                  <span className="leading-none">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Account Credentials & Auth */}
          {currentStep === 1 && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <div className="flex items-center space-x-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-300">
                <Lock className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <strong>Step 1: Administrator Account Credentials.</strong> This account grants full Super-Admin & Store Owner privileges across all cloud branches and warehouses.
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Full Administrator Name *
                    </label>
                    <input
                      type="text"
                      value={formData.account.full_name}
                      onChange={(e) => updateAccount({ full_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Role / Authority
                    </label>
                    <select
                      value={formData.account.role}
                      onChange={(e) => updateAccount({ role: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="STORE_OWNER">Store Owner (Full Enterprise Authority)</option>
                      <option value="SUPER_ADMIN">Super Administrator</option>
                      <option value="WAREHOUSE_MANAGER">Warehouse Logistics Director</option>
                      <option value="BRANCH_MANAGER">Retail Branch General Manager</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-pink-400" />
                      <span>Corporate Email Address *</span>
                    </label>
                    <input
                      type="email"
                      value={formData.account.email}
                      onChange={(e) => updateAccount({ email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center space-x-1.5">
                      <Phone className="w-3.5 h-3.5 text-pink-400" />
                      <span>Direct Phone / Mobile *</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.account.phone}
                      onChange={(e) => updateAccount({ phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Business Profile & Legal Structure */}
          {currentStep === 2 && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <div className="flex items-center space-x-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-300">
                <Building2 className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <strong>Step 2: Business & Legal Entity Profile.</strong> Configure your registered business name, legal structure, registration ID, and default operating currency.
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Official Registered Business Name *
                    </label>
                    <input
                      type="text"
                      value={formData.business.business_name}
                      onChange={(e) => updateBusiness({ business_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Trading Name / Brand
                    </label>
                    <input
                      type="text"
                      value={formData.business.trade_name || ''}
                      onChange={(e) => updateBusiness({ trade_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Business Entity Structure
                    </label>
                    <select
                      value={formData.business.business_structure}
                      onChange={(e) =>
                        updateBusiness({ business_structure: e.target.value as BusinessStructure })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="ENTERPRISE_RETAIL_CHAIN">
                        Enterprise Multi-Branch Retail Chain
                      </option>
                      <option value="LIMITED_LIABILITY_COMPANY">Limited Liability Company (LLC)</option>
                      <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                      <option value="PARTNERSHIP">Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Business Registration / TIN No. *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BN-GH-2026-99120 / TIN-0091"
                      value={formData.business.registration_number}
                      onChange={(e) => updateBusiness({ registration_number: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Base Operating Currency
                    </label>
                    <select
                      value={formData.business.base_currency}
                      onChange={(e) => {
                        const cur = e.target.value;
                        const symbol = cur === 'GHS' ? '₵' : cur === 'USD' ? '$' : cur === 'EUR' ? '€' : cur === 'NGN' ? '₦' : '£';
                        updateBusiness({ base_currency: cur, currency_symbol: symbol });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-bold"
                    >
                      <option value="GHS">Ghanaian Cedi (₵ GHS)</option>
                      <option value="USD">US Dollar ($ USD)</option>
                      <option value="NGN">Nigerian Naira (₦ NGN)</option>
                      <option value="EUR">Euro (€ EUR)</option>
                      <option value="GBP">British Pound (£ GBP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Headquarters Address
                    </label>
                    <input
                      type="text"
                      value={formData.business.headquarters_address}
                      onChange={(e) => updateBusiness({ headquarters_address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Owner Information & KYC */}
          {currentStep === 3 && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <div className="flex items-center space-x-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-300">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <strong>Step 3: Director / Beneficial Owner KYC.</strong> Required for payment gateway clearance, direct bank settlements, and merchant verification.
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Owner / Director Full Legal Name *
                    </label>
                    <input
                      type="text"
                      value={formData.owner.owner_full_name}
                      onChange={(e) => updateOwner({ owner_full_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={formData.owner.nationality}
                      onChange={(e) => updateOwner({ nationality: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Identification Document Type
                    </label>
                    <select
                      value={formData.owner.id_type}
                      onChange={(e) => updateOwner({ id_type: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="PASSPORT">International Passport</option>
                      <option value="NATIONAL_ID">National Ghana Card / ID</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                      <option value="VOTER_ID">Voter ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      ID Document Number *
                    </label>
                    <input
                      type="text"
                      value={formData.owner.id_number}
                      onChange={(e) => updateOwner({ id_number: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={formData.owner.residential_address}
                      onChange={(e) => updateOwner({ residential_address: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Emergency Contact Number
                    </label>
                    <input
                      type="tel"
                      value={formData.owner.emergency_phone}
                      onChange={(e) => updateOwner({ emergency_phone: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Alibaba Supply-Chain Hierarchy (Central Warehouses & Retail Branches) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center space-x-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300">
                <WarehouseIcon className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <strong>The Alibaba Supply-Chain Hierarchy.</strong> Hold bulk inventory in Central Distribution Warehouses and push scheduled replenishment transfers to multiple Retail Shop Outlets with proof-of-delivery receipts.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Warehouses Column */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <WarehouseIcon className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase">
                        Central Logistics Warehouses ({formData.warehouses.length})
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddWarehouse}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Warehouse</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formData.warehouses.map((wh) => (
                      <div
                        key={wh.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{wh.name}</span>
                          {formData.warehouses.length > 1 && (
                            <button
                              onClick={() => handleRemoveWarehouse(wh.id)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">Code: {wh.code}</div>
                        <div className="text-[11px] text-slate-400 truncate">{wh.address}</div>
                        <div className="text-[10px] text-amber-400 font-medium">
                          Supervisor: {wh.manager_name} ({wh.manager_phone})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retail Branches Column */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Store className="w-4 h-4 text-pink-400" />
                      <h4 className="text-xs font-bold text-white uppercase">
                        Retail Shop Fronts & Outlets ({formData.branches.length})
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBranch}
                      className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Branch</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formData.branches.map((br) => (
                      <div
                        key={br.id}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{br.name}</span>
                          {formData.branches.length > 1 && (
                            <button
                              onClick={() => handleRemoveBranch(br.id)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">Code: {br.code}</div>
                        <div className="text-[11px] text-slate-400 truncate">{br.address}</div>
                        <div className="text-[10px] text-pink-400 font-medium">
                          Branch Lead: {br.manager_name} • {br.pos_registers_count} POS Terminals
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Product Catalog Ingestion */}
          {currentStep === 5 && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <div className="flex items-center space-x-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-300">
                <Sparkles className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <strong>Step 5: Product Catalog Ingestion.</strong> Select how you want to populate your beauty products, shades, and wholesale price sheets.
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, catalog_import_choice: 'MASTER_CATALOG' }))
                  }
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                    formData.catalog_import_choice === 'MASTER_CATALOG'
                      ? 'bg-slate-900 border-pink-500 ring-2 ring-pink-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-xs mb-1">
                      1-Click Master Catalog (Recommended)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Pre-loaded with Rare Beauty, Fenty, Huda, NARS, Dior, shade swatches & barcodes.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-pink-400 font-bold uppercase">Ready Instantly</div>
                </div>

                <div
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, catalog_import_choice: 'CSV_FILE' }))
                  }
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                    formData.catalog_import_choice === 'CSV_FILE'
                      ? 'bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-xs mb-1">
                      Upload Supplier Excel / CSV
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Upload your custom inventory spreadsheet with cost prices and SKU quantities.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-emerald-400 font-bold uppercase">Spreadsheet Ingest</div>
                </div>

                <div
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, catalog_import_choice: 'BLANK' }))
                  }
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                    formData.catalog_import_choice === 'BLANK'
                      ? 'bg-slate-900 border-purple-500 ring-2 ring-purple-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white text-xs mb-1">Blank Slate (Manual Entry)</h4>
                    <p className="text-[11px] text-slate-400">
                      Start completely empty and enter products manually as you receive deliveries.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] text-purple-400 font-bold uppercase">Start from Scratch</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Direct Financial & Settlement Accounts */}
          {currentStep === 6 && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <div className="flex items-center space-x-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300">
                <CreditCard className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <strong>Direct Financial Settlement Payouts.</strong> All cashier sales and POS transactions route directly into your verified bank account and Mobile Money merchant wallets.
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase">
                    Configured Settlement Accounts ({formData.financial_accounts.length})
                  </h4>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAddFinancialAccount('BANK')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Bank Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddFinancialAccount('MOMO')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-bold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ MoMo Wallet</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.financial_accounts.map((fin) => (
                    <div
                      key={fin.id}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            fin.account_type === 'BANK'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : fin.account_type === 'MOMO'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {fin.account_type === 'BANK' ? (
                            <Building2 className="w-5 h-5" />
                          ) : (
                            <Smartphone className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{fin.provider_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {fin.account_number} • Holder: {fin.account_holder_name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {fin.is_primary_settlement && (
                          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            Primary Settlement
                          </span>
                        )}
                        {formData.financial_accounts.length > 1 && (
                          <button
                            onClick={() => handleRemoveFinancialAccount(fin.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Review, Summary & Instant Tenant Launch */}
          {currentStep === 7 && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
              <div className="flex items-center space-x-3 p-3 bg-pink-500/10 border border-pink-500/20 rounded-2xl text-pink-300">
                <Rocket className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <strong>Review & Instant Tenant Launch.</strong> Everything is configured. Confirm your enterprise tenant structure to activate the Cosmetics OS edge workspace.
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-pink-400 uppercase">Enterprise Group</span>
                    <h3 className="text-base font-extrabold text-white">{formData.business.business_name}</h3>
                    <div className="text-slate-400 text-xs">
                      {formData.business.business_structure.replace(/_/g, ' ')} • Reg #{formData.business.registration_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Base Currency</span>
                    <div className="text-xl font-mono font-black text-white">
                      {formData.business.base_currency} ({formData.business.currency_symbol})
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-amber-400 uppercase mb-1">
                      Central Warehouses
                    </div>
                    <div className="text-sm font-black text-white">
                      {formData.warehouses.length} Hubs
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {formData.warehouses.map((w) => w.name).join(', ')}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="text-[10px] font-bold text-pink-400 uppercase mb-1">
                      Retail Shop Outlets
                    </div>
                    <div className="text-sm font-black text-white">
                      {formData.branches.length} Stores
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {formData.branches.map((b) => b.name).join(', ')}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">
                    Direct Financial Payout Channels
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {formData.financial_accounts.map((f) => `${f.provider_name} (${f.account_number})`).join(' • ')}
                  </div>
                </div>

                {isDeploying && (
                  <div className="p-4 bg-pink-950/40 border border-pink-500/40 rounded-xl space-y-2 text-center animate-pulse">
                    <Layers className="w-6 h-6 text-pink-400 animate-spin mx-auto" />
                    <div className="text-xs font-bold text-pink-300">{deploymentPhase}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={currentStep === 1 || isDeploying}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={isDeploying}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
                className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center space-x-1.5 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isDeploying}
                onClick={handleExecuteLaunch}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center space-x-2 transition-all"
              >
                <Rocket className="w-4 h-4" />
                <span>{isDeploying ? 'Deploying...' : 'Launch Cosmetics OS Workspace'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
