import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, CheckCircle } from 'lucide-react';

export default function LeadModal({ planName, onClose }) {
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSending(true);
    try {
      await fetch(__API_URL__ + '/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan_name: planName })
      });
      setSent(true);
      setTimeout(() => {
        const msg = encodeURIComponent('Hola, quiero información sobre el plan ' + planName);
        window.open('https://wa.me/573332361814?text=' + msg, '_blank');
        onClose();
      }, 1200);
    } catch {
      const msg = encodeURIComponent('Hola, quiero información sobre el plan ' + planName);
      window.open('https://wa.me/573332361814?text=' + msg, '_blank');
      onClose();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md rounded-2xl bg-slate-900 p-6 shadow-2xl border border-slate-700"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>

        {sent ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle className="h-12 w-12 text-emerald-400 mb-3" />
            <p className="text-lg font-semibold text-white">¡Gracias!</p>
            <p className="text-sm text-slate-400 mt-1">Te redirigimos a WhatsApp...</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-white">Solicitar plan {planName}</h3>
            <p className="text-sm text-slate-400 mt-1 mb-6">Déjanos tus datos y te contactamos</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Tu nombre *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500" required />
              <input type="text" placeholder="Empresa" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500" />
              <input type="tel" placeholder="WhatsApp *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500" required />
              <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 placeholder-slate-500" />
              <button type="submit" disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-2.5 text-sm font-semibold text-white hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50">
                <Send className="h-4 w-4" /> {sending ? 'Enviando...' : 'Enviar y abrir WhatsApp'}
              </button>
              <p className="text-center text-[10px] text-slate-500">Tus datos se guardan y te redirigimos a WhatsApp</p>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
