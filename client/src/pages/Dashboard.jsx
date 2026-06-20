import { apiFetch } from '../api/fetch';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Package, ShoppingCart, Building2, AlertTriangle,
  TrendingUp, DollarSign, Briefcase, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../components/StatsCard';
import useAuthStore from '../store/authStore';

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
  if (!data) return <div className="flex h-96 items-center justify-center text-slate-400"><p>No hay datos disponibles</p></div>;

  // Generate gradient classes from brand colors
  const brandGradient = `from-[${primaryColor}] to-[${secondaryColor}]`;
  const brandGradientLight = `from-[${primaryColor}]/10 to-[${secondaryColor}]/10`;

  const stats = [
    { title: 'Empleados Activos', value: data?.totalEmployees || 0, icon: Users, color: brandGradient, trend: 8 },
    { title: 'Productos', value: data?.totalProducts || 0, icon: Package, color: `from-[${secondaryColor}] to-[${primaryColor}]`, trend: 12 },
    { title: 'Órdenes', value: data?.totalOrders || 0, icon: ShoppingCart, color: `from-[${secondaryColor}] to-amber-500`, trend: -3 },
    { title: 'Clientes', value: data?.totalCustomers || 0, icon: Building2, color: brandGradient, trend: 15 },
    { title: 'Proyectos Activos', value: data?.activeProjects || 0, icon: Briefcase, color: `from-cyan-500 to-[${primaryColor}]`, trend: 5 },
    { title: 'Stock Crítico', value: data?.lowStock || 0, icon: AlertTriangle, color: 'from-rose-500 to-pink-500', trend: 2 },
    { title: 'Tareas Completadas', value: data?.completedTasks || 0, icon: CheckCircle2, color: 'from-emerald-500 to-green-500', trend: 20 },
    { title: 'Pendientes', value: data?.pendingTasks || 0, icon: Clock, color: 'from-amber-500 to-orange-500', trend: -5 },
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Panel de Control</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Resumen ejecutivo del negocio en tiempo real</p>
      </motion.div>

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
              <p className="text-xs text-slate-400">Últimos 30 días</p>
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
              <p className="text-xs text-slate-400">Últimos 12 meses</p>
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
            <p className="text-xs text-slate-400">Distribución actual</p>
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
                  <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Órdenes Recientes</h3>
              <p className="text-xs text-slate-400">Últimas 5 transacciones</p>
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
                    <p className="text-xs text-slate-400">{order.code}</p>
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
      </div>
    </div>
  );
}
