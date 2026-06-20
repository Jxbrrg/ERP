import { useState, useEffect } from 'react';
import { apiFetch } from '../api/fetch';
import { motion } from 'framer-motion';
import { Plus, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const loadOrders = () =>
    apiFetch(__API_URL__ + '/api/sales')
      .then(r => r.json()).then(setOrders);

  useEffect(() => {
    loadOrders();
    apiFetch(__API_URL__ + '/api/employees').then(r => r.json()).then(setEmployees);
    apiFetch(__API_URL__ + '/api/crm').then(r => r.json()).then(setCustomers);
    apiFetch(__API_URL__ + '/api/inventory').then(r => r.json()).then(setProducts);
  }, []);

  const handleSave = async (form) => {
    await apiFetch(__API_URL__ + '/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    await loadOrders();
    setShowModal(false);
  };

  const updateStatus = async (id, status) => {
    await apiFetch(`${__API_URL__}/api/sales/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    await loadOrders();
  };

  const columns = [
    { key: 'code', label: 'Orden' },
    { key: 'customer_name', label: 'Cliente' },
    { key: 'total', label: 'Total', render: r => <span className="font-semibold">${Number(r.total).toLocaleString('es-CO')}</span> },
    { key: 'status', label: 'Estado', render: r => {
      const colors = { pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' };
      return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[r.status] || colors.pending}`}>{r.status}</span>;
    }},
    { key: 'payment_method', label: 'Pago', render: r => {
      const labels = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito', nequi: 'Nequi' };
      return <span>{labels[r.payment_method] || r.payment_method}</span>;
    }},
    { key: 'created_at', label: 'Fecha', render: r => new Date(r.created_at).toLocaleDateString('es-CO') },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => setShowDetail(r.id)}
          className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-500">
          <Eye className="h-3.5 w-3.5" />
        </button>
        {r.status === 'pending' && (
          <button onClick={() => updateStatus(r.id, 'confirmed')}
            className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-500">
            Confirmar
          </button>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ventas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{orders.length} órdenes</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-95">
          <Plus className="h-4 w-4" /> Nueva Orden
        </button>
      </div>

      <DataTable columns={columns} data={orders} searchKeys={['code', 'customer_name']} />

      {showModal && (
        <OrderModal onClose={() => setShowModal(false)} onSave={handleSave}
          customers={customers} employees={employees} products={products} />
      )}

      {showDetail && <OrderDetail orderId={showDetail} onClose={() => setShowDetail(null)} />}
    </div>
  );
}

function OrderModal({ onClose, onSave, customers, employees, products }) {
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);
  const [form, setForm] = useState({ customer_id: '', employee_id: '', payment_method: 'cash', notes: '' });

  const paymentLabels = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito', nequi: 'Nequi' };

  const addItem = () => setItems([...items, { product_id: '', quantity: 1, unit_price: 0 }]);
  
  const updateItem = (i, field, value) => {
    const newItems = [...items];
    newItems[i][field] = value;
    if (field === 'product_id') {
      const p = products.find(pr => pr.id === value);
      if (p) { newItems[i].unit_price = p.unit_price; }
    }
    setItems(newItems);
  };

  const total = items.reduce((s, it) => s + (it.quantity * it.unit_price), 0);

  const handleSave = () => {
    onSave({ ...form, items: items.filter(it => it.product_id) });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-2xl rounded-3xl p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nueva Orden</h3>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Cliente</label>
            <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">Seleccionar...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Vendedor</label>
            <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">Seleccionar...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Método Pago</label>
            <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              {Object.entries(paymentLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Descripción / Notas</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              rows={2} placeholder="Notas adicionales..." />
          </div>
        </div>

        <hr className="my-4 border-slate-200 dark:border-slate-700" />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Productos</h4>
            <button onClick={addItem} className="text-xs text-indigo-500 hover:text-indigo-400">+ Agregar item</button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="">Producto...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} - ${p.unit_price}</option>)}
              </select>
              <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 0)}
                className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-center outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                placeholder="Qty" min="0" />
              <input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-right outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                placeholder="Precio" />
              <span className="flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300 w-24 text-right">
                ${(item.quantity * item.unit_price).toLocaleString('es-CO')}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <p className="text-lg font-bold text-slate-800 dark:text-white">Total: ${total.toLocaleString('es-CO')}</p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={handleSave} className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95">Crear Orden</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function OrderDetail({ orderId, onClose }) {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    apiFetch(`${__API_URL__}/api/sales/${orderId}`)
      .then(r => r.json()).then(setOrder);
  }, [orderId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        {order ? (
          <>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Orden {order.code}</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p><strong>Cliente:</strong> {order.customer_name}</p>
              <p><strong>Vendedor:</strong> {order.employee_name}</p>
              <p><strong>Estado:</strong> {order.status}</p>
              <p><strong>Pago:</strong> {{cash:'Efectivo',card:'Tarjeta',transfer:'Transferencia',credit:'Crédito',nequi:'Nequi'}[order.payment_method] || order.payment_method}</p>
              <p><strong>Total:</strong> ${Number(order.total).toLocaleString('es-CO')}</p>
              {order.notes && <p><strong>Notas:</strong> {order.notes}</p>}
              <hr className="my-3 border-slate-200 dark:border-slate-700" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">Productos:</p>
              {order.items?.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>{it.product_name} x{it.quantity}</span>
                  <span className="font-semibold">${Number(it.subtotal).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>
        )}
        <button onClick={onClose} className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">Cerrar</button>
      </motion.div>
    </motion.div>
  );
}
