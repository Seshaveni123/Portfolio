import nodemailer from 'nodemailer';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const emailValid = email => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || '').trim());

const emailConfigured = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  return Boolean(
    process.env.SMTP_HOST || 'smtp.gmail.com'
  ) && Boolean(port) && Boolean(process.env.EMAIL_USER || process.env.SMTP_USER) && Boolean(process.env.EMAIL_PASS || process.env.SMTP_PASS);
};

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid request body.' });
  }

  const name = String(payload.name || '').trim();
  const email = String(payload.email || '').trim();
  const subject = String(payload.subject || '').trim() || 'Portfolio contact form message';
  const message = String(payload.message || '').trim();

  if (name.length < 2 || name.length > 80) {
    return json(400, { error: 'Name must be 2-80 characters.' });
  }
  if (!emailValid(email)) {
    return json(400, { error: 'Invalid email address.' });
  }
  if (subject.length > 100) {
    return json(400, { error: 'Subject must be 100 characters or fewer.' });
  }
  if (message.length < 10 || message.length > 1200) {
    return json(400, { error: 'Message must be 10-1200 characters.' });
  }
  if (!emailConfigured()) {
    return json(500, { error: 'Email service is not configured.' });
  }

  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
  const SMTP_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || SMTP_PORT === 465;
  const EMAIL_USER = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const EMAIL_PASS = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  const EMAIL_TO = process.env.EMAIL_TO || EMAIL_USER;
  const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <h2>New portfolio contact message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    return json(200, { ok: true, message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Email send error:', error);
    return json(500, { error: 'Failed to send email. Please try again.' });
  }
}
