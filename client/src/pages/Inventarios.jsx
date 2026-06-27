import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertTriangle, FileText } from 'lucide-react';
import DataTable from '../components/DataTable';
import { apiFetch } from '../api/fetch';
import { exportPDF } from '../utils/export';

const STOCK_NAMES = [
  'FRESAS', 'CREMA CHANTILLY', 'MANTEQUILLA', 'LECHE', 'LECHE CONDENSADA',
  'CHOCOLATE', 'AREQUIPE', 'MORA', 'SERVILLETA', 'CUCHARA',
  'VASOS DARNEL', 'PAPEL PELE', 'BOLSA', 'STICKER'
];

const UNITS = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'gramo', label: 'Gramo (g)' },
  { value: 'kilo', label: 'Kilo (kg)' },
  { value: 'litro', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'libra', label: 'Libra (lb)' },
  { value: 'porcion', label: 'Porción' },
];

export default function Inventarios() {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProd, setEditProd] = useState(null);
  const [saveError, setSaveError] = useState('');

  const stockFilter = (p) => STOCK_NAMES.includes(p.name);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/inventory')
      .then(r => r.json())
      .then(all => setProducts(all.filter(stockFilter)));
  }, []);

  const handleSave = async (form) => {
    setSaveError('');
    if (!form.name) { setSaveError('El nombre es obligatorio'); return; }
    if (!form.cost_price && form.cost_price !== 0) { setSaveError('El costo es obligatorio'); return; }
    const url = editProd ? `${__API_URL__}/api/inventory/${editProd.id}` : __API_URL__ + '/api/inventory';
    const method = editProd ? 'PUT' : 'POST';
    try {
      const resp = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...form, unit_price: Number(form.unit_price) || 0, cost_price: Number(form.cost_price), stock: parseInt(form.stock) || 0}) });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setSaveError(err.error || `Error del servidor (${resp.status})`);
        return;
      }
      const res = await apiFetch(__API_URL__ + '/api/inventory');
      const all = await res.json();
      setProducts(all.filter(stockFilter));
      setShowModal(false);
      setEditProd(null);
      setSaveError('');
    } catch (e) {
      setSaveError('Error de conexión');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar item de inventario?')) return;
    await apiFetch(`${__API_URL__}/api/inventory/${id}`, { method: 'DELETE' });
    setProducts(products.filter(p => p.id !== id));
  };

  const columns = [
    { key: 'name', label: 'Insumo' },
    {
      key: 'unit', label: 'Unidad', render: r => {
        const u = UNITS.find(x => x.value === r.unit);
        return <span className="text-slate-500 text-xs">{u ? u.label : r.unit}</span>;
      }
    },
    { key: 'stock', label: 'Stock', render: r => (
      <span className={`font-semibold ${r.stock <= (r.min_stock || 0) ? 'text-rose-500' : 'text-emerald-500'}`}>
        {r.stock} {r.stock <= (r.min_stock || 0) && <AlertTriangle className="inline h-3 w-3" />}
      </span>
    )},
    { key: 'cost_price', label: 'Costo', render: r => `$${Number(r.cost_price).toLocaleString('es-CO')}` },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setEditProd(r); setShowModal(true); }} className="rounded-lg p-1.5 text-slate-500 hover:text-indigo-500">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-slate-500 hover:text-rose-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inventarios</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{products.length} insumos registrados</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportPDF('Inventarios', ['Insumo','Unidad','Stock','Costo'], products.map(p => [p.name, p.unit || '—', String(p.stock), '$' + Number(p.cost_price).toLocaleString('es-CO')]), 'inventarios.pdf')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => { setEditProd(null); setShowModal(true); }}
            className="gradient-success flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-95">
            <Plus className="h-4 w-4" /> Nuevo Insumo
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={products} searchKeys={['name']} />

      {saveError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
          {saveError}
        </div>
      )}
      {showModal && (
        <ProductModal onClose={() => { setShowModal(false); setEditProd(null); setSaveError(''); }} onSave={handleSave} product={editProd} />
      )}
    </div>
  );
}

function ProductModal({ onClose, onSave, product }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    unit: product?.unit || 'gramo',
    cost_price: product?.cost_price || '',
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 0,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{product ? 'Editar' : 'Nuevo'} Insumo</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="Nombre" value={form.name} onChange={v => setForm({...form, name: v})} className="col-span-2" />
          <Select label="Unidad" value={form.unit} onChange={v => setForm({...form, unit: v})} options={UNITS} />
          <Input label="Costo" type="number" value={form.cost_price} onChange={v => setForm({...form, cost_price: v})} />
          <Input label="Stock" type="number" value={form.stock} onChange={v => setForm({...form, stock: parseInt(v) || 0})} />
          <Input label="Stock Mínimo" type="number" value={form.min_stock} onChange={v => setForm({...form, min_stock: parseInt(v) || 0})} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={() => onSave(form)} className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95">
            {product ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Input({ label, type = 'text', value, onChange, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
    </div>
  );
}

function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
