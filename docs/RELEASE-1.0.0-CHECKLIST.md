# Checklist de publicación — AdminGest v1.0.0

## Código y base de datos

- [ ] `npm ci` finaliza sin errores.
- [ ] `npm run db:generate` finaliza correctamente.
- [ ] `npm run db:validate` aprueba el esquema.
- [ ] `npm run db:deploy` aplica todas las migraciones en una base vacía.
- [ ] `npm run lint` no muestra errores ni advertencias.
- [ ] `npm run test` aprueba todas las suites.
- [ ] `npm run build` genera API y frontend.

## Seguridad

- [ ] No existen secretos reales dentro del repositorio.
- [ ] `JWT_SECRET` tiene al menos 32 caracteres aleatorios.
- [ ] CORS permite únicamente dominios autorizados.
- [ ] Swagger está deshabilitado en producción.
- [ ] HTTPS está habilitado en el proxy inverso.
- [ ] La cuenta SQL Server utiliza privilegios mínimos.
- [ ] Recuperación de contraseña envía correos desde un dominio verificado.
- [ ] `npm audit --audit-level=critical` no reporta vulnerabilidades críticas.

## Pruebas funcionales

- [ ] Registro e inicio de sesión.
- [ ] Recuperación de contraseña y token de un solo uso.
- [ ] Roles, permisos y aislamiento entre empresas.
- [ ] CRUD de prospectos, clientes y oportunidades.
- [ ] Kanban y actividades.
- [ ] Cotización con descuento e ITBIS fijo del 18 %.
- [ ] Exportaciones Excel, PDF y Microsoft Project CSV.
- [ ] Proyectos, tareas y cronograma.
- [ ] Tema claro/oscuro y navegación responsive.
- [ ] Reportes y configuración de empresa.

## Infraestructura

- [ ] Docker Compose levanta SQL Server y supera el healthcheck.
- [ ] GitHub Actions está completamente verde.
- [ ] Los artefactos de API y frontend se generan correctamente.
- [ ] Se verificó restauración de una copia de seguridad.

## Documentación y publicación

- [ ] README refleja la versión final.
- [ ] `CHANGELOG.md` está actualizado.
- [ ] `SECURITY.md` está publicado.
- [ ] `docs/DEPLOYMENT.md` fue validado.
- [ ] Se crearon capturas finales sin información sensible.
- [ ] Se creó el tag `v1.0.0` desde `main`.
- [ ] El workflow Release publicó los artefactos.
