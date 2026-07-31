# Política de seguridad de AdminGest

## Versiones soportadas

| Versión | Soporte |
|---|---|
| 1.0.x | ✅ Activo |
| Versiones anteriores | ❌ Sin soporte |

## Reporte responsable

No publiques vulnerabilidades como issues públicos. Reporta el hallazgo al responsable del repositorio indicando:

- componente afectado;
- pasos mínimos para reproducirlo;
- impacto estimado;
- evidencia técnica sin datos personales ni credenciales;
- propuesta de mitigación, cuando aplique.

## Controles implementados

- autenticación JWT;
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
- definir un `JWT_SECRET` aleatorio de al menos 32 caracteres;
- limitar `CORS_ORIGIN` a los dominios autorizados;
- mantener `SWAGGER_ENABLED=false` salvo necesidad operacional controlada;
- usar una cuenta SQL Server con privilegios mínimos;
- almacenar secretos en el gestor de secretos de la plataforma;
- ejecutar `npm audit`, pruebas y migraciones antes de desplegar;
- mantener copias de seguridad verificadas de SQL Server;
- rotar credenciales ante cualquier sospecha de exposición.

## Dependencias

Las actualizaciones deben aplicarse de forma controlada. No debe utilizarse `npm audit fix --force` sin revisar cambios incompatibles, ejecutar la suite completa y validar el sistema funcionalmente.
