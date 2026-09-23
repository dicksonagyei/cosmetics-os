import React, { useState } from 'react';
import { ProductBarcodeMapping, LabelTemplateType, BarTenderIntegrationConfig } from '../../types/label';
import { LabelPreviewCard } from './LabelPreviewCard';
import { generateZplLabel, generateTsplLabel, generateBarTenderRestPayload, generateBarTenderCsvPayload } from '../../utils/labelGenerators';
import {
  X,
  Printer,
  Download,
  Layers,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface PrintLabelModalProps {
  mapping: ProductBarcodeMapping | null;
  config: BarTenderIntegrationConfig;
  isOpen: boolean;
  onClose: () => void;
  onPrint: (data: {
    mapping: ProductBarcodeMapping;
    template: LabelTemplateType;
    quantity: number;
    mode: 'BARTENDER' | 'DIRECT_RAW';
    generatedZpl?: string;
    generatedTspl?: string;
  }) => Promise<void>;
}

export const PrintLabelModal: React.FC<PrintLabelModalProps> = ({
  mapping,
  config,
  isOpen,
  onClose,
  onPrint,
}) => {
  if (!isOpen || !mapping) return null;

  const [template, setTemplate] = useState<LabelTemplateType>('PRODUCT_TUBE_50x30');
  const [quantity, setQuantity] = useState(10);
  const [activeCodeTab, setActiveCodeTab] = useState<'preview' | 'zpl' | 'bartender_json' | 'csv'>('preview');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  const remainingRoll = Math.max(0, mapping.roll_stock_remaining - quantity);
  const zplCode = generateZplLabel(mapping, template, quantity, config.printer_dpi);
  const tsplCode = generateTsplLabel(mapping, template, quantity);
  const restPayload = generateBarTenderRestPayload(mapping, template, quantity, config);
  const csvPayload = generateBarTenderCsvPayload([{ mapping, quantity }]);

  const handlePrint = async (mode: 'BARTENDER' | 'DIRECT_RAW') => {
    setIsPrinting(true);
    setPrintSuccess(false);
    try {
      await onPrint({
        mapping,
        template,
        quantity,
        mode,
        generatedZpl: zplCode,
        generatedTspl: tsplCode,
      });
      setPrintSuccess(true);
      setTimeout(() => {
        setPrintSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Print dispatch failed. Please check printer connection or BarTender configuration.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csvPayload], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BarTender_${mapping.sku}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-950/60 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                Print Product Label & Barcode Tag
              </h3>
              <p className="text-xs text-slate-400">
                {mapping.brand} — {mapping.product_name} ({mapping.shade_name || mapping.sku})
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

        {/* Modal Grid Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto flex-1">
          {/* Left Column: Configuration & Deductions (5 cols) */}
          <div className="md:col-span-5 p-5 border-r border-slate-800 space-y-4 bg-slate-950/50">
            {/* Template Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Label Template & Size
              </label>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'PRODUCT_TUBE_50x30' as LabelTemplateType,
                    title: '50 x 30 mm Compact Tube',
                    desc: 'Lipsticks, foundation bottles, jars',
                  },
                  {
                    id: 'SHELF_TAG_60x40' as LabelTemplateType,
                    title: '60 x 40 mm Shelf Price Tag',
                    desc: 'Store display shelf edge with large price',
                  },
                  {
                    id: 'CARTON_SHIPPING_100x150' as LabelTemplateType,
                    title: '100 x 150 mm (4x6") Outer Case',
                    desc: 'Wholesale master cartons & logistics',
                  },
                  {
                    id: 'TESTER_PROMO_40x20' as LabelTemplateType,
                    title: '40 x 20 mm Tester / Not-For-Sale',
                    desc: 'Display testers and beauty counter samples',
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplate(tpl.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      template === tpl.id
                        ? 'bg-pink-600/10 border-pink-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs text-pink-300">{tpl.title}</div>
                    <div className="text-[10px] text-slate-400">{tpl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Labels to Print
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value || '1', 10))}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-center font-mono font-bold text-white text-base"
                />
                <div className="flex space-x-1">
                  {[5, 10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setQuantity(qty)}
                      className={`px-2 py-1 rounded text-xs font-bold font-mono transition-colors ${
                        quantity === qty
                          ? 'bg-pink-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Roll Stock Deduction Summary */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-3.5 rounded-xl border border-pink-500/20 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <Layers className="w-4 h-4 text-pink-400" />
                <span>Consumable Roll Deduction Preview</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <div className="text-[9px] text-slate-400 uppercase font-bold">Current Stock</div>
                  <div className="text-xs font-mono font-bold text-white">
                    {mapping.roll_stock_remaining}
                  </div>
                </div>

                <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  <div className="text-[9px] text-rose-400 uppercase font-bold">Deduction</div>
                  <div className="text-xs font-mono font-bold text-rose-300">-{quantity}</div>
                </div>

                <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <div className="text-[9px] text-emerald-400 uppercase font-bold">Remaining</div>
                  <div className="text-xs font-mono font-bold text-emerald-300">
                    {remainingRoll}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Visual Preview & Code Inspectors (7 cols) */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between bg-slate-900">
            <div>
              {/* Tab Selector */}
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('preview')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeCodeTab === 'preview'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Live Visual Preview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('zpl')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeCodeTab === 'zpl'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Zebra ZPL II Raw
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('bartender_json')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeCodeTab === 'bartender_json'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  BarTender REST JSON
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('csv')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeCodeTab === 'csv'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Commander CSV
                </button>
              </div>

              {/* Tab Contents */}
              {activeCodeTab === 'preview' && (
                <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[300px]">
                  <LabelPreviewCard mapping={mapping} template={template} scale={1} />
                </div>
              )}

              {activeCodeTab === 'zpl' && (
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-[300px] overflow-auto">
                    {zplCode}
                  </pre>
                </div>
              )}

              {activeCodeTab === 'bartender_json' && (
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-300 max-h-[300px] overflow-auto">
                    {JSON.stringify(restPayload, null, 2)}
                  </pre>
                </div>
              )}

              {activeCodeTab === 'csv' && (
                <div className="space-y-2">
                  <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 max-h-[250px] overflow-auto">
                    {csvPayload}
                  </pre>
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV for BarTender Commander</span>
                  </button>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-mono">
                Target: {config.printer_name}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handlePrint('DIRECT_RAW')}
                  disabled={isPrinting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Direct Raw ZPL</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrint('BARTENDER')}
                  disabled={isPrinting}
                  className={`px-5 py-2 rounded-xl font-bold text-xs shadow-lg flex items-center space-x-1.5 transition-all ${
                    printSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white shadow-pink-600/30'
                  }`}
                >
                  {printSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sent to BarTender!</span>
                    </>
                  ) : (
                    <>
                      <Printer className="w-4 h-4" />
                      <span>{isPrinting ? 'Printing...' : `Print ${quantity} via BarTender`}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
