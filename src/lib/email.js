import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = 'BOXX Thailand <noreply@boxxthailand.com>'

/**
 * Send a booking confirmation email
 */
export async function sendBookingConfirmation({ to, name, className, instructor, date, time }) {
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Booking Confirmed — ${className}`,
    html: emailTemplate({
      heading: 'You\'re In',
      body: `
        <p>Hey ${name || 'there'},</p>
        <p>Your spot is confirmed.</p>
        <table style="margin: 24px 0; border-collapse: collapse;">
          <tr><td style="padding: 6px 16px 6px 0; color: #888;">Class</td><td style="padding: 6px 0; font-weight: 600;">${className}</td></tr>
          <tr><td style="padding: 6px 16px 6px 0; color: #888;">Coach</td><td style="padding: 6px 0;">${instructor || 'TBA'}</td></tr>
          <tr><td style="padding: 6px 16px 6px 0; color: #888;">Date</td><td style="padding: 6px 0;">${date}</td></tr>
          <tr><td style="padding: 6px 16px 6px 0; color: #888;">Time</td><td style="padding: 6px 0;">${time}</td></tr>
        </table>
        <p style="color: #888; font-size: 14px;">See you at 89/2 Bumruang Road, Wat Ket, Chiang Mai.</p>
      `,
    }),
  })
}

/**
 * Send a class reminder (1 hour before)
 */
export async function sendClassReminder({ to, name, className, instructor, time }) {
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Reminder: ${className} in 1 hour`,
    html: emailTemplate({
      heading: 'Class in 1 Hour',
      body: `
        <p>Hey ${name || 'there'},</p>
        <p>Just a heads up — <strong>${className}</strong>${instructor ? ` with ${instructor}` : ''} starts at <strong>${time}</strong>.</p>
        <p style="color: #888; font-size: 14px;">Arrive 5–10 minutes early. Don't forget your wraps and water.</p>
      `,
    }),
  })
}

/**
 * Send a waitlist promotion notification
 */
export async function sendWaitlistPromotion({ to, name, className, date, time }) {
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Spot Available — ${className}`,
    html: emailTemplate({
      heading: 'You\'re Off the Waitlist',
      body: `
        <p>Hey ${name || 'there'},</p>
        <p>A spot opened up in <strong>${className}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>
        <p>You've been automatically booked in. A credit has been deducted from your pack.</p>
        <p style="color: #888; font-size: 14px;">If you can no longer make it, cancel from your dashboard before the class starts.</p>
      `,
    }),
  })
}

/**
 * Send a credit expiry warning
 */
export async function sendCreditExpiryWarning({ to, name, packName, creditsRemaining, expiresAt }) {
  if (!resend) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Credits Expiring Soon — ${packName}`,
    html: emailTemplate({
      heading: 'Credits Expiring',
      body: `
        <p>Hey ${name || 'there'},</p>
        <p>Your <strong>${packName}</strong> pack has <strong>${creditsRemaining} credit${creditsRemaining !== 1 ? 's' : ''}</strong> remaining and expires on <strong>${expiresAt}</strong>.</p>
        <p>Book a class before they expire!</p>
      `,
    }),
  })
}

/**
 * Shared email template wrapper
 */
function emailTemplate({ heading, body }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <div style="text-align:center;margin-bottom:40px;">
      <span style="font-size:28px;font-weight:800;color:#f5f5f5;letter-spacing:0.05em;">BOXX</span>
    </div>
    <div style="background:#111;border:1px solid #1a1a1a;padding:40px 32px;">
      <h1 style="font-size:24px;font-weight:700;color:#c8a750;margin:0 0 24px 0;">${heading}</h1>
      <div style="color:#f5f5f5;font-size:15px;line-height:1.7;">
        ${body}
      </div>
    </div>
    <div style="text-align:center;margin-top:32px;">
      <p style="color:#555;font-size:12px;">BOXX Boxing Studio · Chiang Mai, Thailand</p>
      <p style="color:#444;font-size:11px;margin-top:8px;">
        <a href="https://boxxthailand.com" style="color:#c8a750;text-decoration:none;">boxxthailand.com</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
