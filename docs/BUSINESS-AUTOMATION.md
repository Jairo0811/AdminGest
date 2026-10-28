# Business Automation — Fase 3

## Notificaciones persistentes

- Cada notificación está ligada al tenant y al usuario; nunca se consultan datos de otros tenants.
- Bandeja /notifications, marcar leído PATCH /notifications/:id/read.
- La asignación de actividades/proyectos genera avisos para el usuario responsable.
- El escáner en memoria recorre cada 15 minutos las actividades con vencimiento dentro de 24 horas y las cotizaciones por expirar.
- Clave de deduplicación única para evitar avisos duplicados en varios servidores.
- Reglas por empresa que activan/desactivan cada tipo de evento. Valores iniciales activos.
- No se envía email ni WhatsApp en esta etapa: las alertas son internas.

## Plantillas

- CRUD básico con GET/POST/DELETE /workflows/templates.
- Una plantilla contiene hasta 20 tareas; su aplicación sobre un proyecto crea las tareas.
- Las operaciones validan tenant; las reglas de automatización solo las modifican administradores.
- GET /workflows/rules y PATCH /workflows/rules/:type.

## Registro documental

- GET/POST/DELETE /documents.
- Los documentos se guardan como metadatos y enlaces HTTPS; **no se almacenan los archivos**.
- En producción, definir DOCUMENT_ALLOWED_HOSTS con los dominios autorizados por empresa (configuración global separada por comas).
- Un enlace HTTPS válido no garantiza privacidad del archivo remoto. El proveedor externo debe imponer permisos y vencimiento según sus propias políticas.
- Las asociaciones de cliente/proyecto deben pertenecer al tenant.

## Trabajo pendiente antes del lanzamiento comercial

- Adaptador S3/R2/Azure Blob con presigned URLs, almacenamiento privado y controles de tamaño/tipo/virus.
- Outbox transaccional y workers para notificaciones y envíos de correo.
- Planificador de recordatorios externo y métricas de ejecución: los intervalos dentro de procesos API no constituyen un planificador confiable ante caídas.
- Plantillas personalizadas de correo y WhatsApp opt-in.
- E2E real de aislamiento multiempresa con SQL Server.
