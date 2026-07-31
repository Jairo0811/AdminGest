import QRCode from 'qrcode';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export function buildQuoteVerificationUrl(publicCode: string): string {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  const baseUrl = configuredUrl?.trim()
    ? trimTrailingSlash(configuredUrl.trim())
    : window.location.origin;

  return `${baseUrl}/verify/quote/${encodeURIComponent(publicCode)}`;
}

export function createQuoteVerificationQr(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 220,
  });
}
