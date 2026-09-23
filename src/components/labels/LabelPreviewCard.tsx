import React from 'react';
import { ProductBarcodeMapping, LabelTemplateType } from '../../types/label';
import { AlertCircle } from 'lucide-react';

interface LabelPreviewCardProps {
  mapping: ProductBarcodeMapping;
  template: LabelTemplateType;
  scale?: number;
}

// Generate realistic SVG Barcode lines based on string characters
const generateSvgBarcodeLines = (code: string, width = 180, height = 45) => {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i);
  }
  
  const lineCount = 36;
  const lines: { x: number; w: number }[] = [];
  let currX = 4;
  const totalAvailable = width - 8;
  const step = totalAvailable / lineCount;

  for (let i = 0; i < lineCount; i++) {
    const isThick = ((hash >> (i % 28)) & 1) === 1 || i % 4 === 0;
    const w = isThick ? step * 0.7 : step * 0.35;
    lines.push({ x: currX, w: Math.max(1.2, w) });
    currX += step;
  }

  return (
    <svg width={width} height={height} className="overflow-visible mx-auto">
      {lines.map((l, idx) => (
        <rect
          key={idx}
          x={l.x}
          y={2}
          width={l.w}
          height={height - 12}
          fill="#111827"
          rx={0.5}
        />
      ))}
    </svg>
  );
};

