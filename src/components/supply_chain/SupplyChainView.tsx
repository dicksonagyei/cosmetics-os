import React, { useState } from 'react';
import {
  Warehouse,
  Branch,
  StockTransfer,
} from '../../types/tenant';
import { VariantDetail } from '../../types/pos';
import {
  Warehouse as WarehouseIcon,
  Store,
  Truck,
  ArrowRight,
  Plus,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Search,
  X,
  Send,
  Camera,
} from 'lucide-react';

interface SupplyChainViewProps {
  warehouses: Warehouse[];
  branches: Branch[];
  transfers: StockTransfer[];
  variants: VariantDetail[];
  onCreateTransfer: (data: {
    source_warehouse_id: string;
    destination_branch_id: string;
    items: { variant_id: string; quantity: number }[];
    driver_name?: string;
    vehicle_registration?: string;
    notes?: string;
  }) => Promise<StockTransfer>;
  onReceiveTransfer: (
    transferId: string,
    receivedItems: { variant_id: string; quantity_received: number }[],
    evidenceUrl?: string,
    notes?: string
  ) => Promise<StockTransfer>;
  onAcceptTransfer: (transferId: string) => Promise<StockTransfer>;
  onRefresh: () => Promise<void>;
}

export const SupplyChainView: React.FC<SupplyChainViewProps> = ({
  warehouses,
  branches,
  transfers,
  variants,
  onCreateTransfer,
  onReceiveTransfer,
  onAcceptTransfer,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'transfers' | 'hubs' | 'branches'>('transfers');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // New Transfer Modal State
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [sourceWarehouseId, setSourceWarehouseId] = useState(warehouses[0]?.id || '');
  const [destBranchId, setDestBranchId] = useState(branches[0]?.id || '');
  const [driverName, setDriverName] = useState('Samuel Osei (Fleet Van)');
  const [vehicleReg, setVehicleReg] = useState('GN-4892-24');
  const [transferNotes, setTransferNotes] = useState('Weekend Sephora restocking run');
  const [selectedItems, setSelectedItems] = useState<{ variant_id: string; quantity: number }[]>([
    { variant_id: variants[0]?.id || '', quantity: 15 },
  ]);

  // Receive / Intake Modal State
  const [receivingTransfer, setReceivingTransfer] = useState<StockTransfer | null>(null);
  const [receivedCounts, setReceivedCounts] = useState<Record<string, number>>({});
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Evidence Viewer Modal
  const [viewingEvidenceUrl, setViewingEvidenceUrl] = useState<string | null>(null);

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination_branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.source_warehouse_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const inTransitCount = transfers.filter(
    (t) => t.status === 'IN_TRANSIT' || t.status === 'DISPATCHED'
  ).length;

  const handleAddItemToTransfer = () => {
    const available = variants.find((v) => !selectedItems.some((s) => s.variant_id === v.id));
    if (available) {
      setSelectedItems([...selectedItems, { variant_id: available.id, quantity: 10 }]);
    }
  };

  const handleRemoveTransferItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleExecuteCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert('Please select at least one item to transfer.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTransfer({
        source_warehouse_id: sourceWarehouseId || warehouses[0]?.id,
        destination_branch_id: destBranchId || branches[0]?.id,
        items: selectedItems,
        driver_name: driverName,
        vehicle_registration: vehicleReg,
        notes: transferNotes,
      });
      setIsNewTransferOpen(false);
      await onRefresh();
    } catch (err) {
      alert(`Error creating transfer: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceiveModal = (tr: StockTransfer) => {
    setReceivingTransfer(tr);
    const initialRec: Record<string, number> = {};
    tr.items.forEach((item) => {
      initialRec[item.variant_id] = item.quantity_dispatched;
    });
    setReceivedCounts(initialRec);
    setEvidenceUrl(
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80'
    );
    setIntakeNotes('All cartons arrived intact with seals unbroken.');
  };

  const handleExecuteReceive = async () => {
    if (!receivingTransfer) return;
    setIsSubmitting(true);
    try {
      const itemsPayload = receivingTransfer.items.map((item) => ({
        variant_id: item.variant_id,
        quantity_received: receivedCounts[item.variant_id] ?? item.quantity_dispatched,
      }));

      await onReceiveTransfer(
        receivingTransfer.id,
        itemsPayload,
        evidenceUrl || undefined,
        intakeNotes || undefined
      );

      // Auto-accept
      await onAcceptTransfer(receivingTransfer.id);
      setReceivingTransfer(null);
      await onRefresh();
    } catch (err) {
      alert(`Intake failed: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3.5">
      {/* Top Banner & Alibaba Supply Chain Header */}
      <div className="flex items-center justify-between gap-3 shrink-0 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">
              Enterprise Supply Chain & Logistics Hub
            </h2>
            <div className="text-[11px] text-slate-400">
              The Alibaba Distribution Model • {warehouses.length} Central Hubs ➔ {branches.length} Retail Outlets
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsNewTransferOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Stock Transfer</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3.5 shrink-0">
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Central Distribution Hubs
            </div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {warehouses.length} Active Warehouses
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <WarehouseIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Connected Retail Stores
            </div>
            <div className="text-xl font-black text-pink-400 font-mono mt-0.5">
              {branches.length} Store Fronts
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Shipments In Transit
            </div>
            <div
              className={`text-xl font-black font-mono mt-0.5 ${
                inTransitCount > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {inTransitCount} Waybills Moving
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'transfers'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Transfer Manifests & Waybills ({transfers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('hubs')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hubs'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <WarehouseIcon className="w-3.5 h-3.5" />
            <span>Warehouses ({warehouses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'branches'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Retail Stores ({branches.length})</span>
          </button>
        </div>

        {activeTab === 'transfers' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search manifest, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="ACCEPTED">Accepted / Delivered</option>
              <option value="DISPATCHED">Dispatched</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Table / View Content */}
      <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
        {activeTab === 'transfers' && (
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/90 sticky top-0 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 select-none">
                <tr>
                  <th className="py-2.5 px-3">Manifest & Route</th>
                  <th className="py-2.5 px-3">Items & Quantities</th>
                  <th className="py-2.5 px-3">Fleet & Driver</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Proof of Receipt Evidence</th>
                  <th className="py-2.5 px-3 text-right">Branch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTransfers.map((t) => {
                  const isInTransit = t.status === 'IN_TRANSIT' || t.status === 'DISPATCHED';
                  const isAccepted = t.status === 'ACCEPTED';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-amber-400 font-mono text-xs">
                          {t.transfer_number}
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-300 text-[11px] mt-0.5">
                          <span className="truncate max-w-[150px]">{t.source_warehouse_name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="font-bold text-white truncate max-w-[150px]">
                            {t.destination_branch_name}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        <div className="font-bold text-white text-xs">
                          {t.total_units_dispatched} Units ({t.items.length} SKUs)
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {t.items.map((it) => `${it.product_name} (${it.quantity_dispatched})`).join(', ')}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-sans text-[11px]">
                        <div className="text-slate-200 font-medium">{t.driver_name || 'Fleet Van'}</div>
                        <div className="text-slate-500 font-mono text-[10px]">
                          Plate: {t.vehicle_registration || 'N/A'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isInTransit
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                              : isAccepted
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {isInTransit ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{t.status.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-sans">
                        {t.evidence_attachment_url ? (
                          <button
                            onClick={() => setViewingEvidenceUrl(t.evidence_attachment_url || null)}
                            className="flex items-center space-x-1.5 text-[11px] font-bold text-pink-400 hover:text-pink-300 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20 transition-colors"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>View Signed Receipt</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">Awaiting intake</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-sans">
                        {isInTransit ? (
                          <button
                            onClick={() => handleOpenReceiveModal(t)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 ml-auto transition-all"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Verify & Accept Stock</span>
                          </button>
                        ) : (
                          <div className="text-[11px] text-slate-500">
                            Accepted by {t.received_by?.split(' ')[0] || 'Store Lead'}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'hubs' && (
          <div className="p-4 grid grid-cols-2 gap-4 overflow-y-auto flex-1">
            {warehouses.map((wh) => (
              <div
                key={wh.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <WarehouseIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{wh.name}</h4>
                      <div className="text-slate-400 text-xs font-mono">{wh.code}</div>
                    </div>
                  </div>

                  {wh.is_central_hub && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
                      Central Hub
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-300">{wh.address}</div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
                    <span className="font-mono font-bold text-white">{wh.capacity_sqft.toLocaleString()} sq ft</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Supervisor</span>
                    <span className="text-slate-300">{wh.manager_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="p-4 grid grid-cols-3 gap-4 overflow-y-auto flex-1">
            {branches.map((br) => (
              <div
                key={br.id}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{br.name}</h4>
                      <div className="text-slate-400 text-xs font-mono">{br.code}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                    {br.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300">{br.address}</div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">POS Registers</span>
                    <span className="font-mono font-bold text-white">{br.pos_registers_count} Active Guns</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Branch Lead</span>
                    <span className="text-slate-300">{br.manager_name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW TRANSFER DISPATCH MODAL */}
      {isNewTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Dispatch Inter-Branch Stock Transfer
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Generate an official shipping manifest from Central Warehouse to a retail branch.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewTransferOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCreateTransfer} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Route */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Source Central Warehouse
                  </label>
                  <select
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Destination Retail Branch
                  </label>
                  <select
                    value={destBranchId}
                    onChange={(e) => setDestBranchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase">
                    Items to Dispatch ({selectedItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemToTransfer}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedItems.map((it, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <select
                        value={it.variant_id}
                        onChange={(e) => {
                          const updated = [...selectedItems];
                          updated[idx].variant_id = e.target.value;
                          setSelectedItems(updated);
                        }}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white"
                      >
                        {variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.brand} - {v.product_name} ({v.shade_name || 'Standard'}) - Stock: {v.quantity_on_hand}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const updated = [...selectedItems];
                          updated[idx].quantity = parseInt(e.target.value || '1', 10);
                          setSelectedItems(updated);
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-white text-center font-mono font-bold"
                      />

                      {selectedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTransferItem(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver & Vehicle */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Driver / Courier Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Vehicle Registration Plate
                  </label>
                  <input
                    type="text"
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Dispatch & Waybill Notes
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Weekend restock for Sephora promotions"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-800 -mx-5 -mb-5 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewTransferOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Shipment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE & EVIDENCE ATTACHMENT INTAKE MODAL */}
      {receivingTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Stock Intake Verification & Evidence Attachment
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Waybill: <strong className="text-amber-400">{receivingTransfer.transfer_number}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReceivingTransfer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Item checklist */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                  <span>Product & Variant</span>
                  <span>Dispatched ➔ Actual Received</span>
                </div>

                {receivingTransfer.items.map((it) => (
                  <div key={it.variant_id} className="flex items-center justify-between text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="font-bold text-white block">{it.product_name}</span>
                      <span className="text-[10px] text-slate-400">{it.brand} • {it.shade_name || 'Standard'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400 text-xs">{it.quantity_dispatched} units</span>
                      <span className="text-slate-500">➔</span>
                      <input
                        type="number"
                        min="0"
                        value={receivedCounts[it.variant_id] ?? it.quantity_dispatched}
                        onChange={(e) =>
                          setReceivedCounts({
                            ...receivedCounts,
                            [it.variant_id]: parseInt(e.target.value || '0', 10),
                          })
                        }
                        className="w-16 bg-slate-950 border border-slate-700 rounded p-1 text-center font-mono font-bold text-emerald-400 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Evidence Attachment Photo / Waybill Receipt URL */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-[10px] font-bold text-pink-400 uppercase flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Attach Signed Delivery Note / Evidence Photo</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                  {evidenceUrl && (
                    <img
                      src={evidenceUrl}
                      alt="Waybill Evidence"
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700"
                    />
                  )}
                </div>
              </div>

              {/* Intake Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Branch Intake Audit Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received undamaged, verified by Ama Boateng"
                  value={intakeNotes}
                  onChange={(e) => setIntakeNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceivingTransfer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteReceive}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Confirming...' : 'Accept & Add to Store Stock'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE VIEWER MODAL */}
      {viewingEvidenceUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-xs flex items-center space-x-2">
                <FileText className="w-4 h-4 text-pink-400" />
                <span>Signed Delivery Note / Physical Evidence</span>
              </span>
              <button
                onClick={() => setViewingEvidenceUrl(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={viewingEvidenceUrl}
              alt="Signed Delivery Waybill"
              className="rounded-xl w-full max-h-96 object-cover border border-slate-800 shadow-inner"
            />
          </div>
        </div>
      )}
    </div>
  );
};
