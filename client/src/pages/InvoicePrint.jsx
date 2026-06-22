import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../api/fetch';
import useAuthStore from '../store/authStore';

export default function InvoicePrint() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [tpl, setTpl] = useState(null);
  const [brand, setBrand] = useState({});
  const printRef = useRef();

  useEffect(() => {
    if (!user) return;
    apiFetch(__API_URL__ + '/api/sales/' + id)
      .then(r => r.json()).then(setOrder).catch(() => {});
    apiFetch(__API_URL__ + '/api/company/invoice-template')
      .then(r => r.json()).then(setTpl).catch(() => {});
    apiFetch(__API_URL__ + '/api/company/branding')
      .then(r => r.json()).then(setBrand).catch(() => {});
  }, [id, user]);

  useEffect(() => {
    if (order && tpl) setTimeout(() => window.print(), 500);
  }, [order, tpl]);

  if (!order || !tpl) return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-slate-400">Cargando factura...</p>
    </div>
  );

  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];
  const subtotal = items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const tax = order.tax || 0;
  const total = subtotal + tax;
  const date = order.created_at ? new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const fs = tpl.font_size || 12;
  const pc = tpl.primary_color || '#6366f1';

  const style = document.createElement('style');
  style.textContent = `@media print { @page { margin: 15mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`;
  document.head.appendChild(style);

  return (
    <div ref={printRef} style={{ fontFamily: tpl.font_family || 'Inter', fontSize: fs }} className="mx-auto max-w-[210mm] bg-white p-8 text-slate-800">
      <div style={{ borderBottom: `2px solid ${pc}`, paddingBottom: 16 }} className="flex items-start justify-between mb-6">
        <div>
          {brand?.name && <h1 style={{ color: pc }} className="text-2xl font-bold">{brand.name}</h1>}
          {tpl.show_nit ? <p className="text-sm text-slate-500 mt-1">NIT: {brand?.nit || user?.company_id || ''}</p> : null}
          {brand?.address && <p className="text-sm text-slate-500">{brand.address}</p>}
          {brand?.phone && <p className="text-sm text-slate-500">{brand.phone}</p>}
        </div>
        <div className="text-right">
          <h2 style={{ color: pc }} className="text-xl font-bold">{tpl.header_text || 'Factura de Venta'}</h2>
          <p className="text-sm text-slate-500 mt-1">No. {order.invoice_number || order.id?.slice(0, 8)}</p>
          <p className="text-sm text-slate-500">{date}</p>
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200 pb-4">
        <h3 style={{ color: pc }} className="text-sm font-semibold uppercase tracking-wide mb-2">Cliente</h3>
        <p className="text-sm font-medium">{order.customer_name || 'Cliente General'}</p>
        {order.customer_document && <p className="text-xs text-slate-500">Doc: {order.customer_document}</p>}
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr style={{ backgroundColor: pc, color: '#fff' }} className="text-sm font-semibold">
            <th className="py-2 px-3 text-left">Producto</th>
            <th className="py-2 px-3 text-right">Cant.</th>
            <th className="py-2 px-3 text-right">Precio</th>
            <th className="py-2 px-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="border-b border-slate-100 text-sm">
              <td className="py-2 px-3">{item.name || item.product_name || 'Producto'}</td>
              <td className="py-2 px-3 text-right">{item.quantity || 1}</td>
              <td className="py-2 px-3 text-right">${(item.price || 0).toLocaleString('es-CO')}</td>
              <td className="py-2 px-3 text-right font-medium">${((item.price || 0) * (item.quantity || 1)).toLocaleString('es-CO')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>${subtotal.toLocaleString('es-CO')}</span></div>
          {tax > 0 && <div className="flex justify-between"><span className="text-slate-500">Impuestos</span><span>${tax.toLocaleString('es-CO')}</span></div>}
          <div style={{ borderTop: `2px solid ${pc}`, color: pc }} className="flex justify-between pt-1 font-bold text-base">
            <span>Total</span><span>${total.toLocaleString('es-CO')}</span>
          </div>
        </div>
      </div>

      {tpl.footer_text && <div className="mb-4 text-xs text-slate-500 text-center border-t border-slate-200 pt-4">{tpl.footer_text}</div>}
      {tpl.terms_text && <div className="text-xs text-slate-400">{tpl.terms_text}</div>}
    </div>
  );
}
