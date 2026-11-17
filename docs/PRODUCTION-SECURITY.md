# Production Security — Fase 2

## Sesiones

- Access JWT en memoria del navegador, no en localStorage.
- Refresh tokens aleatorios de 48 bytes, almacenados únicamente como SHA-256 en SQL Server.
- Rotación atómica y rechazo de reutilización.
- Cookie HttpOnly, SameSite=Strict, Secure en producción, Path=/api/auth.
- Refresh de sesión en un único vuelo por pestaña y serializado entre pestañas (Web Locks API, con un
  reintento como alternativa). Una respuesta 401 limpia el estado local sin llamar a `/auth/logout`, para no
  revocar la sesión que otra pestaña acaba de renovar.
- La caché de consultas se vacía al iniciar o cerrar sesión; el cierre se propaga a otras pestañas
  (`BroadcastChannel`).
- Revocación de dispositivos mediante GET /api/auth/sessions y DELETE /api/auth/sessions/:id.
- Revocación completa al cambiar o restablecer contraseña.
- Los JWT contienen sid y son invalidados automáticamente si se revoca su sesión.

## Despliegue

El frontend y la API deben estar bajo el mismo sitio (schemeful same-site), porque la cookie es SameSite=Strict. Evitar arquitecturas cross-site salvo que se diseñe una política explícita CSRF.

`JWT_EXPIRES_IN` vale 15m por defecto y la API rechaza valores superiores a 1h al iniciar. Un refresh token
caduca a los 7 días; no se extiende al rotar. Un token antiguo presentado dentro de 10 segundos tras la
rotación (carrera entre pestañas) se rechaza sin revocar; después de ese margen se considera reutilización
y revoca la sesión completa.

Detrás de un proxy HTTPS definir `TRUST_PROXY` para que rate limiting y auditoría usen la IP real.

## Observabilidad

- X-Request-Id en todas las solicitudes.
- Logs estructurados por request sin tokens ni querystrings.
- GET /api/health/ready verifica la conexión SQL y retorna 503 si no está disponible.
- La respuesta de error incluye requestId para soporte.

## Verificado en v1.2.0

- Pruebas de integración sobre SQL Server real: cookie, rotación, reutilización, origen no autorizado,
  revocación por dispositivo, logout, logout-all, cambio de contraseña y usuarios desactivados.
- Aislamiento Empresa A / Empresa B y cuotas con solicitudes concurrentes (ver [TESTING.md](TESTING.md)).

## Pendiente para hardening adicional

- MFA/TOTP para cuentas privilegiadas.
- Instrumentación OpenTelemetry/Sentry y alertas del despliegue.
- Pruebas de carga.
