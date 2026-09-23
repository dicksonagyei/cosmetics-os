export type BarcodeFormat = 'EAN13' | 'UPCA' | 'CODE128' | 'QR' | 'DATAMATRIX';

export type LabelTemplateType =
  | 'PRODUCT_TUBE_50x30'
  | 'SHELF_TAG_60x40'
  | 'CARTON_SHIPPING_100x150'
  | 'TESTER_PROMO_40x20';

export interface LabelDeductionRecord {
  id: string;
  timestamp: string;
  quantity_printed: number;
  roll_batch?: string;
  operator_name: string;
  notes?: string;
}

export interface ProductBarcodeMapping {
  id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  brand: string;
  sku: string;
  primary_barcode: string;
  secondary_barcodes: string[];
  barcode_format: BarcodeFormat;
  shade_name?: string | null;
  shade_code?: string | null;
  size_volume?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  selling_price_cents: number;
  cost_price_cents: number;
  currency: string;
  currency_symbol: string;
  image_url?: string;
  total_labels_printed: number;
  roll_stock_remaining: number;
  last_printed_at?: string | null;
  deduction_history: LabelDeductionRecord[];
}

export interface BarTenderIntegrationConfig {
  integration_mode: 'WEB_PRINT_API' | 'COMMANDER_DROP_FOLDER' | 'DIRECT_ZPL_RAW' | 'DIRECT_TSPL_RAW';
  bartender_endpoint_url: string;
  btw_template_filename: string;
  drop_folder_path: string;
  printer_name: string;
  printer_dpi: number;
  auto_deduct_roll_stock: boolean;
}

export interface LabelPrintJob {
  id: string;
  mapping_id: string;
  product_name: string;
  brand: string;
  barcode: string;
  template_type: LabelTemplateType;
  quantity_to_print: number;
  printer_target: string;
  status: 'PENDING' | 'SENT_TO_BARTENDER' | 'PRINTED' | 'FAILED';
  generated_zpl?: string;
  generated_tspl?: string;
  bartender_payload_json?: string;
  bartender_csv_row?: string;
  printed_at: string;
  operator_name: string;
}
