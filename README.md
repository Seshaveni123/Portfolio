# Veeramreddy Seshaveni Portfolio

Personal portfolio site with a Node.js backend for the contact form.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Email setup

Create a `.env` file from `.env.example` and add your real Gmail app password.

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=your-email@gmail.com
```

For Gmail:

1. Turn on 2-Step Verification.
2. Create a Mail app password at `https://myaccount.google.com/apppasswords`.
3. Put that 16-character password in `EMAIL_PASS`.

## Notes

- The contact form posts to `/send-email`.
- The server health endpoint is `/api/health`.
- `EMAIL_TO` is the inbox that receives portfolio messages.
