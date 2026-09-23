import React, { useState } from 'react';
import {
  ProductBarcodeMapping,
  LabelTemplateType,
  BarTenderIntegrationConfig,
  LabelPrintJob,
} from '../../types/label';
import { VariantDetail } from '../../types/pos';
import { LabelPreviewCard } from './LabelPreviewCard';
import { EditBarcodeModal } from './EditBarcodeModal';
import { PrintLabelModal } from './PrintLabelModal';
import { BarTenderConfigModal } from './BarTenderConfigModal';
import { generateBarTenderCsvPayload } from '../../utils/labelGenerators';
import {
  Barcode as BarcodeIcon,
  Printer,
  Plus,
  Search,
  Download,
  Settings,
  Layers,
  Eye,
  Edit,
  Tag,
  Zap,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface LabelStudioViewProps {
  barcodeMappings: ProductBarcodeMapping[];
  variants: VariantDetail[];
  config: BarTenderIntegrationConfig;
  printHistory: LabelPrintJob[];
  onSaveBarcodeMapping: (data: Partial<ProductBarcodeMapping>) => Promise<void>;
  onSaveConfig: (config: BarTenderIntegrationConfig) => Promise<void>;
  onPrintLabels: (data: {
    mapping: ProductBarcodeMapping;
    template: LabelTemplateType;
    quantity: number;
    mode: 'BARTENDER' | 'DIRECT_RAW';
    generatedZpl?: string;
    generatedTspl?: string;
  }) => Promise<void>;
  onTestPrint: () => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const LabelStudioView: React.FC<LabelStudioViewProps> = ({
  barcodeMappings,
  variants,
  config,
  printHistory,
  onSaveBarcodeMapping,
  onSaveConfig,
  onPrintLabels,
  onTestPrint,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('ALL');
  const [filterFormat, setFilterFormat] = useState<string>('ALL');
  const [selectedMappingIds, setSelectedMappingIds] = useState<string[]>([]);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProductBarcodeMapping | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingMapping, setPrintingMapping] = useState<ProductBarcodeMapping | null>(null);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [previewingMapping, setPreviewingMapping] = useState<ProductBarcodeMapping | null>(
    barcodeMappings[0] || null
  );

  const brands = Array.from(new Set(barcodeMappings.map((m) => m.brand)));

  const filteredMappings = barcodeMappings.filter((m) => {
    const matchesSearch =
      m.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.primary_barcode.includes(searchQuery) ||
      (m.batch_number && m.batch_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBrand = filterBrand === 'ALL' || m.brand === filterBrand;
    const matchesFormat = filterFormat === 'ALL' || m.barcode_format === filterFormat;

    return matchesSearch && matchesBrand && matchesFormat;
  });

  // Calculate Metrics
  const totalMapped = barcodeMappings.length;
  const totalLabelsPrinted = barcodeMappings.reduce((sum, m) => sum + m.total_labels_printed, 0);
  const totalRollStock = barcodeMappings.reduce((sum, m) => sum + m.roll_stock_remaining, 0);
  const lowRollAlerts = barcodeMappings.filter((m) => m.roll_stock_remaining < 50).length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMappingIds(filteredMappings.map((m) => m.id));
    } else {
      setSelectedMappingIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedMappingIds.includes(id)) {
      setSelectedMappingIds(selectedMappingIds.filter((item) => item !== id));
    } else {
      setSelectedMappingIds([...selectedMappingIds, id]);
    }
  };

  const handleOpenNewBarcode = () => {
    setEditingMapping(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEditBarcode = (m: ProductBarcodeMapping) => {
    setEditingMapping(m);
    setIsEditModalOpen(true);
  };

  const handleOpenPrint = (m: ProductBarcodeMapping) => {
    setPrintingMapping(m);
    setIsPrintModalOpen(true);
  };

  const handleExportBatchCsv = () => {
    const itemsToExport = barcodeMappings
      .filter((m) => (selectedMappingIds.length > 0 ? selectedMappingIds.includes(m.id) : true))
      .map((m) => ({ mapping: m, quantity: 10 }));

    const csvContent = generateBarTenderCsvPayload(itemsToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BarTender_Export_All_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Top Bar Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-600/30">
            <BarcodeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white tracking-wide">
                Barcode & Label Management Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30 uppercase">
                BarTender Automation Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Product-to-barcode registry, batch/expiry stamping, label roll deduction tracking & direct thermal machine integration
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRefresh()}
            title="Refresh Barcodes & Printers"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExportBatchCsv}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export BarTender CSV</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Machine & BarTender Setup</span>
          </button>

          <button
            onClick={handleOpenNewBarcode}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Barcode</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Mapped Product SKUs
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{totalMapped}</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
            <Tag className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Labels Printed
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {totalLabelsPrinted}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Printer className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Consumable Roll Stock</span>
              {lowRollAlerts > 0 && (
                <span className="flex items-center text-amber-400 text-[9px] font-bold">
                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                  {lowRollAlerts} Low
                </span>
              )}
            </div>
            <div className="text-xl font-black text-cyan-400 font-mono mt-0.5">
              {totalRollStock}{' '}
              <span className="text-[11px] text-slate-400 font-normal">stickers</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Printer & BarTender Link
            </div>
            <div className="text-xs font-bold text-amber-400 font-mono mt-1 flex items-center space-x-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate">{config.printer_name}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Workspace (Table + Live Preview Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Table & Filters */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
          {/* Filters Bar */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by brand, SKU, barcode, batch lot..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-300 font-bold"
              >
                <option value="ALL">All Brands ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-300 font-bold"
              >
                <option value="ALL">All Formats</option>
                <option value="EAN13">EAN-13</option>
                <option value="UPCA">UPC-A</option>
                <option value="CODE128">Code-128</option>
                <option value="QR">QR Code</option>
              </select>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedMappingIds.length > 0 &&
                        selectedMappingIds.length === filteredMappings.length
                      }
                      onChange={handleSelectAll}
                      className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-500 bg-slate-900 border-slate-700"
                    />
                  </th>
                  <th className="py-2.5 px-3">Product & Shade</th>
                  <th className="py-2.5 px-3">Barcode Symbology</th>
                  <th className="py-2.5 px-3">Price & Batch Tag</th>
                  <th className="py-2.5 px-3">Roll Stock & Deductions</th>
                  <th className="py-2.5 px-3 text-center">Printed</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredMappings.map((m) => {
                  const isSelected = selectedMappingIds.includes(m.id);
                  const isPreviewing = previewingMapping?.id === m.id;
                  const priceFormatted = `${m.currency_symbol}${(m.selling_price_cents / 100).toFixed(2)}`;

                  return (
                    <tr
                      key={m.id}
                      onClick={() => setPreviewingMapping(m)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isPreviewing ? 'bg-pink-950/20 border-l-4 border-l-pink-500' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(m.id)}
                          className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-500 bg-slate-900 border-slate-700"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2.5">
                          {m.image_url ? (
                            <img
                              src={m.image_url}
                              alt={m.product_name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-pink-500/20">
                              SKU
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-[10px] font-black uppercase text-pink-400 tracking-wider truncate">
                              {m.brand}
                            </div>
                            <div className="font-bold text-white text-xs truncate max-w-[220px]">
                              {m.product_name}
                            </div>
                            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                              {m.shade_name && (
                                <span className="bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                                  {m.shade_name}
                                </span>
                              )}
                              <span>SKU: {m.sku}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <div className="font-mono font-bold text-white text-xs tracking-wider">
                            {m.primary_barcode}
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-pink-500/10 text-pink-300 border border-pink-500/20">
                              {m.barcode_format}
                            </span>
                            {m.secondary_barcodes.length > 0 && (
                              <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                +{m.secondary_barcodes.length} Pack Code
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        <div className="text-xs font-black text-amber-400">{priceFormatted}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          LOT: {m.batch_number || 'N/A'}
                        </div>
                        <div className="text-[9px] text-slate-500">EXP: {m.expiry_date || 'N/A'}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="space-y-1 max-w-[130px]">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-slate-400">Roll Stock:</span>
                            <span
                              className={`font-bold ${
                                m.roll_stock_remaining < 50 ? 'text-rose-400' : 'text-cyan-300'
                              }`}
                            >
                              {m.roll_stock_remaining} pcs
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                m.roll_stock_remaining < 50
                                  ? 'bg-rose-500'
                                  : m.roll_stock_remaining < 150
                                  ? 'bg-amber-500'
                                  : 'bg-cyan-500'
                              }`}
                              style={{
                                width: `${Math.min(100, (m.roll_stock_remaining / 500) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                        {m.total_labels_printed}
                      </td>

                      <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenPrint(m)}
                            className="p-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30 transition-all flex items-center space-x-1 px-2.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="font-bold text-[11px]">Print</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditBarcode(m)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Live Visual Label Preview Panel */}
        <div className="w-[340px] bg-slate-950 p-4 border-l border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto">
          {previewingMapping ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-black uppercase text-pink-400 tracking-wider flex items-center space-x-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Interactive Label Preview</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {previewingMapping.sku}
                </span>
              </div>

              {/* 50x30 Preview */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Product Label (50x30mm)
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-center">
                  <LabelPreviewCard
                    mapping={previewingMapping}
                    template="PRODUCT_TUBE_50x30"
                    scale={0.95}
                  />
                </div>
              </div>

              {/* 60x40 Shelf Tag Preview */}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Shelf Price Tag (60x40mm)
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-center">
                  <LabelPreviewCard
                    mapping={previewingMapping}
                    template="SHELF_TAG_60x40"
                    scale={0.85}
                  />
                </div>
              </div>

              {/* Print Button */}
              <button
                onClick={() => handleOpenPrint(previewingMapping)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Launch BarTender Print Dialog</span>
              </button>

              {/* Recent Print History Drawer */}
              {printHistory.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Recent Label Print Jobs ({printHistory.length})
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {printHistory.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-200 truncate max-w-[170px]">
                            {job.product_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {job.barcode} • {job.quantity_to_print} pcs
                          </div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                          {job.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <BarcodeIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Select a product row to preview label dimensions</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditBarcodeModal
        mapping={editingMapping}
        variants={variants}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onSaveBarcodeMapping}
      />

      <PrintLabelModal
        mapping={printingMapping}
        config={config}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onPrint={onPrintLabels}
      />

      <BarTenderConfigModal
        config={config}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={onSaveConfig}
        onTestPrint={onTestPrint}
      />
    </div>
  );
};
