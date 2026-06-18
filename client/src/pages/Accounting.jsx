import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import DataTable from '../components/DataTable';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#ec4899'];

export default function Accounting() {
  const [txns, setTxns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    fetch('http://localhost:5000/api/accounting', { credentials: 'include' })
      .then(r => r.json()).then(setTxns);
    fetch('http://localhost:5000/api/accounting/summary', { credentials: 'include' })
      .then(r => r.json()).then(setSummary);
  };

  useEffect(load, []);

  const handleSave = async (form) => {
    await fetch('http://localhost:5000/api/accounting', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    load();
    setShowModal(false);
  };

  const columns = [
    { key: 'code', label: 'Código' },
    { key: 'type', label: 'Tipo', render: r => (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        r.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
      }`}>
        {r.type === 'income' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {r.type === 'income' ? 'Ingreso' : 'Gasto'}
      </span>
    )},
    { key: 'category', label: 'Categoría' },
    { key: 'description', label: 'Descripción' },
    { key: 'amount', label: 'Monto', render: r => (
      <span className={`font-semibold ${r.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {r.type === 'income' ? '+' : '-'} ${Number(r.amount).toLocaleString('es-CO')}
      </span>
    )},
    { key: 'date', label: 'Fecha', render: r => new Date(r.date).toLocaleDateString('es-CO') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Contabilidad</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{txns.length} transacciones</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-95">
          <Plus className="h-4 w-4" /> Nueva Transacción
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Ingresos</p>
              <p className="text-xl font-bold text-emerald-500">${(summary?.income || 0).toLocaleString('es-CO')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-500/10 p-2.5">
              <TrendingDown className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Gastos</p>
              <p className="text-xl font-bold text-rose-500">${(summary?.expense || 0).toLocaleString('es-CO')}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${(summary?.balance || 0) >= 0 ? 'bg-blue-500/10' : 'bg-rose-500/10'}`}>
              <Wallet className={`h-5 w-5 ${(summary?.balance || 0) >= 0 ? 'text-blue-500' : 'text-rose-500'}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Balance Neto</p>
              <p className={`text-xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                ${(summary?.balance || 0).toLocaleString('es-CO')}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Ingresos vs Gastos (12 meses)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(summary?.byMonth || []).reverse()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-800 dark:text-white">Gastos por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={summary?.byCategory || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="total" nameKey="category">
                {(summary?.byCategory || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <DataTable columns={columns} data={txns} searchKeys={['code', 'category', 'description']} />

      {showModal && (
        <TxModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}

function TxModal({ onClose, onSave }) {
  const [form, setForm] = useState({ type: 'expense', category: '', description: '', amount: '', payment_method: 'cash', date: new Date().toISOString().split('T')[0] });
  const categories = ['Ventas','Servicios','Nómina','Proveedores','Servicios Públicos','Arriendo','Equipos','Marketing','Transporte','Seguros','Impuestos','Consultoría'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nueva Transacción</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Categoría</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">Seleccionar...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Descripción</label>
            <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Monto</label>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Método Pago</label>
            <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Fecha</label>
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={() => onSave(form)} className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95">Crear</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
