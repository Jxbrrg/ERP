import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, Image, Smartphone, FileText, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Register() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '', name: '', email: '', password: '', confirmPassword: '',
    phone: '', nit: '', logoBase64: '',
    primary_color: '#6366f1', secondary_color: '#06b6d4',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    setError('');
    try {
      await register(form.companyName, form.name, form.email, form.password, form.phone, form.nit, form.logoBase64, form.primary_color, form.secondary_color);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('El logo debe ser menor a 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm({ ...form, logoBase64: event.target.result });
      setLogoPreview(event.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm({ ...form, logoBase64: '' });
    setLogoPreview('');
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 bg-purple-500/20 blur-3xl" />
      </div>

      <div className="relative m-auto flex w-full max-w-4xl items-start gap-8 px-4 py-8">
        {/* Left panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-80 shrink-0 pt-4">
          <div className="mb-6">
            <img src="/Synex.png" alt="Synex" className="h-14 w-14 rounded-2xl mb-4" />
            <h1 className="text-2xl font-bold text-white">Comienza a gestionar tu negocio</h1>
            <p className="mt-2 text-sm text-slate-400">Regístrate y prueba Synex ERP gratis por 14 días</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-300">14 días de prueba gratis</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-300">Sin necesidad de tarjeta</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm text-slate-300">Todas las funciones activas</span>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-auto lg:mx-0">
          <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <img src="/Synex.png" alt="Synex" className="mx-auto mb-3 h-16 w-16 rounded-2xl" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Crear Empresa</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">14 días de prueba gratis · Sin tarjeta</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-600 dark:text-rose-400">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Empresa</label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.companyName} onChange={update('companyName')}
                    placeholder="Nombre de la empresa" required autoFocus
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Nombre</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" value={form.name} onChange={update('name')}
                    placeholder="Tu nombre completo" required
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Email (@synex.com)</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={form.email} onChange={update('email')}
                    placeholder="tu@synex.com" required pattern=".+@synex\.com" title="Debe ser @synex.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Contraseña</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="password" value={form.password} onChange={update('password')}
                    placeholder="Mínimo 6 caracteres" required minLength={6}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Confirmar contraseña</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')}
                    placeholder="Repite la contraseña"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="mt-1 text-[10px] text-rose-500">No coinciden</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">NIT (opc.)</label>
                  <div className="relative mt-1">
                    <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="text" value={form.nit} onChange={update('nit')} placeholder="900.123.456-7"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Teléfono (opc.)</label>
                  <div className="relative mt-1">
                    <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="tel" value={form.phone} onChange={update('phone')} placeholder="300 123 4567"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Logo (opcional)</label>
                <div className="mt-1">
                  {logoPreview ? (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-600 p-2">
                      <img src={logoPreview} alt="" className="h-12 w-12 rounded-xl object-cover" />
                      <button type="button" onClick={removeLogo} className="text-xs text-rose-500">Eliminar</button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-3 hover:border-indigo-400">
                      <Image className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-slate-400">Subir logo</span>
                      <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Color</label>
                  <input type="color" value={form.primary_color} onChange={update('primary_color')}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white p-1 cursor-pointer dark:border-slate-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">Secundario</label>
                  <input type="color" value={form.secondary_color} onChange={update('secondary_color')}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white p-1 cursor-pointer dark:border-slate-600" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-70">
                {loading ? 'Creando...' : 'Crear Empresa — Prueba gratis'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-500">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-medium text-indigo-500 hover:text-indigo-400">Inicia sesión</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
