# Pruebas de AdminGest

## Capas

| Capa                        | Herramienta                       | Ubicación                                       | Base de datos               | Comando                                               |
| --------------------------- | --------------------------------- | ----------------------------------------------- | --------------------------- | ----------------------------------------------------- |
| Unitarias API               | Jest                              | `apps/api/src/**/*.spec.ts`, `prisma/*.spec.ts` | No                          | `npm run test --workspace @admingest/api`             |
| Unitarias y componentes web | Vitest + Testing Library (jsdom)  | `apps/web/src/**/*.spec.ts(x)`                  | No (API simulada)           | `npm run test --workspace @admingest/web`             |
| Integración y E2E HTTP      | Jest + supertest + AppModule real | `apps/api/test/integration/*.int-spec.ts`       | **SQL Server real**         | `npm run test:integration --workspace @admingest/api` |
| E2E en navegador            | Playwright (Chromium)             | `apps/web/e2e/*.spec.ts`                        | **SQL Server real** vía API | `npm run test:e2e --workspace @admingest/web`         |
| Actualización de esquema    | GitHub Actions + sqlcmd           | `apps/api/test/migrations/*.sql`                | SQL Server real             | job `migration-upgrade`                               |
| Proxy de Cloudflare Pages   | `node:test` (sin dependencias)    | `tests/cloudflare-pages-proxy.test.mjs`         | No (backend simulado)       | `node --test tests/cloudflare-pages-proxy.test.mjs`   |

Las pruebas de aislamiento multiempresa **no usan mocks**: arrancan el `AppModule` completo (guards,
validación, filtros y Prisma) contra SQL Server 2022.

## Qué demuestran las pruebas de integración

- **Aislamiento Empresa A / Empresa B** (`tenant-isolation`): listados, búsqueda global, lectura,
  edición, eliminación, contactos, catálogo, usuarios, documentos, notificaciones y plantillas de B son
  inaccesibles para A; A no puede asociar responsables, gerentes, etapas, catálogo, clientes,
  oportunidades ni tareas de B; los rechazos no producen cambios parciales; las claves foráneas compuestas
  rechazan inserciones directas que omiten la API.
- **Concurrencia** (`quotas-and-quotes`): 12 cotizaciones simultáneas reciben números únicos y
  consecutivos (también tras eliminar); 8 altas paralelas de clientes, 6 de proyectos y 6 de usuarios no
  superan la cuota; una plantilla aplicada 4 veces en paralelo crea cada tarea una sola vez.
- **Cotizaciones**: ITBIS 18 % y exento por línea, descuento proporcional, totales persistidos y
  verificación pública.
- **Sesiones** (`auth-sessions`): cookie HttpOnly/SameSite=Strict/Path, mensajes idénticos ante credenciales
  incorrectas, rotación, reutilización de tokens, origen no autorizado, revocación por dispositivo, logout,
  logout-all, cambio de contraseña, usuario desactivado, último administrador, permisos por rol, limpieza de
  campos de empresa y salud.
- **Proxy de Cloudflare** (`proxy-access`): con `API_PROXY_SECRET`, las llamadas directas reciben 403
  `DIRECT_ACCESS_FORBIDDEN` (salvo `/api/health` y `/api/health/ready`), la sesión registra la IP del
  visitante enviada por la Function y el límite de 10 inicios de sesión por minuto se aplica por visitante,
  no a todos los usuarios que llegan desde la misma IP de Cloudflare.
- **Registro** (`auth-sessions`): `GET /api/auth/registration` informa la política; las pruebas unitarias
  verifican que con `PUBLIC_REGISTRATION=false` el alta se rechaza antes de tocar la base.
- **Seed** (`seed`): ejecutado dos veces con contraseñas distintas; conserva la primera, el rol y los datos.
- **Actualización** (`upgrade`): datos con el esquema v1.1.0 conservados, referencias huérfanas limpiadas,
  numeración continuada sin repetir y nuevas empresas sin RNC admitidas.

## Ejecutar la integración localmente

