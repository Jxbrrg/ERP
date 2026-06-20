import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Package, ShoppingCart, 
  BarChart3, Target, FolderKanban, Shield, 
  ChevronRight, Star, ArrowRight, CheckCircle 
} from 'lucide-react';

const features = [
  { icon: LayoutDashboard, title: 'Dashboard', desc: 'Paneles en tiempo real con métricas clave de tu negocio', color: 'from-indigo-500 to-purple-500' },
  { icon: Users, title: 'Empleados', desc: 'Gestión de nómina, asistencia y rendimiento del equipo', color: 'from-blue-500 to-cyan-500' },
  { icon: Package, title: 'Inventario', desc: 'Control de stock, productos y alertas de inventario crítico', color: 'from-emerald-500 to-teal-500' },
  { icon: ShoppingCart, title: 'Ventas', desc: 'Órdenes, facturación y seguimiento de clientes', color: 'from-orange-500 to-amber-500' },
  { icon: BarChart3, title: 'Contabilidad', desc: 'Libro diario, balance general y estado de resultados', color: 'from-rose-500 to-pink-500' },
  { icon: Target, title: 'CRM', desc: 'Gestión de relaciones con clientes e interacciones', color: 'from-violet-500 to-purple-500' },
  { icon: FolderKanban, title: 'Proyectos', desc: 'Planificación, tareas y seguimiento de proyectos', color: 'from-sky-500 to-indigo-500' },
];

const plans = [
  { name: 'Inicial', price: '50.000', period: '/mes', desc: '14 días gratis, luego $50.000/mes - Para empezar', features: ['Todos los módulos', 'Hasta 2 empleados', 'Soporte por email', '100 transacciones/mes'], cta: 'Probar 14 días gratis', popular: false, trial: true, value: 'trial' },
  { name: 'Negocio', price: '120.000', period: '/mes', desc: 'Precio de Lanzamiento - Para empresas en crecimiento', features: ['Todos los módulos', 'Hasta 15 empleados', 'Soporte prioritario', 'Transacciones ilimitadas', 'API Access', 'Múltiples usuarios', 'Exportación de datos', 'Reportes avanzados'], cta: 'Empezar ahora', popular: true, badge: 'OFERTA LANZAMIENTO', value: 'business' },
  { name: 'Empresarial', price: '230.000', period: '/mes', desc: 'Precio de Lanzamiento - Para grandes organizaciones', features: ['Todo lo de Negocio', 'Empleados ilimitados', 'Soporte 24/7', 'Personalización de marca', 'On-premise opcional', 'SLA garantizado', 'Gerente de cuenta dedicado', 'Seguridad avanzada'], cta: 'Contactar', popular: false, badge: 'OFERTA LANZAMIENTO', value: 'enterprise' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/Synex.png" alt="Synex" className="h-10 w-10 rounded-xl" />
            <span className="text-lg font-bold text-white">Synex</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Iniciar Sesión</Link>
            <Link to="/register"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30">
              Crear Cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full from-purple-500/20 blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-300">
            <Star className="h-3 w-3" /> SaaS Enterprise Suite
          </div>
          <h1 className="text-5xl font-bold leading-tight text-white lg:text-7xl">
            El ERP que tu
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> empresa merece</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Gestión inteligente de recursos empresariales con análisis en tiempo real, 
            multi-tenant y una experiencia de usuario inigualable.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <button onClick={() => navigate('/register')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30">
              Comenzar Gratis <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => navigate('/pricing')}
              className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:border-slate-500 hover:text-white">
              Ver Planes
            </button>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-8 text-center">
            {[
              { value: '7', label: 'Módulos Integrados' },
              { value: '99.9%', label: 'Uptime Garantizado' },
              { value: '24/7', label: 'Soporte Dedicado' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-white lg:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative px-4 py-20" id="features">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white lg:text-4xl">Todo lo que necesitas en un solo lugar</h2>
            <p className="mt-3 text-slate-400">Siete módulos diseñados para escalar tu negocio</p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-indigo-500/30 hover:bg-white/10">
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.color} p-3`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative px-4 py-20" id="pricing">
        <div className="mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white lg:text-4xl">Planes para cada etapa</h2>
            <p className="mt-3 text-slate-400">Escala tu plan a medida que creces</p>
          </motion.div>
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-8 transition-all ${
                  p.popular 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-500/10' 
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}>
                {p.badge && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-xs font-bold text-white animate-pulse">
                    {p.badge}
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${p.price}</span>
                  <span className="text-slate-400">{p.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{p.desc}</p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-4 w-4 text-emerald-400" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/register')}
                  className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-all ${
                    p.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl'
                      : 'border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}>
                  {p.cta}
                </button>
                {p.popular && (
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white">
                      <Star className="h-3 w-3" /> Más popular
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 py-20">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-12 text-center shadow-2xl">
          <h2 className="text-3xl font-bold text-white">¿Listo para transformar tu empresa?</h2>
          <p className="mt-3 text-lg text-indigo-100">14 días gratis. Sin tarjeta de crédito.</p>
          <button onClick={() => navigate('/register')}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-semibold text-indigo-600 shadow-lg transition-all hover:shadow-xl">
            Crear cuenta gratis <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <img src="/Synex.png" alt="Synex" className="h-6 w-6 rounded-lg" />
            &copy; {new Date().getFullYear()} Synex. Todos los derechos reservados.
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
            <Link to="/register" className="hover:text-white transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
