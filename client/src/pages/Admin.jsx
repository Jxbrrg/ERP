import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, CreditCard, TrendingUp, ArrowLeft, Eye } from 'lucide-react';
import { apiFetch } from '../api/fetch';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Admin() {
  const navigate = useNavigate();
  const impersonate = useAuthStore(s => s.impersonate);
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/admin/companies')
      .then(r => r.json())
      .then(data => { setCompanies(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updatePlan = async (id, plan) => {
    await apiFetch(__API_URL__ + `/api/admin/companies/${id}/plan`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    setCompanies(companies.map(c => c.id === id ? { ...c, plan } : c));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Panel de Administración</h1>
          <p className="text-sm text-slate-500">{companies.length} empresas registradas</p>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Empresas', value: companies.length, icon: Building2, color: 'text-indigo-500' },
          { label: 'Activas', value: companies.filter(c => c.plan !== 'cancelled').length, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Prueba', value: companies.filter(c => c.plan === 'trial').length, icon: Users, color: 'text-amber-500' },
          { label: 'Empresarial', value: companies.filter(c => c.plan === 'enterprise').length, icon: CreditCard, color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Usuarios</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Creada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                  <td className="px-4 py-3">
                    <select value={c.plan} onChange={e => updatePlan(c.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800">
                      <option value="trial">Prueba</option>
                      <option value="starter">Inicial</option>
                      <option value="business">Negocio</option>
                      <option value="enterprise">Empresarial</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.user_count || 0}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(c)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                      Ver
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl dark:bg-slate-900"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selected.name}</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p><strong>Slug:</strong> {selected.slug}</p>
              <p><strong>Plan:</strong> {selected.plan}</p>
              <p><strong>Usuarios:</strong> {selected.user_count || 0}</p>
              <p><strong>Creada:</strong> {new Date(selected.created_at).toLocaleString()}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { impersonate(selected.id); navigate('/dashboard'); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors">
                <Eye className="h-4 w-4" /> Entrar como admin
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400">
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
