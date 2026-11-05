# Política de seguridad de AdminGest

## Versiones soportadas

| Versión              | Soporte                    |
| -------------------- | -------------------------- |
| 1.2.x                | ✅ Activo                  |
| 1.0.x                | ⚠️ Solo actualizar a 1.2.x |
| Versiones anteriores | ❌ Sin soporte             |

## Reporte responsable

No publiques vulnerabilidades como issues públicos. Reporta el hallazgo al responsable del repositorio indicando:

- componente afectado;
- pasos mínimos para reproducirlo;
- impacto estimado;
- evidencia técnica sin datos personales ni credenciales;
- propuesta de mitigación, cuando aplique.

## Controles implementados

- tokens de acceso JWT de 15 minutos (máximo 1 hora) en memoria, nunca en `localStorage`;
- refresh tokens aleatorios guardados como SHA-256, rotativos, en cookie `HttpOnly`, `SameSite=Strict`,
  `Path=/api/auth` y `Secure` en producción; reutilización detectada y sesión revocada;
- sesiones revocables por dispositivo, cierre de todas las sesiones y revocación al cambiar contraseña,
  rol, estado o correo;
- comprobación de `Origin` en refresco y cierre de sesión (mitigación CSRF junto con `SameSite=Strict`);
- aislamiento multiempresa en cada consulta, validación de referencias entre empresas y claves foráneas
  compuestas en SQL Server;
- cuotas y numeración protegidas contra condiciones de carrera con bloqueos de aplicación de SQL Server;
- documentos imprimibles con escape obligatorio y Content-Security-Policy sin red;
- neutralización de fórmulas en exportaciones CSV;
- contraseñas con bcrypt;
- roles y autorización por endpoint;
- aislamiento de información por empresa;
- validación estricta de DTO y rechazo de propiedades desconocidas;
- rate limiting global y límites reforzados en autenticación;
- Helmet y eliminación de `X-Powered-By`;
- CORS configurable por entorno;
- Swagger deshabilitado por defecto en producción;
- manejo uniforme de errores sin exponer trazas internas;
- recuperación de contraseña con token aleatorio, hash SHA-256, expiración y uso único;
- auditoría de operaciones sensibles;
- secretos gestionados mediante variables de entorno.

## Requisitos de producción

- utilizar HTTPS de extremo a extremo;
- definir un `JWT_SECRET` aleatorio de al menos 32 caracteres y `JWT_EXPIRES_IN=15m`;
- servir frontend y API bajo el mismo sitio (requisito de la cookie `SameSite=Strict`) y definir
  `TRUST_PROXY` según el proxy inverso;
- definir `DOCUMENT_ALLOWED_HOSTS` con los dominios documentales autorizados;
- limitar `CORS_ORIGIN` a los dominios autorizados;
- mantener `SWAGGER_ENABLED=false` salvo necesidad operacional controlada;
- usar una cuenta SQL Server con privilegios mínimos;
- almacenar secretos en el gestor de secretos de la plataforma;
- ejecutar `npm audit`, pruebas y migraciones antes de desplegar;
- mantener copias de seguridad verificadas de SQL Server;
- rotar credenciales ante cualquier sospecha de exposición.

## Dependencias

Las actualizaciones deben aplicarse de forma controlada. No debe utilizarse `npm audit fix --force` sin revisar cambios incompatibles, ejecutar la suite completa y validar el sistema funcionalmente.

### Avisos aceptados en v1.2.0

| Paquete                                             | Severidad | Motivo de aceptación                                                                                    |
| --------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `multer` (vía `@nestjs/platform-express`)           | Alta      | La API no expone rutas multipart; la corrección exige NestJS 12 (cambio mayor fuera del congelamiento). |
| `prisma`, `@prisma/config`, `deepmerge-ts`          | Alta      | CLI usada en build y migraciones, no en tiempo de ejecución; la corrección exige Prisma 7.              |
| Herramientas de desarrollo (Jest, ESLint, Nest CLI) | Moderada  | No forman parte del artefacto desplegado.                                                               |

`npm run security:audit` (nivel crítico) se ejecuta en CI y no reporta vulnerabilidades críticas.
