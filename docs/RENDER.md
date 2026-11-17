# API NestJS en Render

Arquitectura objetivo de AdminGest v1.2.0:

```text
Navegador → Cloudflare Pages (React) → Pages Function /api/* → Render (NestJS) → Azure SQL Database
```

Este documento describe cómo publicar **solo la API** en Render. El frontend y el proxy se configuran en
[CLOUDFLARE.md](CLOUDFLARE.md) y la base de datos en [AZURE-SQL.md](AZURE-SQL.md). Las variables están
clasificadas en [ENVIRONMENT.md](ENVIRONMENT.md).

> **Estado:** pendiente de configuración. El repositorio contiene el Blueprint (`render.yaml`) y el código
> preparado, pero no hay un servicio Render ni una base Azure SQL conectados a `admingest.pages.dev`.
> Mientras tanto la interfaz publicada muestra «El servidor de AdminGest todavía no está configurado».

## 1. Crear el servicio

Opción recomendada: **Dashboard → New → Blueprint** sobre `Jairo0811/AdminGest` (rama `main` cuando los PR
estén fusionados). El archivo [`render.yaml`](../render.yaml) crea un único _Web Service_ del plan **free**
y pide en pantalla los valores secretos (`sync: false`). No crea bases de datos ni recursos de pago.

Configuración equivalente si se crea a mano (**New → Web Service**):

| Campo             | Valor                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------- |
| Runtime           | Node                                                                                      |
| Root directory    | vacío (raíz del monorepo; necesario para `npm workspaces`)                                |
| Build command     | `npm ci --include=dev && npm run db:generate && npm run build --workspace @admingest/api` |
| Start command     | `npm run start:prod --workspace @admingest/api`                                           |
| Health check path | `/api/health`                                                                             |
| Node              | 24 (archivo `.node-version` y variable `NODE_VERSION=24`)                                 |
| Auto-deploy       | Desactivado hasta validar cada versión (Render redespliega en cada push si se activa)     |

**Por qué `--include=dev`:** con `NODE_ENV=production`, `npm ci` omite las devDependencies, y el build
necesita Nest CLI, Prisma CLI y TypeScript. Sin esta opción el build falla con `nest: not found`.

**Puerto y red:** la API escucha en `0.0.0.0` y en `PORT`, que Render asigna automáticamente; no hay que
definir `PORT`.

## 2. Variables de entorno

Definir en **Environment** del servicio (nunca en Git ni como `VITE_*`):

