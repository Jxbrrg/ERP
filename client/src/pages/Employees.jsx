import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, UserCheck, UserX, Shield, ShieldCheck, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';
import { apiFetch } from '../api/fetch';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/employees')
      .then(r => r.json()).then(d => { setEmployees(d); setLoading(false); });
  }, []);

  const handleSave = async (form) => {
    const url = editEmp
      ? `${__API_URL__}/api/employees/${editEmp.id}`
      : __API_URL__ + '/api/employees';
    const method = editEmp ? 'PUT' : 'POST';
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const res = await apiFetch(__API_URL__ + '/api/employees');
    setEmployees(await res.json());
    setShowModal(false);
    setEditEmp(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar empleado?')) return;
    await apiFetch(`${__API_URL__}/api/employees/${id}`, { method: 'DELETE' });
    setEmployees(employees.filter(e => e.id !== id));
  };

  const columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Email' },
    { key: 'position', label: 'Cargo' },
    { key: 'department', label: 'Departamento' },
    { key: 'role', label: 'Rol', render: r => {
      const roles = { admin: { label: 'Admin', icon: Shield, color: 'text-purple-500 bg-purple-500/10' }, editor: { label: 'Editor', icon: ShieldCheck, color: 'text-blue-500 bg-blue-500/10' }, viewer: { label: 'Visor', icon: Eye, color: 'text-slate-500 bg-slate-500/10' } };
      const role = roles[r.role] || roles.editor;
      const Icon = role.icon;
      return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}><Icon className="h-3 w-3" />{role.label}</span>;
    }},
    { key: 'salary', label: 'Salario', render: r => `$${Number(r.salary).toLocaleString('es-CO')}` },
    { key: 'status', label: 'Estado', render: r => (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        r.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
        r.status === 'vacation' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
      }`}>
        {r.status === 'active' ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
        {r.status === 'active' ? 'Activo' : r.status === 'vacation' ? 'Vacaciones' : 'Inactivo'}
      </span>
    )},
    { key: 'actions', label: 'Acciones', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setEditEmp(r); setShowModal(true); }} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-500 dark:hover:bg-slate-800">
          <Edit2 className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => handleDelete(r.id)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-500 dark:hover:bg-slate-800">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Empleados</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{employees.length} registros</p>
        </div>
        <button onClick={() => { setEditEmp(null); setShowModal(true); }}
          className="gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-95">
          <Plus className="h-4 w-4" /> Nuevo Empleado
        </button>
      </div>

      <DataTable columns={columns} data={employees} searchKeys={['name', 'email', 'code', 'position', 'department']} />

      {showModal && (
        <EmployeeModal onClose={() => { setShowModal(false); setEditEmp(null); }} onSave={handleSave} employee={editEmp} />
      )}
    </div>
  );
}

function EmployeeModal({ onClose, onSave, employee }) {
  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    position: employee?.position || '',
    department: employee?.department || 'TI',
    salary: employee?.salary || '',
    hire_date: employee?.hire_date || new Date().toISOString().split('T')[0],
    status: employee?.status || 'active',
    role: employee?.role || 'editor'
  });

  const departments = ['TI', 'Ventas', 'Marketing', 'RRHH', 'Finanzas', 'Operaciones', 'Logística'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{employee ? 'Editar' : 'Nuevo'} Empleado</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="Nombre" value={form.name} onChange={v => setForm({...form, name: v})} className="col-span-2" />
          <Input label="Email" type="email" value={form.email} onChange={v => setForm({...form, email: v})} className="col-span-2" />
          <Input label="Teléfono" value={form.phone} onChange={v => setForm({...form, phone: v})} />
          <Input label="Cargo" value={form.position} onChange={v => setForm({...form, position: v})} />
          <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <Input label="Salario" type="number" value={form.salary} onChange={v => setForm({...form, salary: v})} />
          <Input label="Fecha Contratación" type="date" value={form.hire_date} onChange={v => setForm({...form, hire_date: v})} />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Visor</option>
          </select>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="vacation">Vacaciones</option>
          </select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button onClick={() => onSave(form)} className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95">
            {employee ? 'Actualizar' : 'Crear'}
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
