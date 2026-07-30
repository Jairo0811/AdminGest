# Arquitectura de AdminGest

## Principios

- Monorepositorio con frontend y API independientes.
- Módulos de dominio con controladores, servicios y DTO propios.
- SQL Server como fuente transaccional única.
- Prisma como capa de persistencia tipada y migraciones versionadas.
- Aislamiento multiempresa aplicado en los servicios, no recibido desde el cliente.
- Auditoría transversal para las mutaciones principales.

## Capas

### `apps/web`

React consume la API mediante un cliente centralizado que adjunta el token JWT. TanStack Query administra caché, revalidación y estados asíncronos. Las páginas se organizan por área funcional.

### `apps/api`

- `common`: decoradores, guardias y tipos transversales.
- `infrastructure`: Prisma y acceso a datos.
- `modules/auth`: autenticación y emisión de JWT.
- `modules/*`: casos de uso de CRM, ventas, proyectos y operaciones.
- `modules/audit`: trazabilidad de acciones.

### Persistencia

Todos los identificadores utilizan `UNIQUEIDENTIFIER`. Los campos indexados definen longitudes compatibles con SQL Server y las relaciones usan `NoAction` para evitar rutas múltiples de cascada.

## Seguridad multiempresa

1. El usuario inicia sesión.
2. La API firma un JWT con `sub` y `companyId`.
3. La estrategia JWT vuelve a validar que el usuario y la empresa estén activos.
4. El controlador recibe un `AuthUser`.
5. El servicio filtra la entidad principal y valida sus relaciones con `user.companyId`.

Un cliente nunca puede seleccionar arbitrariamente la empresa mediante un encabezado.

## Decisiones de alcance

La versión 1.0 cubre el núcleo operativo completo. Funciones especializadas como facturación fiscal electrónica, conciliación bancaria, nómina o integraciones externas requieren proyectos propios por sus reglas regulatorias y no forman parte del MVP.
