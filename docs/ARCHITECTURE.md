# Arquitectura inicial

AdminGest utiliza un monorepositorio con separación estricta entre interfaz, API y persistencia.

## Decisiones

1. **React + TypeScript** para una interfaz modular y tipada.
2. **NestJS** para organizar la API por módulos, controladores, servicios y dependencias.
3. **PostgreSQL** como fuente principal de verdad por sus transacciones y relaciones.
4. **Prisma ORM** para migraciones y acceso tipado a datos.
5. **Firebase** se reservará para identidad, archivos y notificaciones; no será la base transaccional principal.
6. Toda entidad empresarial incluye `companyId` para preparar aislamiento multiempresa.

## Módulos iniciales del dominio

- Identity
- Companies
- CRM
- Projects
- Tasks
- Audit
