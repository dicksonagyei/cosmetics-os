import { useState, useEffect, useCallback } from 'react';
import {
  VariantDetail,
  CartItem,
  Customer,
  PaymentItem,
  PaymentMethod,
  CreateOrderResponse,
  SyncQueueItem,
  MasterCatalogProduct,
  StockAdjustmentRequest,
} from './types/pos';
import {
  OnboardingState,
  Warehouse,
  Branch,
  StockTransfer,
  FinancialAccount,
} from './types/tenant';
import { api } from './utils/tauriBridge';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { Header } from './components/layout/Header';
import { ProductCatalog } from './components/pos/ProductCatalog';
import { CartTable } from './components/pos/CartTable';
import { CustomerSelector } from './components/pos/CustomerSelector';
import { TotalsSummary } from './components/pos/TotalsSummary';
import { QuickTenderBar } from './components/pos/QuickTenderBar';
import { CheckoutModal } from './components/pos/CheckoutModal';
import { ReceiptModal } from './components/pos/ReceiptModal';
import { NewCustomerModal } from './components/pos/NewCustomerModal';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomerLedgerView } from './components/customer/CustomerLedgerView';
import { SyncStatusView } from './components/sync/SyncStatusView';
import { SupplyChainView } from './components/supply_chain/SupplyChainView';
import { OnboardingWizardModal } from './components/onboarding/OnboardingWizardModal';

