export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, phone, type, message, company } = req.body || {};
  if (company) return res.status(200).json({ ok: true }); // honeypot
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

  // Tertiary record: every enquiry also lands in Vercel runtime logs
  console.log('ENQUIRY', JSON.stringify({ name, email, phone, type, message }));

  // 1. STORE FIRST — an enquiry must never be lost, even if email fails
  const SB_URL = process.env.SUPABASE_URL || 'https://fawznwtpzswezbpnutjp.supabase.co';
  const SB_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_x4rsdwkzm0SI5hbELJbmZw_5-T2lFUZ';
  let stored = false;
  try {
    const r = await fetch(SB_URL + '/rest/v1/enquiries', {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ name, email, phone, type, message, user_agent: req.headers['user-agent'] || null }),
    });
    stored = r.ok;
    if (!r.ok) console.error('ENQUIRY STORAGE FAILED', r.status, await r.text());
  } catch (e) { console.error('ENQUIRY STORAGE ERROR', e); }

  if (!stored) return res.status(500).json({ error: 'Storage failed' });

  // 2. Email notification — best effort, never blocks the enquiry being recorded
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const TO = (process.env.ENQUIRY_TO || 'Ian_r@eircom.net,colmring2020@gmail.com').split(',');
    const FROM = process.env.ENQUIRY_FROM || 'EPC Components <enquiries@epccomponents.ie>';
    const send = (payload) => fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    try {
      const r1 = await send({
        from: FROM, to: TO, reply_to: email,
        subject: 'New enquiry (' + type + ') — ' + name,
        text: 'Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + (phone || '-') + '\nType: ' + type + '\n\n' + message,
      });
      if (!r1.ok) console.error('ENQUIRY NOTIFY FAILED', r1.status, await r1.text());
      const r2 = await send({
        from: FROM, to: [email],
        subject: 'We’ve received your enquiry — EPC Components',
        text: 'Hi ' + name + ',\n\nThanks for getting in touch with EPC Components. Your enquiry (' + type + ') has been received and we’ll come back to you shortly with a straight answer on scope, programme and price.\n\nIf it’s urgent, ring 083 022 1056.\n\nIan Ring\nEPC Components — Structural Steel Design & Engineering\nDublin · Nationwide',
      });
      if (!r2.ok) console.error('ENQUIRY AUTOREPLY FAILED', r2.status, await r2.text());
    } catch (e) { console.error('ENQUIRY EMAIL ERROR', e); }
  }

  return res.status(200).json({ ok: true });
}
