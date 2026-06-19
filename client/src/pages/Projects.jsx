import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderKanban, CheckCircle2, Clock, AlertCircle, ListTodo } from 'lucide-react';
import DataTable from '../components/DataTable';
import { apiFetch } from '../api/fetch';

const statusColors = {
  planning: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
};

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProj, setEditProj] = useState(null);
  const [selectedProj, setSelectedProj] = useState(null);
  const [customers, setCustomers] = useState([]);

  const load = () =>
    apiFetch(__API_URL__ + '/api/projects')
      .then(r => r.json()).then(setProjects);

  useEffect(() => {
    load();
    apiFetch(__API_URL__ + '/api/crm')
      .then(r => r.json()).then(setCustomers);
  }, []);

  const handleSave = async (form) => {
    const url = editProj ? `${__API_URL__}/api/projects/${editProj.id}` : __API_URL__ + '/api/projects';
    const method = editProj ? 'PUT' : 'POST';
    await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    load();
    setShowModal(false);
    setEditProj(null);
  };

  const columns = [
    { key: 'code', label: 'Código' },
    { key: 'name', label: 'Proyecto' },
    { key: 'customer_name', label: 'Cliente' },
    { key: 'status', label: 'Estado', render: r => (
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[r.status] || statusColors.planning}`}>
        {r.status}
      </span>
    )},
    { key: 'priority', label: 'Prioridad', render: r => {
      const p = { low: 'text-slate-400', medium: 'text-amber-500', high: 'text-orange-500', critical: 'text-rose-500' };
      return <span className={`font-semibold text-xs ${p[r.priority] || p.medium}`}>{r.priority}</span>;
    }},
    { key: 'budget', label: 'Presupuesto', render: r => `$${Number(r.budget).toLocaleString('es-CO')}` },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setEditProj(r); setShowModal(true); }} className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-500">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setSelectedProj(r)} className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-500">
          <ListTodo className="h-3.5 w-3.5" />
        </button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Proyectos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{projects.length} proyectos</p>
        </div>
        <button onClick={() => { setEditProj(null); setShowModal(true); }}
          className="gradient-primary flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-95">
          <Plus className="h-4 w-4" /> Nuevo Proyecto
        </button>
      </div>

      <DataTable columns={columns} data={projects} searchKeys={['name', 'code', 'customer_name']} />

      {showModal && (
        <ProjectModal onClose={() => { setShowModal(false); setEditProj(null); }} onSave={handleSave} project={editProj} customers={customers} />
      )}

      {selectedProj && <ProjectDetail project={selectedProj} onClose={() => setSelectedProj(null)} />}
    </div>
  );
}

function ProjectModal({ onClose, onSave, project, customers }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    customer_id: project?.customer_id || '',
    start_date: project?.start_date || new Date().toISOString().split('T')[0],
    end_date: project?.end_date || '',
    budget: project?.budget || '',
    status: project?.status || 'planning',
    priority: project?.priority || 'medium'
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{project ? 'Editar' : 'Nuevo'} Proyecto</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Input label="Nombre" value={form.name} onChange={v => setForm({...form, name: v})} className="col-span-2" />
          <Input label="Descripción" value={form.description} onChange={v => setForm({...form, description: v})} className="col-span-2" />
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Cliente</label>
            <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">Sin cliente</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Prioridad</label>
            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <Input label="Fecha Inicio" type="date" value={form.start_date} onChange={v => setForm({...form, start_date: v})} />
          <Input label="Fecha Fin" type="date" value={form.end_date} onChange={v => setForm({...form, end_date: v})} />
          <Input label="Presupuesto" type="number" value={form.budget} onChange={v => setForm({...form, budget: v})} />
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Estado</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="planning">Planificación</option>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800">Cancelar</button>
          <button onClick={() => onSave(form)} className="gradient-primary rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95">{project ? 'Actualizar' : 'Crear'}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProjectDetail({ project, onClose }) {
  const [detail, setDetail] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [newTask, setNewTask] = useState({ name: '', assigned_to: '', priority: 'medium', due_date: '' });

  const loadDetail = () =>
    apiFetch(`${__API_URL__}/api/projects/${project.id}`)
      .then(r => r.json()).then(setDetail);

  useEffect(() => {
    loadDetail();
    apiFetch(__API_URL__ + '/api/employees')
      .then(r => r.json()).then(setEmployees);
  }, [project.id]);

  const addTask = async () => {
    if (!newTask.name) return;
    await apiFetch(`${__API_URL__}/api/projects/${project.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    setNewTask({ name: '', assigned_to: '', priority: 'medium', due_date: '' });
    loadDetail();
  };

  const updateTask = async (id, status) => {
    await apiFetch(`${__API_URL__}/api/projects/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadDetail();
  };

  const tasksByStatus = (status) => detail?.tasks?.filter(t => t.status === status) || [];
  const statuses = [
    { key: 'pending', label: 'Pendientes', icon: Clock, color: 'text-amber-500' },
    { key: 'in_progress', label: 'En Progreso', icon: AlertCircle, color: 'text-blue-500' },
    { key: 'review', label: 'Revisión', icon: FolderKanban, color: 'text-purple-500' },
    { key: 'completed', label: 'Completadas', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="glass w-full max-w-4xl rounded-3xl p-6 shadow-2xl dark:bg-slate-900 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {detail ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{detail.name}</h3>
                <p className="text-sm text-slate-400">{detail.code} · {detail.customer_name || 'Sin cliente'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[detail.status] || statusColors.planning}`}>{detail.status}</span>
            </div>

            {/* Add Task */}
            <div className="flex gap-3 mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <input type="text" placeholder="Nueva tarea..." value={newTask.name}
                onChange={e => setNewTask({...newTask, name: e.target.value})}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              <select value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="">Asignar...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
              <button onClick={addTask} className="gradient-primary rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95 whitespace-nowrap">Agregar</button>
            </div>

            {/* Kanban-style task board */}
            <div className="grid grid-cols-4 gap-3">
              {statuses.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="ml-auto text-xs text-slate-400">{tasksByStatus(key).length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {tasksByStatus(key).map(task => (
                      <div key={task.id}
                        onClick={() => {
                          const nextStatus = key === 'pending' ? 'in_progress' :
                            key === 'in_progress' ? 'review' :
                            key === 'review' ? 'completed' : 'completed';
                          if (key !== 'completed') updateTask(task.id, nextStatus);
                        }}
                        className="cursor-pointer rounded-lg bg-white p-2.5 shadow-sm transition-all hover:shadow-md dark:bg-slate-800">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{task.name}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">{task.assigned_name || 'Sin asignar'}</span>
                          <span className={`text-[10px] font-semibold ${
                            task.priority === 'critical' ? 'text-rose-500' :
                            task.priority === 'high' ? 'text-orange-500' :
                            task.priority === 'medium' ? 'text-amber-500' : 'text-slate-400'
                          }`}>{task.priority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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

function Input({ label, type = 'text', value, onChange, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
    </div>
  );
}