export function App() {
  const [activeTab, setActiveTab] = useState<
    'pos' | 'inventory' | 'customers' | 'supply_chain' | 'sync'
  >('pos');
  const [variants, setVariants] = useState<VariantDetail[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [masterProducts, setMasterProducts] = useState<MasterCatalogProduct[]>([]);
  const [stockAdjustmentRequests, setStockAdjustmentRequests] = useState<StockAdjustmentRequest[]>([]);

  // Multi-Tenant, Logistics & Supply Chain State
  const [onboardingState, setOnboardingState] = useState<OnboardingState | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [, setFinancialAccounts] = useState<FinancialAccount[]>([]);

  // Modals state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutInitialMethod, setCheckoutInitialMethod] = useState<PaymentMethod>('CASH');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastOrderResponse, setLastOrderResponse] = useState<CreateOrderResponse | null>(null);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [scanNotification, setScanNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Load initial data from SQLite via Tauri Bridge
  const loadData = useCallback(async () => {
    try {
      const [
        vars,
        custs,
        sync,
        master,
        adjustments,
        onboarding,
        whs,
        brs,
        transfers,
        finances,
      ] = await Promise.all([
        api.getVariants(),
        api.getCustomers(),
        api.getSyncQueue(),
        api.getMasterCatalog(),
        api.getStockAdjustmentRequests(),
        api.getTenantOnboarding(),
        api.getWarehouses(),
        api.getBranches(),
        api.getStockTransfers(),
        api.getFinancialAccounts(),
      ]);
      setVariants(vars);
      setCustomers(custs);
      setSyncQueue(sync);
      setMasterProducts(master);
      setStockAdjustmentRequests(adjustments);
      setOnboardingState(onboarding);
      setWarehouses(whs);
      setBranches(brs);
      setStockTransfers(transfers);
      setFinancialAccounts(finances);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cart Calculations
  const subtotalCents = cart.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0);
  const discountCents = cart.reduce((sum, item) => sum + item.quantity * item.discount_cents, 0);
  const taxableAmount = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxableAmount * 0.15); // 15% VAT
  const totalCents = taxableAmount + taxCents;

  // Add Variant to Cart
  const handleAddToCart = useCallback((variant: VariantDetail) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.variant.id === variant.id);
      if (existing) {
        return prevCart.map((item) =>
          item.variant.id === variant.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total_cents: (item.quantity + 1) * (item.unit_price_cents - item.discount_cents),
              }
            : item
        );
      } else {
        const itemTotal = variant.selling_price_cents;
        return [
          ...prevCart,
          {
            variant,
            quantity: 1,
            unit_price_cents: variant.selling_price_cents,
            unit_cost_cents: variant.cost_price_cents,
            discount_cents: 0,
            total_cents: itemTotal,
          },
        ];
      }
    });
  }, []);

  // Barcode Scan Handler for Hardware Gun
  const handleBarcodeScan = useCallback(
    (scannedBarcode: string) => {
      const match = variants.find((v) => v.barcode === scannedBarcode.trim());
      if (match) {
        handleAddToCart(match);
        setScanNotification({
          msg: `Scanned: ${match.brand} ${match.product_name} (${match.shade_name || 'Standard'})`,
          type: 'success',
        });
      } else {
        setScanNotification({
          msg: `Barcode not found: ${scannedBarcode}`,
          type: 'error',
        });
      }

      setTimeout(() => {
        setScanNotification(null);
      }, 3500);
    },
    [variants, handleAddToCart]
  );

  // Initialize Global Hardware Scanner Hook
  const scannerStatus = useBarcodeScanner({
    onScan: handleBarcodeScan,
    maxKeyIntervalMs: 40,
    minBarcodeLength: 3,
    enableAudioFeedback: true,
  });

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(variantId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.variant.id === variantId
          ? {
              ...item,
              quantity,
              total_cents: quantity * (item.unit_price_cents - item.discount_cents),
            }
          : item
      )
    );
  };

  const handleUpdateDiscount = (variantId: string, discountCentsPerUnit: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.variant.id === variantId
          ? {
              ...item,
              discount_cents: discountCentsPerUnit,
              total_cents: item.quantity * (item.unit_price_cents - discountCentsPerUnit),
            }
          : item
      )
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variant.id !== variantId));
  };

  const handleClearCart = () => {
    if (cart.length > 0) {
      setCart([]);
    }
  };

  // Quick Tender Trigger
  const handleQuickPay = (method: PaymentMethod) => {
    if (cart.length === 0) return;
    setCheckoutInitialMethod(method);
    setIsCheckoutModalOpen(true);
  };

  // Execute Order Checkout (Atomic Transaction)
  const handleCompleteCheckout = async (
    payments: PaymentItem[],
    shouldPrintReceipt: boolean
  ) => {
    try {
      const orderReq = {
        branch_id: 'branch_accra_mall_01',
        register_id: 'REG-01',
        cashier_id: 'Pius',
        customer_id: selectedCustomer?.id || undefined,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        tax_cents: taxCents,
        total_cents: totalCents,
        items: cart.map((item) => ({
          variant_id: item.variant.id,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          unit_cost_cents: item.unit_cost_cents,
          discount_cents: item.discount_cents,
          total_cents: item.total_cents,
        })),
        payments,
      };

      const resp = await api.createOrder(orderReq);
      setLastOrderResponse(resp);
      setIsCheckoutModalOpen(false);
      setCart([]); // Reset Cart

      // Refresh database records
      await loadData();

      // Show receipt modal
      if (shouldPrintReceipt) {
        setIsReceiptModalOpen(true);
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(`Checkout transaction error: ${err}`);
    }
  };

  // Native ESC/POS Print Trigger
  const handlePrintRaw = async (bytes: number[]) => {
    try {
      await api.printRawEscPos(bytes);
    } catch (err) {
      console.error('Thermal print error:', err);
    }
  };

  // Navigation Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('customers');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveTab('sync');
      } else if (e.key === 'Escape') {
        setIsCheckoutModalOpen(false);
        setIsReceiptModalOpen(false);
        setIsNewCustomerModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pendingSyncCount = syncQueue.filter((s) => s.status === 'PENDING').length;
  const pendingAdjustmentCount = stockAdjustmentRequests.filter(
    (s) => s.status === 'PENDING_APPROVAL'
  ).length;
  const inTransitTransferCount = stockTransfers.filter(
    (s) => s.status === 'IN_TRANSIT' || s.status === 'DISPATCHED'
  ).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Top Universal App Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scannerStatus={{
          isScanning: scannerStatus.isScanning,
          lastScanned: scannerStatus.lastScanned,
          scanCount: scannerStatus.scanCount,
          onSimulateScan: scannerStatus.simulateScan,
        }}
        pendingSyncCount={pendingSyncCount}
        pendingAdjustmentCount={pendingAdjustmentCount}
        inTransitTransferCount={inTransitTransferCount}
        businessName={onboardingState?.business.business_name || 'Cosmenply Luxury Group'}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Floating Scan Notification Banner */}
      {scanNotification && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl shadow-2xl border flex items-center space-x-2 text-xs font-bold animate-bounce ${
            scanNotification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
              : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
          }`}
        >
          <span>{scanNotification.msg}</span>
        </div>
      )}

      {/* View Router */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'pos' && (
          <div className="flex-1 grid grid-cols-12 gap-3.5 p-3.5 overflow-hidden">
            {/* Left 7 Columns: Product & Variant Catalog */}
            <div className="col-span-7 h-full overflow-hidden">
              <ProductCatalog
                variants={variants}
                cart={cart}
                onAddToCart={handleAddToCart}
                onSimulateScan={scannerStatus.simulateScan}
              />
            </div>

            {/* Right 5 Columns: Active Cart Matrix & Checkout Sidebar */}
            <div className="col-span-5 h-full flex flex-col space-y-3 overflow-hidden">
              {/* Customer Account Picker */}
              <CustomerSelector
                customers={customers}
                selectedCustomer={selectedCustomer}
                onSelectCustomer={setSelectedCustomer}
                onOpenNewCustomerModal={() => setIsNewCustomerModalOpen(true)}
              />

              {/* Active Cart Items Matrix */}
              <CartTable
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onUpdateDiscount={handleUpdateDiscount}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
              />

              {/* Totals & Net Payable */}
              <TotalsSummary
                subtotalCents={subtotalCents}
                discountCents={discountCents}
                taxCents={taxCents}
                totalCents={totalCents}
              />

              {/* Quick Tender & Checkout Buttons */}
              <QuickTenderBar
                totalCents={totalCents}
                disabled={cart.length === 0}
                onQuickPay={handleQuickPay}
                onOpenCheckoutModal={() => setIsCheckoutModalOpen(true)}
              />
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            variants={variants}
            masterProducts={masterProducts}
            stockAdjustmentRequests={stockAdjustmentRequests}
            onImportMaster={(ids) => api.importMasterProducts(ids)}
            onImportCsv={(rows) => api.importCsvProducts(rows)}
            onCreateProduct={(data) => api.createProductWithVariants(data)}
            onRequestStockAdjustment={(data) => api.requestStockAdjustment(data)}
            onApproveStockAdjustment={async (id, reviewer) => {
              await api.approveStockAdjustment(id, reviewer);
              await loadData();
            }}
            onRejectStockAdjustment={async (id, reviewer, reason) => {
              await api.rejectStockAdjustment(id, reviewer, reason);
              await loadData();
            }}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'supply_chain' && (
          <SupplyChainView
            warehouses={warehouses}
            branches={branches}
            transfers={stockTransfers}
            variants={variants}
            onCreateTransfer={async (data) => {
              const tr = await api.createStockTransfer(data);
              await loadData();
              return tr;
            }}
            onReceiveTransfer={async (id, items, ev, notes) => {
              const tr = await api.receiveStockTransfer(id, items, ev, notes);
              await loadData();
              return tr;
            }}
            onAcceptTransfer={async (id) => {
              const tr = await api.acceptStockTransfer(id);
              await loadData();
              return tr;
            }}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerLedgerView
            customers={customers}
            onRecordPayment={async (data) => {
              await api.recordCustomerPayment(data);
              await loadData();
            }}
            onFetchLedger={(id) => api.getCustomerLedger(id)}
            onOpenNewCustomerModal={() => setIsNewCustomerModalOpen(true)}
          />
        )}

        {activeTab === 'sync' && (
          <SyncStatusView syncQueue={syncQueue} onRefresh={loadData} />
        )}
      </main>

      {/* Checkout & Multi-Tender Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        totalCents={totalCents}
        customer={selectedCustomer}
        initialMethod={checkoutInitialMethod}
        onCompleteCheckout={handleCompleteCheckout}
      />

      {/* ESC/POS Thermal Receipt & Drawer Kick Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        orderData={lastOrderResponse}
        onPrintRaw={handlePrintRaw}
      />

      {/* New Client Modal */}
      <NewCustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onCreateCustomer={(data) => api.createCustomer(data)}
        onCustomerCreated={(cust) => {
          setSelectedCustomer(cust);
          loadData();
        }}
      />

      {/* Multi-Tenant Enterprise Onboarding Wizard */}
      {onboardingState && (
        <OnboardingWizardModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          initialData={onboardingState}
          onSaveOnboarding={async (data) => {
            await api.saveTenantOnboarding(data);
            await loadData();
          }}
          onComplete={() => {
            setIsOnboardingOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default App;
