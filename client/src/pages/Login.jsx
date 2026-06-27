import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Shield, Smartphone } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/fetch';

export default function Login() {
  const { login, verify2fa, send2faCode, setUser, requires2fa, maskedPhone, clear2fa } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [spPassword, setSpPassword] = useState('');
  const [spMsg, setSpMsg] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [fpEmail, setFpEmail] = useState('');
  const [fpSent, setFpSent] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const codeRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setSpMsg('');
    try {
      const r = await apiFetch(__API_URL__ + '/auth/set-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: spPassword })
      });
      const d = await r.json();
      if (!r.ok) { setSpMsg(d.error); return; }
      setSpMsg('¡Contraseña establecida! Ahora inicia sesión.');
      setTimeout(() => { setShowSetPassword(false); setSpMsg(''); setSpPassword(''); }, 2000);
    } catch { setSpMsg('Error de conexión'); }
    setLoading(false);
  };

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('synex_token', token);
      apiFetch(__API_URL__ + '/auth/me')
        .then(r => r.json())
        .then(user => { setUser(user); navigate('/dashboard'); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (requires2fa && !codeSent) {
      setLoading(false);
      send2faCode().then(() => setCodeSent(true)).catch(e => setError(e.message));
    }
  }, [requires2fa]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (!result || !result.requires2fa) navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setCodeError('');
    if (value && index < 5) codeRefs[index + 1].current?.focus();
    if (value && index === 5) handleVerify2fa(newCode.join(''));
  };

  const handleVerify2fa = async (fullCode) => {
    const c = fullCode || code.join('');
    if (c.length !== 6) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      await verify2fa(c);
      navigate('/dashboard');
    } catch (err) {
      setCodeError(err.message);
      setCode(['', '', '', '', '', '']);
      codeRefs[0].current?.focus();
    }
    setCodeLoading(false);
  };

  const handleResendCode = async () => {
    setCodeSent(false);
    setCode(['', '', '', '', '', '']);
    setCodeError('');
    try {
      await send2faCode();
      setCodeSent(true);
    } catch (e) {
      setCodeError(e.message);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setFpLoading(true); setFpError('');
    try {
      const r = await fetch(__API_URL__ + '/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail })
      });
      if (!r.ok) { const d = await r.json(); setFpError(d.error); return; }
      setFpSent(true);
    } catch { setFpError('Error de conexión'); }
    setFpLoading(false);
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full from-purple-500/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="relative m-auto flex w-full max-w-5xl items-center gap-12 px-4">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden flex-1 lg:block"
        >
          <div className="flex items-center gap-4 mb-6">
            <img src="/Synex.png" alt="Synex" className="h-20 w-20 rounded-2xl" />
            <div>
              <h1 className="text-4xl font-bold text-white">Synex</h1>
              <p className="text-sm text-indigo-300/80">Enterprise Suite</p>
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

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md lg:w-[420px]"
        >
          <div className="glass rounded-3xl p-8 shadow-2xl dark:bg-slate-900/80">
            <div className="mb-8 text-center">
              <img src="/Synex.png" alt="Synex" className="mx-auto mb-4 h-24 w-24 rounded-2xl" />
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Iniciar Sesión</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Accede a tu panel de control empresarial
              </p>
            </div>

            {requires2fa ? (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20">
                    <Smartphone className="h-8 w-8 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">Verificación en dos pasos</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Ingresa el código de 6 dígitos enviado a<br />
                    <span className="font-medium text-indigo-400">{maskedPhone}</span>
                  </p>
                </div>

                {codeError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-600 dark:text-rose-400">
                    {codeError}
                  </motion.div>
                )}

                <div className="mb-6 flex justify-center gap-2">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={codeRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !digit && i > 0) codeRefs[i - 1].current?.focus();
                      }}
                      className="h-14 w-12 rounded-xl border border-slate-200 bg-white text-center text-xl font-bold text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  ))}
                </div>

                <button
                  onClick={() => handleVerify2fa()}
                  disabled={codeLoading || code.join('').length !== 6}
                  className="gradient-primary w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-50"
                >
                  {codeLoading ? 'Verificando...' : 'Verificar código'}
                </button>

                <div className="mt-4 text-center">
                  <button onClick={handleResendCode} disabled={codeLoading}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Reenviar código
                  </button>
                  <span className="mx-2 text-slate-500">·</span>
                  <button onClick={() => { clear2fa(); setError(''); }}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
                    Volver al inicio
                  </button>
                </div>
              </>
            ) : (
              <>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl bg-rose-500/10 px-4 py-3 text-center text-sm text-rose-600 dark:text-rose-400">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@synexsoftware.xyz"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Contraseña</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gradient-primary w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => setShowSetPassword(!showSetPassword)}
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors">
                ¿No puedes iniciar sesión? Establecer contraseña
              </button>
              <button onClick={() => setShowForgot(true)}
                className="ml-3 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Olvidé mi contraseña
              </button>
            </div>

            {showSetPassword && (
              <form onSubmit={handleSetPassword} className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Ingresa tu nueva contraseña para {email}
                </p>
                <input type="password" value={spPassword} onChange={e => setSpPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" required minLength={6} />
                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-70">
                  {loading ? 'Guardando...' : 'Establecer Contraseña'}
                </button>
                {spMsg && <p className="text-center text-xs font-medium" style={{color: spMsg.includes('Error') ? '#ef4444' : '#10b981'}}>{spMsg}</p>}
              </form>
            )}

              <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                ¿No tienes empresa?{' '}
                <Link to="/register" className="font-medium text-indigo-500 hover:text-indigo-400">Crear cuenta</Link>
              </p>
              <p className="mt-4 text-center text-[10px] text-slate-500/60">&copy; {new Date().getFullYear()} Synex by Jhossuar</p>
              </>
            )}
            </div>

            {showForgot && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={() => setShowForgot(false)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
                  onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-white">Restablecer contraseña</h3>
                  {fpSent ? (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-emerald-400">Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.</p>
                      <button onClick={() => setShowForgot(false)} className="mt-4 rounded-xl bg-indigo-500 px-6 py-2 text-sm font-semibold text-white">Cerrar</button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgot} className="mt-4 space-y-4">
                      <p className="text-xs text-slate-400">Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                      <input type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="tu@correo.com" required
                        className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
                      {fpError && <p className="text-xs text-rose-400">{fpError}</p>}
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowForgot(false)} className="flex-1 rounded-xl border border-slate-600 py-2 text-sm text-slate-300 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={fpLoading} className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50">
                          {fpLoading ? 'Enviando...' : 'Enviar enlace'}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              </motion.div>
            )}
        </motion.div>
      </div>
    </div>
  );
}
