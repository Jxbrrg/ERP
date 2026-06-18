import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  darkMode: localStorage.getItem('nexus-dark') === 'true',
  
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  
  toggleDark: () => set((state) => {
    const newDark = !state.darkMode;
    localStorage.setItem('nexus-dark', newDark);
    document.documentElement.classList.toggle('dark', newDark);
    return { darkMode: newDark };
  }),

  checkAuth: async () => {
    try {
      const res = await fetch(__API_URL__ + '/auth/me', { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        set({ user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email) => {
    const res = await fetch(__API_URL__ + '/auth/demo', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const user = await res.json();
    set({ user, loading: false });
    return user;
  },

  logout: async () => {
    await fetch(__API_URL__ + '/auth/logout', { method: 'POST', credentials: 'include' });
    set({ user: null });
  }
}));

export default useAuthStore;
