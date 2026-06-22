const express = require('express');
const db = require('../db');
const epayco = require('../services/epayco');
const router = express.Router();
const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use('/epayco-checkout', express.urlencoded({ extended: true }));

router.get('/plans', ah(async (req, res) => {
  const plans = await db.all('SELECT * FROM billing_plans WHERE active = 1 ORDER BY price ASC');
  if (plans.length === 0) {
    return res.json(epayco.DEFAULT_PLANS);
  }
  res.json(plans);
}));

router.get('/company/subscription', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const sub = await db.get(`
    SELECT s.*, p.name as plan_name, p.price, p.currency, p.description
    FROM company_subscriptions s
    LEFT JOIN billing_plans p ON s.plan_id = p.id
    WHERE s.company_id = ? ORDER BY s.created_at DESC LIMIT 1
  `, req.companyId);
  if (!sub) {
    const company = await db.get('SELECT plan, plan_expires_at FROM companies WHERE id = ?', req.companyId);
    return res.json({ active: false, companyPlan: company?.plan, expiresAt: company?.plan_expires_at });
  }
  res.json({ active: sub.status === 'active', ...sub });
}));

router.post('/company/subscription', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { planCode, tokenCard, docType, docNumber } = req.body;
  if (!planCode) return res.status(400).json({ error: 'Plan requerido' });

  let plan = await db.get('SELECT * FROM billing_plans WHERE code = ? AND active = 1', planCode);
  if (!plan) {
    plan = epayco.DEFAULT_PLANS.find(p => p.code === planCode);
    if (!plan) return res.status(400).json({ error: 'Plan no válido' });
  }

  const existingSub = await db.get('SELECT * FROM company_subscriptions WHERE company_id = ? AND status IN (\'active\', \'past_due\') LIMIT 1', req.companyId);
  if (existingSub) return res.status(400).json({ error: 'Ya tienes una suscripción activa. Cancélala primero.' });

  if (epayco.cfg.privateKey && tokenCard) {
    const epaycoCust = await epayco.createCustomer(req.user.name, req.user.email, req.body.phone || '', tokenCard);
    if (epaycoCust.error) return res.status(400).json({ error: 'Error al crear cliente en Epayco: ' + epaycoCust.error });

    const epaycoSub = await epayco.createSubscription(epaycoCust.data?.customer?.id || epaycoCust.customerId, planCode, docType, docNumber);
    if (epaycoSub.error) return res.status(400).json({ error: 'Error al crear suscripción en Epayco: ' + epaycoSub.error });

    const subId = require('uuid').v4();
    const now = new Date();
    const periodEnd = new Date(); periodEnd.setMonth(periodEnd.getMonth() + 1);
    await db.run(`INSERT INTO company_subscriptions (id, company_id, plan_id, epayco_customer_id, epayco_subscription_id, status, current_period_start, current_period_end, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      subId, req.companyId, plan.id, epaycoCust.data?.customer?.id, epaycoSub.data?.suscription?.id || epaycoSub.id,
      'active', now.toISOString(), periodEnd.toISOString(), now.toISOString());
    await db.run('UPDATE companies SET plan = ?, plan_expires_at = ? WHERE id = ?', planCode, periodEnd.toISOString(), req.companyId);

    return res.json({ success: true, subscriptionId: subId, epaycoUrl: epaycoSub.data?.url });
  }

  const subId = require('uuid').v4();
  const now = new Date();
  const periodEnd = new Date(); periodEnd.setMonth(periodEnd.getMonth() + 1);
  await db.run(`INSERT INTO company_subscriptions (id, company_id, plan_id, status, current_period_start, current_period_end, created_at)
    VALUES (?,?,?,?,?,?,?)`,
    subId, req.companyId, plan.id, 'active', now.toISOString(), periodEnd.toISOString(), now.toISOString());
  await db.run('UPDATE companies SET plan = ?, plan_expires_at = ? WHERE id = ?', planCode, periodEnd.toISOString(), req.companyId);

  res.json({ success: true, subscriptionId: subId });
}));

router.put('/company/subscription/cancel', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const sub = await db.get('SELECT * FROM company_subscriptions WHERE company_id = ? AND status = ? LIMIT 1', req.companyId, 'active');
  if (!sub) return res.status(404).json({ error: 'No hay suscripción activa' });

  if (sub.epayco_subscription_id && epayco.cfg.privateKey) {
    await epayco.cancelSubscription(sub.epayco_subscription_id).catch(() => {});
  }

  await db.run('UPDATE company_subscriptions SET status = ? WHERE id = ?', 'cancelled', sub.id);
  await db.run('UPDATE companies SET plan = ?, plan_expires_at = NULL WHERE id = ?', 'cancelled', req.companyId);
  res.json({ success: true });
}));

router.get('/company/payments', ah(async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const payments = await db.all('SELECT * FROM payment_history WHERE company_id = ? ORDER BY created_at DESC LIMIT 50', req.companyId);
  res.json(payments);
}));

router.post('/epayco-checkout', ah(async (req, res) => {
  const { company_id, plan_code } = req.query;
  const data = req.body;
  const codResponse = data.x_cod_response || data.cod_response;
  const responseText = data.x_response || data.response;
  const refPayco = data.x_ref_payco || data.ref_payco;
  const amount = data.x_amount || data.amount;
  const currency = data.x_currency_code || data.currency_code || 'COP';
  const isApproved = codResponse == 1 || responseText === 'Aceptada';

  if (!company_id || !plan_code) {
    return res.status(400).send('Missing company_id or plan_code');
  }

  if (!isApproved) {
    return res.send('Payment not approved');
  }

  const existingSub = await db.get('SELECT * FROM company_subscriptions WHERE company_id = ? AND status IN (\'active\', \'past_due\') LIMIT 1', company_id);
  if (existingSub) {
    const payId = require('uuid').v4();
    await db.run(`INSERT INTO payment_history (id, company_id, subscription_id, epayco_ref, amount, currency, status, date, created_at)
      VALUES (?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
      payId, company_id, existingSub.id, refPayco, amount, currency, 'completed');
    const periodEnd = new Date(); periodEnd.setMonth(periodEnd.getMonth() + 1);
    await db.run('UPDATE company_subscriptions SET status = ?, current_period_end = ? WHERE id = ?', 'active', periodEnd.toISOString(), existingSub.id);
    await db.run('UPDATE companies SET plan_expires_at = ? WHERE id = ?', periodEnd.toISOString(), company_id);
    return res.send('Payment recorded for existing subscription');
  }

  let plan = await db.get('SELECT * FROM billing_plans WHERE code = ? AND active = 1', plan_code);
  if (!plan) {
    plan = epayco.DEFAULT_PLANS.find(p => p.code === plan_code);
    if (!plan) return res.status(400).send('Invalid plan');
  }

  const subId = require('uuid').v4();
  const now = new Date();
  const periodEnd = new Date(); periodEnd.setMonth(periodEnd.getMonth() + 1);
  await db.run(`INSERT INTO company_subscriptions (id, company_id, plan_id, epayco_subscription_id, status, current_period_start, current_period_end, created_at)
    VALUES (?,?,?,?,?,?,?,?)`,
    subId, company_id, plan.id, refPayco, 'active', now.toISOString(), periodEnd.toISOString(), now.toISOString());
  await db.run('UPDATE companies SET plan = ?, plan_expires_at = ? WHERE id = ?', plan_code, periodEnd.toISOString(), company_id);
  await db.run(`INSERT INTO payment_history (id, company_id, subscription_id, epayco_ref, amount, currency, status, date, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`,
    require('uuid').v4(), company_id, subId, refPayco, amount, currency, 'completed', now.toISOString(), now.toISOString());

  res.send('ok');
}));

