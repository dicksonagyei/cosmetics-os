import React from 'react';
import {
  Sparkles,
  Barcode,
  CloudCheck,
  CloudAlert,
  Store,
  UserCheck,
  Package,
  Users,
  Layers,
  Zap,
  ShieldAlert,
  Truck,
  Building2,
  Printer,
} from 'lucide-react';
import { DualPrinterHardwareConfig } from '../../types/printer';

interface HeaderProps {
  activeTab: 'pos' | 'inventory' | 'labels' | 'customers' | 'supply_chain' | 'sync';
  onTabChange: (tab: 'pos' | 'inventory' | 'labels' | 'customers' | 'supply_chain' | 'sync') => void;
  scannerStatus: {
    isScanning: boolean;
    lastScanned: string | null;
    scanCount: number;
    onSimulateScan: (barcode: string) => void;
  };
  pendingSyncCount: number;
  pendingAdjustmentCount?: number;
  inTransitTransferCount?: number;
  businessName?: string;
  hardwareConfig?: DualPrinterHardwareConfig;
  onOpenApprovals?: () => void;
  onOpenOnboarding?: () => void;
  onOpenHardwareSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  scannerStatus,
  pendingSyncCount,
  pendingAdjustmentCount = 0,
  inTransitTransferCount = 0,
  businessName = 'Cosmenply Luxury Group',
  hardwareConfig,
  onOpenApprovals,
  onOpenOnboarding,
  onOpenHardwareSettings,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 select-none">
      {/* Brand & Branch */}
      <div className="flex items-center space-x-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-400 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                COSMETICS OS
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                PRO POS
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <span className="flex items-center space-x-1">
                <Store className="w-3 h-3 text-pink-400" />
                <span>Accra Mall #01</span>
              </span>
              <span>•</span>
              <button
                onClick={onOpenOnboarding}
                title="Configure Multi-Tenant Cloud Enterprise"
                className="text-slate-300 hover:text-pink-300 transition-colors flex items-center space-x-1 underline decoration-dotted"
              >
                <Building2 className="w-3 h-3 text-amber-400" />
                <span className="font-bold truncate max-w-[140px]">{businessName}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 ml-2">
          <button
            onClick={() => onTabChange('pos')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pos'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Cashier POS</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/80">
              F1
            </span>
          </button>

          <button
            onClick={() => onTabChange('labels')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'labels'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Barcode className="w-3.5 h-3.5 text-pink-400" />
            <span>Barcodes & Labels</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/80">
              F2
            </span>
          </button>

          <button
            onClick={() => onTabChange('inventory')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock & Shades</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/80">
              F3
            </span>
            {pendingAdjustmentCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                {pendingAdjustmentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('supply_chain')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'supply_chain'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Logistics & Transfers</span>
            {inTransitTransferCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                {inTransitTransferCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('customers')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'customers'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers & Credit</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-white/80">
              F4
            </span>
          </button>

          <button
            onClick={() => onTabChange('sync')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sync'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sync Queue</span>
            {pendingSyncCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                {pendingSyncCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Hardware Status & Cashier info */}
      <div className="flex items-center space-x-3.5">
        {/* Hardware Barcode Scanner Beacon */}
        <div
          title="Hardware Barcode Scanner Listener (<35ms HID Interval Detection)"
          className={`flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
            scannerStatus.isScanning
              ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 animate-scanner-beacon'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Barcode
              className={`w-4 h-4 ${
                scannerStatus.isScanning ? 'text-pink-400 animate-pulse' : 'text-emerald-400'
              }`}
            />
            <span
              className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
                scannerStatus.isScanning ? 'bg-pink-400' : 'bg-emerald-400'
              }`}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              HID Scanner
            </span>
            <span className="text-[11px] font-bold text-slate-200">
              {scannerStatus.isScanning
                ? 'Scanning...'
                : scannerStatus.lastScanned
                ? `Scanned: ${scannerStatus.lastScanned}`
                : 'Ready (Gun Active)'}
            </span>
          </div>
          {scannerStatus.scanCount > 0 && (
            <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1 rounded">
              #{scannerStatus.scanCount}
            </span>
          )}
        </div>

        {/* Stock Approvals Pending Pill (Audited Alert) */}
        {pendingAdjustmentCount > 0 && (
          <button
            onClick={() => {
              onTabChange('inventory');
              if (onOpenApprovals) onOpenApprovals();
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition-all animate-pulse"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-bold">
              {pendingAdjustmentCount} Approval Req
            </span>
          </button>
        )}

        {/* Hardware Dual-Printers Router Pill */}
        <button
          onClick={onOpenHardwareSettings}
          title="Configure Gainscha Receipt & Xprinter Label Hardware"
          className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-300 group"
        >
          <div className="relative flex items-center justify-center">
            <Printer className="w-4 h-4 text-amber-400 group-hover:text-pink-400 transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              Dual Printers
            </span>
            <span className="text-[11px] font-bold text-slate-200 truncate max-w-[120px]">
              {hardwareConfig?.receipt?.printerName ? 'Gainscha & Xprinter' : 'Printer Setup'}
            </span>
          </div>
        </button>

        {/* Cloud Sync Health Pill */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-medium text-slate-300">
          {pendingSyncCount === 0 ? (
            <>
              <CloudCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-semibold">Edge SQLite Active</span>
            </>
          ) : (
            <>
              <CloudAlert className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="text-[11px] text-amber-300 font-semibold">
                {pendingSyncCount} Pending Sync
              </span>
            </>
          )}
        </div>

        {/* Cashier Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow">
            P
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-200 flex items-center space-x-1">
              <span>Pius</span>
              <UserCheck className="w-3 h-3 text-emerald-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Head Cashier</div>
          </div>
        </div>
      </div>
    </header>
  );
};
