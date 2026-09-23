import { ProductBarcodeMapping, LabelTemplateType, BarTenderIntegrationConfig } from '../types/label';

/**
 * Generates Native Zebra ZPL II raw thermal printer code
 */
export function generateZplLabel(
  mapping: ProductBarcodeMapping,
  template: LabelTemplateType,
  quantity = 1,
  dpi: number = 203
): string {
  const dpmm = dpi === 300 ? 12 : 8; // dots per mm
  const priceFormatted = `${mapping.currency_symbol}${(mapping.selling_price_cents / 100).toFixed(2)}`;
  const cleanBarcode = mapping.primary_barcode.replace(/[^A-Za-z0-9]/g, '');

  let zpl = `^XA\n^PW${template === 'CARTON_SHIPPING_100x150' ? 100 * dpmm : template === 'SHELF_TAG_60x40' ? 60 * dpmm : 50 * dpmm}\n`;

  if (template === 'PRODUCT_TUBE_50x30') {
    // 50mm x 30mm Cosmetics Product Label
    zpl += `
^FO${2 * dpmm},${2 * dpmm}^A0N,${2.5 * dpmm},${2.5 * dpmm}^FD${mapping.brand.toUpperCase()}^FS
^FO${2 * dpmm},${5 * dpmm}^A0N,${2.2 * dpmm},${2.2 * dpmm}^FD${mapping.product_name.substring(0, 24)}^FS
${mapping.shade_name ? `^FO${2 * dpmm},${8 * dpmm}^A0N,${2 * dpmm},${2 * dpmm}^FDShade: ${mapping.shade_name.substring(0, 20)}^FS` : ''}
^FO${2 * dpmm},${11 * dpmm}^BY2,2.5,${8 * dpmm}^BCN,${8 * dpmm},Y,N,N^FD${cleanBarcode}^FS
^FO${2 * dpmm},${22 * dpmm}^A0N,${2.8 * dpmm},${2.8 * dpmm}^FDBatch: ${mapping.batch_number || 'N/A'}^FS
^FO${28 * dpmm},${21 * dpmm}^A0N,${3.5 * dpmm},${3.5 * dpmm}^FD${priceFormatted}^FS
^FO${2 * dpmm},${25.5 * dpmm}^A0N,${2 * dpmm},${2 * dpmm}^FDExp: ${mapping.expiry_date || 'N/A'} | SKU: ${mapping.sku}^FS
^PQ${quantity}
^XZ`;
  } else if (template === 'SHELF_TAG_60x40') {
    // 60mm x 40mm Retail Shelf Edge Price Tag
    zpl += `
^FO${2 * dpmm},${2 * dpmm}^GB${56 * dpmm},${36 * dpmm},2^FS
^FO${4 * dpmm},${4 * dpmm}^A0N,${3 * dpmm},${3 * dpmm}^FD${mapping.brand.toUpperCase()}^FS
^FO${4 * dpmm},${8 * dpmm}^A0N,${2.5 * dpmm},${2.5 * dpmm}^FD${mapping.product_name.substring(0, 28)}^FS
${mapping.shade_name ? `^FO${4 * dpmm},${11.5 * dpmm}^A0N,${2.2 * dpmm},${2.2 * dpmm}^FD${mapping.shade_name}^FS` : ''}
^FO${32 * dpmm},${15 * dpmm}^GB${24 * dpmm},${12 * dpmm},3^FS
^FO${34 * dpmm},${18 * dpmm}^A0N,${5 * dpmm},${5 * dpmm}^FD${priceFormatted}^FS
^FO${4 * dpmm},${15 * dpmm}^BY2,2.5,${9 * dpmm}^BCN,${9 * dpmm},Y,N,N^FD${cleanBarcode}^FS
^FO${4 * dpmm},${31 * dpmm}^A0N,${2 * dpmm},${2 * dpmm}^FDSKU: ${mapping.sku} | EXP: ${mapping.expiry_date || 'N/A'}^FS
^PQ${quantity}
^XZ`;
  } else if (template === 'CARTON_SHIPPING_100x150') {
    // 100mm x 150mm (4x6") Master Carton Logistics Waybill
    zpl += `
^FO${5 * dpmm},${5 * dpmm}^GB${90 * dpmm},${140 * dpmm},3^FS
^FO${10 * dpmm},${10 * dpmm}^A0N,${6 * dpmm},${6 * dpmm}^FDCOSMENPLY LOGISTICS^FS
^FO${10 * dpmm},${18 * dpmm}^A0N,${3.5 * dpmm},${3.5 * dpmm}^FDMaster Outer Carton Manifest^FS
^FO${10 * dpmm},${26 * dpmm}^GB${80 * dpmm},${1 * dpmm},1^FS
^FO${10 * dpmm},${30 * dpmm}^A0N,${3 * dpmm},${3 * dpmm}^FDBrand: ${mapping.brand}^FS
^FO${10 * dpmm},${35 * dpmm}^A0N,${3.5 * dpmm},${3.5 * dpmm}^FDProduct: ${mapping.product_name}^FS
^FO${10 * dpmm},${41 * dpmm}^A0N,${3 * dpmm},${3 * dpmm}^FDShade: ${mapping.shade_name || 'Standard'} | SKU: ${mapping.sku}^FS
^FO${10 * dpmm},${47 * dpmm}^A0N,${3 * dpmm},${3 * dpmm}^FDBatch Lot: ${mapping.batch_number || 'BT-2026-X01'}^FS
^FO${10 * dpmm},${53 * dpmm}^A0N,${3 * dpmm},${3 * dpmm}^FDExpiry Date: ${mapping.expiry_date || '2028-12-31'}^FS
^FO${10 * dpmm},${62 * dpmm}^BY3,3,${20 * dpmm}^BCN,${20 * dpmm},Y,N,N^FD${cleanBarcode}^FS
^FO${10 * dpmm},${92 * dpmm}^GB${80 * dpmm},${1 * dpmm},1^FS
^FO${10 * dpmm},${98 * dpmm}^A0N,${4 * dpmm},${4 * dpmm}^FDPACK COUNT: ${quantity} UNITS^FS
^FO${10 * dpmm},${106 * dpmm}^A0N,${3 * dpmm},${3 * dpmm}^FDDestination: Central Hub -> Retail Branch^FS
^FO${10 * dpmm},${115 * dpmm}^BQN,2,6^FDQA,${cleanBarcode}^FS
^FO${35 * dpmm},${120 * dpmm}^A0N,${2.5 * dpmm},${2.5 * dpmm}^FDAlibaba Supply-Chain GS1 QR Tag^FS
^PQ1
^XZ`;
  } else {
    // 40mm x 20mm Store Tester / Promo Label
    zpl += `
^FO${2 * dpmm},${2 * dpmm}^GB${36 * dpmm},${16 * dpmm},2^FS
^FO${4 * dpmm},${4 * dpmm}^A0N,${2.8 * dpmm},${2.8 * dpmm}^FD*** TESTER UNIT ***^FS
^FO${4 * dpmm},${8 * dpmm}^A0N,${2.2 * dpmm},${2.2 * dpmm}^FDNOT FOR RESALE^FS
^FO${4 * dpmm},${11.5 * dpmm}^A0N,${2 * dpmm},${2 * dpmm}^FD${mapping.brand} - ${mapping.shade_name || mapping.sku}^FS
^FO${4 * dpmm},${14.5 * dpmm}^A0N,${1.8 * dpmm},${1.8 * dpmm}^FDBatch: ${mapping.batch_number || 'DISPLAY'}^FS
^PQ${quantity}
^XZ`;
  }

  return zpl.trim();
}

