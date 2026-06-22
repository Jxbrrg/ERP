import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Key, Copy, Check, RefreshCw, Image, Save, CreditCard, Calendar, XCircle, Loader2, Download, Upload, Trash2, Plus, ShoppingCart, FileText, Bell } from 'lucide-react';
import { apiFetch } from '../api/fetch';
import useAuthStore from '../store/authStore';
import { requestNotifyPermission, sendLocalNotification } from '../utils/notifications';

export default function Settings() {
  const { user } = useAuthStore();
  const [epaycoReady, setEpaycoReady] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
  const [apiKeys, setApiKeys] = useState([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);
  const [invoiceTpl, setInvoiceTpl] = useState(null);
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceSaved, setInvoiceSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subLoading, setSubLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.epayco.co/checkout.js';
    script.async = true;
    script.onload = () => setEpaycoReady(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/company/branding')
      .then(r => r.json())
      .then(data => {
        if (data.logo_url) setLogoUrl(data.logo_url);
        if (data.primary_color) setPrimaryColor(data.primary_color);
        if (data.secondary_color) setSecondaryColor(data.secondary_color);
      })
      .catch(() => {});
    apiFetch(__API_URL__ + '/api/api-keys')
      .then(r => r.json())
      .then(setApiKeys)
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
    apiFetch(__API_URL__ + '/api/company/invoice-template')
      .then(r => r.json())
      .then(setInvoiceTpl)
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

  const openCheckout = (plan) => {
    if (!window.ePayco) return;
    const handler = window.ePayco.checkout.configure({
      key: '5f0d2827af215bfe4fcc5ebe29274a3f',
      test: true,
    });
    handler.open({
      amount: Number(plan.price),
      tax: '0.00',
      tax_ico: '0.00',
      tax_base: Number(plan.price),
      name: plan.name,
      description: plan.name,
      currency: 'cop',
      country: 'CO',
      external: 'false',
      response: window.location.origin + '/settings?payment=success',
      confirmation: window.location.origin + '/api/billing/epayco-checkout?company_id=' + (user?.companyId || user?.company?.id) + '&plan_code=' + plan.code,
    });
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

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    const res = await apiFetch(__API_URL__ + '/api/api-keys', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName })
    });
    const data = await res.json();
    setNewlyCreatedKey(data.key);
    setApiKeys([data, ...apiKeys]);
    setShowNewKey(false);
    setNewKeyName('');
    setGenerating(false);
  };

  const deleteApiKey = async (id) => {
    if (!confirm('¿Eliminar esta API key? Las integraciones que la usen dejarán de funcionar.')) return;
    await apiFetch(__API_URL__ + '/api/api-keys/' + id, { method: 'DELETE' });
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };

  const copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const r = await apiFetch(__API_URL__ + '/api/company/backup');
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus('ok');
    } catch { setBackupStatus('error'); }
    setBackupLoading(false);
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const handleRestore = async () => {
    const file = document.createElement('input');
    file.type = 'file'; file.accept = '.json';
    file.onchange = async () => {
      const f = file.files[0]; if (!f) return;
      if (!confirm('¿Restaurar backup? Los datos actuales serán reemplazados.')) return;
      if (prompt('Escribe RESTAURAR para confirmar') !== 'RESTAURAR') return alert('Cancelado');
      setRestoreLoading(true);
      try {
        const text = await f.text();
        const data = JSON.parse(text);
        const r = await apiFetch(__API_URL__ + '/api/company/restore', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await r.json();
        if (result.success) {
          setBackupStatus('restored');
          setTimeout(() => { window.location.reload(); }, 1500);
        } else throw new Error();
      } catch { setBackupStatus('error'); }
      setRestoreLoading(false);
      setTimeout(() => setBackupStatus(null), 3000);
    };
    file.click();
  };

  const handleInvoiceSave = async () => {
    setInvoiceSaving(true);
    try {
      const r = await apiFetch(__API_URL__ + '/api/company/invoice-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceTpl)
      });
      const data = await r.json();
      setInvoiceTpl(data);
      setInvoiceSaved(true);
    } catch {}
    setInvoiceSaving(false);
    setTimeout(() => setInvoiceSaved(false), 3000);
  };

  const updateTpl = (key, val) => setInvoiceTpl(prev => ({ ...prev, [key]: val }));

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

      {/* API Keys */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-500/10">
            <Key className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">API Keys</h2>
            <p className="text-xs text-slate-400">Integra Synex con tus sistemas externos</p>
          </div>
          <button onClick={() => setShowNewKey(true)}
            className="flex items-center gap-1 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Nueva Key
          </button>
        </div>

        {newlyCreatedKey && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-medium text-emerald-400">¡API Key creada!</p>
            <p className="mt-1 text-xs text-slate-400">Cópiala ahora, no la podrás ver de nuevo:</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg bg-slate-800 px-3 py-2 text-sm font-mono text-emerald-300">{newlyCreatedKey}</code>
              <button onClick={() => { navigator.clipboard.writeText(newlyCreatedKey); setCopied(newlyCreatedKey); }}
                className="rounded-lg border border-slate-600 p-2 text-slate-400 hover:text-white transition-colors">
                {copied === newlyCreatedKey ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button onClick={() => setNewlyCreatedKey(null)} className="mt-2 text-xs text-slate-400 hover:text-white">Descartar</button>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No tienes API keys. Crea una para empezar.</p>
        ) : (
          <div className="space-y-3">
            {apiKeys.map(k => (
              <div key={k.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{k.name}</p>
                  <code className="text-xs text-slate-400 font-mono truncate block">{k.key}</code>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {k.last_used_at ? `Último uso: ${new Date(k.last_used_at).toLocaleDateString('es')}` : 'Sin uso'} · Creada: {new Date(k.created_at).toLocaleDateString('es')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyApiKey(k.key)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {copied === k.key ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteApiKey(k.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Endpoints disponibles</h4>
          <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <p><code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">GET /api/v1/products</code> — Listar productos</p>
            <p><code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">GET /api/v1/customers</code> — Listar clientes</p>
            <p><code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">GET /api/v1/orders</code> — Listar órdenes</p>
            <p className="mt-2">Usa el header <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">X-API-Key</code> para autenticar.</p>
          </div>
        </div>

        {showNewKey && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => { setShowNewKey(false); setNewKeyName(''); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white">Nueva API Key</h3>
              <p className="mt-1 text-xs text-slate-400">Asigna un nombre para identificar esta key</p>
              <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)}
                placeholder="Ej: Integración Shopify" autoFocus
                className="mt-4 w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
              <div className="mt-4 flex gap-3">
                <button onClick={() => { setShowNewKey(false); setNewKeyName(''); }}
                  className="flex-1 rounded-xl border border-slate-600 py-2 text-sm text-slate-300 hover:text-white transition-colors">Cancelar</button>
                <button onClick={createApiKey} disabled={generating || !newKeyName.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-50">
                  {generating ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
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
            <p className="text-sm text-slate-500">Elige un plan para empezar a facturar:</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((p, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 flex flex-col">
                  <h3 className="font-semibold text-slate-800 dark:text-white">{p.name}</h3>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${Number(p.price).toLocaleString('es-CO')}<span className="text-sm font-normal text-slate-400">/mes</span></p>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  <ul className="mt-3 space-y-1 flex-1">
                    {(typeof p.features === 'string' ? JSON.parse(p.features) : p.features || []).map((f, j) => (
                      <li key={j} className="text-xs text-slate-500 flex items-center gap-1"><Check className="h-3 w-3 text-emerald-400 shrink-0" />{f}</li>
                    ))}
                  </ul>
                  {Number(p.price) > 200000 ? (
                    <a href="https://wa.me/573332361814?text=Quiero%20el%20plan%20${encodeURIComponent(p.name)}"
                      target="_blank" rel="noopener noreferrer"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-all">
                      Contactar por WhatsApp
                    </a>
                  ) : (
                  <button onClick={() => openCheckout(p)}
                    disabled={!epaycoReady}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                    <ShoppingCart className="h-4 w-4" /> Contratar Plan
                  </button>
                  )}
                </div>
              ))}
            </div>
            {!epaycoReady && (
              <p className="text-xs text-slate-400 animate-pulse">Cargando pasarela de pago...</p>
            )}
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

      {/* Notificaciones Push */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-rose-50 p-2.5 dark:bg-rose-500/10">
            <Bell className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Notificaciones del Navegador</h2>
            <p className="text-xs text-slate-400">Recibe alertas en el escritorio sobre nuevos pedidos, pagos y más</p>
          </div>
        </div>
        <button onClick={async () => {
          const ok = await requestNotifyPermission();
          if (ok) { sendLocalNotification('¡Notificaciones activadas!', { body: 'Recibirás alertas en tiempo real.' }); }
        }}
          className="flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-600 transition-colors">
          <Bell className="h-4 w-4" />
          {'Notification' in window && Notification.permission === 'granted' ? 'Notificaciones Activadas' : 'Activar Notificaciones'}
        </button>
      </motion.div>

      {/* Plantilla de Factura */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-violet-50 p-2.5 dark:bg-violet-500/10">
            <FileText className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Plantilla de Factura / Recibo</h2>
            <p className="text-xs text-slate-400">Personaliza el diseño de tus facturas y recibos</p>
          </div>
        </div>
        {invoiceTpl && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Texto del encabezado</label>
                <input value={invoiceTpl.header_text || ''} onChange={e => updateTpl('header_text', e.target.value)}
                  placeholder="Ej: Factura de Venta" maxLength={200}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Color principal</label>
                <input type="color" value={invoiceTpl.primary_color || '#6366f1'} onChange={e => updateTpl('primary_color', e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Texto del pie de página</label>
              <input value={invoiceTpl.footer_text || ''} onChange={e => updateTpl('footer_text', e.target.value)}
                placeholder="Ej: Gracias por su compra" maxLength={300}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Términos y condiciones</label>
              <textarea value={invoiceTpl.terms_text || ''} onChange={e => updateTpl('terms_text', e.target.value)}
                placeholder="Ej: Las facturas vencen a 30 días..." maxLength={500} rows={2}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white resize-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Fuente</label>
                <select value={invoiceTpl.font_family || 'Inter'} onChange={e => updateTpl('font_family', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tamaño (px)</label>
                <input type="number" value={invoiceTpl.font_size || 12} onChange={e => updateTpl('font_size', Number(e.target.value))}
                  min={8} max={24}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex items-end gap-4 pb-1">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={!!invoiceTpl.show_logo} onChange={e => updateTpl('show_logo', e.target.checked ? 1 : 0)} />
                  Logo
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={!!invoiceTpl.show_nit} onChange={e => updateTpl('show_nit', e.target.checked ? 1 : 0)} />
                  NIT
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleInvoiceSave} disabled={invoiceSaving}
                className="flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-600 transition-colors disabled:opacity-50">
                <Save className="h-4 w-4" />
                {invoiceSaving ? 'Guardando...' : 'Guardar Plantilla'}
              </button>
              {invoiceSaved && <span className="text-sm text-emerald-500">✓ Guardado</span>}
            </div>
          </div>
        )}
      </motion.div>

      {/* Backup & Restore */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl bg-blue-50 p-2.5 dark:bg-blue-500/10">
            <Download className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Backup & Restaurar</h2>
            <p className="text-xs text-slate-400">Exporta o importa todos los datos de tu empresa</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleBackup} disabled={backupLoading}
            className="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-600 transition-colors disabled:opacity-50">
            <Download className={`h-4 w-4 ${backupLoading ? 'animate-bounce' : ''}`} />
            {backupLoading ? 'Exportando...' : 'Exportar Backup'}
          </button>
          <button onClick={handleRestore} disabled={restoreLoading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors disabled:opacity-50">
            <Upload className={`h-4 w-4 ${restoreLoading ? 'animate-bounce' : ''}`} />
            {restoreLoading ? 'Restaurando...' : 'Restaurar Backup'}
          </button>
          {backupStatus === 'ok' && <span className="inline-flex items-center text-sm text-emerald-500">✓ Backup descargado</span>}
          {backupStatus === 'restored' && <span className="inline-flex items-center text-sm text-emerald-500">✓ Datos restaurados. Recargando...</span>}
          {backupStatus === 'error' && <span className="inline-flex items-center text-sm text-rose-500">✗ Error al procesar</span>}
        </div>
        <p className="mt-4 text-xs text-slate-400">El backup incluye: empleados, productos, clientes, órdenes, transacciones, proyectos y tareas. No incluye configuración de branding ni suscripción.</p>
      </motion.div>
    </div>
  );
}