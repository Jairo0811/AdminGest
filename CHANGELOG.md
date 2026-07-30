# Changelog

Todos los cambios relevantes de AdminGest se documentan en este archivo.

## 1.0.0 — 2026-07-30

### Añadido

- Autenticación JWT, registro de empresas e inicio de sesión.
- Usuarios, roles y permisos administrativos.
- Aislamiento multiempresa obtenido desde la sesión autenticada.
- CRUD de prospectos, clientes, contactos, oportunidades y actividades.
- Pipeline comercial configurable por empresa.
- Catálogo de productos y servicios.
- Cotizaciones con líneas, descuentos, impuestos y totales automáticos.
- Proyectos, tareas, progreso y responsables.
- Dashboard ejecutivo, reportes y registro de auditoría.
- Interfaz React responsive con rutas protegidas.
- SQL Server 2022, Prisma, datos iniciales y Docker Compose.
- Pruebas unitarias y de interfaz.
- CI con validación de Prisma, lint, pruebas y build.
- Instalación reproducible mediante npm workspaces y `package-lock.json`.
- Seed seguro con contraseña aleatoria o variable de entorno.

### Corregido

- Eliminada la dependencia funcional del encabezado inseguro `x-company-id`.
- Alineada toda la documentación técnica con Microsoft SQL Server.
- Declaradas las dependencias directas que faltaban para ESLint y pruebas.
