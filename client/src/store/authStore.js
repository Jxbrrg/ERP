import { create } from 'zustand';

const fetchBranding = async (token) => {
  try {
    const brandRes = await fetch(__API_URL__ + '/api/company/branding', {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (brandRes.ok) return await brandRes.json();
  } catch (e) { console.error('Failed to load branding', e); }
  return null;
};

const setUserWithBranding = async (token, userData, set) => {
  let user = userData;
  if (user.company_id) {
    const branding = await fetchBranding(token);
    if (branding) user.company = { ...user.company, ...branding };
  }
  set({ user, loading: false, impersonating: !!localStorage.getItem('synex_admin_token') });
  return user;
};

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  impersonating: false,

  // 2FA state
  requires2fa: false,
  tempToken: null,
  maskedPhone: null,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear2fa: () => set({ requires2fa: false, tempToken: null, maskedPhone: null }),

  getToken: () => localStorage.getItem('synex_token'),

  checkAuth: async () => {
    const token = localStorage.getItem('synex_token');
    if (!token) return set({ user: null, loading: false });
    try {
      const res = await fetch(__API_URL__ + '/auth/me', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      if (res.ok) {
        const user = await res.json();
        await setUserWithBranding(token, user, set);
      } else {
        localStorage.removeItem('synex_token');
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await fetch(__API_URL__ + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Credenciales inválidas');
    }
    const data = await res.json();
    if (data.requires2fa) {
      set({ requires2fa: true, tempToken: data.tempToken, maskedPhone: data.phone });
      return data;
    }
    localStorage.setItem('synex_token', data.token);
    return setUserWithBranding(data.token, data.user, set);
  },

  send2faCode: async () => {
    const state = useAuthStore.getState();
    if (!state.tempToken) throw new Error('No hay sesión pendiente');
    const res = await fetch(__API_URL__ + '/auth/send-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: state.tempToken })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al enviar código');
    }
    return res.json();
  },

  verify2fa: async (code) => {
    const state = useAuthStore.getState();
    if (!state.tempToken) throw new Error('No hay sesión pendiente');
    const res = await fetch(__API_URL__ + '/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: state.tempToken, code })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Código incorrecto');
    }
    const data = await res.json();
    localStorage.setItem('synex_token', data.token);
    set({ requires2fa: false, tempToken: null, maskedPhone: null });
    return setUserWithBranding(data.token, data.user, set);
  },

  register: async (companyName, name, email, password, phone, nit, logoBase64, primary_color, secondary_color) => {
    const res = await fetch(__API_URL__ + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, name, email, password, phone, nit, logoBase64, primary_color, secondary_color })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar');
    }
    const data = await res.json();
    localStorage.setItem('synex_token', data.token);
    return setUserWithBranding(data.token, data.user, set);
  },

  impersonate: async (companyId) => {
    const token = localStorage.getItem('synex_token');
    const res = await fetch(__API_URL__ + '/auth/impersonate/' + companyId, {
      headers: { Authorization: 'Bearer ' + token }
    });
    if (!res.ok) throw new Error('No se pudo acceder a la empresa');
    const data = await res.json();
    localStorage.setItem('synex_admin_token', token);
    localStorage.setItem('synex_token', data.token);
    return setUserWithBranding(data.token, data.user, set);
  },

  stopImpersonating: async () => {
    const adminToken = localStorage.getItem('synex_admin_token');
    if (adminToken) {
      localStorage.setItem('synex_token', adminToken);
      localStorage.removeItem('synex_admin_token');
      const res = await fetch(__API_URL__ + '/auth/me', {
        headers: { Authorization: 'Bearer ' + adminToken }
      });
      if (res.ok) {
        const user = await res.json();
        await setUserWithBranding(adminToken, user, set);
        return;
      }
    }
    localStorage.removeItem('synex_token');
    set({ user: null, loading: false, impersonating: false });
  },

  logout: async () => {
    localStorage.removeItem('synex_token');
    localStorage.removeItem('synex_admin_token');
    set({ user: null, impersonating: false, requires2fa: false, tempToken: null, maskedPhone: null });
  }
}));

export default useAuthStore;