| Variable                 | Valor en Render                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `NODE_ENV`               | `production`                                                                                   |
| `DATABASE_URL`           | Cadena de Azure SQL con `encrypt=true` (ver [AZURE-SQL.md](AZURE-SQL.md#2-cadena-de-conexión)) |
| `JWT_SECRET`             | 64 caracteres aleatorios (`openssl rand -base64 48`)                                           |
| `JWT_EXPIRES_IN`         | `15m`                                                                                          |
| `API_PROXY_SECRET`       | 32+ caracteres aleatorios; **el mismo valor** en Cloudflare Pages                              |
| `CORS_ORIGIN`            | `https://admingest.pages.dev` (o el dominio propio)                                            |
| `PASSWORD_RESET_URL`     | `https://admingest.pages.dev/reset-password`                                                   |
| `DOCUMENT_ALLOWED_HOSTS` | Dominios documentales autorizados (obligatorio en producción)                                  |
| `TRUST_PROXY`            | `1`                                                                                            |
| `SWAGGER_ENABLED`        | `false`                                                                                        |
| `PUBLIC_REGISTRATION`    | `false` (cerrado) o `true` si se decide abrir el alta de empresas                              |
| `RESEND_API_KEY`         | Clave de API de Resend (**obligatoria en producción**: la API no inicia sin ella)              |
| `MAIL_FROM`              | Remitente de un dominio verificado en Resend (obligatoria en producción)                       |

**Correo:** sin un dominio verificado, Resend solo entrega a la dirección del titular de la cuenta; la
recuperación de contraseña para otros usuarios requiere verificar un dominio propio. Si Resend rechaza el
envío, la API responde con error y no informa un envío exitoso. Los enlaces y tokens de recuperación no se
escriben en los logs de producción.

La API valida estas variables al iniciar y se detiene con un mensaje claro si falta una obligatoria o si
`JWT_SECRET`, `JWT_EXPIRES_IN`, `API_PROXY_SECRET` o `PUBLIC_REGISTRATION` no son válidos.

## 3. Acceso solo a través de Cloudflare

Cuando `API_PROXY_SECRET` está definido:

- La Pages Function envía el secreto en `x-admingest-proxy-secret` y la IP del visitante
  (`cf-connecting-ip`) en `x-admingest-client-ip`, y elimina cualquier copia enviada por el navegador.
- La API compara el secreto en tiempo constante y responde **403 `DIRECT_ACCESS_FORBIDDEN`** a llamadas
  directas a `https://…onrender.com/api/…`. Solo `/api/health` y `/api/health/ready` quedan públicos para
  el health check de Render.
- Rate limiting, sesiones y auditoría usan la IP real del visitante. Sin este mecanismo todas las peticiones
  llegarían desde las IP de salida de Cloudflare y compartirían el mismo límite (10 inicios de sesión por
  minuto para **todos** los usuarios).

Sin `API_PROXY_SECRET` (desarrollo local, CI) el comportamiento es el anterior.

## 4. Health checks

| Ruta                | Tipo      | Consulta la BD | Uso recomendado                                                               |
| ------------------- | --------- | -------------- | ----------------------------------------------------------------------------- |
| `/api/health`       | Liveness  | No             | **Health check de Render.** Responde 200 aunque la base esté pausada.         |
| `/api/health/ready` | Readiness | `SELECT 1`     | Monitoreo externo y verificación manual; 503 `DATABASE_UNAVAILABLE` si falla. |

No usar `/api/health/ready` como health check de Render: una base Azure SQL en pausa automática haría que
Render considere caído el servicio y lo reinicie en bucle. La API arranca aunque la base no responda y se
reconecta en la siguiente consulta.

## 5. Limitaciones del plan Free de Render

Según la [documentación de Render](https://render.com/docs/free) (verificar antes de desplegar, puede
cambiar):

- El servicio **se suspende tras 15 minutos sin tráfico entrante** y tarda alrededor de **un minuto** en
  volver a iniciar. La interfaz muestra «Conectando con el servidor… puede tardar hasta un minuto» y reintenta
  una sola vez; no inunda el servidor de peticiones.
- **750 horas de instancia al mes** por espacio de trabajo; al agotarse, los servicios gratuitos se suspenden
  hasta el mes siguiente.
- Render puede reiniciar el servicio en cualquier momento; no hay disco persistente (AdminGest no lo necesita:
  todo está en SQL Server).
- Sin _cron jobs_, _background workers_ ni _pre-deploy command_: las migraciones se aplican manualmente (ver
  [AZURE-SQL.md](AZURE-SQL.md#4-migraciones)).
- Puertos SMTP salientes bloqueados: el correo usa la API HTTPS de Resend, por lo que no se ve afectado.
- IP de salida compartidas por región (**Connect → Outbound** en el panel); las IP dedicadas requieren un
  plan de pago.

**Impacto en AdminGest:**

| Función                                | Efecto con Render Free                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| Primer acceso tras inactividad         | ~1 min de espera; mensaje de servidor iniciando, nunca «credenciales incorrectas».         |
| Recordatorios periódicos (cada 15 min) | Solo se generan mientras la API está activa; no hay recuperación de los periodos dormidos. |
| Sesiones                               | Se conservan: están en SQL Server y en la cookie, no en memoria del proceso.               |
| Limitación de solicitudes              | En memoria del proceso; se reinicia al suspenderse (aceptable para una instancia).         |

Para disponibilidad permanente se requiere un plan de pago (no activado sin autorización del propietario).

## 6. Verificación después del despliegue

1. **Logs** muestra `nest build` correcto y `Nest application successfully started`.
2. `https://SERVICIO.onrender.com/api/health` → 200 con `version: 1.2.0`.
3. `https://SERVICIO.onrender.com/api/health/ready` → 200 si la base responde; 503 JSON si no.
4. `https://SERVICIO.onrender.com/api/auth/registration` → **403 `DIRECT_ACCESS_FORBIDDEN`** (acceso
   directo bloqueado).
5. Configurar `API_ORIGIN=https://SERVICIO.onrender.com` y `API_PROXY_SECRET` en Cloudflare Pages y
   redesplegar Pages. `https://admingest.pages.dev/api/health/ready` → 200.
6. Ejecutar la [lista de verificación de producción](PRODUCTION-CHECKLIST.md).

Los logs no contienen contraseñas, tokens, enlaces de recuperación ni la cadena de conexión: el filtro global
registra solo el tipo de error y el identificador de la petición.
