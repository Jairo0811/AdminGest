# Changelog

Todos los cambios relevantes de AdminGest se documentan en este archivo.

## [1.2.0] - Pendiente de publicación

Versión de congelamiento técnico. Consolida las fases SaaS Foundation, Production Security y Business
Automation (1.1.0 y 1.2.0 no se publicaron por separado) junto con el hardening final. Detalle, evidencia
y riesgos en [docs/RELEASE-1.2.0.md](docs/RELEASE-1.2.0.md).

### Seguridad

- Corregido XSS almacenado en el Gantt imprimible; toda impresión usa escape obligatorio (`SafeHtml`) y una
  CSP sin acceso a red con script por nonce.
- Validación por empresa de responsables, gerentes, tareas padre, etapas, catálogo, clientes y
  oportunidades en creación y actualización, y claves foráneas compuestas `(companyId, id)` en SQL Server.
- Tokens de acceso de 15 minutos (máximo 1 hora, validado al iniciar); refresh coordinado entre pestañas;
  caché limpiada al cambiar de sesión; cierre de sesión propagado a otras pestañas.
- Política de administración: solo SUPER_ADMIN gestiona SUPER_ADMIN, la empresa conserva un administrador
  activo, cambios de rol/estado/correo revocan sesiones.
- `/api/users/me` accesible para todos los roles (antes 403 para roles no administrativos).
- `TRUST_PROXY` para proxies HTTPS, login de tiempo constante, neutralización de fórmulas en CSV.
- `react-router-dom` 7.18.5.

### Integridad de datos

- Numeración de cotizaciones por empresa y año con secuencia transaccional.
- Cuotas de usuarios, clientes y proyectos verificadas y aplicadas de forma atómica.
- Importes de descuento e ITBIS persistidos por línea; impresión basada solo en valores del servidor;
  descuento mayor que el subtotal rechazado.
- Índices únicos filtrados: varias empresas sin RNC y varios proyectos sin oportunidad.
- Seed idempotente que no modifica credenciales, roles, planes ni datos existentes.
- Migración `20261103120000_tenant_integrity_hardening` con comprobación previa y aborto atómico.

### Interfaz y accesibilidad

- `EntityPage` distingue error y lista vacía, evita envíos duplicados y carga fechas al editar.
- Modal accesible (foco, Escape, contención y restauración).
- Panel de suscripción en Configuración y campos opcionales limpiables.
- Notificaciones, Documentos y Flujos unificados con el diseño corporativo, con confirmaciones.
- Contraste AA, títulos alineados, tablas sin superposición y sin desbordamiento en 320-1440 px.

### Calidad

- Pruebas de integración y E2E HTTP sobre SQL Server real, prueba de actualización de esquema y E2E en
  navegador con Playwright en CI.
- Prettier aplicado y verificado en CI; umbrales de cobertura para módulos críticos.
- La API vuelve a iniciar desde `dist/main.js` (`tsconfig.build.json`).

### Añadido en la fase Business Automation

- Bandeja persistente de notificaciones por empresa y usuario.
- Avisos de actividades y proyectos asignados, más recordatorios periódicos.
- Reglas de automatización por empresa.
- Plantillas reutilizables de tareas para proyectos.
- Registro de referencias documentales HTTPS con filtros por tenant.
- Vistas de Notificaciones, Documentos y Flujos.

### Cambios que requieren acción

- `JWT_EXPIRES_IN` mayor de `1h` impide iniciar la API: usar `15m`.
- Ejecutar `npm run db:deploy` con respaldo previo; la migración aborta si encuentra referencias entre
  empresas.

## [1.1.0] - No publicada por separado (incluida en 1.2.0)

### Añadido

- Catálogo de planes SaaS Starter, Pro y Business.
- Suscripción única por empresa con trial Starter automático de 14 días.
- Migración retrocompatible para provisionar tenants existentes.
- Endpoint administrativo de estado, consumo y capacidad restante.
- Documentación de la base SaaS.

### Reglas comerciales

- Límites de usuarios activos, clientes activos y proyectos aplicados desde la API.
- Respuesta 403 al superar la capacidad del plan.
- Nuevas altas bloqueadas cuando la suscripción no está utilizable.
- Consulta de suscripción restringida a ADMIN y SUPER_ADMIN.

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
