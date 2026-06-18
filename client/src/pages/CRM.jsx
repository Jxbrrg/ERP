import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Phone, Mail, MapPin, Edit2, Trash2, MessageSquare } from 'lucide-react';
import DataTable from '../components/DataTable';

export default function CRM() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCust, setEditCust] = useState(null);
  const [selectedCust, setSelectedCust] = useState(null);

  const load = () =>
    fetch('http://localhost:5000/api/crm', { credentials: 'include' })
      .then(r => r.json()).then(setCustomers);

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    const url = editCust ? `http://localhost:5000/api/crm/${editCust.id}` : 'http://localhost:5000/api/crm';
    const method = editCust ? 'PUT' : 'POST';
    await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    load();
    setShowModal(false);
    setEditCust(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar cliente?')) return;
    await fetch(`http://localhost:5000/api/crm/${id}`, { method: 'DELETE', credentials: 'include' });
    setCustomers(customers.filter(c => c.id !== id));
  };

  const columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Cliente' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'type', label: 'Tipo', render: r => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        r.type === 'vip' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
        r.type === 'corporate' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
        'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400'
      }`}>{r.type}</span>
    )},
    { key: 'credit_limit', label: 'Límite Crédito', render: r => `$${Number(r.credit_limit).toLocaleString('es-CO')}` },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setEditCust(r); setShowModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-500"><Edit2 className="h-3.5 w-3.5" /></button>
        <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
        <button onClick={() => setSelectedCust(r)} className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-500"><MessageSquare className="h-3.5 w-3.5" /></button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">CRM - Clientes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{customers.length} clientes registrados</p>
        </div>
        <button onClick={() => { setEditCust(null); setShowModal(true); }}
          className="gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-95">
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </button>
      </div>

      <DataTable columns={columns} data={customers} searchKeys={['name', 'email', 'code', 'phone']} />

      {showModal && (
        <CustomerModal onClose={() => { setShowModal(false); setEditCust(null); }} onSave={handleSave} customer={editCust} />
      )}

      {selectedCust && <CustomerDetail customer={selectedCust} onClose={() => setSelectedCust(null)} />}
    </div>
  );
}

function CustomerModal({ onClose, onSave, customer }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    type: customer?.type || 'regular',
    credit_limit: customer?.credit_limit || '',
    notes: customer?.notes || ''
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{customer ? 'Editar' : 'Nuevo'} Cliente</h3>
        <div className="mt-4 space-y-4">
          <Input label="Nombre" value={form.name} onChange={v => setForm({...form, name: v})} />
          <Input label="Email" type="email" value={form.email} onChange={v => setForm({...form, email: v})} />
          <Input label="Teléfono" value={form.phone} onChange={v => setForm({...form, phone: v})} />
          <Input label="Dirección" value={form.address} onChange={v => setForm({...form, address: v})} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="corporate">Corporativo</option>
              </select>
            </div>
            <Input label="Límite Crédito" type="number" value={form.credit_limit} onChange={v => setForm({...form, credit_limit: v})} />
          </div>
          <Input label="Notas" value={form.notes} onChange={v => setForm({...form, notes: v})} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={() => onSave(form)} className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95">{customer ? 'Actualizar' : 'Crear'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CustomerDetail({ customer, onClose }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/crm/${customer.id}`, { credentials: 'include' })
      .then(r => r.json()).then(setDetail);
  }, [customer.id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-2xl rounded-3xl p-6 shadow-2xl dark:bg-slate-900 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {detail ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="gradient-primary flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white">
                {detail.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{detail.name}</h3>
                <div className="flex gap-4 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {detail.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {detail.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {detail.address}</span>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Interacciones</h4>
            <div className="space-y-2">
              {detail.interactions?.map((int, i) => (
                <div key={int.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{int.subject}</p>
                    <p className="text-xs text-slate-400">{int.type} · {int.assigned_name || 'Sin asignar'}</p>
                  </div>
                  <span className={`text-xs font-medium ${
                    int.status === 'completed' ? 'text-emerald-500' :
                    int.status === 'scheduled' ? 'text-blue-500' : 'text-amber-500'
                  }`}>{int.status}</span>
                </div>
              ))}
              {(!detail.interactions || detail.interactions.length === 0) && (
                <p className="text-sm text-slate-400">Sin interacciones registradas</p>
              )}
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

function Input({ label, type = 'text', value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
    </div>
  );
}
