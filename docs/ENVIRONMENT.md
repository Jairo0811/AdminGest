# Variables de entorno de AdminGest

Clasificación:

- **Pública:** termina en el JavaScript que descarga el navegador. Nunca debe contener secretos.
- **Secreta:** credencial; solo en el gestor de secretos de la plataforma (Render, Cloudflare). Nunca en Git.
- **Solo servidor:** configuración no secreta que solo lee la API o la Pages Function.

Los archivos `.env.example` contienen solo valores ficticios. `.env` está en `.gitignore`.

## API NestJS (Render)

| Variable                 | Tipo          | Producción                  | Desarrollo                             | Notas                                                                                     |
| ------------------------ | ------------- | --------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `NODE_ENV`               | Solo servidor | `production`                | `development`                          | Activa cookies `Secure`, HSTS, CSP y validaciones de producción.                          |
| `PORT`                   | Solo servidor | Asignado por Render         | `3000`                                 | La API escucha en `0.0.0.0`.                                                              |
| `DATABASE_URL`           | **Secreta**   | Obligatoria                 | Obligatoria                            | Azure SQL con `encrypt=true;trustServerCertificate=false` ([AZURE-SQL.md](AZURE-SQL.md)). |
| `JWT_SECRET`             | **Secreta**   | Obligatoria                 | Obligatoria                            | Mínimo 32 caracteres aleatorios; validado al iniciar.                                     |
| `JWT_EXPIRES_IN`         | Solo servidor | `15m`                       | `15m`                                  | Entre `1m` y `1h`; validado al iniciar.                                                   |
| `API_PROXY_SECRET`       | **Secreta**   | Recomendada                 | Vacía                                  | Igual que en Cloudflare. Bloquea el acceso directo y habilita la IP real del visitante.   |
| `CORS_ORIGIN`            | Solo servidor | Obligatoria                 | `http://localhost:5173`                | Origen exacto del frontend; también valida el `Origin` del refresh de sesión.             |
| `PASSWORD_RESET_URL`     | Solo servidor | Obligatoria                 | `http://localhost:5173/reset-password` | URL del frontend que recibe el token.                                                     |
| `RESEND_API_KEY`         | **Secreta**   | Obligatoria                 | Opcional                               | Sin ella, en desarrollo el enlace se escribe en el log; en producción la API no inicia.   |
| `MAIL_FROM`              | Solo servidor | Obligatoria                 | Opcional                               | Remitente de un dominio verificado en Resend.                                             |
| `DOCUMENT_ALLOWED_HOSTS` | Solo servidor | Obligatoria para Documentos | Opcional                               | Sin ella, el registro de documentos responde 400 en producción.                           |
| `TRUST_PROXY`            | Solo servidor | `1`                         | `false`                                | Saltos de proxy de confianza para `request.ip`.                                           |
| `SWAGGER_ENABLED`        | Solo servidor | `false`                     | `true`                                 | No exponer Swagger en producción.                                                         |
| `PUBLIC_REGISTRATION`    | Solo servidor | `false` (por defecto)       | abierto por defecto                    | `true`/`false`. Cerrado: `POST /api/auth/register` → 403 `REGISTRATION_DISABLED`.         |
| `REMINDERS_DISABLED`     | Solo servidor | Opcional                    | Opcional                               | `true` desactiva los recordatorios periódicos en ese proceso.                             |
| `THROTTLE_DISABLED`      | Solo pruebas  | **No usar**                 | Solo E2E                               | Ignorada cuando `NODE_ENV=production`.                                                    |
| `SEED_*`                 | Solo servidor | Solo al inicializar         | Opcional                               | Ver [DEPLOYMENT.md](DEPLOYMENT.md#seed-en-producción). No dejarlas definidas en Render.   |

## Frontend (build de Cloudflare Pages)

| Variable              | Tipo        | Valor                | Notas                                                                                |
| --------------------- | ----------- | -------------------- | ------------------------------------------------------------------------------------ |
| `VITE_API_URL`        | **Pública** | `/api` (por defecto) | Siempre el proxy del mismo origen. No usar la URL de Render ni `localhost` en Pages. |
| `VITE_PUBLIC_APP_URL` | **Pública** | Opcional             | Dominio canónico para los QR de verificación; si se omite se usa el dominio actual.  |
| `NODE_VERSION`        | Build       | `24`                 | Versión de Node del build de Pages.                                                  |

**Nunca** crear variables `VITE_*` con `DATABASE_URL`, `JWT_SECRET`, `API_PROXY_SECRET`, claves de Resend
ni credenciales SQL: Vite las incrusta en los archivos JavaScript públicos.

## Cloudflare Pages Function (`functions/api/[[path]].js`)

| Variable           | Tipo          | Valor                           | Notas                                                                            |
| ------------------ | ------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `API_ORIGIN`       | Solo servidor | `https://SERVICIO.onrender.com` | Solo HTTPS, sin ruta, credenciales ni query. Sin ella: 503 `API_NOT_CONFIGURED`. |
| `API_PROXY_SECRET` | **Secreta**   | Igual que en la API             | Definir como _Secret_ (cifrado) en Production y, si se usa, en Preview.          |

## Docker local

| Variable            | Tipo    | Notas                                        |
| ------------------- | ------- | -------------------------------------------- |
| `MSSQL_SA_PASSWORD` | Secreta | Solo para el SQL Server local de desarrollo. |
