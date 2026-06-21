import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, CreditCard, TrendingUp, ArrowLeft, Eye, Image, Palette, Save, X, Trash2, DollarSign, Activity, Ban } from 'lucide-react';
import { apiFetch } from '../api/fetch';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Admin() {
  const navigate = useNavigate();
  const impersonate = useAuthStore(s => s.impersonate);
  const [companies, setCompanies] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState({ logo_url: '', primary_color: '', secondary_color: '' });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');
  const [tab, setTab] = useState('companies');
  const [billingData, setBillingData] = useState(null);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/admin/companies')
      .then(r => r.json())
      .then(data => { setCompanies(data); setLoading(false); })
      .catch(() => setLoading(false));
    apiFetch(__API_URL__ + '/api/billing/admin/overview')
      .then(r => r.json())
      .then(setBillingData)
      .catch(() => {});
  }, []);

  const updatePlan = async (id, plan) => {
    await apiFetch(__API_URL__ + `/api/admin/companies/${id}/plan`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan })
    });
    setCompanies(companies.map(c => c.id === id ? { ...c, plan } : c));
  };

  const deleteCompany = async (id, name) => {
    if (!confirm(`¿Eliminar empresa "${name}"? Esta acción NO se puede deshacer. Se borrarán TODOS sus datos (usuarios, productos, clientes, ventas, etc.).`)) return;
    if (!confirm('¿ESTÁS SEGURO? Escribe "ELIMINAR" en el siguiente prompt para confirmar.')) return;
    const confirmText = prompt('Escribe ELIMINAR para confirmar:');
    if (confirmText !== 'ELIMINAR') {
      alert('Cancelado: texto incorrecto');
      return;
    }
    try {
      await apiFetch(__API_URL__ + `/api/admin/companies/${id}`, { method: 'DELETE' });
      setCompanies(companies.filter(c => c.id !== id));
      alert('Empresa eliminada correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const loadBranding = async (companyId) => {
    setBrandingLoading(true);
    try {
      const res = await apiFetch(__API_URL__ + `/api/admin/companies/${companyId}/branding`);
      const data = await res.json();
      setBranding(data);
      setLogoPreview(data?.logo_url || '');
    } catch (e) {
      console.error('Error loading branding', e);
    }
    setBrandingLoading(false);
  };

  const saveBranding = async (companyId) => {
    setBrandingLoading(true);
    try {
      await apiFetch(__API_URL__ + `/api/admin/companies/${companyId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding)
      });
      setCompanies(companies.map(c => c.id === companyId ? { ...c, ...branding } : c));
      alert('Branding guardado correctamente');
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setBrandingLoading(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('El logo debe ser menor a 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setBranding({ ...branding, logo_url: base64 });
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setBranding({ ...branding, logo_url: '' });
    setLogoPreview('');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Panel de Administración</h1>
          <p className="text-sm text-slate-500">{companies.length} empresas registradas</p>
        </div>
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setTab('companies')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${tab === 'companies' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <Building2 className="h-4 w-4 inline mr-1" /> Empresas
        </button>
        <button onClick={() => setTab('billing')} className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${tab === 'billing' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          <DollarSign className="h-4 w-4 inline mr-1" /> Facturación
        </button>
      </div>

      {tab === 'companies' && (<>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Empresas', value: companies.length, icon: Building2, color: 'text-indigo-500' },
          { label: 'Activas', value: companies.filter(c => c.plan !== 'cancelled').length, icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Prueba', value: companies.filter(c => c.plan === 'trial').length, icon: Users, color: 'text-amber-500' },
          { label: 'Empresarial', value: companies.filter(c => c.plan === 'enterprise').length, icon: CreditCard, color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Usuarios</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Creada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.slug}</td>
                  <td className="px-4 py-3">
                    <select value={c.plan} onChange={e => updatePlan(c.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800">
                      <option value="trial">Prueba</option>
                      <option value="starter">Inicial</option>
                      <option value="business">Negocio</option>
                      <option value="enterprise">Empresarial</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.user_count || 0}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelected(c); loadBranding(c.id); }}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                          Ver
                        </button>
                        <button onClick={() => deleteCompany(c.id, c.name)}
                          className="rounded-lg px-3 py-1 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-1">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => { setSelected(null); setBranding({ logo_url: '', primary_color: '', secondary_color: '' }); setLogoPreview(''); }}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="glass w-full max-w-2xl rounded-3xl p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{selected.name}</h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p><strong>Slug:</strong> {selected.slug}</p>
              <p><strong>Plan:</strong> {selected.plan}</p>
              <p><strong>Usuarios:</strong> {selected.user_count || 0}</p>
              <p><strong>Creada:</strong> {new Date(selected.created_at).toLocaleString()}</p>
            </div>

            <hr className="my-4 border-slate-200 dark:border-slate-700" />

            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Palette className="h-4 w-4" /> Branding de la empresa
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Color Primario</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="color" value={branding.primary_color || '#6366f1'} onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                      className="h-10 w-16 rounded-xl border border-slate-200 bg-white cursor-pointer dark:border-slate-600" />
                    <input type="text" value={branding.primary_color || '#6366f1'} onChange={e => setBranding({ ...branding, primary_color: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Color Secundario</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="color" value={branding.secondary_color || '#06b6d4'} onChange={e => setBranding({ ...branding, secondary_color: e.target.value })}
                      className="h-10 w-16 rounded-xl border border-slate-200 bg-white cursor-pointer dark:border-slate-600" />
                    <input type="text" value={branding.secondary_color || '#06b6d4'} onChange={e => setBranding({ ...branding, secondary_color: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Image className="h-4 w-4" /> Logo
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
                  <p className="mt-1 text-[10px] text-slate-400">PNG, JPG hasta 2MB (se guarda como base64)</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => saveBranding(selected.id)}
                disabled={brandingLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors disabled:opacity-50">
                <Save className="h-4 w-4" /> Guardar branding
              </button>
              <button onClick={() => { loadBranding(selected.id); }}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400">
                Cargar actual
              </button>
              <button onClick={() => { impersonate(selected.id); navigate('/dashboard'); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors">
                <Eye className="h-4 w-4" /> Entrar como admin
              </button>
              <button onClick={() => { setSelected(null); setBranding({ logo_url: '', primary_color: '', secondary_color: '' }); setLogoPreview(''); }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400">
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </>)}

      {tab === 'billing' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Suscripciones activas', value: billingData?.stats?.totalActive || 0, icon: Activity, color: 'text-emerald-500' },
              { label: 'Morosos', value: billingData?.stats?.totalPastDue || 0, icon: Ban, color: 'text-rose-500' },
              { label: 'Canceladas', value: billingData?.stats?.totalCancelled || 0, icon: X, color: 'text-slate-400' },
              { label: 'MRR', value: '$' + ((billingData?.stats?.monthlyRecurring || 0)).toLocaleString('es-CO'), icon: DollarSign, color: 'text-indigo-500' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Precio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Próximo cobro</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Epayco ID</th>
                  </tr>
                </thead>
                <tbody>
                  {(billingData?.subscriptions || []).map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{s.company_name}</td>
                      <td className="px-4 py-3 text-slate-500 capitalize">{s.plan_name || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">${Number(s.price || 0).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          s.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                          s.status === 'past_due' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-700'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('es') : '—'}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">{s.epayco_subscription_id || '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
