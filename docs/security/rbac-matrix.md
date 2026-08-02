# Matriz RBAC de AdminGest

AdminGest aplica autorización por rol tanto en la API como en la interfaz. La API es la fuente de verdad y responde con `403 Forbidden` cuando un usuario intenta ejecutar una acción no autorizada.

| Módulo | Administrador | Gerente comercial | Representante de ventas | Gerente de proyectos | Solo lectura |
|---|---|---|---|---|---|
| Dashboard | Lectura/escritura | Lectura | Lectura | Lectura | Lectura |
| Prospectos | Total | Total | Total | Sin acceso | Lectura |
| Clientes | Total | Total | Lectura | Lectura | Lectura |
| Oportunidades | Total | Total | Total | Sin acceso | Lectura |
| Actividades | Total | Total | Total | Lectura | Lectura |
| Catálogo | Total | Total | Lectura | Lectura | Lectura |
| Cotizaciones | Total | Total | Total | Lectura | Lectura |
| Proyectos | Total | Lectura | Sin acceso | Total | Lectura |
| Reportes | Total | Lectura | Sin acceso | Lectura | Lectura |
| Usuarios y roles | Total | Sin acceso | Sin acceso | Sin acceso | Sin acceso |
| Configuración empresarial | Total | Sin acceso | Sin acceso | Sin acceso | Sin acceso |

## Principios

- Denegación por defecto para roles no administrativos.
- Autorización en backend aunque la interfaz oculte la acción.
- Separación entre permisos de lectura y escritura.
- Las rutas y el menú se adaptan al rol activo.
- Los administradores y superadministradores conservan acceso total.
