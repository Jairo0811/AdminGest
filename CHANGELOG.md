# Changelog

Todos los cambios relevantes de AdminGest se documentan en este archivo.

## [1.0.1] - 2026-08-02

### Añadido

- Matriz RBAC real para administradores, gerentes comerciales, representantes de ventas, gerentes de proyectos y perfiles de solo lectura.
- Protección global de API por recurso y tipo de operación.
- Rutas, navegación, dashboards y acciones adaptados al rol activo.
- Reportes corporativos con branding, KPIs, folio, QR documental, marca de agua y paginación real.
- Footer global con año dinámico y mejoras de consistencia visual.
- Documentación de permisos en `docs/security/rbac-matrix.md`.
- Pruebas de regresión ampliadas para toda la matriz de autorización.

### Seguridad

- Denegación por defecto para perfiles no administrativos.
- Respuesta `403 Forbidden` ante operaciones no autorizadas.
- Separación efectiva entre lectura y escritura.
- Administración de usuarios y configuración restringidas a administradores.
- Acciones de creación, edición y eliminación ocultas cuando el rol no posee permiso de escritura.
- API mantenida como fuente de verdad, independientemente de la interfaz.

### Corregido

- Privilegios excesivos en roles no administrativos.
- Botones mutables visibles para perfiles de consulta.
- Dashboard genérico para todos los perfiles.
- Validación inconsistente de campos en prospectos, oportunidades, actividades y proyectos.
- PDFs genéricos sin identidad corporativa.
- Numeración incorrecta `Página 0 de 0` en reportes.
- Persistencia de acciones entre Lista, Calendario, Kanban, Cronograma y MS Project.
- Selector de vistas y botones principales que desaparecían al cambiar de modo.
- Compatibilidad de `package-lock.json` entre Windows y GitHub Actions Linux.

### Documentación

- README actualizado con RBAC, dashboards por rol, acciones condicionadas por permiso y validación CI.
- Changelog actualizado para reflejar el estado funcional final de la versión estable.

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
