# Production Security — Fase 2

## Sesiones

- Access JWT en memoria del navegador, no en localStorage.
- Refresh tokens aleatorios de 48 bytes, almacenados únicamente como SHA-256 en SQL Server.
- Rotación atómica y rechazo de reutilización.
- Cookie HttpOnly, SameSite=Strict, Secure en producción, Path=/api/auth.
- Refresh de sesión en un único vuelo para evitar carreras entre llamadas HTTP.
- Revocación de dispositivos mediante GET /api/auth/sessions y DELETE /api/auth/sessions/:id.
- Revocación completa al cambiar o restablecer contraseña.
- Los JWT contienen sid y son invalidados automáticamente si se revoca su sesión.

## Despliegue

El frontend y la API deben estar bajo el mismo sitio (schemeful same-site), porque la cookie es SameSite=Strict. Evitar arquitecturas cross-site salvo que se diseñe una política explícita CSRF.

La variable JWT_EXPIRES_IN debería establecerse en 15m. Un refresh token caduca a los 7 días; no se extiende al rotar.

## Observabilidad

- X-Request-Id en todas las solicitudes.
- Logs estructurados por request sin tokens ni querystrings.
- GET /api/health/ready verifica la conexión SQL y retorna 503 si no está disponible.
- La respuesta de error incluye requestId para soporte.

## Pendiente para hardening adicional

- MFA/TOTP para cuentas privilegiadas.
- E2E multiempresa usando una base de datos real y pruebas de concurrencia.
- Instrumentación OpenTelemetry/Sentry y alertas del despliegue.
- Pruebas de carga y protección contra carreras en cuotas de suscripción.
