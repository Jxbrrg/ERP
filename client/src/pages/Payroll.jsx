import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import DataTable from '../components/DataTable';
import { apiFetch } from '../api/fetch';
import { exportPDF } from '../utils/export';

export default function Payroll() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/payroll').then(r => r.json()).then(setRecords);
    apiFetch(__API_URL__ + '/api/payroll/summary').then(r => r.json()).then(setSummary);
  }, []);

  const updateStatus = async (id, status) => {
    await apiFetch(`${__API_URL__}/api/payroll/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, payment_date: status === 'paid' ? new Date().toISOString().split('T')[0] : null })
    });
    const res = await apiFetch(__API_URL__ + '/api/payroll');
    setRecords(await res.json());
  };

  const columns = [
    { key: 'employee_name', label: 'Empleado' },
    { key: 'period', label: 'Período' },
    { key: 'amount', label: 'Monto', render: r => `$${Number(r.amount).toLocaleString('es-CO')}` },
    { key: 'payment_date', label: 'Fecha Pago', render: r => r.payment_date ? new Date(r.payment_date).toLocaleDateString('es-CO') : '—' },
    { key: 'status', label: 'Estado', render: r => {
      const styles = { paid: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400', pending: 'text-amber-600 bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400', cancelled: 'text-rose-600 bg-rose-100 dark:bg-rose-500/20 dark:text-rose-400' };
      return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[r.status] || styles.pending}`}>
        {r.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : r.status === 'cancelled' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {r.status === 'paid' ? 'Pagado' : r.status === 'cancelled' ? 'Anulado' : 'Pendiente'}
      </span>;
    }},
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        {r.status === 'pending' && (
          <>
            <button onClick={() => updateStatus(r.id, 'paid')} className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => updateStatus(r.id, 'cancelled')} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
              <XCircle className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Nómina</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {summary ? `${summary.activeCount} empleados activos · Total nómina: $${Number(summary.totalPayroll || 0).toLocaleString('es-CO')}` : `${records.length} registros`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => exportPDF('Nómina', ['Empleado','Período','Monto','Estado'], records.map(r => [r.employee_name, r.period, '$' + Number(r.amount).toLocaleString('es-CO'), r.status]), 'nomina.pdf')}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            <FileText className="h-4 w-4" /> PDF
          </button>
          <button onClick={() => setShowModal(true)}
            className="gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-95">
            <Plus className="h-4 w-4" /> Nuevo Pago
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={records} searchKeys={['employee_name', 'period']} />

      {showModal && (
        <PayrollModal onClose={() => setShowModal(false)}
          onSaved={async () => {
            setShowModal(false);
            const res = await apiFetch(__API_URL__ + '/api/payroll');
            setRecords(await res.json());
            const s = await apiFetch(__API_URL__ + '/api/payroll/summary');
            setSummary(await s.json());
          }}
        />
      )}
    </div>
  );
}

function PayrollModal({ onClose, onSaved }) {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ employee_id: '', amount: '', period: '', notes: '' });

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/payroll/summary')
      .then(r => r.json())
      .then(d => setEmployees(d.employees?.filter(e => e.status === 'active') || []));
  }, []);

  const handleSave = async () => {
    if (!form.employee_id || !form.amount || !form.period) return;
    await apiFetch(__API_URL__ + '/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    onSaved();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-md rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Registrar Pago de Nómina</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Empleado</label>
            <select value={form.employee_id} onChange={e => {
              const emp = employees.find(em => em.id === e.target.value);
              setForm({...form, employee_id: e.target.value, amount: emp ? emp.salary : '' });
            }}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">Seleccionar...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} - ${Number(e.salary).toLocaleString('es-CO')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Monto</label>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Período (ej: 2026-06)</label>
            <input type="month" value={form.period} onChange={e => setForm({...form, period: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notas</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white" rows={2} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={handleSave} className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95">Guardar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
