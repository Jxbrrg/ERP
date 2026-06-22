const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('[Email] SMTP no configurado. Los correos se mostrarán en consola.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email] Simulado: Para=${to} | Asunto=${subject} | HTML=${html.substring(0, 100)}...`);
    return { simulated: true };
  }
  try {
    const info = await t.sendMail({ from: process.env.SMTP_FROM || 'noreply@synex.com', to, subject, html });
    console.log('[Email] Enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Error:', err.message);
    return { error: err.message };
  }
}

module.exports = { sendEmail };