```bash
# SQL Server 2022 en Docker (define MSSQL_SA_PASSWORD en el .env raíz)
docker compose up -d
docker exec -it admingest-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C \
  -Q "CREATE DATABASE AdminGestTest"

export NODE_ENV=test THROTTLE_DISABLED=true JWT_SECRET=local-only-secret-with-at-least-32-chars
export DATABASE_URL="sqlserver://localhost:1433;database=AdminGestTest;user=sa;password=$MSSQL_SA_PASSWORD;encrypt=true;trustServerCertificate=true"
export DOCUMENT_ALLOWED_HOSTS=docs.example.com
npm run db:deploy
npm run test:integration --workspace @admingest/api
```

Usa siempre una base desechable: las pruebas crean empresas y modifican suscripciones de prueba.
`THROTTLE_DISABLED` solo tiene efecto fuera de `NODE_ENV=production`.

## E2E en navegador

El job `e2e` despliega migraciones, ejecuta el seed, inicia la API desde `dist/main.js` y el frontend con
`vite preview`, e instala Chromium. Escenarios: inicio de sesión, registro desde la interfaz, CRUD de
clientes con doble clic, cotización exenta, aislamiento A/B, importación CSV con nombres hostiles y Gantt
imprimible sin ejecución de scripts, plantilla, notificaciones, revocación de sesión, cambio de contraseña
y usuario de solo lectura (escritorio y móvil).

## Proxy de Cloudflare y estados de servicio

- `tests/cloudflare-pages-proxy.test.mjs` (CI, job `validate`): 503 `API_NOT_CONFIGURED` sin backend,
  rechazo de orígenes inseguros, todos los métodos con cuerpo JSON, query y `Authorization`, respuestas 204,
  varias `Set-Cookie`, redirecciones sin seguir, `no-store`, ausencia de proxy abierto y envío del secreto e
  IP del visitante solo cuando `API_PROXY_SECRET` está configurado.
- Vitest (`apps/web/src/api/errors.spec.ts`, `LoginPage.spec.tsx`): clasificación de errores (API no
  configurada, servidor no disponible, base de datos, red, sesión expirada, permisos, validación, límite de
  solicitudes), política de reintentos y mensajes de la pantalla de inicio de sesión sin «credenciales
  incorrectas» cuando el problema es el servicio.

## Verificación en producción

Las pruebas anteriores usan SQL Server en contenedor o servicios simulados: **no** son una verificación del
despliegue real. La verificación en Cloudflare + Render + Azure SQL se registra con
[PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md) y está **pendiente** hasta que exista esa infraestructura.

## Cobertura

`npm run test:coverage` genera la cobertura unitaria y `test:integration:coverage` la de integración.

Objetivos aplicados como umbral (el build falla si bajan):

| Módulo                                                      | Umbral                  |
| ----------------------------------------------------------- | ----------------------- |
| `api/src/modules/quotes/quote-calculator.ts`                | 95 % líneas             |
| `api/src/modules/subscriptions/subscription-limits.ts`      | 95 % líneas             |
| `api/src/modules/users/user-policy.ts`                      | 95 % líneas             |
| `api/src/modules/auth/session-tokens.ts`                    | 90 % líneas             |
| `web/src/utils/html.ts`, `quote-print.ts`, `gantt-print.ts` | 90 % líneas y funciones |

Medición del congelamiento: API unitaria 32 % de líneas; API con integración 64 % (`common/tenant` 93 %,
`quotes.service` 90 %, `subscriptions.service` 96 %); web 33 %.

Módulos con cobertura baja o solo cubiertos por E2E: páginas React de Dashboard, Reportes, Oportunidades
(kanban), Actividades (calendario), Usuarios y Perfil; `dashboard.service`, `navigation.service`,
`password-reset-mail.service` (envío real por Resend no se ejecuta en CI) y el escáner periódico de
recordatorios (`scanReminders`, cubierto por pruebas unitarias con mocks).

## Auditoría visual y de accesibilidad

La revisión del congelamiento se ejecutó con Playwright sobre el build de producción y una API simulada con
datos realistas y cadenas hostiles: 16 rutas × 6 anchos (320, 375, 390, 768, 1024, 1440 px) × tema claro y
oscuro, comprobando desbordamiento horizontal, ejecución de scripts y axe-core (WCAG 2.0/2.1/2.2 A y AA,
impacto serious/critical). Resultado final: 0 desbordamientos, 0 scripts ejecutados, 0 violaciones graves o
críticas. No constituye una certificación de accesibilidad.
