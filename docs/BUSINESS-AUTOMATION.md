# Business Automation — Fase 3

## Notificaciones persistentes

- Cada notificación está ligada al tenant y al usuario; nunca se consultan datos de otros tenants.
- Bandeja /notifications con filtros (todas, sin leer, leídas), marcar leída `PATCH /notifications/:id/read` y
  marcar todas `PATCH /notifications/read-all`. La campana del encabezado comparte la misma consulta y muestra
  el número de no leídas.
- La asignación y reasignación de actividades y proyectos genera avisos para el usuario responsable.
- El escáner en memoria recorre cada 15 minutos las actividades con vencimiento dentro de 24 horas y las
  cotizaciones por expirar. Es un mecanismo de mejor esfuerzo: no se ejecuta mientras la API está detenida
  ni recupera ejecuciones perdidas.
- Clave de deduplicación única para evitar avisos duplicados en varios servidores.
- Reglas por empresa que activan/desactivan cada tipo de evento. Valores iniciales activos.
- No se envía email ni WhatsApp en esta etapa: las alertas son internas.

## Plantillas

- CRUD básico con GET/POST/DELETE /workflows/templates.
- Una plantilla contiene hasta 20 tareas sin nombres repetidos. Al aplicarla se crean solo las tareas que el
  proyecto todavía no tiene (comparación sin mayúsculas ni acentos), en una transacción con bloqueo por
  proyecto: aplicarla de nuevo o en paralelo no duplica tareas. La interfaz pide confirmación y muestra
  cuántas tareas se crearon y omitieron; el avance del proyecto se recalcula.
- Las operaciones validan tenant; las reglas de automatización solo las modifican administradores.
- GET /workflows/rules y PATCH /workflows/rules/:type.

## Registro documental

- GET/POST/DELETE /documents.
- Los documentos se guardan como metadatos y enlaces HTTPS; **no se almacenan los archivos**.
- En producción, definir DOCUMENT_ALLOWED_HOSTS con los dominios autorizados por empresa (configuración global separada por comas).
- Un enlace HTTPS válido no garantiza privacidad del archivo remoto. El proveedor externo debe imponer permisos y vencimiento según sus propias políticas.
- Las asociaciones de cliente/proyecto deben pertenecer al tenant (validado en la API y por claves foráneas
  compuestas). Eliminar un proyecto desvincula sus documentos.
- La interfaz solo enlaza URLs HTTPS sin credenciales y pide confirmación antes de eliminar una referencia.

## Trabajo pendiente antes del lanzamiento comercial

- Adaptador S3/R2/Azure Blob con presigned URLs, almacenamiento privado y controles de tamaño/tipo/virus.
- Outbox transaccional y workers para notificaciones y envíos de correo.
- Planificador de recordatorios externo y métricas de ejecución: los intervalos dentro de procesos API no constituyen un planificador confiable ante caídas.
- Plantillas personalizadas de correo y WhatsApp opt-in.
- E2E real de aislamiento multiempresa con SQL Server: **completado en v1.2.0** (ver [TESTING.md](TESTING.md)).
