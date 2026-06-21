import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, ArrowRight, Star, Zap, Sparkles, Building2, Globe, Shield, Crown } from 'lucide-react';

const planIcons = [Zap, Sparkles, Building2, Globe, Shield, Crown];

const plans = [
  {
    name: 'Personal', price: '30.000', period: '/mes', color: 'emerald', iconBg: 'bg-emerald-500/20 text-emerald-400',
    desc: 'Para emprendedores independientes', features: ['Panel, Ventas básico', 'Inventario reducido', 'Contabilidad simplificada', '1 usuario · 1 empleado', 'Hasta 40 transacciones/mes', 'Soporte por correo', 'Exportación básica'],
    cta: 'Probar 14 días gratis', popular: false, trial: true,
  },
  {
    name: 'Inicial', price: '50.000', period: '/mes', color: 'amber', iconBg: 'bg-amber-500/20 text-amber-400',
    desc: 'Para empezar formalmente', features: ['Todos los módulos', 'Hasta 2 empleados', '100 transacciones/mes', 'Soporte por correo'],
    cta: 'Probar 14 días gratis', popular: false, trial: true,
  },
  {
    name: 'Microempresa', price: '80.000', period: '/mes', color: 'orange', iconBg: 'bg-orange-500/20 text-orange-400',
    desc: 'Para negocios con equipo pequeño', features: ['Todos los módulos', 'Hasta 6 empleados', '300 transacciones/mes', 'Soporte correo y chat', 'Reportes sencillos'],
    cta: 'Probar 14 días gratis', popular: false, trial: true,
  },
  {
    name: 'Negocio', price: '150.000', period: '/mes', color: 'blue', iconBg: 'bg-blue-500/20 text-blue-400',
    desc: 'Para empresas en crecimiento', features: ['Todos los módulos', 'Hasta 15 empleados', 'Transacciones ilimitadas', 'Soporte prioritario', 'API Access', 'Exportación completa', 'Reportes avanzados'],
    cta: 'Empezar ahora', popular: true, badge: 'MÁS POPULAR',
  },
  {
    name: 'Crecimiento Regional', price: '180.000', period: '/mes', color: 'purple', iconBg: 'bg-purple-500/20 text-purple-400',
    desc: 'Para empresas con sucursales', features: ['Todo lo de Negocio', 'Hasta 40 empleados', 'Multisede y almacenes', 'Roles y permisos avanzados', 'Copias de seguridad programadas'],
    cta: 'Empezar ahora', popular: false,
  },
  {
    name: 'Empresarial', price: '230.000', period: '/mes', color: 'rose', iconBg: 'bg-rose-500/20 text-rose-400',
    desc: 'Para grandes organizaciones', features: ['Todo lo de Crecimiento', 'Empleados ilimitados', 'Soporte 24/7', 'Marca propia', 'Gerente de cuenta dedicado', 'On-premise opcional', 'SLA garantizado'],
    cta: 'Contactar', popular: false,
  },
  {
    name: 'Corporativo', price: '360.000', period: '/mes', color: 'slate', iconBg: 'bg-slate-500/20 text-slate-300',
    desc: 'Para grupos empresariales', features: ['Todo lo de Empresarial', 'Multiempresa misma cuenta', 'Informes consolidados', 'Personalización total', 'Capacitación presencial', 'Auditorías periódicas'],
    cta: 'Contactar', popular: false,
  },
];

const faq = [
  { q: '¿Puedo cambiar de plan después?', a: 'Sí, puedes subir o bajar de plan en cualquier momento desde Configuración → Suscripción, sin penalización.' },
  { q: '¿Hay período de prueba gratis?', a: 'Sí, todos los planes incluyen 14 días gratis sin necesidad de tarjeta de crédito.' },
  { q: '¿Qué significa "transacciones/mes"?', a: 'Cada venta, compra o movimiento contable cuenta como una transacción. Los planes superiores tienen límites más altos o ilimitados.' },
  { q: '¿Puedo tener varias sucursales?', a: 'Sí, los planes Crecimiento Regional en adelante incluyen multisede y múltiples almacenes.' },
  { q: '¿Mis datos están seguros?', a: 'Todos los datos se almacenan en servidores seguros con encriptación SSL. Ofrecemos backups diarios programados.' },
  { q: '¿Ofrecen soporte técnico?', a: 'Sí, desde soporte por correo en planes básicos hasta 24/7 con gerente de cuenta dedicado en planes superiores.' },
];

function PlanCard({ p, i, navigate }) {
  const Icon = planIcons[i % planIcons.length];
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
      className={`relative rounded-2xl border p-6 transition-all flex flex-col ${
        p.popular
          ? 'border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-500/10 scale-105 z-10'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}>
      {p.badge && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider animate-pulse whitespace-nowrap">
          {p.badge}
        </div>
      )}
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${p.iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold text-white">{p.name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-white">${p.price}</span>
        <span className="text-slate-400 text-sm">{p.period}</span>
      </div>
      {p.trial && <p className="mt-1 text-[10px] text-emerald-400 font-medium">14 días gratis</p>}
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">{p.desc}</p>
      <ul className="mt-5 space-y-2 flex-1">
        {p.features.map((f, j) => (
          <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
            <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" /> {f}
          </li>
        ))}
      </ul>
      <button onClick={() => navigate('/register')}
        className={`mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
          p.popular
            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl'
            : 'border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
        }`}>
        {p.cta}
      </button>
      {p.popular && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-0.5 text-[10px] font-semibold text-white">
            <Star className="h-3 w-3" /> Más popular
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/Synex.png" alt="Synex" className="h-10 w-10 rounded-xl" />
            <span className="text-lg font-bold text-white">Synex</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Iniciar Sesión</Link>
            <Link to="/register"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl">
              Crear Cuenta
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            <h1 className="text-4xl font-bold text-white">Planes y Precios</h1>
            <p className="mt-3 text-lg text-slate-400">Elige el plan perfecto para tu empresa</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {plans.slice(0, 4).map((p, i) => (
              <PlanCard key={i} p={p} i={i} navigate={navigate} />
            ))}
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-3 max-w-4xl mx-auto">
            {plans.slice(4).map((p, i) => (
              <PlanCard key={i + 4} p={p} i={i + 4} navigate={navigate} />
            ))}
          </div>

          {/* FAQ */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="mt-20">
            <h2 className="mb-8 text-center text-2xl font-bold text-white">Preguntas Frecuentes</h2>
            <div className="mx-auto max-w-2xl space-y-4">
              {faq.map((item, i) => (
                <motion.details key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="group rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20">
                  <summary className="cursor-pointer text-sm font-medium text-white">{item.q}</summary>
                  <p className="mt-3 text-sm text-slate-400">{item.a}</p>
                </motion.details>
              ))}
            </div>
          </motion.div>

          <div className="mt-16 text-center">
            <p className="text-slate-400">¿Necesitas un plan personalizado?</p>
            <button onClick={() => navigate('/register')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl">
              Contáctanos <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <img src="/Synex.png" alt="Synex" className="h-6 w-6 rounded-lg" />
            &copy; {new Date().getFullYear()} Synex.
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
            <Link to="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
