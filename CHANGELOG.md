# Changelog

Todos los cambios relevantes de AdminGest se documentan en este archivo.

## [1.0.0] - 2026-07-31

### Añadido

- Plataforma web multiempresa con React, NestJS, Prisma y SQL Server.
- Autenticación JWT, registro de empresas y autorización por roles.
- Recuperación segura de contraseña con tokens temporales de uso único.
- Gestión de prospectos, clientes, contactos, oportunidades y actividades.
- Dashboard premium con KPIs, gráficos, tendencias y embudo comercial.
- Pipeline y vista Kanban de oportunidades.
- Calendario de actividades y cronograma de proyectos.
- Proyectos, tareas, responsables, presupuesto y seguimiento de progreso.
- Cotizaciones imprimibles con descuento e ITBIS fijo del 18 %.
- Exportaciones Excel, impresión PDF y CSV compatible con Microsoft Project.
- Reportes ejecutivos y configuración de empresa.
- Gestión de usuarios, roles, perfil y contraseñas.
- Validación dominicana de cédula y RNC.
- Tema claro y oscuro, navegación avanzada y diseño responsive.
- Auditoría de operaciones sensibles.
- Docker Compose opcional para SQL Server.
- GitHub Actions con SQL Server real, migraciones, lint, pruebas y build.

### Seguridad

- Helmet y encabezados HTTP endurecidos.
- CORS configurable por entorno.
- Rate limiting global y específico para autenticación.
- Validación obligatoria de variables críticas.
- Swagger deshabilitado por defecto en producción.
- Respuestas de error uniformes sin exposición de trazas internas.
- Eliminación del encabezado `X-Powered-By`.

### Corregido

- Eliminada la dependencia funcional del encabezado inseguro `x-company-id`.
- Corregida la migración y conexión de Prisma con SQL Server.
- Restaurado el módulo de reportes.
- Corregidos encabezados, navegación y botones responsive.
- Corregida la generación imprimible de PDF desde navegadores Chromium.
- Corregidos el cálculo, la presentación y el ITBIS de cotizaciones.

### Documentación

- Guía de arquitectura.
- Instalación local con SQL Server Express.
- Ejecución opcional con Docker Compose.
- Despliegue de producción.
- Política de seguridad.
- Documentación de recuperación de contraseña.
- Avisos de componentes de terceros.