export const LabelPreviewCard: React.FC<LabelPreviewCardProps> = ({
  mapping,
  template,
  scale = 1,
}) => {
  const priceFormatted = `${mapping.currency_symbol}${(mapping.selling_price_cents / 100).toFixed(2)}`;

  if (template === 'PRODUCT_TUBE_50x30') {
    // 50mm x 30mm Cosmetics Product Label
    return (
      <div
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="w-[280px] h-[170px] bg-white text-slate-900 rounded-lg p-3 shadow-xl border-2 border-slate-300 font-sans flex flex-col justify-between select-none relative overflow-hidden"
      >
        <div className="absolute top-1 right-2 text-[9px] font-mono text-slate-400 font-bold">
          50x30mm
        </div>

        <div>
          <div className="flex items-center justify-between pr-8">
            <span className="text-[11px] font-black uppercase tracking-wider text-pink-600 truncate">
              {mapping.brand}
            </span>
          </div>

          <div className="text-[11px] font-bold text-slate-900 leading-tight truncate mt-0.5">
            {mapping.product_name}
          </div>

          {mapping.shade_name && (
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-700 border border-slate-300 inline-block shrink-0" />
              <span className="text-[10px] font-semibold text-slate-700 truncate">
                {mapping.shade_name} {mapping.shade_code ? `(${mapping.shade_code})` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Barcode & Numbers */}
        <div className="my-auto text-center">
          {generateSvgBarcodeLines(mapping.primary_barcode, 230, 38)}
          <div className="text-[10px] font-mono font-bold tracking-widest text-slate-800 -mt-2">
            {mapping.primary_barcode}
          </div>
        </div>

        {/* Bottom Details */}
        <div className="flex items-end justify-between border-t border-dashed border-slate-300 pt-1">
          <div className="text-[8.5px] text-slate-600 font-mono leading-tight">
            <div>SKU: {mapping.sku}</div>
            <div>EXP: {mapping.expiry_date || '2028-12'} | LOT: {mapping.batch_number || 'BT-01'}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-slate-950 font-mono">{priceFormatted}</div>
          </div>
        </div>
      </div>
    );
  }

  if (template === 'SHELF_TAG_60x40') {
    // 60mm x 40mm Retail Shelf Edge Tag
    return (
      <div
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="w-[320px] h-[210px] bg-white text-slate-900 rounded-lg p-3.5 shadow-xl border-2 border-slate-400 font-sans flex flex-col justify-between select-none relative overflow-hidden"
      >
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-1.5">
          <div className="truncate pr-2">
            <div className="text-[10px] font-black uppercase text-pink-700 tracking-wider">
              {mapping.brand}
            </div>
            <div className="text-xs font-black text-slate-950 truncate leading-tight">
              {mapping.product_name}
            </div>
            {mapping.shade_name && (
              <div className="text-[10px] font-bold text-slate-600 truncate">
                Shade: {mapping.shade_name}
              </div>
            )}
          </div>
          <span className="bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            SHELF
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 items-center my-1">
          {/* Left: Barcode */}
          <div className="text-center">
            {generateSvgBarcodeLines(mapping.primary_barcode, 130, 42)}
            <div className="text-[9px] font-mono font-bold tracking-widest text-slate-800 -mt-2">
              {mapping.primary_barcode}
            </div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">
              SKU: {mapping.sku}
            </div>
          </div>

          {/* Right: Big Price Box */}
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-2 text-center shadow-inner">
            <div className="text-[8px] font-black uppercase tracking-wider text-amber-800">
              Retail Price
            </div>
            <div className="text-lg font-black text-slate-950 font-mono tracking-tight">
              {priceFormatted}
            </div>
            <div className="text-[8px] text-slate-600 font-medium">Incl. Tax</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono border-t border-slate-200 pt-1">
          <span>Batch: {mapping.batch_number || 'BT-2026-X'}</span>
          <span>Exp: {mapping.expiry_date || '2028-11-30'}</span>
          <span>Unit: {mapping.size_volume || 'Standard'}</span>
        </div>
      </div>
    );
  }

  if (template === 'CARTON_SHIPPING_100x150') {
    // 100mm x 150mm (4x6") Master Case Logistics Waybill
    return (
      <div
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        className="w-[300px] h-[380px] bg-white text-slate-900 rounded-lg p-3.5 shadow-xl border-4 border-slate-900 font-sans flex flex-col justify-between select-none relative overflow-hidden"
      >
        <div className="border-b-2 border-slate-900 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black tracking-widest uppercase bg-slate-950 text-white px-2 py-0.5 rounded">
              COSMENPLY LOGISTICS
            </span>
            <span className="text-[9px] font-mono font-bold text-slate-500">
              100x150mm (4x6")
            </span>
          </div>
          <div className="text-[10px] font-bold text-slate-700 mt-1 uppercase">
            Master Shipping Carton Manifest
          </div>
        </div>

        <div className="space-y-1.5 my-1 bg-slate-50 p-2 rounded border border-slate-200 text-[10px]">
          <div>
            <span className="font-bold text-slate-500">BRAND:</span>{' '}
            <span className="font-black text-pink-700">{mapping.brand}</span>
          </div>
          <div>
            <span className="font-bold text-slate-500">PRODUCT:</span>{' '}
            <span className="font-bold text-slate-950">{mapping.product_name}</span>
          </div>
          <div className="flex justify-between">
            <span>
              <span className="font-bold text-slate-500">SHADE:</span>{' '}
              <span className="font-bold">{mapping.shade_name || 'Standard'}</span>
            </span>
            <span>
              <span className="font-bold text-slate-500">SKU:</span>{' '}
              <span className="font-mono font-bold">{mapping.sku}</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span>
              <span className="font-bold text-slate-500">LOT:</span>{' '}
              <span className="font-mono font-bold">{mapping.batch_number || 'BT-2026-X'}</span>
            </span>
            <span>
              <span className="font-bold text-slate-500">EXP:</span>{' '}
              <span className="font-mono font-bold">{mapping.expiry_date || '2028-12-31'}</span>
            </span>
          </div>
        </div>

        {/* Master Case Barcode */}
        <div className="text-center my-1 bg-white p-1 rounded border border-slate-300">
          <div className="text-[8px] font-bold text-slate-500 mb-0.5">GS1 LOGISTICS MASTER BARCODE</div>
          {generateSvgBarcodeLines(mapping.primary_barcode, 250, 48)}
          <div className="text-xs font-mono font-black tracking-widest text-slate-900 -mt-2">
            (01) 0 {mapping.primary_barcode} (10) {mapping.batch_number || 'BT2026'}
          </div>
        </div>

        {/* Destination & Waybill */}
        <div className="border-t-2 border-slate-900 pt-2 flex items-center justify-between text-[10px]">
          <div>
            <div className="font-bold text-slate-500 text-[8px] uppercase">Route / Transit:</div>
            <div className="font-bold text-slate-900">Hub ➔ Retail Branch</div>
            <div className="text-[8px] font-mono text-slate-600">Alibaba Waybill Tag</div>
          </div>

          <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded font-mono text-[9px] font-bold">
            QR GS1
          </div>
        </div>
      </div>
    );
  }

  // 40mm x 20mm Store Tester / Promo Sticker
  return (
    <div
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      className="w-[240px] h-[130px] bg-amber-50 text-slate-900 rounded-lg p-2.5 shadow-xl border-2 border-dashed border-amber-600 font-sans flex flex-col justify-between select-none relative overflow-hidden"
    >
      <div className="text-center border-b border-amber-300 pb-1">
        <div className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center justify-center space-x-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>TESTER UNIT</span>
        </div>
        <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest">
          NOT FOR SALE / DISPLAY ONLY
        </div>
      </div>

      <div className="text-center my-0.5">
        <div className="text-[10px] font-bold text-slate-900 truncate">{mapping.product_name}</div>
        <div className="text-[9px] font-semibold text-slate-600 truncate">
          {mapping.brand} • {mapping.shade_name || mapping.sku}
        </div>
      </div>

      <div className="text-center">
        {generateSvgBarcodeLines(mapping.primary_barcode, 180, 26)}
        <div className="text-[8px] font-mono font-bold text-slate-700 -mt-1.5">
          {mapping.primary_barcode}
        </div>
      </div>
    </div>
  );
};
