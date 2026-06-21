import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Key, Copy, Check, RefreshCw, Image, Save, CreditCard, Calendar, XCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../api/fetch';
import useAuthStore from '../store/authStore';

export default function Settings() {
  const { user } = useAuthStore();
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
  const [apiKey, setApiKey] = useState(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/company/branding')
      .then(r => r.json())
      .then(data => {
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.primary_color) setPrimaryColor(data.primary_color);
        if (data.secondary_color) setSecondaryColor(data.secondary_color);
      })
      .catch(() => {});
    apiFetch(__API_URL__ + '/api/company/api-key')
      .then(r => r.json())
      .then(data => setApiKey(data.apiKey))
      .catch(() => {});
    apiFetch(__API_URL__ + '/api/billing/plans')
      .then(r => r.json())
      .then(setPlans)
      .catch(() => {});
    apiFetch(__API_URL__ + '/api/billing/company/subscription')
      .then(r => r.json())
      .then(data => { setSubscription(data); setSubLoading(false); })
      .catch(() => setSubLoading(false));
    apiFetch(__API_URL__ + '/api/billing/company/payments')
      .then(r => r.json())
      .then(setPayments)
      .catch(() => {});
  }, []);

  const cancelSubscription = async () => {
    if (!confirm('¿Cancelar suscripción? Perderás acceso a funciones premium al final del período.')) return;
    if (!confirm('¿Estás seguro? Escribe CANCELAR para confirmar.')) return;
    if (prompt('Escribe CANCELAR para confirmar') !== 'CANCELAR') return alert('Cancelado');
    setCancelling(true);
    await apiFetch(__API_URL__ + '/api/billing/company/subscription/cancel', { method: 'PUT' });
    setSubscription({ ...subscription, status: 'cancelled' });
    setCancelling(false);
  };

  const saveBranding = async () => {
    setSaving(true);
    await apiFetch(__API_URL__ + '/api/company/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: logoUrl, primary_color: primaryColor, secondary_color: secondaryColor })
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateApiKey = async () => {
    setGenerating(true);
    const res = await apiFetch(__API_URL__ + '/api/company/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    setApiKey(data.apiKey);
    setGenerating(false);
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Personaliza tu empresa</p>
      </motion.div>

      {/* Branding */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-indigo-50 p-2.5 dark:bg-indigo-500/10">
            <Palette className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Branding</h2>
            <p className="text-xs text-slate-400">Logo y colores de tu empresa</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Image className="h-4 w-4" /> Logo URL
            </label>
            <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={logoUrl} alt="Logo preview" className="h-10 w-10 rounded-lg object-contain border dark:border-slate-600"
                  onError={e => e.target.style.display = 'none'} />
                <span className="text-xs text-slate-400">Vista previa</span>
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Color primario</label>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600" />
                <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Color secundario</label>
              <div className="flex items-center gap-3">
                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-600" />
                <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          <button onClick={saveBranding} disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>

      {/* API Key */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-500/10">
            <Key className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">API Key</h2>
            <p className="text-xs text-slate-400">Integra Synex con tus sistemas externos</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Tu API Key</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-mono dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {apiKey || '—————————————'}
              </code>
              {apiKey && (
                <button onClick={copyApiKey}
                  className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800 transition-colors">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Usa esta key en el header <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">X-API-Key</code> para autenticar tus requests a <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">/api/external/*</code>
            </p>
          </div>

          <button onClick={generateApiKey} disabled={generating}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generando...' : apiKey ? 'Regenerar API Key' : 'Generar API Key'}
          </button>

          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Ejemplo de uso</h4>
            <pre className="mt-2 overflow-x-auto text-xs text-slate-500 dark:text-slate-400">
{`curl -H "X-API-Key: ${apiKey || 'tu_api_key'}" \\
  ${window.location.origin}/api/external/companies/me`}
            </pre>
          </div>
        </div>
      </motion.div>

      {/* Subscription */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-500/10">
            <CreditCard className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Suscripción</h2>
            <p className="text-xs text-slate-400">Gestiona tu plan y pagos</p>
          </div>
        </div>

        {subLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : subscription?.active ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Plan actual</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">{subscription.plan_name || subscription.companyPlan}</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Activo</span>
            </div>
            {subscription.current_period_end && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Próximo cobro: {new Date(subscription.current_period_end).toLocaleDateString('es')}
              </div>
            )}
            <button onClick={cancelSubscription} disabled={cancelling}
              className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 transition-colors disabled:opacity-50">
              <XCircle className="h-4 w-4" /> {cancelling ? 'Cancelando...' : 'Cancelar suscripción'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">No tienes suscripción activa.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{p.name}</h3>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${Number(p.price).toLocaleString('es-CO')}<span className="text-sm font-normal text-slate-400">/mes</span></p>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  <ul className="mt-3 space-y-1">
                    {(typeof p.features === 'string' ? JSON.parse(p.features) : p.features || []).map((f, j) => (
                      <li key={j} className="text-xs text-slate-500 flex items-center gap-1"><Check className="h-3 w-3 text-emerald-400" />{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">Cuando tengas las credenciales de Epayco, aparecerá la opción de pago aquí.</p>
          </div>
        )}

        {payments.length > 0 && (
          <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Historial de pagos</h3>
            <div className="space-y-2">
              {payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">${Number(p.amount).toLocaleString('es-CO')}</p>
                    <p className="text-xs text-slate-400">{new Date(p.date || p.created_at).toLocaleDateString('es')}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    p.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                  }`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}