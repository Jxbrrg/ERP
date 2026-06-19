import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  BarChart3, Target, FolderKanban, ChevronLeft, 
  ChevronRight, Menu, X, Moon, Sun, Bell, LogOut,
  Shield
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'from-indigo-500 to-purple-500' },
  { path: '/employees', icon: Users, label: 'Empleados', color: 'from-blue-500 to-cyan-500' },
  { path: '/inventory', icon: Package, label: 'Inventario', color: 'from-emerald-500 to-teal-500' },
  { path: '/sales', icon: ShoppingCart, label: 'Ventas', color: 'from-orange-500 to-amber-500' },
  { path: '/accounting', icon: BarChart3, label: 'Contabilidad', color: 'from-rose-500 to-pink-500' },
  { path: '/crm', icon: Target, label: 'CRM', color: 'from-violet-500 to-purple-500' },
  { path: '/projects', icon: FolderKanban, label: 'Proyectos', color: 'from-sky-500 to-indigo-500' },
];

function SidebarView({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-4 py-5">
        <img src="/SynexERP.png" alt="SynexERP" className="h-14 w-14 rounded-xl" />
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">SynexERP</span>
            <span className="text-[10px] uppercase tracking-widest text-indigo-400">Enterprise ERP</span>
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
                  ? 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' 
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className={`rounded-lg p-1.5 transition-all duration-200 ${
                active ? `${item.color} text-white shadow-lg` : ''
              }`}>
                <item.icon className="h-4 w-4" />
              </div>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {active && !collapsed && (
                <motion.div layoutId="activeTab" className="absolute right-2 h-2 w-2 rounded-full bg-indigo-500" />
              )}
            </motion.button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200/50 p-4 dark:border-slate-700/50">
        {!collapsed && (
          <div className="rounded-xl bg-indigo-50 p-3 dark:bg-indigo-500/10">
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">¿Necesitas ayuda?</p>
            <p className="mt-1 text-[10px] text-indigo-500/70 dark:text-indigo-400/70">Versión 1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
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

      {/* Mobile Overlay */}
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

      {/* Mobile Sidebar */}
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
  const { user, darkMode, toggleDark, logout } = useAuthStore();
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/notifications', { credentials: 'include' })
      .then(r => r.json())
      .then(setNotifs)
      .catch(() => {});
  }, []);

  const markRead = async (id) => {
    await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
    setNotifs(notifs.map(n => n.id === id ? { ...n, read: 1 } : n));
  };

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/50 px-4 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-white">
            {user?.name ? `Bienvenido, ${user.name.split(' ')[0]}` : 'SynexERP'}
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
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
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
            <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white">
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
