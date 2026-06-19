import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  darkMode: localStorage.getItem('synex-dark') === 'true',

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
        set({ user, loading: false });
      } else {
        localStorage.removeItem('synex_token');
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email) => {
    const res = await fetch(__API_URL__ + '/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const data = await res.json();
    localStorage.setItem('synex_token', data.token);
    set({ user: data.user, loading: false });
    return data.user;
  },

  logout: async () => {
    localStorage.removeItem('synex_token');
    set({ user: null });
  }
}));

export default useAuthStore;
