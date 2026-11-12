# Despliegue de AdminGest

## Componentes

- Frontend React compilado en `apps/web/dist`.
- API NestJS compilada en `apps/api/dist`.
- Microsoft SQL Server 2022.
- Proxy inverso con HTTPS: IIS, Nginx, Apache o servicio administrado equivalente.

## Variables obligatorias de producción

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="sqlserver://SERVIDOR:1433;database=AdminGestDb;user=USUARIO;password=CONTRASENA;encrypt=true;trustServerCertificate=false"
CORS_ORIGIN=https://admingest.example.com
JWT_SECRET=CLAVE_ALEATORIA_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRES_IN=15m
SWAGGER_ENABLED=false
TRUST_PROXY=1
DOCUMENT_ALLOWED_HOSTS=docs.admingest.example.com
PASSWORD_RESET_URL=https://admingest.example.com/reset-password
RESEND_API_KEY=CLAVE_DEL_PROVEEDOR
MAIL_FROM=AdminGest <no-reply@example.com>
```

`JWT_EXPIRES_IN` admite entre `1m` y `1h`; un valor mayor impide iniciar la API. La sesión del usuario se
mantiene con el refresh token rotativo (7 días). `TRUST_PROXY` indica cuántos proxies de confianza preceden
a la API para que la IP real se use en rate limiting y auditoría.

## Preparación

```bash
npm ci
npm run db:generate
npm run db:validate
npm run lint
npm run test
npm run build
# Respaldo completo de la base antes de migrar
npm run db:deploy
```

`db:deploy` debe utilizarse en producción. `db:migrate` está reservado para desarrollo porque ejecuta `prisma migrate dev`.

### Actualización a 1.2.0

La migración `20261103120000_tenant_integrity_hardening` verifica primero que no existan referencias entre
empresas distintas. Si las encuentra, se detiene con el mensaje «se detectaron N referencias entre
empresas distintas» **sin aplicar cambios**; corrige esos registros (las consultas están en el bloque
«Preflight» del archivo `migration.sql`) y vuelve a ejecutar `db:deploy`. Las referencias de documentos a
proyectos o clientes inexistentes se ponen en `NULL`. Ver [RELEASE-1.2.0.md](RELEASE-1.2.0.md).

### Seed en producción

En producción el seed solo crea los planes que falten. Nunca modifica administradores, suscripciones ni
límites existentes (salvo `SEED_SYNC_PLANS=true`). Los datos de demostración requieren
`SEED_DEMO_DATA=true` y una `SEED_ADMIN_PASSWORD` explícita.

## API

```bash
npm run start:prod --workspace @admingest/api   # ejecuta apps/api/dist/main.js
```

La API escucha en `0.0.0.0` y utiliza el puerto configurado. Debe exponerse únicamente detrás del proxy inverso.
El workflow de CI inicia la API desde el build y comprueba `/api/health/ready` en cada cambio.

Los recordatorios de actividades y cotizaciones se generan con un temporizador dentro del proceso de la API
(cada 15 minutos). No se generan mientras la API está detenida y no hay cola persistente; definir
`REMINDERS_DISABLED=true` en réplicas que no deban ejecutarlos (la deduplicación evita duplicados).

## Frontend

Publica `apps/web/dist` como aplicación estática y configura fallback hacia `index.html` para rutas del cliente.

La URL de la API debe definirse antes del build mediante el archivo de entorno del frontend
(`VITE_API_URL`, preferiblemente `/api` en el mismo dominio) y `VITE_PUBLIC_APP_URL` para los códigos QR
de verificación.

Frontend y API deben compartir el mismo sitio (por ejemplo `app.empresa.com` y `app.empresa.com/api`, o
`api.empresa.com`): la cookie de sesión es `SameSite=Strict`. `CORS_ORIGIN` debe contener exactamente el
origen del frontend.

## SQL Server

- Crear una base de datos dedicada.
- Utilizar un usuario de aplicación con privilegios mínimos.
- Cifrar la conexión.
- Configurar respaldos completos, diferenciales y del log según el modelo de recuperación.
- Probar restauraciones periódicamente.

## Docker opcional

Docker Compose se conserva para desarrollo reproducible de SQL Server. No es obligatorio para producción. Para levantar el servicio local:

```bash
docker compose up -d
```

## Verificación posterior

- `GET /api/health` responde con `version: 1.2.0` y `GET /api/health/ready` con `ready`.
- Swagger no está expuesto cuando `SWAGGER_ENABLED=false`.
- El frontend consume la API mediante HTTPS.
- Registro, login y recuperación de contraseña funcionan.
- Las migraciones aparecen aplicadas en `_prisma_migrations`.
- No se muestran trazas internas en respuestas HTTP.

## Cloudflare Pages

La opción de hospedaje del frontend en Cloudflare Pages y la función proxy same-origin
`/api/*` están documentadas en [CLOUDFLARE.md](CLOUDFLARE.md). NestJS y SQL Server
necesitan un proveedor externo; la ausencia de `API_ORIGIN` retorna 503.
