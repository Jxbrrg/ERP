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
  { code: 'starter', name: 'Inicial', price: 50000, currency: 'COP', interval: 'month', description: 'Para emprender', features: ['Todos los módulos', 'Hasta 5 empleados', '100 transacciones/mes', 'Soporte email'], active: true },
  { code: 'business', name: 'Negocio', price: 120000, currency: 'COP', interval: 'month', description: 'Para empresas en crecimiento', features: ['Todos los módulos', 'Hasta 15 empleados', 'Transacciones ilimitadas', 'API Access', 'Soporte prioritario', 'Reportes avanzados'], active: true },
  { code: 'enterprise', name: 'Empresarial', price: 230000, currency: 'COP', interval: 'month', description: 'Para grandes organizaciones', features: ['Empleados ilimitados', 'Transacciones ilimitadas', 'Soporte 24/7', 'Personalización de marca', 'Gerente de cuenta', 'On-premise opcional'], active: true },
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
