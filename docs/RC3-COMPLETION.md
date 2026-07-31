# Cierre integral de RC3

## RC3.1 — Usuarios, roles y perfil

- Gestión de usuarios por empresa.
- Roles y políticas de autorización.
- Perfil personal y cambio de contraseña.
- Auditoría de operaciones sensibles.

## RC3.2 — Recuperación de contraseña

- Solicitud con respuesta genérica.
- Token aleatorio almacenado como hash SHA-256.
- Expiración de 30 minutos y uso único.
- Invalidación de solicitudes anteriores.
- Integración de correo y pantallas públicas.

## RC3.3 — Seguridad

- Validación de variables de entorno.
- Helmet y encabezados endurecidos.
- CORS explícito por entorno.
- Rate limiting general y reforzado en autenticación.
- Swagger deshabilitado por defecto en producción.
- Filtro global de errores.
- Cierre automático del frontend al vencer el JWT.
- Política de seguridad y guía de despliegue.

## RC3.4 — Calidad, Docker y CI

- Validación de Prisma.
- SQL Server 2022 real dentro de GitHub Actions.
- Creación automática de base de datos de CI.
- Aplicación de migraciones con `prisma migrate deploy`.
- Lint, pruebas y build de todos los workspaces.
- Auditoría de vulnerabilidades críticas.
- Artefactos compilados de API y frontend.
- Docker Compose con healthcheck para SQL Server.
- Nuevas pruebas de configuración y expiración JWT.

## RC3.5 — Release

- `CHANGELOG.md` de la versión 1.0.0.
- `SECURITY.md`.
- Guía de despliegue.
- Checklist de publicación.
- Workflow de GitHub Release basado en tags `v*`.
- Scripts `verify`, `security:audit` y `release:check`.

## Criterio de aceptación

RC3 puede considerarse terminado cuando:

1. `npm run release:check` finaliza correctamente.
2. `npm run db:deploy` funciona contra una base SQL Server vacía.
3. GitHub Actions queda en verde.
4. Se completa la prueba funcional descrita en `docs/RELEASE-1.0.0-CHECKLIST.md`.
5. La rama se fusiona a `main` y se crea el tag `v1.0.0`.
