/**
 * Portfolio backend (Node.js + Express)
 * Contact form -> email via Nodemailer (SMTP)
 */

import express from 'express';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const allowedOrigins = new Set([
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  `http://${HOST}:${PORT}`,
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
]);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Relax CSP for development/CDNs
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'self' 'unsafe-inline'; img-src * 'self' data: blob:; connect-src * 'self' data: blob:; font-src * 'self' data:; worker-src * 'self' blob:;");
  next();
});

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || SMTP_PORT === 465;
const EMAIL_USER = process.env.EMAIL_USER || process.env.SMTP_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
const EMAIL_TO = process.env.EMAIL_TO || EMAIL_USER;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const SMTP_CONNECTION_TIMEOUT = Number(process.env.SMTP_CONNECTION_TIMEOUT || 10000);
const SMTP_GREETING_TIMEOUT = Number(process.env.SMTP_GREETING_TIMEOUT || 10000);
const SMTP_SOCKET_TIMEOUT = Number(process.env.SMTP_SOCKET_TIMEOUT || 10000);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.static(path.join(__dirname), { maxAge: 0, etag: false }));

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) =>
    res.status(429).json({ error: 'Too many messages sent. Please try again in 15 minutes.' }),
});

const emailConfigured = () => Boolean(SMTP_HOST && SMTP_PORT && EMAIL_USER && EMAIL_PASS && EMAIL_TO);

const transporter = emailConfigured()
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      connectionTimeout: SMTP_CONNECTION_TIMEOUT,
      greetingTimeout: SMTP_GREETING_TIMEOUT,
      socketTimeout: SMTP_SOCKET_TIMEOUT,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })
  : null;

const mailerState = {
  ready: false,
  checkedAt: null,
  error: null,
};

const verifyMailer = async () => {
  if (!emailConfigured() || !transporter) {
    mailerState.ready = false;
    mailerState.checkedAt = new Date().toISOString();
    mailerState.error = 'Email service is not configured.';
    return false;
  }

  try {
    await transporter.verify();
    mailerState.ready = true;
    mailerState.checkedAt = new Date().toISOString();
    mailerState.error = null;
    return true;
  } catch (error) {
    mailerState.ready = false;
    mailerState.checkedAt = new Date().toISOString();
    mailerState.error = error?.message || 'SMTP verification failed.';
    console.error('SMTP verify error:', error);
    return false;
  }
};

app.post(
  '/send-email',
  contactLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters.'),
    body('email').trim().isEmail().normalizeEmail().withMessage('Invalid email address.'),
    body('subject')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 100 })
      .withMessage('Subject must be 100 characters or fewer.'),
    body('message').trim().isLength({ min: 10, max: 1200 }).withMessage('Message must be 10-1200 characters.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const subject = String(req.body.subject || '').trim() || 'Portfolio contact form message';
    const message = String(req.body.message || '').trim();

    if (!emailConfigured() || !transporter) {
      console.error('Email not configured. Missing one of: SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_TO');
      return res.status(500).json({ error: 'Email service is not configured.' });
    }

    const mailerReady = await verifyMailer();
    if (!mailerReady) {
      return res.status(503).json({
        error: 'Email service is temporarily unavailable. Please use the direct email link for now.',
      });
    }

    const escapedMessage = message.replace(/\n/g, '<br>');

    const mailOptions = {
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: email,
      subject: `[Portfolio] ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
`,
      html: `
        <h2>New portfolio contact message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${escapedMessage}</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      mailerState.ready = true;
      mailerState.checkedAt = new Date().toISOString();
      mailerState.error = null;
      console.log('Email sent successfully');
      return res.json({ ok: true, message: 'Message sent successfully.' });
    } catch (err) {
      console.error('Email send error:', err);
      mailerState.ready = false;
      mailerState.checkedAt = new Date().toISOString();
      mailerState.error = err?.message || 'Email send failed.';
      return res.status(503).json({
        error: 'Email service is temporarily unavailable. Please use the direct email link for now.',
      });
    }
  }
);

app.get('/api/health', (_, res) =>
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      host: HOST,
      port: PORT,
    },
    emailConfigured: emailConfigured(),
    emailReady: mailerState.ready,
    mailer: {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      to: EMAIL_TO || null,
      checkedAt: mailerState.checkedAt,
      error: mailerState.error,
    },
  })
);

app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`Health check: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api/health`);
  console.log(`POST http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/send-email`);
  verifyMailer();
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or change PORT in .env.`);
  } else {
    console.error('Server failed to start:', error);
  }
  process.exit(1);
});

export default app;