/**
 * Generates TSC TSPL2 raw thermal printer code
 */
export function generateTsplLabel(
  mapping: ProductBarcodeMapping,
  template: LabelTemplateType,
  quantity = 1
): string {
  const widthMm = template === 'CARTON_SHIPPING_100x150' ? 100 : template === 'SHELF_TAG_60x40' ? 60 : 50;
  const heightMm = template === 'CARTON_SHIPPING_100x150' ? 150 : template === 'SHELF_TAG_60x40' ? 40 : 30;
  const priceFormatted = `${mapping.currency_symbol}${(mapping.selling_price_cents / 100).toFixed(2)}`;

  let tspl = `SIZE ${widthMm} mm, ${heightMm} mm\nGAP 2 mm, 0 mm\nDIRECTION 1\nCLS\n`;
  tspl += `TEXT 20,20,"3",0,1,1,"${mapping.brand.toUpperCase()}"\n`;
  tspl += `TEXT 20,50,"2",0,1,1,"${mapping.product_name.substring(0, 22)}"\n`;
  tspl += `BARCODE 20,80,"128",60,1,0,2,2,"${mapping.primary_barcode}"\n`;
  tspl += `TEXT 20,160,"3",0,1,1,"PRICE: ${priceFormatted}"\n`;
  tspl += `PRINT ${quantity},1\n`;

  return tspl;
}

