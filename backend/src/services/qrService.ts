import QRCode from 'qrcode';
import crypto from 'crypto';

export async function generateQRCodeDataUrl(
  payload: string,
  colorHex: string = '#000000'
): Promise<string> {
  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 350,
    color: {
      dark: colorHex,
      light: '#FFFFFF',
    },
  });
}

export async function generateQRCodeBuffer(
  payload: string,
  colorHex: string = '#000000'
): Promise<Buffer> {
  return await QRCode.toBuffer(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 350,
    color: {
      dark: colorHex,
      light: '#FFFFFF',
    },
  });
}

export function generateTeamToken(schoolCode: string): string {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TEAM-${schoolCode.toUpperCase()}-${rand}`;
}

export function generateParticipantToken(): string {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PART-${rand}`;
}
