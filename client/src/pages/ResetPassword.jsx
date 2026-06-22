import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return; }
    setStatus('loading');
    setError('');
    try {
      const r = await fetch(__API_URL__ + '/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); setStatus(null); return; }
      setStatus('success');
      setTimeout(() => navigate('/login'), 2000);
    } catch { setError('Error de conexión'); setStatus(null); }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center max-w-md">
          <XCircle className="mx-auto h-12 w-12 text-rose-400" />
          <h2 className="mt-4 text-xl font-bold text-white">Enlace inválido</h2>
          <p className="mt-2 text-sm text-slate-400">Este enlace no es válido o ha expirado.</p>
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-indigo-500 px-6 py-2 text-sm font-semibold text-white">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8">
        {status === 'success' ? (
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
            <h2 className="mt-4 text-xl font-bold text-white">¡Contraseña actualizada!</h2>
            <p className="mt-2 text-sm text-slate-400">Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <Lock className="mx-auto h-10 w-10 text-indigo-400" />
              <h2 className="mt-3 text-xl font-bold text-white">Nueva contraseña</h2>
              <p className="mt-1 text-sm text-slate-400">Ingresa tu nueva contraseña</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Nueva contraseña" required minLength={6}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Confirmar contraseña" required minLength={6}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
              {error && <p className="text-xs text-rose-400">{error}</p>}
              <button type="submit" disabled={status === 'loading'}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50">
                {status === 'loading' ? 'Guardando...' : 'Restablecer contraseña'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
