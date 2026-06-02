import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Only send emails if RESEND_API_KEY is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is not configured in .env');
    console.log(`\n=== MOCK EMAIL (No API Key) ===\nTo: ${to}\nSubject: ${subject}\nBody: ${html}\n===========================\n`);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'HireIQ AI <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    
    if (data.error) {
      console.error('Error from Resend API:', data.error);
      throw new Error('Failed to send email via Resend');
    }
    
    console.log(`Email sent via Resend: ${data.data?.id}`);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
