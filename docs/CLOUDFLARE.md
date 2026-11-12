# AdminGest en Cloudflare Pages

## Arquitectura

- **Cloudflare Pages:** React 19, Vite, rutas SPA y assets.
- **Pages Function `/api/*`:** proxy same-origin hacia la API NestJS mediante `API_ORIGIN`.
- **API NestJS:** corre en un servidor Node.js externo con HTTPS (Render, VPS u otro).
- **SQL Server 2022:** se conecta únicamente a la API; **nunca** al navegador ni a Pages.

Esta integración NO despliega NestJS o SQL Server en Cloudflare. Sin API pública, las rutas
`/api/*` devuelven **503 JSON**, y el login no estará disponible. No se anuncia una demo funcional
sin backend.

## Crear el proyecto en Cloudflare

1. Abre [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages**.
2. Selecciona **Create application** → **Pages** → **Connect to Git**.
3. Autoriza GitHub y selecciona `Jairo0811/AdminGest`.
4. Configura:

| Campo Cloudflare       | Valor                                                  |
| ---------------------- | ------------------------------------------------------ |
| Nombre de proyecto     | `admingest` (si está disponible)                       |
| Rama de producción     | `main` (después de fusionar PR #33 y el PR Cloudflare) |
| Framework preset       | None (configuración manual)                            |
| Root directory         | Raíz del repositorio, `/` (no `apps/web`)              |
| Build command          | `npm run build --workspace @admingest/web`             |
| Build output directory | `apps/web/dist`                                        |
| Variable de build      | `NODE_VERSION=24`                                      |
| Variable de build      | `VITE_API_URL=/api`                                    |

**Importante:** mantener la raíz del repositorio para instalar dependencias de los
`npm workspaces` y detectar `functions/api/[[path]].js`.
El frontend ya contiene `VITE_API_URL=/api` como valor predeterminado. No configurar
`VITE_API_URL` con `localhost`, ni con la URL pública del backend: se utiliza el proxy.

No definas `VITE_PUBLIC_APP_URL` salvo que quieras forzar un dominio canónico para
los QR públicos. Al omitirla, los QR usan el dominio actual (incluidas previews).

## Configurar el proxy/API

En el proyecto Pages, entra a **Settings → Variables and Secrets** y define
**API_ORIGIN** como variable de entorno de runtime en **Production** (y en Preview si
necesitas probar las ramas). Ejemplo ilustrativo:

```env
API_ORIGIN=https://TU_API_NESTJS_PUBLICA
```

No incluye `/api`, rutas, credenciales, query strings ni barra con subruta. Debe usar
HTTPS y responder en `/api/health` y `/api/health/ready`. Si todavía no tienes
API desplegada, deja esta variable sin configurar; Cloudflare mostrará el frontend
pero devolverá 503 a las llamadas de datos.

Pages Function:

- Reenvía métodos, body, cookies, autorización y querystrings a la API.
- Copia la cabecera `Set-Cookie` de NestJS, por lo que el navegador mantiene la cookie
  `HttpOnly; Secure; SameSite=Strict; Path=/api/auth` bajo el dominio de Pages.
- Limpia cabeceras de forwarding proporcionadas por el cliente y utiliza HTTPS.
- Nunca almacena ni expone las credenciales de SQL Server.
- Deshabilita caché para todas las respuestas de `/api/*`.
- Rechaza configuración de backend insegura; no es un proxy abierto.

En el servicio externo NestJS establece, como mínimo:

```env
NODE_ENV=production
JWT_EXPIRES_IN=15m
CORS_ORIGIN=https://TU_SITIO.pages.dev
PASSWORD_RESET_URL=https://TU_SITIO.pages.dev/reset-password
SWAGGER_ENABLED=false
TRUST_PROXY=1
```

Configura además en **el servidor de API, no en Cloudflare**: `DATABASE_URL`,
`JWT_SECRET` aleatorio, `RESEND_API_KEY`, `MAIL_FROM`,
`DOCUMENT_ALLOWED_HOSTS`, y un SQL Server con TLS y respaldos. Ajusta `TRUST_PROXY`
a la cadena real de proxies confiables y restringe el acceso directo a la API cuando
la infraestructura lo permita. El proxy de Pages no sustituye la autenticación ni RBAC.

### Seguridad y privacidad

- **No exponer `DATABASE_URL`, `JWT_SECRET` ni claves privadas como `VITE_*`.**
  Las variables `VITE_*` aparecen en los archivos JS enviados al navegador.
- `API_ORIGIN` debe ser HTTPS y corresponde a infraestructura bajo tu control.
- El proveedor de base de datos debe permitir conexiones privadas/restringidas desde
  el servidor NestJS. No exponer SQL Server 1433 abiertamente a internet.
- Al usar `pages.dev`, el frontend y su proxy ya comparten el origen.
- No establezcas una cookie `Domain=` apuntando al dominio del backend externo.
- Si conectas un dominio propio, actualiza `CORS_ORIGIN` y `PASSWORD_RESET_URL`.
- El código no habilita una versión demo sin persistencia ni credenciales.

## Validación después del despliegue

1. Abre `https://TU_SITIO.pages.dev/` y recarga directamente rutas como `/login`
   y `/verify/quote/CODIGO` (el fallback SPA de Pages funciona sin `404.html`).
2. Sin `API_ORIGIN`: `/api/health` debe responder **503 JSON**, no HTML.
3. Con backend: `/api/health` debe responder 200; `/api/health/ready` comprueba SQL.
4. Comprueba `Set-Cookie` en login, restauración tras refresh y logout.
5. Comprueba CRUD aislado Empresa A/B, cotizaciones y verificación pública QR.
6. Comprueba variables de producción y privacidad; no publicar datos demo reales.
7. Revisa logs y `Functions` en Cloudflare; no hay URL pública confirmada hasta
   que el despliegue aparezca como exitoso.

Prueba local de la función proxy (sin dependencias extra):

```bash
node --test tests/cloudflare-pages-proxy.test.mjs
```

> La release v1.2.0 del PR #33 y este despliegue se revisan por separado.
> No crear tags, no fusionar PRs, no desplegar secretos y no crear servidores de
> pago sin autorización del propietario.
