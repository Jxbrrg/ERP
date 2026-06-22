const EPAYCO_API = 'https://api.epayco.co/v1';

const cfg = {
  publicKey: process.env.EPAYCO_PUBLIC_KEY || '',
  privateKey: process.env.EPAYCO_PRIVATE_KEY || '',
  test: process.env.EPAYCO_TEST !== 'false',
};

async function apiFetch(path, opts = {}) {
  if (!cfg.privateKey) return { error: 'Epayco no configurado' };
  const res = await fetch(EPAYCO_API + path, {
    method: opts.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.privateKey,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  return res.json();
}

async function createCustomer(name, email, phone, tokenCard) {
  const payload = { name, email, phone, default: true, token_card: tokenCard };
  if (cfg.test) payload.test = true;
  return apiFetch('/customers', { body: payload });
}

async function createSubscription(customerId, planCode, docType, docNumber) {
  const payload = {
    id_plan: planCode,
    customer: customerId,
    doc_type: docType || 'CC',
    doc_number: docNumber || '',
    url_response: process.env.APP_URL || 'https://erp-teal-phi.vercel.app/settings',
    url_confirmation: (process.env.APP_URL || 'https://erp-teal-phi.vercel.app') + '/api/billing/webhook',
    method: 'card',
    invoice: 'recurring',
    no_redirect: false,
  };
  if (cfg.test) payload.test = true;
  return apiFetch('/subscriptions/create', { body: payload });
}

async function cancelSubscription(subscriptionId) {
  return apiFetch('/subscriptions/cancel', { body: { id: subscriptionId } });
}

async function getSubscription(subscriptionId) {
  return apiFetch('/subscriptions/' + subscriptionId, { method: 'GET' });
}

async function getPlan(planCode) {
  return apiFetch('/plans/' + planCode, { method: 'GET' });
}

function verifyWebhookSignature(body, signature) {
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', cfg.privateKey)
    .update(JSON.stringify(body))
    .digest('hex');
  return signature === expected;
}

const DEFAULT_PLANS = [
  { code: 'personal', name: 'Personal', price: 30000, currency: 'COP', interval: 'month', description: 'Para emprendedores independientes', features: ['Panel, Ventas básico', 'Inventario reducido', 'Contabilidad simplificada', '1 usuario · 1 empleado', 'Hasta 40 transacciones/mes', 'Soporte por correo', 'Exportación básica'], active: true },
  { code: 'starter', name: 'Inicial', price: 50000, currency: 'COP', interval: 'month', description: 'Para empezar formalmente', features: ['Todos los módulos', 'Hasta 2 empleados', '100 transacciones/mes', 'Soporte por correo'], active: true },
  { code: 'micro', name: 'Microempresa', price: 79999.98, currency: 'COP', interval: 'month', description: 'Para negocios con equipo pequeño', features: ['Todos los módulos', 'Hasta 6 empleados', '300 transacciones/mes', 'Soporte correo y chat', 'Reportes sencillos'], active: true },
  { code: 'business', name: 'Negocio', price: 150000, currency: 'COP', interval: 'month', description: 'Para empresas en crecimiento', features: ['Todos los módulos', 'Hasta 15 empleados', 'Transacciones ilimitadas', 'Soporte prioritario', 'API Access', 'Exportación completa', 'Reportes avanzados'], active: true },
  { code: 'growth', name: 'Crecimiento Regional', price: 180000, currency: 'COP', interval: 'month', description: 'Para empresas con sucursales', features: ['Todo lo de Negocio', 'Hasta 40 empleados', 'Multisede y almacenes', 'Roles y permisos avanzados', 'Copias de seguridad programadas'], active: true },
  { code: 'enterprise', name: 'Empresarial', price: 230000, currency: 'COP', interval: 'month', description: 'Para grandes organizaciones', features: ['Todo lo de Crecimiento', 'Empleados ilimitados', 'Soporte 24/7', 'Marca propia', 'Gerente de cuenta dedicado', 'On-premise opcional', 'SLA garantizado'], active: true },
  { code: 'corporate', name: 'Corporativo', price: 360000, currency: 'COP', interval: 'month', description: 'Para grupos empresariales', features: ['Todo lo de Empresarial', 'Multiempresa misma cuenta', 'Informes consolidados', 'Personalización total', 'Capacitación presencial', 'Auditorías periódicas'], active: true },
];

module.exports = {
  createCustomer,
  createSubscription,
  cancelSubscription,
  getSubscription,
  getPlan,
  verifyWebhookSignature,
  DEFAULT_PLANS,
  cfg,
};
