# AdminGest v1.2.0 — Hardening final y congelamiento

**Estado:** candidata a congelamiento técnico (pendiente de autorización para fusionar y etiquetar).
**Rama:** `chore/final-hardening-freeze-v1.2.0` → `main`.
**Versión anterior publicada:** `v1.0.1`. Las fases 1.1.0 (SaaS Foundation y Production Security) y 1.2.0
(Business Automation) se fusionaron en `main` sin etiqueta; esta versión las consolida junto con el
hardening.

> **Congelado técnicamente** no equivale a **listo para comercialización**. Ver la sección
> [Estado comercial](#estado-comercial).

## 1. Auditoría inicial

Severidad: **P0** explotable con impacto crítico · **P1** defecto grave de seguridad, integridad o
funcionalidad principal · **P2** defecto relevante con impacto limitado · **P3** mejora menor.

| #   | Sev. | Hallazgo                                                                                                                                                                                                                            | Archivo principal                                                       | Impacto                                                                                                    | Solución                                                                                                                                      |
| --- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | P0   | XSS almacenado en el Gantt imprimible: nombres de proyecto y tarea se insertaban sin escapar en HTML escrito en una ventana con el mismo origen.                                                                                    | `apps/web/src/pages/ProjectsPage.tsx`                                   | Un script podía llamar a `/api/auth/refresh` con la cookie del usuario y obtener tokens (toma de cuenta).  | Plantilla `html` con escape obligatorio y tipo `SafeHtml`; CSP con nonce y sin red en toda ventana de impresión.                              |
| 2   | P0   | Identificadores relacionados sin validar el tenant (`ownerId`, `managerId`, `assigneeId`, `parentId`, `catalogItemId`, `pipelineStageId`, `customerId`/`opportunityId` incoherentes).                                               | `opportunities`, `projects`, `activities`, `leads`, `quotes` services   | Asignar usuarios o recursos de otra empresa y recibir sus datos a través de relaciones Prisma (`include`). | Validación en creación y actualización (`common/tenant/tenant-references.ts`) y claves foráneas compuestas `(companyId, id)` en la base.      |
| 3   | P1   | Numeración de cotizaciones por `count + 1`.                                                                                                                                                                                         | `quotes.service.ts`                                                     | Números duplicados o error 500 con solicitudes simultáneas o tras eliminar una cotización.                 | Secuencia por empresa y año (`CompanySequence`) bajo `sp_getapplock`, continuando la numeración existente.                                    |
| 4   | P1   | Cuotas SaaS con condición de carrera (verificar y luego crear).                                                                                                                                                                     | `subscriptions.service.ts`, `customers`, `projects`, `users`            | Dos solicitudes simultáneas superaban el límite del plan.                                                  | `runWithinQuota`: verificación y alta en la misma transacción con bloqueo por empresa y recurso; incluye reactivación de usuarios.            |
| 5   | P1   | La cotización impresa recalculaba ITBIS con 18 % fijo por línea.                                                                                                                                                                    | `QuotesPage.tsx`                                                        | Líneas exentas mostraban ITBIS; el documento contradecía los importes del servidor.                        | Importes por línea persistidos (`discountAmount`, `taxAmount`) y documento construido solo con valores del servidor.                          |
| 6   | P1   | Restricciones `UNIQUE` sobre columnas nulas en SQL Server.                                                                                                                                                                          | `schema.prisma`, migración inicial                                      | Solo podía existir **una** empresa sin RNC y **un** proyecto sin oportunidad en toda la base.              | Índices únicos filtrados (`WHERE ... IS NOT NULL`) en la migración `20261103120000`.                                                          |
| 7   | P1   | `nest build` generaba `dist/src/main.js` (el tsconfig incluía `prisma/`).                                                                                                                                                           | `apps/api/tsconfig.json`                                                | `npm start` y `start:prod` fallaban en producción.                                                         | `tsconfig.build.json`; CI arranca la API desde el build y consulta `/api/health/ready`.                                                       |
| 8   | P1   | `/api/users/me` se resolvía como recurso `users`.                                                                                                                                                                                   | `common/authorization/role-permissions.ts`                              | VIEWER, SALES_REP, SALES_MANAGER y PROJECT_MANAGER no podían ver su perfil ni cambiar su contraseña.       | `/users/me*` pertenece al recurso `profile`.                                                                                                  |
| 9   | P1   | El seed reescribía contraseña, perfil y rol del administrador existente y los límites de los planes.                                                                                                                                | `apps/api/prisma/seed.ts`                                               | Credenciales y datos reales alterados al repetir el seed.                                                  | Seed idempotente con opciones explícitas (`SEED_DEMO_DATA`, `SEED_SYNC_PLANS`, `SEED_RESET_ADMIN_PASSWORD`); nunca reutiliza empresas reales. |
| 10  | P1   | Renovación simultánea desde varias pestañas.                                                                                                                                                                                        | `apps/web/src/api/client.ts`, `AuthContext.tsx`                         | La pestaña rechazada ejecutaba logout y revocaba la sesión recién rotada: se cerraba la sesión en todas.   | Refresh serializado entre pestañas (Web Locks + un reintento); un 401 limpia el estado local sin revocar.                                     |
| 11  | P1   | Caché de consultas no se limpiaba al cerrar o iniciar sesión.                                                                                                                                                                       | `AuthContext.tsx`                                                       | Datos de la sesión anterior (otro usuario u otra empresa) visibles brevemente.                             | `queryClient.clear()` al iniciar, cerrar y perder la sesión; cierre propagado a otras pestañas.                                               |
| 12  | P1   | Política de tokens inconsistente (`JWT_EXPIRES_IN=8h` en ejemplos).                                                                                                                                                                 | `.env.example`, `DEPLOYMENT.md`                                         | Tokens de acceso de larga duración.                                                                        | 15 min por defecto; la API no arranca con más de 1 h. Sesión larga vía refresh rotativo de 7 días.                                            |
| 13  | P1   | Administración de usuarios: un ADMIN podía modificar a un SUPER_ADMIN, la empresa podía quedarse sin administradores y un cambio de rol no revocaba sesiones.                                                                       | `users.service.ts`, `user-policy.ts`                                    | Escalada o pérdida del control administrativo.                                                             | Política explícita con bloqueo transaccional y revocación de sesiones.                                                                        |
| 14  | P2   | Errores Prisma (P2002/P2003/P2025) respondían 500.                                                                                                                                                                                  | `global-exception.filter.ts`                                            | Mensajes poco claros y posible exposición de nombres internos.                                             | Traducción a 409/404/503 sin detalles internos.                                                                                               |
| 15  | P2   | Inyección de fórmulas en el CSV de Microsoft Project.                                                                                                                                                                               | `ms-project-csv.ts`                                                     | Celdas `=...` ejecutadas al abrir el CSV en una hoja de cálculo.                                           | Prefijo `'` en exportación (revertido al importar) y validación previa de todas las filas.                                                    |
| 16  | P2   | `EntityPage` mostraba «No hay resultados» ante errores de API; doble clic duplicaba registros; números vacíos se enviaban como 0; fechas no cargaban al editar.                                                                     | `components/EntityPage.tsx`                                             | Datos duplicados o incorrectos y errores ocultos.                                                          | Estado de error con reintento, guardia contra doble envío, normalización de valores.                                                          |
| 17  | P2   | Modal sin gestión de foco ni etiqueta accesible.                                                                                                                                                                                    | `components/Modal.tsx`                                                  | Navegación por teclado y lector de pantalla deficientes.                                                   | Patrón de diálogo WAI-ARIA completo.                                                                                                          |
| 18  | P2   | Regla CSS global convertía todos los `h1/h2/h3` en flex centrado; celdas de tabla se superponían; el gráfico del dashboard desbordaba en ≤ 390 px; contraste insuficiente (44 nodos); `aria-expanded` inválido en la búsqueda.      | `styles.css`, `dashboard.css`, `accessibility.css`, `AppLayout.tsx`     | Jerarquía visual rota, textos superpuestos y barreras de accesibilidad.                                    | Correcciones puntuales verificadas con Playwright y axe-core en 6 anchos y ambos temas.                                                       |
| 19  | P2   | Configuración no permitía limpiar campos opcionales ni mostraba la suscripción.                                                                                                                                                     | `SettingsPage.tsx`                                                      | Datos obsoletos; administradores sin visibilidad de cuotas.                                                | Campos limpiables (null) y panel de suscripción sin botones de compra.                                                                        |
| 20  | P2   | Notificaciones, Documentos y Flujos sin diseño unificado ni confirmaciones.                                                                                                                                                         | `NotificationsPage.tsx`, `DocumentsPage.tsx`, `WorkflowsPage.tsx`       | Acciones repetitivas o destructivas sin confirmar; campana y bandeja incoherentes.                         | Rediseño con patrones existentes, confirmaciones, filtros, marcar todas y contador coherente.                                                 |
| 21  | P2   | El login anunciaba «Cotizaciones, facturas y pagos».                                                                                                                                                                                | `LoginPage.tsx`                                                         | Funcionalidad inexistente anunciada.                                                                       | Texto corregido.                                                                                                                              |
| 22  | P2   | `react-router-dom` 7.11.0 con avisos de severidad alta.                                                                                                                                                                             | `apps/web/package.json`                                                 | Vulnerabilidades conocidas (principalmente en SSR).                                                        | 7.18.5 (misma versión mayor).                                                                                                                 |
| 23  | P2   | Sin soporte de proxy inverso.                                                                                                                                                                                                       | `bootstrap.ts`                                                          | Detrás de HTTPS todas las solicitudes compartían la IP del proxy (throttling y auditoría).                 | `TRUST_PROXY`.                                                                                                                                |
| 24  | P2   | Documentos referenciaban proyectos eliminados (sin FK).                                                                                                                                                                             | `projects.service.ts`, migración                                        | Referencias huérfanas.                                                                                     | FK compuesta, limpieza en la migración y al eliminar proyectos.                                                                               |
| 25  | P3   | Login revelaba por tiempo de respuesta si un correo existía; descuento mayor que el subtotal se ajustaba en silencio; reasignar actividades no notificaba.                                                                          | `auth.service.ts`, `quote-calculator.ts`, `activities.service.ts`       | Enumeración de cuentas, importes inesperados, avisos omitidos.                                             | Comparación de tiempo constante, rechazo explícito y notificación.                                                                            |
| 26  | P3   | Documentación desactualizada: licencia inexistente citada, enlace roto, contraseña demo fija que no coincidía con el seed, fases marcadas como pendientes.                                                                          | `README.md`, `docs/*`                                                   | Información incorrecta para usuarios y evaluadores.                                                        | Documentación corregida; la licencia requiere decisión del propietario.                                                                       |
| 27  | P3   | Hallazgos del E2E en navegador: el aviso tras cambiar la contraseña se perdía en la redirección (React Router 7 aplica `navigate` como transición) y varios campos tenían nombres accesibles con el texto de sus opciones o ayudas. | `AuthContext.tsx`, `ProfilePage.tsx`, `LoginPage.tsx`, `EntityPage.tsx` | Confirmación invisible; lectores de pantalla con nombres confusos.                                         | Aviso transportado por el contexto de autenticación; `aria-label` explícito en selects y campos con ayuda.                                    |

## 2. Implementación

Los cambios se organizaron en commits por área (ver `git log main..chore/final-hardening-freeze-v1.2.0`):
multiempresa y base de datos, cotizaciones, SaaS y usuarios, seed, build y sesiones, XSS e impresión,
`EntityPage`, módulos y accesibilidad, RBAC, pruebas de integración y E2E, formato, interfaz y dependencias.

### Migración `20261103120000_tenant_integrity_hardening`

- Comprobación previa: si existen referencias entre empresas distintas, la migración **aborta sin cambios**
  (`THROW 51000`). Consulta para localizarlas: las mismas uniones del bloque «Preflight» del archivo
  `migration.sql`.
- Referencias de documentos a proyectos o clientes inexistentes se ponen en `NULL` (no existía FK).
- Índices únicos filtrados para `Company.taxId`, `Customer(companyId, taxId)` y `Project.opportunityId`.
- Claves `(companyId, id)` y 15 claves foráneas compuestas.
- Tabla `CompanySequence` y columnas `QuoteItem.discountAmount` / `taxAmount` (nulas en cotizaciones previas).
- Todo dentro de una transacción con `TRY/CATCH`.

## 3. Evidencia

Todas las ejecuciones se encuentran en GitHub Actions del PR. Resultados del último run verde:

| Validación                                                             | Dónde                               | Resultado                                                         |
| ---------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| `npm ci`, `db:generate`, `db:validate`, `format:check`, `lint`         | CI                                  | ✅                                                                |
| Pruebas unitarias API (Jest)                                           | CI y local                          | ✅ 16 suites, 70 pruebas                                          |
| Pruebas web (Vitest + Testing Library)                                 | CI y local                          | ✅ 9 archivos, 31 pruebas                                         |
| Migraciones desde base limpia (SQL Server 2022)                        | CI `validate`                       | ✅ 7 migraciones                                                  |
| Seed ejecutado dos veces sin modificar al administrador                | CI `validate` + `seed.int-spec`     | ✅                                                                |
| Integración y E2E HTTP sobre SQL Server real                           | CI `validate`                       | ✅ 4 suites, 25 pruebas (aislamiento A/B, sesiones, concurrencia) |
| Actualización v1.1.0 → v1.2.0 con datos heredados                      | CI `migration-upgrade`              | ✅ 3 pruebas + 15 FK compuestas verificadas                       |
| Aborto atómico ante referencias cruzadas existentes                    | CI `migration-upgrade`              | ✅ sin tabla nueva, FK anterior intacta                           |
| API iniciada desde `dist/main.js`, `/api/health` y `/api/health/ready` | CI `validate`                       | ✅ `version: 1.2.0`                                               |
| E2E en navegador (Playwright, Chromium, escritorio y móvil)            | CI `e2e`                            | ✅ 8 pruebas (6 escritorio + 2 móvil), sin reintentos             |
| Build API y web                                                        | CI y local                          | ✅                                                                |
| `npm audit --audit-level=critical`                                     | CI y local                          | ✅ 0 críticas                                                     |
| Revisión visual 320/375/390/768/1024/1440 px × claro/oscuro            | Local (Playwright con API simulada) | ✅ 0 desbordamientos horizontales, 0 scripts ejecutados           |
| axe-core WCAG 2.0/2.1/2.2 A-AA (serious/critical)                      | Local, 375 y 1440 px, ambos temas   | ✅ 0 violaciones tras las correcciones (primera auditoría: 78)    |

Cobertura medida: API unitaria 32 % de líneas (umbrales ≥ 95 % en `quote-calculator`,
`subscription-limits` y `user-policy`); API con integración 64 % (`common/tenant` 93 %); web 33 %
(umbrales ≥ 90 % en `html`, `quote-print` y `gantt-print`). Ver [TESTING.md](TESTING.md).

## 4. Reporte comparativo

| Área          | Antes (v1.1 en `main`)                                        | Después (v1.2.0)                                                              |
| ------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Aislamiento   | Filtros por `companyId` en consultas; referencias sin validar | Validación en API + FKs compuestas; demostrado con dos empresas en SQL Server |
| Impresión     | HTML concatenado; XSS en Gantt                                | Escape obligatorio por tipo + CSP sin red                                     |
| Cotizaciones  | `count + 1`; ITBIS fijo en impresión                          | Secuencia transaccional; importes por línea persistidos                       |
| Cuotas        | Verificación no atómica                                       | Bloqueo por empresa/recurso; probado con 6-8 solicitudes paralelas            |
| Sesiones      | 8 h documentadas; carrera entre pestañas                      | 15 min (máx. 1 h); refresh coordinado; caché limpiada                         |
| Seed          | Reescribía credenciales                                       | Idempotente, sin efectos sobre datos existentes                               |
| Producción    | `npm start` fallaba                                           | Arranque verificado en CI                                                     |
| Pruebas       | 40 unitarias + 16 web, solo mocks                             | 70 + 31 + 28 integración + 8 E2E navegador sobre SQL Server real              |
| Accesibilidad | 78 violaciones graves/críticas (axe, primera auditoría)       | 0                                                                             |
| Formato       | 180 archivos sin formato, no verificado                       | Prettier aplicado y verificado en CI                                          |

**Regresiones evitadas:** la impresión y las exportaciones se conservan; ningún módulo ni dato se eliminó;
la numeración existente continúa (verificado con datos heredados); las cotizaciones anteriores se imprimen
sin inventar importes por línea; el diseño corporativo, temas y navegación se mantienen.

## 5. Cambios que requieren acción al actualizar

1. **`JWT_EXPIRES_IN`**: valores mayores de `1h` (por ejemplo `8h`) impiden iniciar la API con un mensaje
   explícito. Usar `15m`.
2. **Migración**: ejecutar `npm run db:deploy` con respaldo previo. Si aborta por referencias entre
   empresas, revisar y corregir esos registros manualmente y repetir.
3. **Seed**: ya no restablece la contraseña del administrador. Para hacerlo de forma explícita fuera de
   producción: `SEED_RESET_ADMIN_PASSWORD=true SEED_ADMIN_PASSWORD=... npm run db:seed`.
4. **Descuentos**: un descuento mayor que el subtotal responde 400 en lugar de ajustarse.
5. **Proxy inverso**: definir `TRUST_PROXY=1` (o el número de saltos) cuando la API esté detrás de HTTPS.

## 6. Riesgos restantes y limitaciones

| Riesgo / limitación                                                                                                    | Severidad | Decisión                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `npm audit`: `multer` (vía `@nestjs/platform-express`) y Prisma CLI con avisos altos; requieren NestJS 12 / Prisma 7.  | P2        | Aceptado: no hay rutas multipart; Prisma CLI se usa en build/migración. Revisar en la próxima versión mayor. |
| Recordatorios con temporizador dentro del proceso de la API.                                                           | P2        | Aceptado y documentado: sin ejecución mientras la API está detenida; sin outbox ni worker persistente.       |
| Listados completos por empresa con paginación en el cliente.                                                           | P2        | Aceptado para el volumen previsto; paginación de servidor recomendada antes de clientes grandes.             |
| Documentos: solo referencias externas, sin almacenamiento privado.                                                     | P2        | Documentado; la privacidad depende del proveedor externo.                                                    |
| Sin facturación SaaS, cobros ni renovación automática; plan asignado por un operador.                                  | —         | Documentado; la interfaz no muestra botones de compra.                                                       |
| Almacenamiento, reportes avanzados y acceso API del plan son informativos.                                             | —         | Documentado en la API (`informativeFeatures`) y en Configuración.                                            |
| Sin MFA para cuentas privilegiadas.                                                                                    | P2        | Fuera del alcance del congelamiento.                                                                         |
| Accesibilidad verificada con axe-core y pruebas de teclado automatizadas; sin auditoría manual con lector de pantalla. | P3        | No se declara certificación WCAG.                                                                            |
| Pruebas móviles mediante emulación (Pixel 7) y capturas; sin dispositivos físicos.                                     | P3        | Aceptado.                                                                                                    |
| **Licencia**: el repositorio no contiene archivo `LICENSE`.                                                            | —         | **Requiere decisión del propietario.** Sin licencia, se aplican por defecto todos los derechos reservados.   |

## 7. Estado comercial

**CONGELADO TÉCNICAMENTE:** sí, al fusionar este PR con CI verde (funcionalidades definidas, pruebas y
documentación alineadas con el código).

**LISTO PARA COMERCIALIZACIÓN:** no. Requiere además: operación real con clientes piloto, integración de
cobros si se vende por suscripción, infraestructura administrada con HTTPS, respaldos y restauraciones
probadas, monitoreo y alertas, soporte, términos de servicio y política de privacidad, licencia, y la
revisión de requisitos legales y fiscales aplicables. Las cotizaciones **no son facturas ni comprobantes
fiscales** y AdminGest no está autorizado por la DGII para emitir e-CF.

## 8. Checklist de congelamiento

- [x] Sin vulnerabilidades P0 conocidas.
- [x] P1 resueltos.
- [x] Sin fuga de datos entre empresas en las pruebas (API y base de datos).
- [x] Flujos principales probados de principio a fin (HTTP y navegador).
- [x] Frontend y backend compilan.
- [x] Prisma y migraciones validados (base limpia y actualización).
- [x] Pruebas unitarias e integración satisfactorias.
- [x] Pruebas E2E críticas en navegador (8/8 en CI).
- [x] Interfaz validada en móvil y escritorio (capturas y axe-core).
- [x] Sin errores graves de accesibilidad conocidos (axe-core).
- [x] Cotizaciones con importes correctos (servidor, impresión y verificación pública).
- [x] README y CHANGELOG corresponden al código.
- [x] Sin credenciales ni secretos reales en el repositorio (solo valores de CI y ejemplos).
- [x] CI verde (validación, actualización de esquema y E2E).
- [ ] Decisión sobre la licencia.
- [ ] Autorización para fusionar y etiquetar.

## 9. Procedimiento de liberación (requiere autorización)

```bash
# 1. Fusionar el PR en main (squash no recomendado: conserva los commits por área).
git checkout main && git pull --ff-only

# 2. Verificar en main.
npm ci && npm run db:generate && npm run release:check && npm run format:check

# 3. Crear la etiqueta anotada sobre el commit de fusión.
git tag -a v1.2.0 -m "AdminGest v1.2.0 — hardening final y congelamiento"
git push origin v1.2.0
```

El workflow `release.yml` publica la release con los artefactos de API y web y el `CHANGELOG.md`.
Después de publicar, proteger `main` y considerar archivada la línea 1.x salvo correcciones de seguridad.
