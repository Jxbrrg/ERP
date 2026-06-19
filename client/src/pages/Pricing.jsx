import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

const plans = [
  { name: 'Inicial', price: 'Gratis', period: '14 días', desc: 'Para probar Synex sin compromiso', features: ['Todos los módulos', 'Hasta 5 empleados', 'Soporte por email', '100 transacciones/mes'], cta: 'Probar gratis', popular: false },
  { name: 'Negocio', price: '$29', period: '/mes', desc: 'Para pequeñas y medianas empresas', features: ['Todos los módulos', 'Hasta 50 empleados', 'Soporte prioritario', 'Transacciones ilimitadas', 'API Access', 'Múltiples usuarios', 'Exportación de datos'], cta: 'Empezar', popular: true },
  { name: 'Empresarial', price: '$99', period: '/mes', desc: 'Para empresas con necesidades avanzadas', features: ['Todo lo de Negocio', 'Empleados ilimitados', 'Soporte 24/7', 'Personalización de marca', 'On-premise opcional', 'SLA garantizado', 'Gerente de cuenta dedicado'], cta: 'Contactar', popular: false },
];

const faq = [
  { q: '¿Puedo cambiar de plan después?', a: 'Sí, puedes upgradear o downgradear tu plan en cualquier momento desde el panel de administración.' },
  { q: '¿Hay período de prueba gratis?', a: 'Sí, ofrecemos 14 días gratis en el plan Inicial sin necesidad de tarjeta de crédito.' },
  { q: '¿Mis datos están seguros?', a: 'Todos los datos se almacenan en servidores seguros con encriptación SSL. Ofrecemos backups diarios.' },
  { q: '¿Ofrecen soporte técnico?', a: 'Sí, dependiendo de tu plan: email (Inicial), prioritario (Negocio) y 24/7 (Empresarial).' },
];

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

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border p-8 transition-all ${
                  p.popular 
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-xl shadow-indigo-500/10' 
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-xs font-semibold text-white">
                    Más popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-white">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{p.price}</span>
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
              </motion.div>
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
