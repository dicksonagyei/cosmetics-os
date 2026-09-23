import {
  DualPrinterHardwareConfig,
  ReceiptPrinterSettings,
  LabelPrinterSettings,
} from '../types/printer';
import { EscPosEncoder } from './escpos';
import { generateTsplLabel, generateZplLabel } from './labelGenerators';
import { ProductBarcodeMapping } from '../types/label';

const LOCAL_STORAGE_KEY = 'cosmetics_os_printer_router_config';

export const DEFAULT_PRINTER_CONFIG: DualPrinterHardwareConfig = {
  receipt: {
    printerName: 'POS Printer 300DPI  Series',
    paperWidth: '80mm',
    autoCut: true,
    cashDrawerKick: true,
    connectionType: 'WINDOWS_SPOOLER',
    headerText: 'COSMETICS OS LUXURY BEAUTY',
    subHeaderText: 'Main Mall Flagship • Accra',
    footerText: 'Thank you for shopping with us! Returns valid within 7 days.',
  },
  label: {
    printerName: 'POS Printer 300DPI  Series',
    driverType: 'TSPL',
    dpi: 203,
    gapMm: 2,
    speed: 4,
    density: 8,
    connectionType: 'WINDOWS_SPOOLER',
    autoDeductRollStock: true,
  },
  systemPrinters: [
    'POS Printer 300DPI  Series',
    'Microsoft Print to PDF',
    'OneNote for Windows 10',
    'Microsoft XPS Document Writer',
  ],
};

export const loadPrinterConfig = (): DualPrinterHardwareConfig => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PRINTER_CONFIG,
        ...parsed,
        receipt: { ...DEFAULT_PRINTER_CONFIG.receipt, ...parsed.receipt },
        label: { ...DEFAULT_PRINTER_CONFIG.label, ...parsed.label },
      };
    }
  } catch (err) {
    console.error('Error loading printer config from localStorage', err);
  }
  return DEFAULT_PRINTER_CONFIG;
};

export const savePrinterConfig = (config: DualPrinterHardwareConfig): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving printer config to localStorage', err);
  }
};

/**
 * Generates test ESC/POS bytes for the Gainscha Receipt Printer
 */
export const buildTestReceiptBytes = (settings: ReceiptPrinterSettings): number[] => {
  const enc = new EscPosEncoder();
  const width = settings.paperWidth === '80mm' ? 42 : 32;

  if (settings.cashDrawerKick) {
    enc.kickCashDrawer();
  }

  enc.alignCenter();
  enc.bold(true);
  enc.textSize(true, true);
  enc.textLn('GAINSCHA 80MM TEST');
  enc.textSize(false, false);
  enc.textLn('Hardware Diagnostic Passed');
  enc.bold(false);
  enc.divider(width);

  enc.alignLeft();
  enc.textLn(`PRINTER: ${settings.printerName || 'Default Windows Queue'}`);
  enc.textLn(`WIDTH:   ${settings.paperWidth}`);
  enc.textLn(`TIME:    ${new Date().toLocaleString()}`);
  enc.divider(width);

  enc.bold(true);
  enc.textLn('TEST ITEM BREAKDOWN:');
  enc.bold(false);
  enc.twoColumns('1x Rare Beauty Blush (Joy)', '₵320.00', width);
  enc.twoColumns('1x Fenty Gloss (Glow)', '₵280.00', width);
  enc.divider(width);

  enc.bold(true);
  enc.twoColumns('SUBTOTAL:', '₵600.00', width);
  enc.twoColumns('VAT TAX (15%):', '₵90.00', width);
  enc.textSize(false, true);
  enc.twoColumns('TOTAL AMOUNT:', '₵690.00', width);
  enc.textSize(false, false);
  enc.bold(false);
  enc.divider(width);

  enc.alignCenter();
  enc.textLn('ESC/POS Protocol Verified OK');
  enc.textLn('*** COSMETICS OS POS ***');

  if (settings.autoCut) {
    enc.cut();
  }

  return Array.from(enc.getUint8Array());
};

/**
 * Generates test TSPL / ZPL payload for the Xprinter Label Printer
 */
export const buildTestLabelPayload = (settings: LabelPrinterSettings): { payload: string; type: 'TSPL' | 'ZPL' } => {
  const testMapping: ProductBarcodeMapping = {
    id: 'test-item-01',
    product_id: 'prod-rare-01',
    variant_id: 'var-rare-01',
    product_name: 'Soft Pinch Liquid Blush',
    brand: 'Rare Beauty',
    sku: 'RB-BLUSH-JOY',
    primary_barcode: '840139300125',
    secondary_barcodes: ['CTN-12-JOY'],
    barcode_format: 'EAN13',
    shade_name: 'Joy (Dewy Peach)',
    shade_code: '#FF8A65',
    size_volume: '7.5ml / 0.25 fl oz',
    batch_number: 'BT-2026-X09',
    expiry_date: '2028-12-31',
    selling_price_cents: 32000,
    cost_price_cents: 18000,
    currency: 'GHS',
    currency_symbol: '₵',
    total_labels_printed: 1,
    roll_stock_remaining: 499,
    deduction_history: [],
  };

  if (settings.driverType === 'ZPL') {
    return {
      payload: generateZplLabel(testMapping, 'PRODUCT_TUBE_50x30', 1, settings.dpi),
      type: 'ZPL',
    };
  }

  return {
    payload: generateTsplLabel(testMapping, 'PRODUCT_TUBE_50x30', 1),
    type: 'TSPL',
  };
};
