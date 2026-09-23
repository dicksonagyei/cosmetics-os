import React, { useState } from 'react';
import {
  DualPrinterHardwareConfig,
  ReceiptPrinterSettings,
  LabelPrinterSettings,
} from '../../types/printer';
import {
  X,
  Printer,
  Receipt,
  Tag,
  Zap,
  CheckCircle2,
  RefreshCw,
  Scissors,
  DollarSign,
  Smartphone,
  Save,
  Laptop,
} from 'lucide-react';

interface HardwareSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DualPrinterHardwareConfig;
  onSaveConfig: (config: DualPrinterHardwareConfig) => Promise<void>;
  onTestReceipt: (settings: ReceiptPrinterSettings) => Promise<{ success: boolean; message: string }>;
  onTestLabel: (settings: LabelPrinterSettings) => Promise<{ success: boolean; message: string }>;
  onRefreshPrinters: () => Promise<string[]>;
}

export const HardwareSettingsModal: React.FC<HardwareSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestReceipt,
  onTestLabel,
  onRefreshPrinters,
}) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'label' | 'network'>('receipt');
  const [receiptSettings, setReceiptSettings] = useState<ReceiptPrinterSettings>(config.receipt);
  const [labelSettings, setLabelSettings] = useState<LabelPrinterSettings>(config.label);
  const [systemPrinters, setSystemPrinters] = useState<string[]>(config.systemPrinters);

  const [isSaving, setIsSaving] = useState(false);
  const [isTestingReceipt, setIsTestingReceipt] = useState(false);
  const [isTestingLabel, setIsTestingLabel] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const printers = await onRefreshPrinters();
      setSystemPrinters(printers);
      setTestResult({ type: 'success', msg: `Found ${printers.length} installed printers` });
    } catch {
      setTestResult({ type: 'error', msg: 'Failed to refresh printer list' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestReceiptClick = async () => {
    setIsTestingReceipt(true);
    setTestResult(null);
    try {
      const res = await onTestReceipt(receiptSettings);
      setTestResult({
        type: res.success ? 'success' : 'error',
        msg: res.message,
      });
    } catch (err: unknown) {
      setTestResult({
        type: 'error',
        msg: `Test print error: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsTestingReceipt(false);
    }
  };

  const handleTestLabelClick = async () => {
    setIsTestingLabel(true);
    setTestResult(null);
    try {
      const res = await onTestLabel(labelSettings);
      setTestResult({
        type: res.success ? 'success' : 'error',
        msg: res.message,
      });
    } catch (err: unknown) {
      setTestResult({
        type: 'error',
        msg: `Test print error: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsTestingLabel(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig({
        receipt: receiptSettings,
        label: labelSettings,
        systemPrinters,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save printer configuration:', err);
      alert('Error saving printer settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center space-x-2">
                <span>Hardware & Printer Router</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Dual-Channel Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Independent channel routing for Gainscha Receipt Printer & Xprinter Barcode Label Printer
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Windows Printers"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all text-xs font-bold flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Devices</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-5 shrink-0">
          <button
            onClick={() => {
              setActiveTab('receipt');
              setTestResult(null);
            }}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'receipt'
                ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>1. Gainscha Receipt Printer (80mm)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('label');
              setTestResult(null);
            }}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'label'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>2. Xprinter Barcode Label Printer (TSPL)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('network');
              setTestResult(null);
            }}
            className={`flex items-center space-x-2 py-3 px-4 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'network'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>3. Mobile & Network Routing</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {testResult && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 animate-fadeIn shrink-0 ${
              testResult.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>{testResult.msg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* TAB 1: RECEIPT PRINTER (Gainscha) */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-pink-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-wider">
                      Cashier POS Receipt Printer
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                    ESC/POS Protocol
                  </span>
                </div>

                {/* Target Windows Printer */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Select Installed Windows Printer Target
                  </label>
                  <select
                    value={receiptSettings.printerName}
                    onChange={(e) =>
                      setReceiptSettings({ ...receiptSettings, printerName: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-pink-500 outline-none"
                  >
                    <option value="">-- Choose Installed Printer --</option>
                    {systemPrinters.map((prn) => (
                      <option key={prn} value={prn}>
                        {prn}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Matches your connected Gainscha USB printer (e.g. <code>POS Printer 300DPI Series</code> or <code>Gainscha 80mm</code>).
                  </p>
                </div>

                {/* Paper Width & Cutter */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Paper Roll Width
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptSettings({ ...receiptSettings, paperWidth: '80mm' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          receiptSettings.paperWidth === '80mm'
                            ? 'bg-pink-600/20 border-pink-500 text-pink-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        80mm (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptSettings({ ...receiptSettings, paperWidth: '58mm' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          receiptSettings.paperWidth === '58mm'
                            ? 'bg-pink-600/20 border-pink-500 text-pink-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        58mm (Compact)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Connection Mode
                    </label>
                    <select
                      value={receiptSettings.connectionType}
                      onChange={(e) =>
                        setReceiptSettings({
                          ...receiptSettings,
                          connectionType: e.target.value as 'WINDOWS_SPOOLER' | 'RAW_TCP' | 'WEB_PRINT',
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-pink-500 outline-none"
                    >
                      <option value="WINDOWS_SPOOLER">Windows Print Spooler (Default)</option>
                      <option value="RAW_TCP">Direct Raw TCP Socket (Port 9100)</option>
                      <option value="WEB_PRINT">Web / Browser Print Modal</option>
                    </select>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={receiptSettings.autoCut}
                      onChange={(e) =>
                        setReceiptSettings({ ...receiptSettings, autoCut: e.target.checked })
                      }
                      className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1">
                        <Scissors className="w-3.5 h-3.5 text-pink-400" />
                        <span>Auto Paper Cutter</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Pulsing GS V 65 0 cut command</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={receiptSettings.cashDrawerKick}
                      onChange={(e) =>
                        setReceiptSettings({ ...receiptSettings, cashDrawerKick: e.target.checked })
                      }
                      className="rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kick Cash Drawer</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Pulsing ESC p 0 25 250 pulse</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Button: Test Print */}
              <button
                type="button"
                onClick={handleTestReceiptClick}
                disabled={isTestingReceipt}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Printer className={`w-4 h-4 ${isTestingReceipt ? 'animate-spin' : ''}`} />
                <span>
                  {isTestingReceipt
                    ? 'Transmitting ESC/POS Receipt Stream...'
                    : '⚡ Test Print Receipt to Gainscha Printer'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: BARCODE LABEL PRINTER (Xprinter) */}
          {activeTab === 'label' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-wider">
                      Thermal Barcode Sticker Label Printer
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    TSPL / ZPL Direct Engine
                  </span>
                </div>

                {/* Target Windows Printer */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Select Label Printer Target
                  </label>
                  <select
                    value={labelSettings.printerName}
                    onChange={(e) =>
                      setLabelSettings({ ...labelSettings, printerName: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                  >
                    <option value="">-- Choose Installed Printer --</option>
                    {systemPrinters.map((prn) => (
                      <option key={prn} value={prn}>
                        {prn}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Target your Xprinter XP-365B / XP-370B / 300DPI thermal label printer.
                  </p>
                </div>

                {/* Driver Type & Resolution */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Label Command Protocol
                    </label>
                    <select
                      value={labelSettings.driverType}
                      onChange={(e) =>
                        setLabelSettings({
                          ...labelSettings,
                          driverType: e.target.value as 'TSPL' | 'ZPL' | 'BARTENDER_REST' | 'BARTENDER_CSV' | 'WINDOWS_SPOOLER',
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                    >
                      <option value="TSPL">TSPL (Native Xprinter / TSC)</option>
                      <option value="ZPL">ZPL II (Zebra Technologies)</option>
                      <option value="BARTENDER_REST">BarTender REST API Server</option>
                      <option value="BARTENDER_CSV">BarTender Commander Drop CSV</option>
                      <option value="WINDOWS_SPOOLER">Standard Windows GDI Driver</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Printhead Resolution
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLabelSettings({ ...labelSettings, dpi: 203 })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          labelSettings.dpi === 203
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        203 DPI (Standard)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLabelSettings({ ...labelSettings, dpi: 300 })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          labelSettings.dpi === 300
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        300 DPI (High Res)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sticker Gap & Speed */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Die-Cut Label Gap (mm)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="10"
                      value={labelSettings.gapMm}
                      onChange={(e) =>
                        setLabelSettings({ ...labelSettings, gapMm: parseFloat(e.target.value) || 2 })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Consumable Roll Deduction
                    </label>
                    <label className="flex items-center space-x-2 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={labelSettings.autoDeductRollStock}
                        onChange={(e) =>
                          setLabelSettings({
                            ...labelSettings,
                            autoDeductRollStock: e.target.checked,
                          })
                        }
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-200">
                        Auto-decrement sticker inventory
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Button: Test Print */}
              <button
                type="button"
                onClick={handleTestLabelClick}
                disabled={isTestingLabel}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Tag className={`w-4 h-4 ${isTestingLabel ? 'animate-spin' : ''}`} />
                <span>
                  {isTestingLabel
                    ? 'Transmitting TSPL Sticker Command...'
                    : '⚡ Test Print Barcode Sticker to Xprinter'}
                </span>
              </button>
            </div>
          )}

          {/* TAB 3: NETWORK & MOBILE PRINTING */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">
                    Host PC Print Gateway
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Printers connected physically to this PC via USB are automatically shared with any mobile phone, tablet, or cashier station connecting to:
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-pink-300 font-bold">http://10.10.61.89:1420</span>
                  <span className="text-[10px] text-slate-400">Local Wi-Fi Network</span>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>How Remote Printing Works:</span>
                </h4>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5">
                  <li>When cashier checks out on a phone/iPad, the print job is sent to this host PC.</li>
                  <li>This host PC immediately forwards the raw command stream to the <strong>Gainscha</strong> receipt printer or <strong>Xprinter</strong> label printer.</li>
                  <li>If the host PC is unreachable, the phone automatically falls back to <strong>AirPrint / Browser Print</strong>.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Current Receipt Target: <strong className="text-slate-200">{receiptSettings.printerName || 'Not Set'}</strong> | Label Target: <strong className="text-slate-200">{labelSettings.printerName || 'Not Set'}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center space-x-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Printer Router Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
