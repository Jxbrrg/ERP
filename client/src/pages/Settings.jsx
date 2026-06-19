import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Key, Copy, Check, RefreshCw, Image, Save } from 'lucide-react';
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
  }, []);

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
    </div>
  );
}