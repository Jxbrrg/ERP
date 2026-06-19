import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full from-purple-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="relative m-auto flex w-full max-w-5xl items-center gap-12 px-4">
        {/* Left - Brand */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden flex-1 lg:block"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-2xl shadow-indigo-500/30">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">NEXUS</h1>
              <p className="text-sm text-indigo-300/80">Enterprise Resource Planning</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight text-white">
            El ERP que tu<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              empresa merece
            </span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
            Gestión inteligente de recursos empresariales con inteligencia artificial integrada, 
            análisis en tiempo real y una experiencia de usuario inigualable.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '7', label: 'Módulos', color: 'from-indigo-500 to-purple-500' },
              { value: '99.9%', label: 'Uptime', color: 'from-emerald-500 to-teal-500' },
              { value: '24/7', label: 'Soporte', color: 'from-amber-500 to-orange-500' },
            ].map((stat, i) => (
              <div key={i} className={`rounded-xl bg-gradient-to-br ${stat.color} p-0.5`}>
                <div className="rounded-[10px] bg-slate-900/90 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/70">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right - Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md lg:w-[420px]"
        >
          <div className="glass rounded-3xl p-8 shadow-2xl dark:bg-slate-900/80">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Iniciar Sesión</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Accede a tu panel de control empresarial
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-600 dark:text-rose-400">
                {error}
              </motion.div>
            )}

            {/* Demo Login */}
            <form onSubmit={handleDemoLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email de prueba</label>
                <div className="relative mt-1.5">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@nexus.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500"
                    required
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Usuarios demo: admin@nexus.com · manager@nexus.com · 1044619997@nexus.com
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gradient-primary w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Ingresando...' : 'Ingresar con Demo'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 dark:bg-slate-900">Demo</span></div>
            </div>

            <p className="mt-6 text-center text-[10px] text-slate-400 dark:text-slate-500">
              Al iniciar sesión aceptas los términos y condiciones de NEXUS ERP
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
