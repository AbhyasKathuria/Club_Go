import nodemailer from 'nodemailer';
import { ENV } from '../config/env';
import { generateQRCodeBuffer } from './qrService';

interface EmailParticipant {
  name: string;
  email: string;
  qrToken: string;
}

interface RegistrationEmailData {
  toEmail: string;
  teamName: string;
  schoolName: string;
  schoolColor: string;
  eventName: string;
  teamToken: string;
  participants: EmailParticipant[];
}

let transporter: nodemailer.Transporter | null = null;

if (ENV.EMAIL_ENABLED && ENV.SMTP_USER && ENV.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS,
    },
  });
  console.log(`📧 Nodemailer configured with host: ${ENV.SMTP_HOST}:${ENV.SMTP_PORT}`);
}

export async function sendRegistrationConfirmationEmail(data: RegistrationEmailData): Promise<boolean> {
  try {
    // Generate QR buffers for inline email attachments
    const teamQRBuffer = await generateQRCodeBuffer(data.teamToken, data.schoolColor);

    const participantAttachments = await Promise.all(
      data.participants.map(async (p, idx) => {
        const qrBuffer = await generateQRCodeBuffer(p.qrToken, data.schoolColor);
        return {
          filename: `pass-${p.name.replace(/\s+/g, '_')}.png`,
          content: qrBuffer,
          cid: `participant_qr_${idx}`,
        };
      })
    );

    const attachments = [
      {
        filename: `team-pass-${data.teamName.replace(/\s+/g, '_')}.png`,
        content: teamQRBuffer,
        cid: 'team_qr',
      },
      ...participantAttachments,
    ];

    const participantListHtml = data.participants
      .map(
        (p, idx) => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center;">
          <div style="flex: 1;">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1e293b;">${p.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">${p.email}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; font-family: monospace; color: #94a3b8;">Pass Token: ${p.qrToken}</p>
          </div>
          <div style="text-align: center; margin-left: 16px;">
            <img src="cid:participant_qr_${idx}" alt="Individual QR" style="width: 90px; height: 90px; border-radius: 6px; border: 1px solid #cbd5e1;" />
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Individual Pass</p>
          </div>
        </div>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Event Pass - ${data.eventName}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with School Color Accent -->
          <div style="background-color: ${data.schoolColor}; padding: 24px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 700;">${data.eventName}</h1>
            <p style="margin: 6px 0 0 0; font-size: 15px; opacity: 0.95;">Registration Confirmed • ${data.schoolName}</p>
          </div>

          <!-- Body -->
          <div style="padding: 24px;">
            <p style="font-size: 16px; color: #334155; margin-top: 0;">
              Hello <strong>${data.teamName}</strong>,
            </p>
            <p style="font-size: 14px; color: #475569; line-height: 1.5;">
              Your registration has been successfully confirmed. Below you will find your official <strong>Team Pass</strong> and each individual member pass.
            </p>

            <!-- Team Pass Card -->
            <div style="background-color: #f1f5f9; border-left: 5px solid ${data.schoolColor}; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0; font-size: 18px; color: #0f172a;">Team QR Pass: ${data.teamName}</h3>
              <p style="margin: 4px 0 16px 0; font-size: 13px; color: #64748b;">Scan this at the entrance for express full-team check-in</p>
              <img src="cid:team_qr" alt="Team QR Pass" style="width: 180px; height: 180px; border-radius: 8px; background: #ffffff; padding: 8px; border: 1px solid #cbd5e1;" />
              <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 14px; color: #334155; font-weight: 600;">Token: ${data.teamToken}</p>
            </div>

            <h3 style="font-size: 16px; color: #1e293b; margin: 24px 0 12px 0;">Individual Member Passes:</h3>
            ${participantListHtml}

            <!-- Instructions -->
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">Important Check-In Instructions:</h4>
              <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e3a8a; line-height: 1.6;">
                <li>Please have your individual QR pass or Team QR pass ready on your mobile screen.</li>
                <li>University volunteers will scan your code at registration desks upon arrival.</li>
                <li>Carry your student university ID card for identity verification.</li>
              </ul>
            </div>

            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
              ClubGo University Event Management System • Automated Confirmation Email
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (transporter) {
      await transporter.sendMail({
        from: ENV.SMTP_FROM,
        to: data.toEmail,
        subject: `Your Event Passes - ${data.teamName} [${data.eventName}]`,
        html: htmlContent,
        attachments,
      });
      console.log(`📧 Real email delivered to ${data.toEmail} with ${attachments.length} passes.`);
      return true;
    } else {
      console.log(`📧 [EMAIL NOTICE] Real SMTP not enabled. Passes generated for ${data.toEmail} (${data.teamName}). Ready for instant download.`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Email dispatch error for ${data.toEmail}:`, error);
    // Non-blocking: we return false so registration still succeeds
    return false;
  }
}
