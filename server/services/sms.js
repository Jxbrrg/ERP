const twilio = require('twilio');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let client = null;
let enabled = false;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  enabled = true;
}

async function sendSMS(to, message) {
  if (!enabled || !client) {
    console.log('[SMS] Twilio no configurado — omitiendo SMS real');
    return { sid: 'mock-' + Date.now(), status: 'mock' };
  }
  try {
    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to
    });
    return { sid: result.sid, status: result.status };
  } catch (err) {
    console.error('[SMS] Error enviando SMS:', err.message);
    throw err;
  }
}

async function send2FACode(phone, code) {
  const msg = `Tu código de verificación Synex es: ${code}. Válido por 5 minutos. No compartas este código.`;
  return sendSMS(phone, msg);
}

module.exports = { sendSMS, send2FACode, enabled };
