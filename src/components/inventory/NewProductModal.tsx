import React, { useState } from 'react';
import { VariantDetail } from '../../types/pos';
import {
  Sparkles,
  X,
  Plus,
  Trash2,
  Barcode,
  Package,
  Layers,
  Calculator,
} from 'lucide-react';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProduct: (data: {
    product_name: string;
    brand: string;
    category: string;
    description?: string;
    image_url?: string;
    variants: {
      sku: string;
      barcode: string;
      shade_name?: string;
      shade_code?: string;
      size_volume?: string;
      cost_price_cents: number;
      selling_price_cents: number;
      expiry_date?: string;
      batch_number?: string;
      low_stock_threshold?: number;
      quantity_on_hand: number;
    }[];
  }) => Promise<VariantDetail[]>;
  onProductCreated: (items: VariantDetail[]) => void;
}

interface VariantFormState {
  id: string;
  shade_name: string;
  shade_code: string;
  size_volume: string;
  sku: string;
  barcode: string;
  cost_price: string;
  selling_price: string;
  quantity_on_hand: number;
  batch_number: string;
  expiry_date: string;
  // UOM Helper state
  uom_enabled: boolean;
  uom_packages_received: number;
  uom_package_multiplier: number;
}

const UOM_PRESETS = [
  { label: 'Single Retail Unit (1x)', multiplier: 1 },
  { label: '3-Pack Bundle (3x)', multiplier: 3 },
  { label: 'Half-Dozen Pack (6x)', multiplier: 6 },
  { label: 'Dozen Box (12x)', multiplier: 12 },
  { label: 'Case / Carton (24x)', multiplier: 24 },
  { label: 'Master Shipper Case (48x)', multiplier: 48 },
  { label: 'Bulk Wholesale Crate (100x)', multiplier: 100 },
];

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  onCreateProduct,
  onProductCreated,
}) => {
  const [brand, setBrand] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Foundation');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [variants, setVariants] = useState<VariantFormState[]>([
    {
      id: 'var_1',
      shade_name: '',
      shade_code: '#D49B72',
      size_volume: '30ml',
      sku: '',
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      cost_price: '15.00',
      selling_price: '35.00',
      quantity_on_hand: 20,
      batch_number: `LOT-${new Date().getFullYear()}-01`,
      expiry_date: '2028-06-30',
      uom_enabled: false,
      uom_packages_received: 2,
      uom_package_multiplier: 12,
    },
  ]);

  if (!isOpen) return null;

  const handleAddVariant = () => {
    const brandPrefix = (brand || 'PROD').slice(0, 3).toUpperCase();
    const index = variants.length + 1;
    setVariants([
      ...variants,
      {
        id: `var_${Date.now()}`,
        shade_name: `Shade #${index}`,
        shade_code: '#8D021F',
        size_volume: '30ml',
        sku: `${brandPrefix}-${Date.now().toString().slice(-4)}-0${index}`,
        barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        cost_price: '15.00',
        selling_price: '35.00',
        quantity_on_hand: 12,
        batch_number: `LOT-${new Date().getFullYear()}-0${index}`,
        expiry_date: '2028-06-30',
        uom_enabled: false,
        uom_packages_received: 1,
        uom_package_multiplier: 12,
      },
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleUpdateVariant = (id: string, updates: Partial<VariantFormState>) => {
    setVariants(
      variants.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, ...updates };
        // Recalculate quantity if UOM was changed
        if (updates.uom_packages_received !== undefined || updates.uom_package_multiplier !== undefined) {
          const packages = updates.uom_packages_received ?? v.uom_packages_received;
          const mult = updates.uom_package_multiplier ?? v.uom_package_multiplier;
          updated.quantity_on_hand = packages * mult;
        }
        return updated;
      })
    );
  };

  const handleGenerateBarcode = (id: string) => {
    const newBarcode = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    handleUpdateVariant(id, { barcode: newBarcode });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !productName) {
      alert('Please enter Brand and Product Name');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        product_name: productName,
        brand,
        category,
        description,
        image_url:
          imageUrl ||
          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80',
        variants: variants.map((v) => ({
          sku: v.sku || `${brand.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: v.barcode,
          shade_name: v.shade_name || undefined,
          shade_code: v.shade_code || undefined,
          size_volume: v.size_volume || undefined,
          cost_price_cents: Math.round(parseFloat(v.cost_price || '0') * 100),
          selling_price_cents: Math.round(parseFloat(v.selling_price || '0') * 100),
          expiry_date: v.expiry_date || undefined,
          batch_number: v.batch_number || undefined,
          low_stock_threshold: 5,
          quantity_on_hand: v.quantity_on_hand,
        })),
      };

      const created = await onCreateProduct(payload);
      onProductCreated(created);
      onClose();
    } catch (err) {
      alert(`Error creating product: ${err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">Create New Cosmetics Product</h3>
                <span className="text-[10px] uppercase font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  Multi-Shade & UOM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Define master beauty product details and add multiple shade color swatches with wholesale unit conversion.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Base Product Details */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-extrabold text-pink-400 uppercase tracking-wider flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>1. Master Product Information</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fenty Beauty, M·A·C, NARS"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pro Filt'r Soft Matte Foundation"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  <option value="Foundation">Foundation</option>
                  <option value="Lipstick">Lipstick</option>
                  <option value="Lip Gloss">Lip Gloss</option>
                  <option value="Concealer">Concealer</option>
                  <option value="Setting Powder">Setting Powder</option>
                  <option value="Blush">Blush</option>
                  <option value="Eyeshadow">Eyeshadow</option>
                  <option value="Mascara">Mascara</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Fragrance">Fragrance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Product Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Short product overview..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Variants & Shades Builder */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-pink-400 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>2. Shades, Pricing, Barcodes & Initial Stock ({variants.length} Variants)</span>
              </h4>

              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/40 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Shade / Size</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {variants.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400">
                      Variant #{idx + 1}
                    </span>

                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Shade Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. #420 Deep Neutral"
                        value={v.shade_name}
                        onChange={(e) => handleUpdateVariant(v.id, { shade_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Shade Swatch Color
                      </label>
                      <div className="flex items-center space-x-2 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
                        <input
                          type="color"
                          value={v.shade_code}
                          onChange={(e) => handleUpdateVariant(v.id, { shade_code: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono text-slate-300">{v.shade_code}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Volume / Size
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 30ml, 50g"
                        value={v.size_volume}
                        onChange={(e) => handleUpdateVariant(v.id, { size_volume: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        SKU
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FB-420"
                        value={v.sku}
                        onChange={(e) => handleUpdateVariant(v.id, { sku: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Barcode (HID Scanner)
                      </label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="text"
                          value={v.barcode}
                          onChange={(e) => handleUpdateVariant(v.id, { barcode: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          title="Generate Unique Barcode"
                          onClick={() => handleGenerateBarcode(v.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                        >
                          <Barcode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Cost Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.cost_price}
                        onChange={(e) => handleUpdateVariant(v.id, { cost_price: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Selling Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.selling_price}
                        onChange={(e) => handleUpdateVariant(v.id, { selling_price: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-pink-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                        Initial Stock On Hand
                      </label>
                      <input
                        type="number"
                        value={v.quantity_on_hand}
                        onChange={(e) =>
                          handleUpdateVariant(v.id, {
                            quantity_on_hand: parseInt(e.target.value || '0', 10),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-emerald-400"
                      />
                    </div>
                  </div>

                  {/* UOM (Unit of Measure) Conversion Calculator Box */}
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Calculator className="w-4 h-4 text-pink-400 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-300">
                        Wholesale UOM Packaging Converter:
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-400">Received:</span>
                        <input
                          type="number"
                          min="1"
                          value={v.uom_packages_received}
                          onChange={(e) =>
                            handleUpdateVariant(v.id, {
                              uom_packages_received: parseInt(e.target.value || '1', 10),
                            })
                          }
                          className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono text-center"
                        />
                      </div>

                      <span className="text-slate-500">×</span>

                      <select
                        value={v.uom_package_multiplier}
                        onChange={(e) =>
                          handleUpdateVariant(v.id, {
                            uom_package_multiplier: parseInt(e.target.value, 10),
                          })
                        }
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
                      >
                        {UOM_PRESETS.map((p) => (
                          <option key={p.multiplier} value={p.multiplier}>
                            {p.label}
                          </option>
                        ))}
                      </select>

                      <span className="text-slate-500">=</span>

                      <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">
                        {v.uom_packages_received * v.uom_package_multiplier} Shelf Units
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-800 -mx-5 -mb-5 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-pink-600/30 flex items-center space-x-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Product & Variants'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
