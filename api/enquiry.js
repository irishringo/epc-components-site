export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, type, message, company } = req.body || {};
  if (company) return res.status(200).json({ ok: true }); // honeypot
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ error: 'Email not configured yet' });

  const TO = process.env.ENQUIRY_TO || 'info@epccomponents.ie';
  const FROM = process.env.ENQUIRY_FROM || 'EPC Components <enquiries@epccomponents.ie>';

  const send = (payload) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // 1. notify EPC
  const r1 = await send({
    from: FROM, to: [TO], reply_to: email,
    subject: `New enquiry (${type}) — ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nType: ${type}\n\n${message}`,
  });
  if (!r1.ok) return res.status(502).json({ error: 'Send failed' });

  // 2. auto-reply to the enquirer
  await send({
    from: FROM, to: [email],
    subject: 'We’ve received your enquiry — EPC Components',
    text: `Hi ${name},\n\nThanks for getting in touch with EPC Components. Your enquiry (${type}) has been received and we’ll come back to you shortly with a straight answer on scope, programme and price.\n\nIf it’s urgent, reply directly to this email.\n\nIan Ring\nEPC Components — Structural Steel Design & Engineering\nDublin · Nationwide`,
  });

  return res.status(200).json({ ok: true });
}
