# Arquitectura de AdminGest

AdminGest utiliza un monorepositorio con npm workspaces y separación estricta entre interfaz, API, dominio y persistencia.

## Decisiones principales

1. **React + TypeScript** para una interfaz modular, accesible y tipada.
2. **NestJS** para organizar la API por módulos, controladores, servicios y dependencias.
3. **Microsoft SQL Server 2022** como fuente transaccional principal.
4. **Prisma ORM** para el modelo relacional, migraciones y acceso tipado a datos.
5. **JWT** para la autenticación del MVP. Firebase queda como integración opcional futura para archivos y notificaciones push.
6. Toda consulta empresarial se filtra por `companyId`, obtenido del token autenticado.
7. Las operaciones sensibles generan entradas de auditoría.

## Capas

- `apps/web`: experiencia de usuario, rutas, formularios, consultas y estado de sesión.
- `apps/api/src/common`: seguridad, decoradores, guardas y contratos compartidos.
- `apps/api/src/modules`: módulos verticales del negocio.
- `apps/api/src/infrastructure`: acceso a SQL Server mediante Prisma.
- `apps/api/prisma`: esquema, migraciones y datos iniciales.

## Módulos

- Autenticación y usuarios
- Empresas
- CRM: prospectos, clientes y contactos
- Pipeline y oportunidades
- Actividades
- Catálogo y cotizaciones
- Proyectos y tareas
- Dashboard y reportes
- Auditoría

## Seguridad multiempresa

El cliente no envía un `companyId` confiable. Tras iniciar sesión, la API firma un JWT con el usuario, rol y empresa. Los servicios obtienen la empresa desde ese contexto y aplican el filtro en cada lectura o escritura.
