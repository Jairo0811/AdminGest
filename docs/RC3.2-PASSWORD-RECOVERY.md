# RC3.2 — Recuperación de contraseña

## Flujo

1. El usuario solicita recuperación en `/forgot-password`.
2. La API responde siempre con un mensaje genérico para evitar enumeración de cuentas.
3. Si la cuenta está activa, se invalidan los tokens anteriores y se genera uno aleatorio de 64 bytes.
4. Solo el hash SHA-256 se almacena en SQL Server.
5. El enlace vence en 30 minutos y es de un solo uso.
6. Al restablecer la contraseña, se actualiza el hash bcrypt, se invalidan todos los tokens pendientes y se registra auditoría.

## Correo

En desarrollo, si `RESEND_API_KEY` y `MAIL_FROM` no están configurados, el enlace se registra en la consola de la API.

Para envío real configura:

```env
PASSWORD_RESET_URL=https://tu-dominio/reset-password
RESEND_API_KEY=re_xxxxxxxxx
MAIL_FROM=AdminGest <no-reply@tu-dominio.com>
```

En producción la ausencia del proveedor de correo se considera una configuración inválida.

## Validación

```bash
npm run db:generate
npm run db:migrate
npm run lint
npm run test
npm run build
```

Prueba manual:

1. Abre `/login` y selecciona **¿Olvidaste tu contraseña?**.
2. Solicita el enlace para una cuenta activa.
3. En desarrollo, copia el enlace mostrado por la API.
4. Define una nueva contraseña.
5. Confirma que el enlace no puede reutilizarse y que la nueva contraseña permite iniciar sesión.
