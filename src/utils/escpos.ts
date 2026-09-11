import { Order, OrderItem, PaymentItem, Customer } from '../types/pos';
import { formatMoney } from './formatters';

export class EscPosEncoder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02); // ESC a 2
    return this;
  }

  bold(on: boolean): this {
    this.buffer.push(0x1b, 0x45, on ? 0x01 : 0x00); // ESC E
    return this;
  }

  textSize(doubleWidth: boolean, doubleHeight: boolean): this {
    let n = 0;
    if (doubleWidth) n |= 0x20;
    if (doubleHeight) n |= 0x01;
    this.buffer.push(0x1d, 0x21, n); // GS ! n
    return this;
  }

  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  textLn(str: string): this {
    this.text(str);
    this.feed(1);
    return this;
  }

  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a); // LF
    }
    return this;
  }

  divider(width = 32): this {
    this.textLn('-'.repeat(width));
    return this;
  }

  twoColumns(left: string, right: string, totalWidth = 32): this {
    const leftLen = left.length;
    const rightLen = right.length;

    if (leftLen + rightLen >= totalWidth) {
      this.textLn(left);
      const spaces = Math.max(0, totalWidth - rightLen);
      this.textLn(' '.repeat(spaces) + right);
    } else {
      const spaces = totalWidth - leftLen - rightLen;
      this.textLn(left + ' '.repeat(spaces) + right);
    }
    return this;
  }

  cut(): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, 0x41, 0x00); // GS V 65 0
    return this;
  }

  kickCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa); // ESC p 0 25 250
    return this;
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  getRawHex(): string {
    return this.buffer.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }
}

export interface ReceiptInfo {
  storeName: string;
  branchName: string;
  phone: string;
  taxNumber?: string;
  order: Order;
  items: OrderItem[];
  payments: PaymentItem[];
  customer?: Customer | null;
  cashierName: string;
}

/**
 * Generate full ESC/POS byte buffer for thermal receipt printer
 */
export function buildReceiptEscPos(info: ReceiptInfo, kickDrawer = true): Uint8Array {
  const encoder = new EscPosEncoder();
  const width = 32;

  if (kickDrawer) {
    encoder.kickCashDrawer();
  }

  // Header
  encoder.alignCenter();
  encoder.bold(true);
  encoder.textSize(true, true);
  encoder.textLn(info.storeName);
  encoder.textSize(false, false);
  encoder.textLn(info.branchName);
  encoder.textLn(`Tel: ${info.phone}`);
  if (info.taxNumber) {
    encoder.textLn(`TIN: ${info.taxNumber}`);
  }
  encoder.bold(false);
  encoder.divider(width);

  // Metadata
  encoder.alignLeft();
  encoder.twoColumns('RECEIPT #:', info.order.id.slice(0, 16), width);
  encoder.twoColumns('DATE:', info.order.created_at.slice(0, 19).replace('T', ' '), width);
  encoder.twoColumns('CASHIER:', info.cashierName, width);
  encoder.twoColumns('REGISTER:', info.order.register_id, width);

  if (info.customer) {
    encoder.twoColumns('CUSTOMER:', info.customer.full_name, width);
    encoder.twoColumns('PHONE:', info.customer.phone, width);
  }
  encoder.divider(width);

  // Items
  encoder.bold(true);
  encoder.twoColumns('ITEM / QTY', 'TOTAL', width);
  encoder.bold(false);
  encoder.divider(width);

  for (const item of info.items) {
    const name = item.product_name || 'Cosmetics Item';
    const shade = item.shade_name ? ` [${item.shade_name}]` : '';
    const vol = item.size_volume ? ` (${item.size_volume})` : '';
    encoder.textLn(`${name}${shade}${vol}`);

    const sub = `  ${item.quantity}x @ ${formatMoney(item.unit_price_cents)}`;
    const lineTot = formatMoney(item.total_cents);
    encoder.twoColumns(sub, lineTot, width);
  }

  encoder.divider(width);

  // Totals
  encoder.twoColumns('SUBTOTAL:', formatMoney(info.order.subtotal_cents), width);
  if (info.order.discount_cents > 0) {
    encoder.twoColumns('DISCOUNT:', `-${formatMoney(info.order.discount_cents)}`, width);
  }
  if (info.order.tax_cents > 0) {
    encoder.twoColumns('VAT (15%):', formatMoney(info.order.tax_cents), width);
  }

  encoder.bold(true);
  encoder.textSize(false, true);
  encoder.twoColumns('GRAND TOTAL:', formatMoney(info.order.total_cents), width);
  encoder.textSize(false, false);
  encoder.bold(false);
  encoder.divider(width);

  // Payments
  encoder.bold(true);
  encoder.textLn('PAYMENT SUMMARY:');
  encoder.bold(false);

  for (const p of info.payments) {
    const label =
      p.payment_method === 'CASH'
        ? 'Cash'
        : p.payment_method === 'MOMO'
        ? `Mobile Money (${p.reference_no || 'Direct'})`
        : p.payment_method === 'CARD'
        ? `Card (${p.reference_no || 'POS'})`
        : 'Store Credit / Ledger';

    encoder.twoColumns(label, formatMoney(p.amount_cents), width);
  }

  // Credit Account Summary if applicable
  if (info.customer && (info.customer.outstanding_balance_cents > 0 || info.order.payment_status === 'CREDIT')) {
    encoder.divider(width);
    encoder.bold(true);
    encoder.textLn('CUSTOMER CREDIT ACCOUNT:');
    encoder.bold(false);
    encoder.twoColumns('Credit Limit:', formatMoney(info.customer.credit_limit_cents), width);
    encoder.twoColumns('Balance Owed:', formatMoney(info.customer.outstanding_balance_cents), width);
    const available = Math.max(0, info.customer.credit_limit_cents - info.customer.outstanding_balance_cents);
    encoder.twoColumns('Available Credit:', formatMoney(available), width);
  }

  // Footer & Return Policy
  encoder.divider(width);
  encoder.alignCenter();
  encoder.textLn('Thank you for shopping with us!');
  encoder.textLn('Beauty is Confidence.');
  encoder.textLn('Returns accepted within 7 days');
  encoder.textLn('with original seal intact.');
  encoder.feed(1);
  encoder.textLn('Powered by Cosmetics OS');

  encoder.cut();

  return encoder.getUint8Array();
}
