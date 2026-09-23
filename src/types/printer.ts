export type ReceiptConnectionType = 'WINDOWS_SPOOLER' | 'RAW_TCP' | 'WEB_PRINT';
export type LabelDriverType = 'TSPL' | 'ZPL' | 'BARTENDER_REST' | 'BARTENDER_CSV' | 'WINDOWS_SPOOLER';

export interface ReceiptPrinterSettings {
  printerName: string;
  paperWidth: '80mm' | '58mm';
  autoCut: boolean;
  cashDrawerKick: boolean;
  connectionType: ReceiptConnectionType;
  tcpHost?: string;
  tcpPort?: number;
  headerText: string;
  subHeaderText: string;
  footerText: string;
}

export interface LabelPrinterSettings {
  printerName: string;
  driverType: LabelDriverType;
  dpi: 203 | 300;
  gapMm: number;
  speed: number;
  density: number;
  connectionType: ReceiptConnectionType;
  tcpHost?: string;
  tcpPort?: number;
  autoDeductRollStock: boolean;
}

export interface DualPrinterHardwareConfig {
  receipt: ReceiptPrinterSettings;
  label: LabelPrinterSettings;
  systemPrinters: string[];
}
