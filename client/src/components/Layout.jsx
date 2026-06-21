import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  BarChart3, Target, FolderKanban, ChevronLeft, 
  ChevronRight, Menu, X, Moon, Sun, Bell, LogOut,
  Shield, Building2, Eye, EyeOff, Settings2
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { apiFetch } from '../api/fetch';

const customerMenu = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'from-indigo-500 to-purple-500' },
  { path: '/employees', icon: Users, label: 'Empleados', color: 'from-blue-500 to-cyan-500' },
  { path: '/inventory', icon: Package, label: 'Inventario', color: 'from-emerald-500 to-teal-500' },
  { path: '/sales', icon: ShoppingCart, label: 'Ventas', color: 'from-orange-500 to-amber-500' },
  { path: '/accounting', icon: BarChart3, label: 'Contabilidad', color: 'from-rose-500 to-pink-500' },
  { path: '/clientes', icon: Target, label: 'Clientes', color: 'from-violet-500 to-purple-500' },
  { path: '/projects', icon: FolderKanban, label: 'Proyectos', color: 'from-sky-500 to-indigo-500' },
  { path: '/settings', icon: Settings2, label: 'Configuración', color: 'from-slate-500 to-slate-400' },
];

const superadminMenu = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'CEO Dashboard', color: 'from-indigo-500 to-purple-500' },
  { path: '/admin', icon: Shield, label: 'Admin Clientes', color: 'from-rose-500 to-pink-500' },
  { path: '/settings', icon: Settings2, label: 'Configuración', color: 'from-slate-500 to-slate-400' },
];

function SidebarView({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';
  const company = user?.company;
  const brandColor = company?.primary_color || '#6366f1';
  const menuItems = isSuperAdmin ? superadminMenu : customerMenu;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        {company?.logo_url ? (
          <img src={company.logo_url} alt={company.name} className="h-14 w-14 rounded-xl object-contain border dark:border-slate-700" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ background: brandColor }}>
            {(company?.name || 'S').charAt(0)}
          </div>
        )}
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">{company?.name || 'Synex'}</span>
            <span className="text-[10px] uppercase tracking-widest" style={{ color: brandColor }}>
              {isSuperAdmin ? 'Panel CEO' : 'Enterprise Suite'}
            </span>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'
              }`}
              style={active ? { backgroundColor: brandColor + '15', color: brandColor } : {}}
            >
              <div className={`rounded-lg p-1.5 transition-all duration-200 text-white shadow-lg`}
                style={active ? { background: brandColor } : {}}>
                <item.icon className="h-4 w-4" />
              </div>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {active && !collapsed && (
                <motion.div layoutId="activeTab" className="absolute right-2 h-2 w-2 rounded-full" style={{ background: brandColor }} />
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/50 p-4 dark:border-slate-700/50">
        {!collapsed && (
          <div className="rounded-xl p-3" style={{ backgroundColor: brandColor + '12' }}>
            <p className="text-xs font-medium" style={{ color: brandColor }}>
              {isSuperAdmin ? 'Panel de control CEO' : '¿Necesitas ayuda?'}
            </p>
            <p className="mt-1 text-[10px]" style={{ color: brandColor + '99' }}>Versión 1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        className="hidden h-screen flex-shrink-0 overflow-hidden border-r border-slate-200/50 bg-white/80 backdrop-blur-xl transition-colors lg:block dark:border-slate-700/50 dark:bg-slate-900/80"
      >
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: mobileOpen ? 0 : -300 }}
        className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-slate-200 bg-white shadow-2xl lg:hidden dark:border-slate-700 dark:bg-slate-900"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}

export function Navbar({ setMobileOpen }) {
  const { user, darkMode, toggleDark, logout, impersonating, stopImpersonating } = useAuthStore();
  const brandColor = user?.company?.primary_color || '#6366f1';
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const { expired, plan, plan_expires_at, subscriptionStatus } = user?.company || {};
  const navigate = useNavigate();
  const daysLeft = plan_expires_at ? Math.ceil((new Date(plan_expires_at) - new Date()) / 86400000) : 0;

  useEffect(() => {
    if (!user) return;
    apiFetch(__API_URL__ + '/api/notifications')
      .then(r => r.json())
      .then(r => Array.isArray(r) ? setNotifs(r) : setNotifs([]))
      .catch(() => {});
  }, [user]);

  const markRead = async (id) => {
    await apiFetch(__API_URL__ + `/api/notifications/${id}/read`, { method: 'POST' });
    setNotifs(notifs.map(n => n.id === id ? { ...n, read: 1 } : n));
  };

  return (
    <>
      {impersonating && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <Eye className="h-4 w-4" />
          Modo demo — Estás viendo como {user?.name}
          <button onClick={stopImpersonating}
            className="ml-2 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold hover:bg-amber-700 transition-colors">
            Salir
          </button>
        </div>
      )}
      {expired && subscriptionStatus !== 'active' && user?.role !== 'superadmin' && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-rose-600 px-4 py-2.5 text-sm font-medium text-white">
          <span>Tu período de prueba terminó. Elegí un plan para seguir usando Synex.</span>
          <button onClick={() => navigate('/settings')} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
            Ver Planes
          </button>
        </div>
      )}
      {!expired && daysLeft > 0 && daysLeft <= 3 && subscriptionStatus !== 'active' && user?.role !== 'superadmin' && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <span>Tu prueba gratis termina en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}.</span>
          <button onClick={() => navigate('/settings')} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
            Elegir Plan
          </button>
        </div>
      )}
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/50 px-4 dark:border-slate-700/50"
        style={{ top: impersonating ? '40px' : '0' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-slate-800 dark:text-white">
              {user?.name ? `Bienvenido, ${user.name.split(' ')[0]}` : 'Synex'}
            </h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleDark} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="h-4 w-4" />
              {notifs.filter(n => !n.read).length > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900" style={{ background: brandColor }} />
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
                >
                  <p className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Notificaciones</p>
                  {notifs.slice(0, 5).map(n => (
                    <button key={n.id} onClick={() => markRead(n.id)}
                      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                      <div className={`mt-0.5 h-2 w-2 rounded-full ${!n.read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{n.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{n.message}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button onClick={() => setShowUser(!showUser)} className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ background: brandColor }}>
                {user?.name?.charAt(0) || 'U'}
              </div>
            </button>
            <AnimatePresence>
              {showUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  </div>
                  <hr className="my-1 border-slate-200 dark:border-slate-700" />
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    </>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <SidebarView
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
