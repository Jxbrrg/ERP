import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  darkMode: localStorage.getItem('synex-dark') === 'true',
  impersonating: false,

  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),

  getToken: () => localStorage.getItem('synex_token'),

  toggleDark: () => set((state) => {
    const newDark = !state.darkMode;
    localStorage.setItem('synex-dark', newDark);
    document.documentElement.classList.toggle('dark', newDark);
    return { darkMode: newDark };
  }),

  checkAuth: async () => {
    const token = localStorage.getItem('synex_token');
    if (!token) return set({ user: null, loading: false });
    try {
      const res = await fetch(__API_URL__ + '/auth/me', {
        headers: token ? { Authorization: 'Bearer ' + token } : {}
      });
      if (res.ok) {
        const user = await res.json();
        // Fetch company branding if not already in user
        if (user.company_id && !user.company) {
          try {
            const brandRes = await fetch(__API_URL__ + '/api/company/branding', {
              headers: { Authorization: 'Bearer ' + token }
            });
            if (brandRes.ok) {
              const branding = await brandRes.json();
              user.company = { ...user.company, ...branding };
            }
          } catch (e) { console.error('Failed to load branding', e); }
        }
        set({ user, loading: false, impersonating: !!localStorage.getItem('synex_admin_token') });
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
    localStorage.setItem('synex_token', data.token);
    // Fetch branding for the company
    let user = data.user;
    if (user.company_id) {
      try {
        const brandRes = await fetch(__API_URL__ + '/api/company/branding', {
          headers: { Authorization: 'Bearer ' + data.token }
        });
        if (brandRes.ok) {
          const branding = await brandRes.json();
          user.company = { ...user.company, ...branding };
        }
      } catch (e) { console.error('Failed to load branding', e); }
    }
    set({ user, loading: false, impersonating: false });
    return user;
  },

  register: async (companyName, name, email, password, logoBase64, primary_color, secondary_color) => {
    const res = await fetch(__API_URL__ + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName, name, email, password, logoBase64, primary_color, secondary_color })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar');
    }
    const data = await res.json();
    localStorage.setItem('synex_token', data.token);
    let user = data.user;
    if (user.company_id) {
      try {
        const brandRes = await fetch(__API_URL__ + '/api/company/branding', {
          headers: { Authorization: 'Bearer ' + data.token }
        });
        if (brandRes.ok) {
          const branding = await brandRes.json();
          user.company = { ...user.company, ...branding };
        }
      } catch (e) { console.error('Failed to load branding', e); }
    }
    set({ user, loading: false });
    return data;
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
    let user = data.user;
    if (user.company_id) {
      try {
        const brandRes = await fetch(__API_URL__ + '/api/company/branding', {
          headers: { Authorization: 'Bearer ' + data.token }
        });
        if (brandRes.ok) {
          const branding = await brandRes.json();
          user.company = { ...user.company, ...branding };
        }
      } catch (e) { console.error('Failed to load branding', e); }
    }
    set({ user, loading: false, impersonating: true });
    return user;
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
        let user = await res.json();
        if (user.company_id) {
          try {
            const brandRes = await fetch(__API_URL__ + '/api/company/branding', {
              headers: { Authorization: 'Bearer ' + adminToken }
            });
            if (brandRes.ok) {
              const branding = await brandRes.json();
              user.company = { ...user.company, ...branding };
            }
          } catch (e) { console.error('Failed to load branding', e); }
        }
        set({ user, loading: false, impersonating: false });
        return;
      }
    }
    localStorage.removeItem('synex_token');
    set({ user: null, loading: false, impersonating: false });
  },

  logout: async () => {
    localStorage.removeItem('synex_token');
    localStorage.removeItem('synex_admin_token');
    set({ user: null, impersonating: false });
  }
}));

export default useAuthStore;
