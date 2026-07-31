import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PasswordResetMail {
  to: string;
  firstName: string;
  resetUrl: string;
}

@Injectable()
export class PasswordResetMailService {
  private readonly logger = new Logger(PasswordResetMailService.name);

  constructor(private readonly config: ConfigService) {}

  async send({ to, firstName, resetUrl }: PasswordResetMail): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('MAIL_FROM');

    if (!apiKey || !from) {
      if (this.config.get<string>('NODE_ENV', 'development') === 'production') {
        throw new ServiceUnavailableException('El servicio de correo no está configurado.');
      }

      this.logger.warn(`Enlace de recuperación para ${to}: ${resetUrl}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Restablece tu contraseña de AdminGest',
        html: this.buildHtml(firstName, resetUrl),
      }),
    });

    if (!response.ok) {
      this.logger.error(`Resend rechazó el correo de recuperación: ${response.status}`);
      throw new ServiceUnavailableException('No fue posible enviar el correo de recuperación.');
    }
  }

  private buildHtml(firstName: string, resetUrl: string): string {
    const safeName = this.escapeHtml(firstName);
    const safeUrl = this.escapeHtml(resetUrl);

    return `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:auto;color:#1f2937">
        <h1 style="color:#1677df">AdminGest</h1>
        <p>Hola ${safeName},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p style="margin:32px 0">
          <a href="${safeUrl}" style="background:#1677df;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
            Restablecer contraseña
          </a>
        </p>
        <p>El enlace vence en 30 minutos y solo puede utilizarse una vez.</p>
        <p>Si no realizaste esta solicitud, ignora este mensaje.</p>
      </div>`;
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    })[character] ?? character);
  }
}
