const crypto = require('crypto');
const { getReadySql } = require('../server/db');
const { requireAdmin } = require('../server/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function makeUnsubscribeToken(email) {
  const secret = process.env.ADMIN_SECRET || '';
  const payload = Buffer.from(String(email).toLowerCase()).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function baseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return host ? `${proto}://${host}` : '';
}

function emailHtml({ subject, message, unsubscribeUrl }) {
  const safeSubject = escapeHtml(subject);
  const safeBody = escapeHtml(message).replace(/\r?\n/g, '<br>');
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f8ff;font-family:Arial,Helvetica,sans-serif;color:#17324d">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f8ff;padding:32px 14px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dce9f8;border-radius:18px;overflow:hidden">
        <tr><td style="padding:24px 28px;background:linear-gradient(135deg,#edf6ff,#f7f5ff);border-bottom:1px solid #e4edf8">
          <div style="font-size:20px;font-weight:800;letter-spacing:.08em;color:#245ea8">AUREX STUDIO</div>
        </td></tr>
        <tr><td style="padding:30px 28px">
          <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#102a43">${safeSubject}</h1>
          <div style="font-size:15px;line-height:1.75;color:#40566d">${safeBody}</div>
        </td></tr>
        <tr><td style="padding:20px 28px;background:#f8fbff;border-top:1px solid #e4edf8;font-size:12px;line-height:1.6;color:#71859a">
          © Aurex Studio
          ${unsubscribeUrl ? `<br><a href="${escapeHtml(unsubscribeUrl)}" style="color:#4d78b8;text-decoration:underline">Abunəlikdən çıx</a>` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendBrevoEmail({ to, subject, message, req }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Aurex Studio';

  const token = makeUnsubscribeToken(to);
  const root = baseUrl(req);
  const unsubscribeUrl = root ? `${root}/api/unsubscribe?token=${encodeURIComponent(token)}` : '';

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: emailHtml({ subject, message, unsubscribeUrl })
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('Brevo send failed:', response.status, detail.slice(0, 300));
    throw new Error(`Brevo HTTP ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    return res.status(503).json({ error: 'E-poçt servisi konfiqurasiya edilməyib.' });
  }

  const mode = req.body?.mode === 'test' ? 'test' : 'all';
  const subject = String(req.body?.subject || '').trim();
  const message = String(req.body?.message || '').trim();
  const testEmail = String(req.body?.testEmail || '').trim().toLowerCase();

  if (!subject || subject.length > 200) {
    return res.status(400).json({ error: 'Mövzu boş ola bilməz və 200 simvoldan uzun olmamalıdır.' });
  }
  if (!message || message.length > 20000) {
    return res.status(400).json({ error: 'Mesaj boş ola bilməz və 20000 simvoldan uzun olmamalıdır.' });
  }

  try {
    if (mode === 'test') {
      if (!EMAIL_RE.test(testEmail) || testEmail.length > 320) {
        return res.status(400).json({ error: 'Düzgün test e-poçt ünvanı daxil edin.' });
      }
      await sendBrevoEmail({ to: testEmail, subject, message, req });
      return res.status(200).json({ ok: true, mode: 'test', sent: 1, failed: 0 });
    }

    const sql = await getReadySql();
    if (!sql) return res.status(503).json({ error: 'Database bağlantısı qurulmayıb.' });

    const subscribers = await sql`SELECT email FROM subscribers WHERE status='active' ORDER BY id ASC`;
    if (!subscribers.length) {
      return res.status(400).json({ error: 'Aktiv abunəçi yoxdur.' });
    }

    let sent = 0;
    let failed = 0;
    const failedEmails = [];
    const batchSize = 8;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((row) => sendBrevoEmail({ to: row.email, subject, message, req }))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          sent += 1;
        } else {
          failed += 1;
          failedEmails.push(batch[index].email);
        }
      });
    }

    return res.status(200).json({
      ok: failed === 0,
      mode: 'all',
      total: subscribers.length,
      sent,
      failed,
      failedEmails: failedEmails.slice(0, 20)
    });
  } catch (error) {
    console.error('send-campaign:', error.message);
    return res.status(500).json({ error: 'E-poçt göndərilməsi zamanı xəta baş verdi.' });
  }
};
