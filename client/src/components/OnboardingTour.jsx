import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const steps = [
  { title: 'Bienvenido a Synex', text: 'Este es tu panel de control. Aquí verás el resumen de tu negocio en tiempo real.', target: '' },
  { title: 'Métricas Clave', text: 'Tus estadísticas más importantes: empleados, productos, órdenes y clientes.', target: '' },
  { title: 'Gráficos', text: 'Explora tendencias de ventas, ingresos mensuales y distribución de órdenes.', target: '' },
];

export default function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('synex_onboarding_done');
    if (!seen) {
      setTimeout(() => setOpen(true), 800);
    }
  }, []);

  const done = () => {
    localStorage.setItem('synex_onboarding_done', '1');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
            className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-slate-500">Paso {step + 1} de {steps.length}</span>
              <button onClick={done} className="rounded-lg p-1 text-slate-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-6 flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === step ? 'bg-indigo-500' : i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              ))}
            </div>
            <h3 className="text-lg font-bold text-white">{steps[step].title}</h3>
            <p className="mt-2 text-sm text-slate-400">{steps[step].text}</p>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30">
                <ArrowLeft className="h-4 w-4" /> Anterior
              </button>
              {step < steps.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all">
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={done}
                  className="flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all">
                  ¡Empezar! <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