/**
 * Generates dynamic CSV data file for Seagull Scientific BarTender Commander / Integration Builder
 */
export function generateBarTenderCsvPayload(
  items: { mapping: ProductBarcodeMapping; quantity: number }[]
): string {
  const headers = [
    'SKU',
    'Product_Name',
    'Brand',
    'Shade_Name',
    'Shade_Code',
    'Primary_Barcode',
    'Secondary_Barcode',
    'Barcode_Format',
    'Price_Formatted',
    'Price_Cents',
    'Currency',
    'Batch_Number',
    'Expiry_Date',
    'Print_Quantity',
  ];

  const rows = items.map(({ mapping, quantity }) => {
    const priceFormatted = `${mapping.currency_symbol}${(mapping.selling_price_cents / 100).toFixed(2)}`;
    return [
      `"${mapping.sku}"`,
      `"${mapping.product_name.replace(/"/g, '""')}"`,
      `"${mapping.brand.replace(/"/g, '""')}"`,
      `"${(mapping.shade_name || '').replace(/"/g, '""')}"`,
      `"${mapping.shade_code || ''}"`,
      `"${mapping.primary_barcode}"`,
      `"${mapping.secondary_barcodes.join(';')}"`,
      `"${mapping.barcode_format}"`,
      `"${priceFormatted}"`,
      mapping.selling_price_cents,
      `"${mapping.currency}"`,
      `"${mapping.batch_number || ''}"`,
      `"${mapping.expiry_date || ''}"`,
      quantity,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates BarTender Web Print Server REST API Payload (JSON)
 */
export function generateBarTenderRestPayload(
  mapping: ProductBarcodeMapping,
  template: LabelTemplateType,
  quantity: number,
  config: BarTenderIntegrationConfig
) {
  const priceFormatted = `${mapping.currency_symbol}${(mapping.selling_price_cents / 100).toFixed(2)}`;

  return {
    Header: {
      DocumentFile: config.btw_template_filename || 'Cosmetics_50x30_Standard.btw',
      Printer: config.printer_name || 'Zebra ZD420',
      Copies: quantity,
      SerializedDataSources: {
        SKU: mapping.sku,
        Brand: mapping.brand,
        ProductName: mapping.product_name,
        ShadeName: mapping.shade_name || '',
        ShadeCode: mapping.shade_code || '',
        Barcode: mapping.primary_barcode,
        BarcodeFormat: mapping.barcode_format,
        PriceFormatted: priceFormatted,
        PriceCents: mapping.selling_price_cents,
        BatchNumber: mapping.batch_number || 'BT-2026-X',
        ExpiryDate: mapping.expiry_date || '2028-12-31',
        TemplateType: template,
        PrintedTimestamp: new Date().toISOString(),
      },
    },
  };
}
