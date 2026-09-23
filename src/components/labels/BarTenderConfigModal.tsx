import React, { useState } from 'react';
import { BarTenderIntegrationConfig } from '../../types/label';
import {
  X,
  Printer,
  FileCode,
  FolderOpen,
  Save,
  CheckCircle2,
  Play,
  Zap,
} from 'lucide-react';

interface BarTenderConfigModalProps {
  config: BarTenderIntegrationConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: BarTenderIntegrationConfig) => Promise<void>;
  onTestPrint: () => Promise<void>;
}

export const BarTenderConfigModal: React.FC<BarTenderConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onSave,
  onTestPrint,
}) => {
  if (!isOpen) return null;

  const [integrationMode, setIntegrationMode] = useState(config.integration_mode);
  const [endpointUrl, setEndpointUrl] = useState(config.bartender_endpoint_url);
  const [btwFilename, setBtwFilename] = useState(config.btw_template_filename);
  const [dropFolderPath, setDropFolderPath] = useState(config.drop_folder_path);
  const [printerName, setPrinterName] = useState(config.printer_name);
  const [printerDpi, setPrinterDpi] = useState(config.printer_dpi);
  const [autoDeduct, setAutoDeduct] = useState(config.auto_deduct_roll_stock);

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestSuccess(false);
    try {
      await onTestPrint();
      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Test print dispatch failed. Please check printer connection or BarTender service.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        integration_mode: integrationMode,
        bartender_endpoint_url: endpointUrl.trim(),
        btw_template_filename: btwFilename.trim(),
        drop_folder_path: dropFolderPath.trim(),
        printer_name: printerName.trim(),
        printer_dpi: printerDpi,
        auto_deduct_roll_stock: autoDeduct,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save printer configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                BarTender & Label Machine Setup
              </h3>
              <p className="text-xs text-slate-400">
                Configure Seagull BarTender Automation, Web Print Server & Direct ZPL Thermal Printers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Integration & Printing Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIntegrationMode('WEB_PRINT_API')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  integrationMode === 'WEB_PRINT_API'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs text-amber-400">
                  <Zap className="w-4 h-4" />
                  <span>BarTender REST API</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Direct HTTP print trigger to BarTender Print Server
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationMode('COMMANDER_DROP_FOLDER')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  integrationMode === 'COMMANDER_DROP_FOLDER'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs text-amber-400">
                  <FolderOpen className="w-4 h-4" />
                  <span>Drop Folder (CSV/XML)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Drop CSV scan-in files into monitored Commander folder
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationMode('DIRECT_ZPL_RAW')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  integrationMode === 'DIRECT_ZPL_RAW'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs text-amber-400">
                  <FileCode className="w-4 h-4" />
                  <span>Direct Zebra ZPL II</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Send raw byte stream directly to USB / LAN Zebra printer
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIntegrationMode('DIRECT_TSPL_RAW')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  integrationMode === 'DIRECT_TSPL_RAW'
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 font-bold text-xs text-amber-400">
                  <Printer className="w-4 h-4" />
                  <span>Direct TSC / TSPL2</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Send raw TSPL commands to TSC / Xprinter / Honeywell
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Fields */}
          {integrationMode === 'WEB_PRINT_API' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                BarTender Print Server Endpoint URL
              </label>
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="http://127.0.0.1:8080/BarTender/api/v1/print"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>
          )}

          {integrationMode === 'COMMANDER_DROP_FOLDER' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Monitored Integration Drop Folder Path
              </label>
              <input
                type="text"
                value={dropFolderPath}
                onChange={(e) => setDropFolderPath(e.target.value)}
                placeholder="C:\BarTender\Commander\ScanIn\"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Target Thermal Label Printer
              </label>
              <input
                type="text"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="e.g. Zebra ZD420 (203dpi)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Default BarTender Template (.btw)
              </label>
              <input
                type="text"
                value={btwFilename}
                onChange={(e) => setBtwFilename(e.target.value)}
                placeholder="Cosmetics_50x30_Standard.btw"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 items-center">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Printer Printhead DPI
              </label>
              <select
                value={printerDpi}
                onChange={(e) => setPrinterDpi(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-bold"
              >
                <option value={203}>203 DPI (8 dots/mm - Standard)</option>
                <option value={300}>300 DPI (12 dots/mm - High Res)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-3">
              <input
                type="checkbox"
                id="autoDeduct"
                checked={autoDeduct}
                onChange={(e) => setAutoDeduct(e.target.checked)}
                className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 bg-slate-900 border-slate-700"
              />
              <label htmlFor="autoDeduct" className="text-xs font-bold text-slate-200 cursor-pointer">
                Auto-deduct label roll stock on print
              </label>
            </div>
          </div>

          {/* Test Print Section */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Printer Calibration & Test Print</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Dispatches a test calibration label to verify connection
              </div>
            </div>

            <button
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                testSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {testSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Success!</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Sending...' : 'Test Machine'}</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center space-x-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
