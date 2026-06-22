import { apiFetch } from '../api/fetch';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Package, ShoppingCart, Building2, AlertTriangle,
  TrendingUp, DollarSign, Briefcase, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight, Download, FileText, FileSpreadsheet, Award,
  CalendarDays, Timer
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../components/StatsCard';
import useAuthStore from '../store/authStore';
import OnboardingTour from '../components/OnboardingTour';
import { exportPDF, exportExcel } from '../utils/export';

export default function Dashboard() {
  const { user } = useAuthStore();
  const primaryColor = user?.company?.primary_color || '#6366f1';
  const secondaryColor = user?.company?.secondary_color || '#06b6d4';
  
  // Generate color palette from primary/secondary
  const getColorPalette = (primary, secondary) => [
    primary,
    secondary,
    '#10b981', // emerald
    '#f59e0b', // amber
    '#f97316', // orange
    '#ef4444', // red
    '#8b5cf6', // violet
  ];

  const COLORS = getColorPalette(primaryColor, secondaryColor);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const totalRevenue = data?.monthlySales?.reduce((s, m) => s + Number(m.total), 0) || 0;

  useEffect(() => {
    let cancelled = false;
    apiFetch(__API_URL__ + '/api/dashboard')
      .then(r => { if (!r.ok) throw new Error('Error ' + r.status); return r.json(); })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" /></div>;
  if (error) return <div className="flex h-96 items-center justify-center text-rose-500"><p>Error al cargar datos: {error}</p></div>;
  if (!data) return <div className="flex h-96 items-center justify-center text-slate-500"><p>No hay datos disponibles</p></div>;

  const brandGradient = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;

  const stats = [
    { title: 'Empleados Activos', value: data?.totalEmployees || 0, icon: Users, color: brandGradient, trend: 8 },
    { title: 'Productos', value: data?.totalProducts || 0, icon: Package, color: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`, trend: 12 },
    { title: 'Órdenes', value: data?.totalOrders || 0, icon: ShoppingCart, color: `linear-gradient(135deg, ${secondaryColor}, #f59e0b)`, trend: -3 },
    { title: 'Clientes', value: data?.totalCustomers || 0, icon: Building2, color: brandGradient, trend: 15 },
    { title: 'Proyectos Activos', value: data?.activeProjects || 0, icon: Briefcase, color: `linear-gradient(135deg, #06b6d4, ${primaryColor})`, trend: 5 },
    { title: 'Stock Crítico', value: data?.lowStock || 0, icon: AlertTriangle, color: 'linear-gradient(135deg, #f43f5e, #ec4899)', trend: 2 },
    { title: 'Tareas Completadas', value: data?.completedTasks || 0, icon: CheckCircle2, color: 'linear-gradient(135deg, #10b981, #22c55e)', trend: 20 },
    { title: 'Pendientes', value: data?.pendingTasks || 0, icon: Clock, color: 'linear-gradient(135deg, #f59e0b, #f97316)', trend: -5 },
  ];

  const orderStatusData = [
    { name: 'Pendientes', value: data?.orderStatus?.find(s => s.status === 'pending')?.count || 0 },
    { name: 'Confirmadas', value: data?.orderStatus?.find(s => s.status === 'confirmed')?.count || 0 },
    { name: 'Enviadas', value: data?.orderStatus?.find(s => s.status === 'shipped')?.count || 0 },
    { name: 'Entregadas', value: data?.orderStatus?.find(s => s.status === 'delivered')?.count || 0 },
    { name: 'Canceladas', value: data?.orderStatus?.find(s => s.status === 'cancelled')?.count || 0 },
  ].filter(d => d.value > 0);

  const salesChartData = data?.salesByDay?.map(s => ({
    day: new Date(s.day).toLocaleDateString('es', { day: '2-digit', month: 'short' }),
    ventas: Number(s.total) || 0,
    ordenes: s.count || 0
  })) || [];

  const monthlyData = data?.monthlySales?.map(m => {
    const [y, mon] = (m.month || '').split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const label = mon ? months[parseInt(mon) - 1] + ' ' + y.slice(-2) : m.month;
    return { month: label, ingresos: Number(m.total) || 0 };
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Panel de Control</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Resumen ejecutivo del negocio en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportPDF('Reporte Dashboard', ['Métrica', 'Valor'], stats.map(s => [s.title, String(s.value)]), 'dashboard.pdf')}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-all" title="Exportar PDF">
            <FileText className="h-4 w-4" />
          </button>
          <button onClick={() => exportExcel('Reporte Dashboard', ['Métrica', 'Valor'], stats.map(s => [s.title, String(s.value)]), 'dashboard.xlsx')}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-all" title="Exportar Excel">
            <FileSpreadsheet className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* Subscription Status */}
      {(() => {
        const company = user?.company || {};
        const expires = company.plan_expires_at;
        const daysLeft = expires ? Math.ceil((new Date(expires) - new Date()) / 86400000) : null;
        if (!company.subscriptionStatus || company.subscriptionStatus === 'active') return null;
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 flex items-center justify-between ${
              daysLeft !== null && daysLeft <= 0
                ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
                : daysLeft !== null && daysLeft <= 5
                ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20'
                : 'bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20'
            }`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${
                daysLeft !== null && daysLeft <= 0
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-500'
                  : daysLeft !== null && daysLeft <= 5
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500'
                  : 'bg-sky-100 dark:bg-sky-500/20 text-sky-500'
              }`}>
                {daysLeft !== null && daysLeft <= 0 ? <AlertTriangle className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${
                  daysLeft !== null && daysLeft <= 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {daysLeft !== null && daysLeft <= 0
                    ? 'Tu suscripción ha expirado'
                    : `Te quedan ${daysLeft} día${daysLeft !== 1 ? 's' : ''} de prueba`
                  }
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {daysLeft !== null && daysLeft <= 0
                    ? 'Selecciona un plan en Configuración para reactivar tu cuenta.'
                    : `Tu plan ${company.plan || 'actual'} vence el ${new Date(expires).toLocaleDateString('es')}`
                  }
                </p>
              </div>
            </div>
            <a href="/settings"
              className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02] ${
                daysLeft !== null && daysLeft <= 0
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
              }`}>
              {daysLeft !== null && daysLeft <= 0 ? 'Reactivar' : 'Ver Planes'}
            </a>
          </motion.div>
        );
      })()}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} delay={i * 0.05} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Tendencia de Ventas</h3>
              <p className="text-xs text-slate-500">Últimos 30 días</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
              <span className="font-semibold">12.5%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesChartData}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.15} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="ventas" stroke={primaryColor} strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Monthly Revenue */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Ingresos Mensuales</h3>
              <p className="text-xs text-slate-500">Últimos 12 meses</p>
            </div>
            <DollarSign className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.15} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="ingresos" fill={primaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Order Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Estado de Órdenes</h3>
            <p className="text-xs text-slate-500">Distribución actual</p>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {orderStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {orderStatusData.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Department Distribution */}
        {data?.deptEmployees?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Empleados por Departamento</h3>
            <p className="text-xs text-slate-500">Distribución del equipo</p>
          </div>
          <div className="space-y-3">
            {data.deptEmployees.map((d, i) => {
              const maxCount = Math.max(...data.deptEmployees.map(x => x.count));
              const pct = (d.count / maxCount) * 100;
              return (
                <div key={d.department || 'sin-depto'}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{d.department || 'Sin departamento'}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{d.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
        )}
      </div>

      {/* Recent Orders & Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Órdenes Recientes</h3>
              <p className="text-xs text-slate-500">Últimas 5</p>
            </div>
          </div>
          <div className="space-y-3">
            {data?.recentOrders?.map((order, i) => (
              <motion.div key={order.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                    order.status === 'delivered' ? 'bg-emerald-500' :
                    order.status === 'cancelled' ? 'bg-rose-500' :
                    order.status === 'shipped' ? 'bg-blue-500' :
                    order.status === 'confirmed' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}>
                    {order.code?.slice(-3)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{order.customer_name || 'N/A'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{order.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    ${Number(order.total).toLocaleString('es-CO')}
                  </p>
                  <span className={`text-[10px] uppercase ${
                    order.status === 'delivered' ? 'text-emerald-500' :
                    order.status === 'cancelled' ? 'text-rose-500' :
                    order.status === 'shipped' ? 'text-blue-500' : 'text-amber-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Transacciones Recientes</h3>
              <p className="text-xs text-slate-500">Últimos movimientos</p>
            </div>
            <DollarSign className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div className="space-y-3">
            {data?.recentTransactions?.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                    tx.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{tx.description || tx.category}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(tx.date || tx.created_at).toLocaleDateString('es')}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ${Number(tx.amount).toLocaleString('es-CO')}
                </p>
              </motion.div>
            ))}
            {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
              <p className="text-sm text-slate-400 text-center py-4">Sin movimientos recientes</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Customers */}
      {data?.topCustomers?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Top Clientes</h3>
              <p className="text-xs text-slate-500">Por volumen de compras</p>
            </div>
            <Award className="h-5 w-5" style={{ color: primaryColor }} />
          </div>
          <div className="space-y-2">
            {data.topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{c.orders} órdenes</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">${Number(c.total).toLocaleString('es-CO')}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <OnboardingTour />
    </div>
  );
}