router.post('/webhook', ah(async (req, res) => {
  const event = req.body;
  if (!event) return res.status(400).json({ error: 'No payload' });

  if (epayco.cfg.privateKey) {
    const signature = req.headers['x-signature'] || req.headers['x-epayco-signature'];
    if (signature && !epayco.verifyWebhookSignature(event, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  if (event.type === 'recurring_payment' || event.type === 'subscription_charge') {
    const data = event.data || event.payload || {};
    const subId = data.subscription_id || data.id_subscription;
    const ref = data.reference || data.ref_payco;
    const amount = data.amount || data.valor;
    const currency = data.currency || 'COP';
    const status = data.status === 'approved' || data.status === 'Aceptada' ? 'completed' : 'failed';
    const companyEmail = data.email || data.customer_email;

    const sub = await db.get('SELECT * FROM company_subscriptions WHERE epayco_subscription_id = ?', subId);
    if (sub && status === 'completed') {
      const payId = require('uuid').v4();
      const now = new Date();
      await db.run(`INSERT INTO payment_history (id, company_id, subscription_id, epayco_ref, amount, currency, status, date, created_at)
        VALUES (?,?,?,?,?,?,?,?,?)`,
        payId, sub.company_id, sub.id, ref, amount, currency, status, (data.date || now.toISOString()), now.toISOString());

      const periodEnd = new Date(); periodEnd.setMonth(periodEnd.getMonth() + 1);
      await db.run('UPDATE company_subscriptions SET status = ?, current_period_end = ? WHERE id = ?', 'active', periodEnd.toISOString(), sub.id);
      await db.run('UPDATE companies SET plan_expires_at = ? WHERE id = ?', periodEnd.toISOString(), sub.company_id);
    } else if (sub && status === 'failed') {
      await db.run('UPDATE company_subscriptions SET status = ? WHERE id = ?', 'past_due', sub.id);
    }
  }

  if (event.type === 'subscription_cancelled') {
    const data = event.data || event.payload || {};
    const subId = data.subscription_id || data.id_subscription;
    const sub = await db.get('SELECT * FROM company_subscriptions WHERE epayco_subscription_id = ?', subId);
    if (sub) {
      await db.run('UPDATE company_subscriptions SET status = ? WHERE id = ?', 'cancelled', sub.id);
      await db.run('UPDATE companies SET plan = ?, plan_expires_at = NULL WHERE id = ?', 'cancelled', sub.company_id);
    }
  }

  res.json({ success: true });
}));

router.get('/admin/overview', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const subs = await db.all(`
    SELECT s.*, c.name as company_name, c.slug, p.name as plan_name, p.price
    FROM company_subscriptions s
    JOIN companies c ON s.company_id = c.id
    LEFT JOIN billing_plans p ON s.plan_id = p.id
    WHERE c.id != ?
    ORDER BY s.created_at DESC
  `, req.companyId);

  const totalActive = subs.filter(s => s.status === 'active').length;
  const totalPastDue = subs.filter(s => s.status === 'past_due').length;
  const totalCancelled = subs.filter(s => s.status === 'cancelled').length;
  const monthlyRecurring = subs.filter(s => s.status === 'active').reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  res.json({ subscriptions: subs, stats: { totalActive, totalPastDue, totalCancelled, monthlyRecurring } });
}));

router.get('/admin/plans', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  let plans = await db.all('SELECT * FROM billing_plans ORDER BY price ASC');
  if (plans.length === 0) plans = epayco.DEFAULT_PLANS;
  res.json(plans);
}));

router.put('/admin/plans/:id', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const { name, price, description, features, active } = req.body;
  await db.run('UPDATE billing_plans SET name=?, price=?, description=?, features=?, active=? WHERE id=?',
    name, price, description, features ? JSON.stringify(features) : null, active ? 1 : 0, req.params.id);
  res.json({ success: true });
}));

router.get('/admin/payments', ah(async (req, res) => {
  if (!req.user || req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado' });
  const payments = await db.all(`
    SELECT p.*, c.name as company_name
    FROM payment_history p
    JOIN companies c ON p.company_id = c.id
    ORDER BY p.created_at DESC LIMIT 100
  `);
  res.json(payments);
}));

module.exports = router;
