import React, { useState } from 'react';
import { ProductBarcodeMapping, BarcodeFormat } from '../../types/label';
import { VariantDetail } from '../../types/pos';
import {
  X,
  Barcode as BarcodeIcon,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Scan,
} from 'lucide-react';

interface EditBarcodeModalProps {
  mapping: ProductBarcodeMapping | null;
  variants: VariantDetail[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<ProductBarcodeMapping>) => Promise<void>;
}

export const EditBarcodeModal: React.FC<EditBarcodeModalProps> = ({
  mapping,
  variants,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = !!mapping;
  const initialVariant = variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(
    mapping?.variant_id || initialVariant?.id || ''
  );
  const [primaryBarcode, setPrimaryBarcode] = useState(mapping?.primary_barcode || '');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>(
    mapping?.barcode_format || 'EAN13'
  );
  const [secondaryBarcodes, setSecondaryBarcodes] = useState<string[]>(
    mapping?.secondary_barcodes || []
  );
  const [newSecondaryCode, setNewSecondaryCode] = useState('');
  const [batchNumber, setBatchNumber] = useState(mapping?.batch_number || 'BT-2026-X01');
  const [expiryDate, setExpiryDate] = useState(mapping?.expiry_date || '2028-12-31');
  const [rollStock, setRollStock] = useState(mapping?.roll_stock_remaining || 500);
  const [isSaving, setIsSaving] = useState(false);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || initialVariant;

  const handleGenerateBarcode = () => {
    // Generate valid random EAN-13 or Code-128
    if (barcodeFormat === 'EAN13') {
      const prefix = '840';
      const randomMiddle = Math.floor(100000000 + Math.random() * 900000000).toString();
      const code12 = (prefix + randomMiddle).substring(0, 12);
      // calculate check digit
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(code12[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      setPrimaryBarcode(code12 + checkDigit.toString());
    } else {
      const code = `CSM-${Math.floor(100000 + Math.random() * 900000)}`;
      setPrimaryBarcode(code);
    }
  };

  const handleAddSecondaryBarcode = () => {
    if (!newSecondaryCode.trim()) return;
    setSecondaryBarcodes([...secondaryBarcodes, newSecondaryCode.trim()]);
    setNewSecondaryCode('');
  };

  const handleRemoveSecondaryBarcode = (index: number) => {
    setSecondaryBarcodes(secondaryBarcodes.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryBarcode.trim()) {
      alert('Please enter or generate a primary barcode.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: mapping?.id,
        variant_id: selectedVariant.id,
        product_id: selectedVariant.product_id,
        product_name: selectedVariant.product_name,
        brand: selectedVariant.brand,
        sku: selectedVariant.sku,
        primary_barcode: primaryBarcode.trim(),
        secondary_barcodes: secondaryBarcodes,
        barcode_format: barcodeFormat,
        shade_name: selectedVariant.shade_name,
        shade_code: selectedVariant.shade_code,
        size_volume: selectedVariant.size_volume,
        batch_number: batchNumber.trim(),
        expiry_date: expiryDate,
        selling_price_cents: selectedVariant.selling_price_cents,
        cost_price_cents: selectedVariant.cost_price_cents,
        currency: 'GHS',
        currency_symbol: '₵',
        image_url: selectedVariant.image_url || undefined,
        roll_stock_remaining: rollStock,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save barcode mapping', err);
      alert('Failed to save barcode mapping.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-950/60 via-slate-900 to-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">
                {isEditing ? 'Update Barcode & Batch Mapping' : 'Assign New Product Barcode'}
              </h3>
              <p className="text-xs text-slate-400">
                Link EAN/UPC barcodes, batch lot numbers, and expiry tags for BarTender printing
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Target Product Selection */}
          {!isEditing ? (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                Select Product Variant
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => {
                  setSelectedVariantId(e.target.value);
                  const found = variants.find((v) => v.id === e.target.value);
                  if (found) {
                    setPrimaryBarcode(found.barcode);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} - {v.product_name} ({v.shade_name || 'Standard'}) - SKU: {v.sku}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
              {mapping?.image_url ? (
                <img
                  src={mapping.image_url}
                  alt={mapping.product_name}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold">
                  SKU
                </div>
              )}
              <div>
                <div className="text-[10px] font-black uppercase text-pink-400">
                  {mapping?.brand}
                </div>
                <div className="font-bold text-white text-xs">{mapping?.product_name}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {mapping?.shade_name ? `Shade: ${mapping.shade_name} | ` : ''}SKU: {mapping?.sku}
                </div>
              </div>
            </div>
          )}

          {/* Barcode & Format */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Primary Barcode</span>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[10px] font-bold text-pink-400 hover:text-pink-300 flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Generate</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={primaryBarcode}
                  onChange={(e) => setPrimaryBarcode(e.target.value)}
                  placeholder="e.g. 840000000001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold tracking-wider pl-9"
                />
                <Scan className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Format / Symbology
              </label>
              <select
                value={barcodeFormat}
                onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white font-bold"
              >
                <option value="EAN13">EAN-13 (Standard)</option>
                <option value="UPCA">UPC-A (US Beauty)</option>
                <option value="CODE128">Code-128</option>
                <option value="QR">QR 2D Code</option>
                <option value="DATAMATRIX">GS1 DataMatrix</option>
              </select>
            </div>
          </div>

          {/* Batch & Expiry Date */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Batch / Lot Number
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. BT-2026-09A"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Expiration Date</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Consumable Label Roll Stock Tracking */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-pink-400" />
                <span>Label Roll Remaining Consumable Stock</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Automatic deduction occurs each time BarTender or direct machine prints
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="0"
                value={rollStock}
                onChange={(e) => setRollStock(parseInt(e.target.value || '0', 10))}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-center font-mono font-bold text-white"
              />
              <span className="text-xs text-slate-400">stickers</span>
            </div>
          </div>

          {/* Secondary / Carton Barcodes */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              Secondary / Master Pack Barcodes (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newSecondaryCode}
                onChange={(e) => setNewSecondaryCode(e.target.value)}
                placeholder="e.g. Master Carton 12-Pack Barcode"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddSecondaryBarcode}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {secondaryBarcodes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {secondaryBarcodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono"
                  >
                    <span className="text-pink-300">{code}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryBarcode(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center space-x-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Barcode Mapping'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
