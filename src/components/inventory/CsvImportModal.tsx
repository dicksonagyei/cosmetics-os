import React, { useState, useRef } from 'react';
import { CsvImportProductRow } from '../../types/pos';
import { formatMoney } from '../../utils/formatters';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCsv: (rows: CsvImportProductRow[]) => Promise<number>;
  onImportSuccess: (count: number) => void;
}

const SAMPLE_CSV = `Product Name,Brand,Category,Shade Name,Hex Code,Size/Volume,SKU,Barcode,Cost Price,Selling Price,Quantity,Batch No,Expiry Date
Luminous Silk Foundation,Giorgio Armani,Foundation,Shade 6.5 Medium,#B58A63,30ml,GA-LSF-65,3614270293811,28.00,69.00,15,LOT-GA65-01,2027-12-31
Soft Matte Complete Concealer,NARS Cosmetics,Concealer,Ginger,#B07D53,6.2g,NARS-SMC-GIN,607845012399,14.00,32.00,20,LOT-NGIN-02,2027-10-15
Setting Powder Translucent,Laura Mercier,Setting Powder,Translucent Honey,#DDB892,29g,LM-TLSP-HNY,736150162541,19.00,43.00,12,LOT-LM-882,2028-03-31
Matte Revolution Lipstick,Charlotte Tilbury,Lipstick,Pillow Talk Medium,#965B54,3.5g,CT-MRL-PTM,506054272101,15.00,35.00,25,LOT-CTPT-09,2027-09-30`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportCsv,
  onImportSuccess,
}) => {
  const [parsedRows, setParsedRows] = useState<CsvImportProductRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Download CSV template
  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'cosmetics_os_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV text
  const parseCsvText = (text: string) => {
    try {
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        throw new Error('CSV file must have a header row and at least 1 data row.');
      }

      const rows: CsvImportProductRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Split by comma ignoring commas inside quotes
        const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 10) continue;

        const [
          productName,
          brand,
          category,
          shadeName,
          hexCode,
          sizeVolume,
          sku,
          barcode,
          costPrice,
          sellingPrice,
          quantity,
          batchNo,
          expiryDate,
        ] = cols;

        const costCents = Math.round(parseFloat(costPrice || '0') * 100);
        const sellCents = Math.round(parseFloat(sellingPrice || '0') * 100);
        const qty = parseInt(quantity || '0', 10);

        if (!productName || !brand || !sku || !barcode) continue;

        rows.push({
          product_name: productName,
          brand,
          category: category || 'General Beauty',
          shade_name: shadeName || undefined,
          shade_code: hexCode?.startsWith('#') ? hexCode : undefined,
          size_volume: sizeVolume || undefined,
          sku,
          barcode,
          cost_price_cents: isNaN(costCents) ? 0 : costCents,
          selling_price_cents: isNaN(sellCents) ? 0 : sellCents,
          quantity_on_hand: isNaN(qty) ? 0 : qty,
          batch_number: batchNo || undefined,
          expiry_date: expiryDate || undefined,
        });
      }

      if (rows.length === 0) {
        throw new Error('No valid product rows could be extracted from this CSV.');
      }

      setParsedRows(rows);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV file.');
      setParsedRows([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const count = await onImportCsv(parsedRows);
      setImportedCount(count);
      onImportSuccess(count);
      setTimeout(() => {
        setImportedCount(null);
        setParsedRows([]);
        setFileName(null);
        onClose();
      }, 1500);
    } catch (err) {
      alert(`Import failed: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  Excel & CSV Inventory Importer
                </h3>
                <span className="text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Bulk Ingestion
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload your supplier product spreadsheet or download our pre-formatted template.
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

        {/* Action / Dropzone Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3 flex-1">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{fileName ? 'Choose Another File' : 'Upload CSV / Excel File'}</span>
            </button>

            {fileName && (
              <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold truncate max-w-xs">{fileName}</span>
                <span className="text-emerald-400 font-bold">({parsedRows.length} rows parsed)</span>
              </div>
            )}
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600 text-xs font-bold flex items-center space-x-1.5 transition-colors shrink-0"
          >
            <Download className="w-4 h-4 text-pink-400" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/50 border-b border-rose-800/50 flex items-center space-x-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Table Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          {parsedRows.length > 0 ? (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 sticky top-0 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Brand & Product</th>
                    <th className="py-2.5 px-3">Shade / Size</th>
                    <th className="py-2.5 px-3">SKU & Barcode</th>
                    <th className="py-2.5 px-3">Cost Price</th>
                    <th className="py-2.5 px-3">Retail Price</th>
                    <th className="py-2.5 px-3 text-right">Initial Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </td>
                      <td className="py-2 px-3 font-sans">
                        <span className="font-bold text-pink-400 text-[10px] uppercase block">
                          {row.brand}
                        </span>
                        <span className="font-bold text-white text-xs">{row.product_name}</span>
                      </td>
                      <td className="py-2 px-3 font-sans">
                        {row.shade_name ? (
                          <div className="flex items-center space-x-1.5">
                            {row.shade_code && (
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20"
                                style={{ backgroundColor: row.shade_code }}
                              />
                            )}
                            <span className="text-slate-300">{row.shade_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">{row.size_volume || 'Standard'}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        <div className="text-slate-300">{row.sku}</div>
                        <div className="text-slate-500 text-[10px]">{row.barcode}</div>
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {formatMoney(row.cost_price_cents)}
                      </td>
                      <td className="py-2 px-3 font-bold text-white">
                        {formatMoney(row.selling_price_cents)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400">
                        +{row.quantity_on_hand}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl">
              <UploadCloud className="w-12 h-12 text-slate-600 mb-3" />
              <h4 className="font-bold text-white text-sm">No CSV file uploaded yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Upload a .csv file or download the template above to quickly populate and import your cosmetics catalog.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {parsedRows.length > 0 && (
              <span>
                Ready to import <strong className="text-emerald-400">{parsedRows.length}</strong> items into your local edge database.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              disabled={parsedRows.length === 0 || isProcessing}
              onClick={handleExecuteImport}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {importedCount !== null ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Imported {importedCount} Items!</span>
                </>
              ) : isProcessing ? (
                <>
                  <Layers className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Confirm & Ingest {parsedRows.length} Products</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
