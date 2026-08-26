export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
const { name, email, phone, type, message, hp } = req.body || {};
// honeypot: bots fill this hidden field. Log every block so a real enquiry can never vanish without a trace.
if (hp) { console.log('ENQUIRY HONEYPOT BLOCKED', JSON.stringify({ name, email, hp })); return res.status(200).json({ ok: true }); }
if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

// Tertiary record: every enquiry lands in Vercel runtime logs no matter what else happens
console.log('ENQUIRY', JSON.stringify({ name, email, phone, type, message }));

const result = { notified: false, autoreply: false, stored: false };

// Resend sender with retry on rate-limit (429) and transient 5xx errors
const key = process.env.RESEND_API_KEY;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const sendEmail = async (payload, label) => {
if (!key) { console.error('ENQUIRY EMAIL SKIPPED - RESEND_API_KEY not set'); return false; }
for (let attempt = 1; attempt <= 3; attempt++) {
try {
const r = await fetch('https://api.resend.com/emails', {
method: 'POST',
headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
body: JSON.stringify(payload),
});
if (r.ok) return true;
const body = await r.text();
if ((r.status === 429 || r.status >= 500) && attempt < 3) { await wait(attempt * 600); continue; }
console.error('ENQUIRY ' + label + ' FAILED', r.status, body);
return false;
} catch (e) {
if (attempt < 3) { await wait(attempt * 600); continue; }
console.error('ENQUIRY ' + label + ' ERROR', e);
return false;
}
}
return false;
};

const TO = (process.env.ENQUIRY_TO || 'enquiries@epccomponents.ie,Ian_r@eircom.net,colmring2020@gmail.com').split(',');
const FROM = process.env.ENQUIRY_FROM || 'EPC Components <enquiries@epccomponents.ie>';

// 1. NOTIFY — the primary channel. Never gated by storage or anything else.
result.notified = await sendEmail({
from: FROM, to: TO, reply_to: email,
subject: 'New enquiry (' + type + ') — ' + name,
text: 'Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + (phone || '-') + '\nType: ' + type + '\n\n' + message,
}, 'NOTIFY');

// 2. AUTO-REPLY to the enquirer — best effort.
result.autoreply = await sendEmail({
from: FROM, to: [email],
subject: 'We’ve received your enquiry — EPC Components',
text: 'Hi ' + name + ',\n\nThanks for getting in touch with EPC Components. Your enquiry (' + type + ') has been received and we’ll come back to you shortly with a straight answer on scope, programme and price.\n\nIf it’s urgent, ring 083 022 1056.\n\nIan Ring\nEPC Components — Structural Steel Design & Engineering\nDublin · Nationwide',
}, 'AUTOREPLY');

// 3. STORE — best effort archive. Must NEVER block the emails above.
try {
const SB_URL = process.env.SUPABASE_URL || 'https://fawznwtpzswezbpnutjp.supabase.co';
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_x4rsdwkzm0SI5hbELJbmZw_5-T2lFUZ';
const r = await fetch(SB_URL + '/rest/v1/enquiries', {
method: 'POST',
headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
body: JSON.stringify({ name, email, phone, type, message, user_agent: req.headers['user-agent'] || null, notified: result.notified }),
});
result.stored = r.ok;
if (!r.ok) console.error('ENQUIRY STORAGE FAILED', r.status, await r.text());
} catch (e) { console.error('ENQUIRY STORAGE ERROR', e); }

// Success if the enquiry was captured on at least one reliable channel (email to us, or stored).
if (result.notified || result.stored) return res.status(200).json({ ok: true });

// Nothing got through — tell the client so the browser opens the mailto fallback.
console.error('ENQUIRY TOTAL FAILURE', JSON.stringify(result));
return res.status(500).json({ error: 'Delivery failed' });
}
