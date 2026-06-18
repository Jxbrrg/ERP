import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react';
import DataTable from '../components/DataTable';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProd, setEditProd] = useState(null);

  useEffect(() => {
    fetch(__API_URL__ + '/api/inventory', { credentials: 'include' })
      .then(r => r.json()).then(setProducts);
    fetch(__API_URL__ + '/api/inventory/categories', { credentials: 'include' })
      .then(r => r.json()).then(setCategories);
  }, []);

  const handleSave = async (form) => {
    const url = editProd ? `${__API_URL__}/api/inventory/${editProd.id}` : __API_URL__ + '/api/inventory';
    const method = editProd ? 'PUT' : 'POST';
    await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const res = await fetch(__API_URL__ + '/api/inventory', { credentials: 'include' });
    setProducts(await res.json());
    setShowModal(false);
    setEditProd(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar producto?')) return;
    await fetch(`${__API_URL__}/api/inventory/${id}`, { method: 'DELETE', credentials: 'include' });
    setProducts(products.filter(p => p.id !== id));
  };

  const columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Producto' },
    { key: 'category_name', label: 'Categoría' },
    { key: 'stock', label: 'Stock', render: r => (
      <span className={`font-semibold ${r.stock <= r.min_stock ? 'text-rose-500' : 'text-emerald-500'}`}>
        {r.stock} {r.stock <= r.min_stock && <AlertTriangle className="inline h-3 w-3" />}
      </span>
    )},
    { key: 'unit_price', label: 'Precio Venta', render: r => `$${Number(r.unit_price).toLocaleString('es-CO')}` },
    { key: 'cost_price', label: 'Costo', render: r => `$${Number(r.cost_price).toLocaleString('es-CO')}` },
    { key: 'margin', label: 'Margen', render: r => {
      const margin = ((r.unit_price - r.cost_price) / r.unit_price * 100).toFixed(0);
      return <span className={`font-semibold ${margin > 40 ? 'text-emerald-500' : margin > 20 ? 'text-amber-500' : 'text-rose-500'}`}>{margin}%</span>;
    }},
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setEditProd(r); setShowModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-500">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Inventario</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{products.length} productos · {products.filter(p => p.stock <= p.min_stock).length} con stock crítico</p>
        </div>
        <button onClick={() => { setEditProd(null); setShowModal(true); }}
          className="gradient-success flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-95">
          <Plus className="h-4 w-4" /> Nuevo Producto
        </button>
      </div>

      <DataTable columns={columns} data={products} searchKeys={['name', 'code', 'category_name']} />

      {showModal && (
        <ProductModal onClose={() => { setShowModal(false); setEditProd(null); }} onSave={handleSave} product={editProd} categories={categories} />
      )}
    </div>
  );
}

function ProductModal({ onClose, onSave, product, categories }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || categories[0]?.id || '',
    unit_price: product?.unit_price || '',
    cost_price: product?.cost_price || '',
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 10,
    location: product?.location || ''
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{product ? 'Editar' : 'Nuevo'} Producto</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="Nombre" value={form.name} onChange={v => setForm({...form, name: v})} className="col-span-2" />
          <Input label="Descripción" value={form.description} onChange={v => setForm({...form, description: v})} className="col-span-2" />
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Categoría</label>
            <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Ubicación" value={form.location} onChange={v => setForm({...form, location: v})} />
          <Input label="Precio Venta" type="number" value={form.unit_price} onChange={v => setForm({...form, unit_price: v})} />
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
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
    </div>
  );
}
