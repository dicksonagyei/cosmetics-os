export interface TenantAccount {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'STORE_OWNER' | 'WAREHOUSE_MANAGER' | 'BRANCH_MANAGER' | 'CASHIER';
  auth_token?: string;
  created_at: string;
}

export type BusinessStructure =
  | 'SOLE_PROPRIETORSHIP'
  | 'LIMITED_LIABILITY_COMPANY'
  | 'ENTERPRISE_RETAIL_CHAIN'
  | 'PARTNERSHIP';

export interface BusinessProfile {
  business_name: string;
  trade_name?: string;
  business_structure: BusinessStructure;
  registration_number: string; // TIN, CAC, or Registrar General Number
  tax_identification_number?: string;
  base_currency: string; // GHS, USD, EUR, NGN, GBP, KES, ZAR
  currency_symbol: string; // ₵, $, €, ₦, £, KSh, R
  logo_url?: string;
  website?: string;
  support_email: string;
  support_phone: string;
  headquarters_address: string;
}

export interface OwnerKYC {
  owner_full_name: string;
  id_type: 'NATIONAL_ID' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTER_ID';
  id_number: string;
  date_of_birth: string;
  nationality: string;
  residential_address: string;
  emergency_phone: string;
  id_document_url?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string; // e.g., WH-ACCRA-CENTRAL
  address: string;
  capacity_sqft: number;
  manager_name: string;
  manager_phone: string;
  is_central_hub: boolean;
  total_skus?: number;
  total_units?: number;
}

export interface Branch {
  id: string;
  name: string;
  code: string; // e.g., BR-ACCRA-MALL-01
  address: string;
  assigned_warehouse_id: string; // Source Central Warehouse
  pos_registers_count: number;
  manager_name: string;
  manager_phone: string;
  status: 'ACTIVE' | 'SETTING_UP' | 'CLOSED';
}

export type FinancialAccountType = 'BANK' | 'MOMO' | 'PAYMENT_GATEWAY';

export interface FinancialAccount {
  id: string;
  account_type: FinancialAccountType;
  provider_name: string; // e.g. "Standard Chartered Bank", "Ecobank", "MTN Mobile Money", "Vodafone Cash", "Stripe", "Paystack"
  account_holder_name: string;
  account_number: string; // Bank Acc No, MoMo Phone, or Gateway Merchant Key
  branch_sort_code?: string;
  currency: string;
  is_primary_settlement: boolean;
  auto_payout_frequency?: 'INSTANT_DAILY' | 'WEEKLY' | 'MONTHLY';
}

export type StockTransferStatus =
  | 'DRAFT'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'ACCEPTED'
  | 'REJECTED';

export interface StockTransferItem {
  variant_id: string;
  product_name: string;
  brand: string;
  shade_name?: string | null;
  sku: string;
  quantity_dispatched: number;
  quantity_received: number;
  quantity_variance: number; // received - dispatched
  unit_cost_cents: number;
}

export interface StockTransfer {
  id: string;
  transfer_number: string; // e.g. TR-2026-0042
  source_warehouse_id: string;
  source_warehouse_name: string;
  destination_branch_id: string;
  destination_branch_name: string;
  items: StockTransferItem[];
  status: StockTransferStatus;
  dispatched_by: string;
  dispatched_at: string;
  received_by?: string;
  received_at?: string;
  driver_name?: string;
  vehicle_registration?: string;
  evidence_attachment_url?: string; // Photo of signed physical delivery note / manifest
  notes?: string;
  total_units_dispatched: number;
  total_units_received?: number;
}

export interface OnboardingState {
  is_completed: boolean;
  current_step: number;
  account: TenantAccount;
  business: BusinessProfile;
  owner: OwnerKYC;
  warehouses: Warehouse[];
  branches: Branch[];
  financial_accounts: FinancialAccount[];
  catalog_import_choice: 'MASTER_CATALOG' | 'CSV_FILE' | 'BLANK';
  created_at: string;
}
