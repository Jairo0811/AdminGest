# Política de seguridad de AdminGest

## Versiones soportadas

| Versión | Soporte |
|---|---|
| 1.0.x | ✅ Activo |
| Versiones anteriores | ❌ No soportadas |

## Reporte responsable

No publiques credenciales, cadenas de conexión, tokens JWT ni información empresarial en una incidencia pública.

Para reportar una vulnerabilidad, utiliza **GitHub Security Advisories** del repositorio e incluye:

- descripción del riesgo;
- pasos mínimos para reproducirlo;
- impacto esperado;
- versión o commit afectado;
- propuesta de mitigación, cuando aplique.

## Controles implementados

- JWT firmado con secreto de al menos 32 caracteres;
- autorización por roles;
- aislamiento multiempresa mediante `companyId` obtenido del token;
- Helmet y cabeceras HTTP seguras;
- CORS restringido por configuración;
- validación y transformación global de DTO;
- rechazo de propiedades no permitidas;
- rate limiting global;
- auditoría de operaciones sensibles;
- Prisma ORM con consultas parametrizadas;
- validación obligatoria de variables de entorno;
- análisis automatizado de dependencias de producción en CI.

## Gestión de secretos

Los archivos `.env` no deben versionarse. Utiliza valores diferentes para desarrollo, CI y producción.

Variables sensibles principales:

```text
DATABASE_URL
JWT_SECRET
SEED_ADMIN_PASSWORD
MSSQL_SA_PASSWORD
```

En producción, almacena los secretos mediante el proveedor de despliegue, un gestor de secretos o variables protegidas del entorno.

## Dependencias

Las actualizaciones se aplican de forma controlada. No se debe ejecutar `npm audit fix --force` sin revisar cambios mayores, compatibilidad, pruebas y migraciones.
