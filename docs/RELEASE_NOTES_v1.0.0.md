# AdminGest 1.0.0

AdminGest 1.0.0 consolida la reconstrucción del proyecto académico como un CRM web multiempresa listo para portafolio y evolución comercial.

## Experiencia ejecutiva

- Dashboard Premium con KPIs reales y variación porcentual.
- Evolución comercial de seis meses.
- Embudo por etapa y valor del pipeline.
- Actividades próximas y oportunidades recientes.
- Tema oscuro persistente y detección inicial del sistema.

## Navegación

- Sidebar colapsable con preferencia persistente.
- Búsqueda global de prospectos, clientes, oportunidades, proyectos y cotizaciones.
- Breadcrumbs contextuales.
- Menú de usuario.
- Panel real de notificaciones derivado de actividades, vencimientos y proyectos próximos.

## Funcionalidades profesionales

- Exportación de listados a Excel compatible.
- Exportación imprimible y guardado como PDF.
- Cotizaciones profesionales imprimibles.
- Búsqueda, filtros por estado y paginación.
- Vista Kanban de oportunidades con arrastrar y soltar.
- Calendario mensual de actividades.
- Cronograma visual de proyectos.

## Calidad

- Pruebas unitarias para validación de entorno y exportaciones.
- Smoke test E2E de autenticación, dashboard y navegación.
- CI con Node.js 22, Prisma, formato, lint, pruebas, build, auditoría y artefactos.
- Job E2E con SQL Server 2022 real.
- Validación estricta de variables de entorno.
- Política de seguridad documentada.

## Instalación

- Docker Compose continúa disponible.
- Se documenta el método con SQL Server local para Windows.

Consulta:

- [Guía de usuario](USER_GUIDE.md)
- [SQL Server local](LOCAL_SQL_SERVER.md)
- [Arquitectura](ARCHITECTURE.md)
- [Política de seguridad](../SECURITY.md)

## Validación previa al release

```bash
npm ci
npm run db:generate
npm run db:validate
npm run format:check
npm run lint
npm run test
npm run build
```

Con API y base de datos activas:

```bash
npm run test:e2e
```

## Estado

Esta rama se considera **Release Candidate** hasta completar la validación local, revisar GitHub Actions y fusionar el pull request correspondiente. La etiqueta `v1.0.0` debe crearse únicamente después de que CI esté en verde.
