import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, User } from 'lucide-react';
import DataTable from '../components/DataTable';
import { apiFetch } from '../api/fetch';

export default function Rendimiento() {
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(__API_URL__ + '/api/sales/by-vendedor')
      .then(r => r.json()).then(d => { setReport(d); setLoading(false); });
  }, []);

  const totalVentas = report.reduce((s, r) => s + Number(r.total_sales), 0);
  const totalOrdenes = report.reduce((s, r) => s + Number(r.total_orders), 0);

  const columns = [
    { key: 'employee_name', label: 'Vendedor' },
    { key: 'email', label: 'Email' },
    { key: 'total_orders', label: 'Órdenes', render: r => <span className="font-semibold">{r.total_orders}</span> },
    { key: 'total_sales', label: 'Ventas $', render: r => <span className="font-semibold text-emerald-500">${Number(r.total_sales).toLocaleString('es-CO')}</span> },
    { key: 'total_profit', label: 'Ganancia', render: r => <span className="font-semibold text-indigo-500">${Number(r.total_profit).toLocaleString('es-CO')}</span> },
    { key: 'last_sale', label: 'Última Venta', render: r => r.last_sale ? new Date(r.last_sale).toLocaleDateString('es-CO') : '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rendimiento de Ventas</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{report.length} vendedores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 opacity-80" />
            <div>
              <p className="text-sm font-medium opacity-80">Ventas Totales</p>
              <p className="text-2xl font-bold">${totalVentas.toLocaleString('es-CO')}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 opacity-80" />
            <div>
              <p className="text-sm font-medium opacity-80">Órdenes</p>
              <p className="text-2xl font-bold">{totalOrdenes}</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 opacity-80" />
            <div>
              <p className="text-sm font-medium opacity-80">Vendedores</p>
              <p className="text-2xl font-bold">{report.length}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800/50">
        <DataTable columns={columns} data={report} searchKeys={['employee_name', 'email']} />
      </div>
    </div>
  );
}
