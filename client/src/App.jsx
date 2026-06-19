import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';
import CeoDashboard from './pages/CeoDashboard';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Accounting from './pages/Accounting';
import CRM from './pages/CRM';
import Projects from './pages/Projects';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader /></div>;
  return user ? children : <Navigate to="/login" />;
}

function Loader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      <p className="text-sm text-slate-500 dark:text-slate-400">Cargando Synex...</p>
    </div>
  );
}

export default function App() {
  const { checkAuth, darkMode, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
    if (localStorage.getItem('synex-dark') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={user?.role === 'superadmin' ? <CeoDashboard /> : <Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/accounting" element={<Accounting />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}
