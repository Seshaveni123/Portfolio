const emailConfigured = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  return Boolean(
    process.env.SMTP_HOST || 'smtp.gmail.com'
  ) && Boolean(port) && Boolean(process.env.EMAIL_USER || process.env.SMTP_USER) && Boolean(process.env.EMAIL_PASS || process.env.SMTP_PASS);
};

export async function handler() {
  const SMTP_PORT = Number(process.env.SMTP_PORT || 587);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      emailConfigured: emailConfigured(),
      mailer: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: SMTP_PORT,
        secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || SMTP_PORT === 465,
        to: process.env.EMAIL_TO || process.env.EMAIL_USER || process.env.SMTP_USER || null,
      },
    }),
  };
}
