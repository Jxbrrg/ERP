import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Register() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.companyName, form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative m-auto flex w-full max-w-md items-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="glass rounded-3xl p-8 shadow-2xl dark:bg-slate-900/80">
            <div className="mb-6 text-center">
              <img src="/Synex.png" alt="Synex" className="mx-auto mb-4 h-20 w-20 rounded-2xl" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Crear Empresa</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Registra tu empresa en Synex
              </p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-600">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Nombre de la empresa</label>
                <div className="relative mt-1.5">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.companyName} onChange={update('companyName')}
                    placeholder="Mi Empresa SAS"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Tu nombre</label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.name} onChange={update('name')}
                    placeholder="Juan Pérez"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={update('email')}
                    placeholder="tu@synex.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    required pattern=".+@synex\.com" title="Debe ser un correo @synex.com" />
                  <p className="mt-1 text-[10px] text-slate-400">Solo correos @synex.com</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Contraseña</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="password" value={form.password} onChange={update('password')}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    required minLength={6} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="gradient-primary w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-70">
                {loading ? 'Creando...' : 'Crear Empresa'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-400">Inicia sesión</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
