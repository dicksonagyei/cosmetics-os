import React, { useState } from 'react';
import { SyncQueueItem } from '../../types/pos';
import { formatDateTime } from '../../utils/formatters';
import {
  Layers,
  RefreshCw,
  Clock,
  Database,
  Code,
} from 'lucide-react';

interface SyncStatusViewProps {
  syncQueue: SyncQueueItem[];
  onRefresh: () => void;
}

export const SyncStatusView: React.FC<SyncStatusViewProps> = ({
  syncQueue,
  onRefresh,
}) => {
  const [selectedItem, setSelectedItem] = useState<SyncQueueItem | null>(syncQueue[0] || null);

  const pendingCount = syncQueue.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="flex-1 flex flex-col p-5 overflow-hidden space-y-4">
      {/* Metrics Banner */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sync Engine Status
            </div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Offline Edge DB Active</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Sync Events
            </div>
            <div
              className={`text-2xl font-black font-mono mt-0.5 ${
                pendingCount > 0 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {pendingCount} Enqueued
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Central Cloud Relay
            </div>
            <div className="text-sm font-bold text-slate-300 mt-0.5">
              REST / Event Sync v1
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Queue</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Queue Table | Payload Inspector */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Event List */}
        <div className="col-span-7 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-pink-400" />
              <span>Append-Only Sync Event Stream</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">{syncQueue.length} records</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 select-none">
                <tr>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Retry</th>
                  <th className="py-2.5 px-4 text-right">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {syncQueue.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-pink-900/30 font-semibold text-white'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-pink-400">
                        {item.event_type}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.status === 'SYNCED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {item.retry_count}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400">
                        {formatDateTime(item.created_at)}
                      </td>
                    </tr>
                  );
                })}

                {syncQueue.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500 text-xs">
                      Sync queue is currently empty. All edge events synced with cloud.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payload Inspector */}
        <div className="col-span-5 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center space-x-1.5">
            <Code className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Event Payload Inspector
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-950/80">
            {selectedItem ? (
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Event ID:</span>
                  <span className="text-slate-200">{selectedItem.id}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Event Type:</span>
                  <span className="text-pink-400 font-bold">{selectedItem.event_type}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Timestamp:</span>
                  <span className="text-slate-200">{selectedItem.created_at}</span>
                </div>

                <div className="pt-2">
                  <div className="text-[11px] text-slate-400 uppercase font-bold mb-1">JSON Payload:</div>
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-[11px] leading-relaxed overflow-x-auto">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedItem.payload), null, 2);
                      } catch {
                        return selectedItem.payload;
                      }
                    })()}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Layers className="w-8 h-8 text-slate-600 mb-2" />
                <p>Select a sync queue item to inspect payload structure.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
