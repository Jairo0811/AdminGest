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
JWT_EXPIRES_IN=8h
SWAGGER_ENABLED=false
PASSWORD_RESET_URL=https://admingest.example.com/reset-password
RESEND_API_KEY=CLAVE_DEL_PROVEEDOR
MAIL_FROM=AdminGest <no-reply@example.com>
```

## Preparación

```bash
npm ci
npm run db:generate
npm run db:validate
npm run lint
npm run test
npm run build
npm run db:deploy
```

`db:deploy` debe utilizarse en producción. `db:migrate` está reservado para desarrollo porque ejecuta `prisma migrate dev`.

## API

```bash
npm run start:prod --workspace @admingest/api
```

La API escucha en `0.0.0.0` y utiliza el puerto configurado. Debe exponerse únicamente detrás del proxy inverso.

## Frontend

Publica `apps/web/dist` como aplicación estática y configura fallback hacia `index.html` para rutas del cliente.

La URL de la API debe definirse antes del build mediante el archivo de entorno del frontend.

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

- `GET /api/health` responde correctamente.
- Swagger no está expuesto cuando `SWAGGER_ENABLED=false`.
- El frontend consume la API mediante HTTPS.
- Registro, login y recuperación de contraseña funcionan.
- Las migraciones aparecen aplicadas en `_prisma_migrations`.
- No se muestran trazas internas en respuestas HTTP.
