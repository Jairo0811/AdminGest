import QRCode from 'qrcode';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const QR_SIZE = 320;
const LOGO_CONTAINER_SIZE = 72;
const LOGO_PADDING = 8;
const LOGO_RADIUS = 12;

export function buildQuoteVerificationUrl(publicCode: string): string {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  const baseUrl = configuredUrl?.trim()
    ? trimTrailingSlash(configuredUrl.trim())
    : window.location.origin;

  return `${baseUrl}/verify/quote/${encodeURIComponent(publicCode)}`;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No fue posible cargar el logo de AdminGest para el QR.'));
    image.src = source;
  });
}

function drawRoundedRectangle(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

export async function createQuoteVerificationQr(url: string): Promise<string> {
  const canvas = document.createElement('canvas');

  await QRCode.toCanvas(canvas, url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: QR_SIZE,
  });

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('El navegador no pudo preparar el código QR.');
  }

  const logoUrl = new URL('/brand/logo.png', window.location.origin).href;
  const logo = await loadImage(logoUrl);
  const containerX = (canvas.width - LOGO_CONTAINER_SIZE) / 2;
  const containerY = (canvas.height - LOGO_CONTAINER_SIZE) / 2;

  context.save();
  context.fillStyle = '#ffffff';
  drawRoundedRectangle(
    context,
    containerX,
    containerY,
    LOGO_CONTAINER_SIZE,
    LOGO_CONTAINER_SIZE,
    LOGO_RADIUS,
  );

  const availableSize = LOGO_CONTAINER_SIZE - LOGO_PADDING * 2;
  const scale = Math.min(availableSize / logo.naturalWidth, availableSize / logo.naturalHeight);
  const logoWidth = logo.naturalWidth * scale;
  const logoHeight = logo.naturalHeight * scale;

  context.drawImage(
    logo,
    (canvas.width - logoWidth) / 2,
    (canvas.height - logoHeight) / 2,
    logoWidth,
    logoHeight,
  );
  context.restore();

  return canvas.toDataURL('image/png');
}
