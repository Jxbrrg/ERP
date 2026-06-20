import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, ArrowLeft, Image, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function Register() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    companyName: '', 
    name: '', 
    email: '', 
    password: '', 
    logoBase64: '',
    primary_color: '#e11d48',   // Rosa fresa (strawberry red)
    secondary_color: '#fde047'  // Amarillo crema (cream yellow)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
      try {
        await register(form.companyName, form.name, form.email, form.password, form.logoBase64, form.primary_color, form.secondary_color);
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
    if (file.size > 2 * 1024 * 1024) {
      setError('El logo debe ser menor a 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setForm({ ...form, logoBase64: base64 });
      setLogoPreview(base64);
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Color Primario</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="color" value={form.primary_color || '#6366f1'} onChange={update('primary_color')}
                      className="h-10 w-16 rounded-xl border border-slate-200 bg-white cursor-pointer dark:border-slate-600" />
                    <input type="text" value={form.primary_color || '#6366f1'} onChange={update('primary_color')}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Color Secundario</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="color" value={form.secondary_color || '#06b6d4'} onChange={update('secondary_color')}
                      className="h-10 w-16 rounded-xl border border-slate-200 bg-white cursor-pointer dark:border-slate-600" />
                    <input type="text" value={form.secondary_color || '#06b6d4'} onChange={update('secondary_color')}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Image className="h-4 w-4" /> Logo de la empresa (opcional, máx 2MB)
                </label>
                <div className="mt-1.5">
                  {logoPreview ? (
                    <div className="flex items-center gap-3">
                      <img src={logoPreview} alt="Preview" className="h-16 w-16 rounded-xl object-cover border border-slate-200" />
                      <button type="button" onClick={removeLogo} className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <input type="file" accept="image/*" onChange={handleLogoChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700 file:px-4 file:py-2" />
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">PNG, JPG hasta 2MB</p>
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
