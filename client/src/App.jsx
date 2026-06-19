import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Accounting from './pages/Accounting';
import CRM from './pages/CRM';
import Projects from './pages/Projects';
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
      <p className="text-sm text-slate-500 dark:text-slate-400">Cargando SynexERP...</p>
    </div>
  );
}

export default function App() {
  const { checkAuth, darkMode, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
    if (localStorage.getItem('nexus-dark') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/accounting" element={<Accounting />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}
