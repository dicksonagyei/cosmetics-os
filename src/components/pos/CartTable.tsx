import React from 'react';
import { CartItem } from '../../types/pos';
import { formatMoney } from '../../utils/formatters';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  Sparkles,
} from 'lucide-react';

interface CartTableProps {
  cart: CartItem[];
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onUpdateDiscount: (variantId: string, discountCents: number) => void;
  onRemoveItem: (variantId: string) => void;
  onClearCart: () => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
}) => {
  if (cart.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-900/30 rounded-2xl border border-slate-800/80 select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3.5 shadow-inner">
          <ShoppingBag className="w-8 h-8 text-pink-400/60 animate-pulse" />
        </div>
        <h3 className="text-base font-bold text-slate-200">Active Register Cart is Empty</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          Aim hardware scanner at cosmetics barcode or click items from catalog to start transaction.
        </p>
        <div className="mt-4 flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-pink-400 font-bold">TIP:</span>
          <span>Press F1 to search or use gun scanner directly</span>
        </div>
      </div>
    );
  }

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Cart Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
            Current Cart Matrix
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onClearCart}
            className="flex items-center space-x-1 text-xs font-semibold text-rose-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear (Esc)</span>
          </button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
        {cart.map((item) => {
          const v = item.variant;
          const isOverStock = item.quantity > v.quantity_on_hand;

          return (
            <div
              key={v.id}
              className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-900/80 border border-slate-800/60 transition-all flex items-center justify-between gap-3 group"
            >
              {/* Left: Product & Variant Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="font-bold text-pink-400 uppercase tracking-wide truncate">
                    {v.brand}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">{v.sku}</span>
                </div>

                <div className="font-bold text-slate-100 text-xs truncate mt-0.5">
                  {v.product_name}
                </div>

                {/* Shade Swatch & Volume Badges */}
                <div className="mt-1 flex items-center space-x-2 flex-wrap gap-y-1">
                  {v.shade_name && (
                    <div className="flex items-center space-x-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px] text-slate-300">
                      {v.shade_code ? (
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: v.shade_code }}
                        />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5 text-pink-400" />
                      )}
                      <span className="truncate font-semibold">{v.shade_name}</span>
                    </div>
                  )}

                  {v.size_volume && (
                    <span className="text-[10px] bg-slate-800/60 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {v.size_volume}
                    </span>
                  )}

                  {isOverStock && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
                      Exceeds Stock ({v.quantity_on_hand})
                    </span>
                  )}
                </div>
              </div>

              {/* Center: Unit Price & Quantity Stepper */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-300 font-mono">
                    {formatMoney(item.unit_price_cents)}
                  </div>
                  {item.discount_cents > 0 && (
                    <div className="text-[10px] text-rose-400 font-mono">
                      -{formatMoney(item.discount_cents)}
                    </div>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                  <button
                    onClick={() => onUpdateQuantity(v.id, item.quantity - 1)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      onUpdateQuantity(v.id, val);
                    }}
                    className="w-9 text-center bg-transparent text-xs font-bold font-mono text-white focus:outline-none"
                  />
                  <button
                    onClick={() => onUpdateQuantity(v.id, item.quantity + 1)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right: Line Total & Delete */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right min-w-[70px]">
                  <div className="text-sm font-extrabold text-white tracking-tight font-mono">
                    {formatMoney(item.total_cents)}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Quick Discount Trigger */}
                  <button
                    onClick={() => {
                      const currentDiscDollars = item.discount_cents / 100;
                      const input = window.prompt(
                        `Set discount in dollars for ${v.product_name}:`,
                        currentDiscDollars.toString()
                      );
                      if (input !== null) {
                        const parsed = parseFloat(input);
                        if (!isNaN(parsed) && parsed >= 0) {
                          onUpdateDiscount(v.id, Math.round(parsed * 100));
                        }
                      }
                    }}
                    title="Apply Item Discount"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-pink-300 hover:bg-slate-800 transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove Item */}
                  <button
                    onClick={() => onRemoveItem(v.id)}
                    title="Remove item"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
