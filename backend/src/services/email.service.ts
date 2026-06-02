import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Force IPv4 to fix Render's ENETUNREACH IPv6 routing issue
    family: 4
  });
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Only send emails if SMTP configuration is present
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ SMTP_USER and SMTP_PASS are not configured in .env');
    console.log(`\n=== MOCK EMAIL (No SMTP Config) ===\nTo: ${to}\nSubject: ${subject}\nBody: ${html}\n===========================\n`);
    return;
  }

  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"HireIQ AI" <noreply@hireiq.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
