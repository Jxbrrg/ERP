import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, TrendingUp, DollarSign, Users, Calendar,
  AlertTriangle, ExternalLink, ArrowUpRight, ArrowDownRight, Eye, Clock
} from 'lucide-react';
import { apiFetch } from '../api/fetch';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function CeoDashboard() {
  const navigate = useNavigate();
  const { user, impersonate } = useAuthStore();
  const company = user?.company;
  const [companies, setCompanies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch(__API_URL__ + '/api/admin/companies').then(r => r.json()),
      apiFetch(__API_URL__ + '/api/admin/alerts').then(r => r.json()),
    ]).then(([companiesData, alertsData]) => {
      setCompanies(companiesData);
      setAlerts(alertsData?.expiringSoon || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const activeCompanies = companies.filter(c => c.plan !== 'cancelled');
  const trialCompanies = companies.filter(c => c.plan === 'trial');
  const paidCompanies = companies.filter(c => c.plan === 'business' || c.plan === 'enterprise');

  const growthData = (() => {
    const byMonth = {};
    companies.forEach(c => {
      const d = new Date(c.created_at);
      const key = d.toLocaleDateString('es', { month: 'short', year: '2-digit' });
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return Object.entries(byMonth).map(([month, count]) => ({ month, empresas: count }));
  })();

  const mrr = paidCompanies.length * 29 + companies.filter(c => c.plan === 'enterprise').length * 70;

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4">
        {company?.logo_url ? (
          <img src={company.logo_url} alt={company.name} className="h-14 w-14 rounded-xl object-contain border dark:border-slate-700" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ background: company?.primary_color || '#6366f1' }}>
            {(company?.name || 'S').charAt(0)}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">CEO Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{company?.name || 'Synex'} — Resumen de tu negocio SaaS</p>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Empresas Activas', value: activeCompanies.length, icon: Building2, trend: activeCompanies.length - trialCompanies.length, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
          { label: 'MRR', value: '$' + mrr, icon: DollarSign, trend: 0, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'En Prueba', value: trialCompanies.length, icon: Users, trend: 0, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'De Pago', value: paidCompanies.length, icon: TrendingUp, trend: paidCompanies.length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className={`rounded-xl ${stat.bg} p-2.5 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              {stat.trend > 0 && (
                <div className="flex items-center gap-1 text-xs text-emerald-500">
                  <ArrowUpRight className="h-3 w-3" /> {stat.trend}
                </div>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Crecimiento de Clientes</h3>
              <p className="text-xs text-slate-400">Nuevas empresas registradas por mes</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="empresas" stroke="#6366f1" strokeWidth={2} fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Distribución de Planes</h3>
            <p className="text-xs text-slate-400">Empresas por plan</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Prueba', value: trialCompanies.length, color: 'bg-amber-500' },
              { label: 'Inicial', value: companies.filter(c => c.plan === 'starter').length, color: 'bg-blue-500' },
              { label: 'Negocio', value: companies.filter(c => c.plan === 'business').length, color: 'bg-indigo-500' },
              { label: 'Empresarial', value: companies.filter(c => c.plan === 'enterprise').length, color: 'bg-purple-500' },
              { label: 'Cancelado', value: companies.filter(c => c.plan === 'cancelled').length, color: 'bg-rose-500' },
            ].map((p, i) => {
              const pct = companies.length ? Math.round(p.value / companies.length * 100) : 0;
              return (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{p.label}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{p.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }}
                      className={`h-full rounded-full ${p.color}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Planes por vencer</h3>
              <p className="text-xs text-slate-400">{alerts.length} empresa{alerts.length > 1 ? 's' : ''} con plan próximo a expirar</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {alerts.map((c, i) => {
              const daysLeft = Math.ceil((new Date(c.plan_expires_at) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</p>
                      <p className="text-xs text-slate-400">
                        Plan: {c.plan} · {c.user_count || 0} usuarios
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    daysLeft <= 2
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>
                    {daysLeft <= 0 ? 'Vencido' : `${daysLeft} día${daysLeft > 1 ? 's' : ''}`}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Registrations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Últimas Empresas Registradas</h3>
            <p className="text-xs text-slate-400">Gestiona tus clientes</p>
          </div>
          <button onClick={() => navigate('/admin')}
            className="text-xs font-medium text-indigo-500 hover:text-indigo-400">
            Ver todas
          </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {companies.slice(0, 8).map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                  c.plan === 'enterprise' ? 'bg-purple-500' :
                  c.plan === 'business' ? 'bg-indigo-500' :
                  c.plan === 'starter' ? 'bg-blue-500' :
                  c.plan === 'trial' ? 'bg-amber-500' : 'bg-rose-500'
                }`}>
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</p>
                  <p className="text-xs text-slate-400">
                    {c.plan === 'trial' ? 'Prueba' : c.plan === 'starter' ? 'Inicial' : c.plan === 'business' ? 'Negocio' : c.plan === 'enterprise' ? 'Empresarial' : 'Cancelado'}
                    {' · '}{c.user_count || 0} usuarios
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</span>
                <button onClick={() => { impersonate(c.id); navigate('/dashboard'); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                  title="Entrar como admin">
                  <Eye className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/admin')}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
