# Lista de verificación de producción (Cloudflare + Render + Azure SQL)

Se ejecuta **después** de configurar [Render](RENDER.md), [Azure SQL](AZURE-SQL.md) y
[Cloudflare Pages](CLOUDFLARE.md). Usar exclusivamente empresas y usuarios de prueba creados para esta
verificación (por ejemplo `qa-a@…` y `qa-b@…`); no modificar datos de usuarios reales.

**Estado al cierre de v1.2.0:** **pendiente**. No hay backend Render ni base Azure SQL conectados, por lo
que ninguna casilla de producción está marcada. Los mismos flujos están cubiertos en CI con SQL Server 2022
real (integración HTTP y Playwright, ver [TESTING.md](TESTING.md)); esa evidencia **no** sustituye esta
verificación.

## Antes de empezar

- [ ] `https://SERVICIO.onrender.com/api/health` → 200, `version: 1.2.0`.
- [ ] `https://SERVICIO.onrender.com/api/auth/registration` → 403 `DIRECT_ACCESS_FORBIDDEN`.
- [ ] `https://admingest.pages.dev/api/health/ready` → 200 (proxy, API y base conectados).
- [ ] La respuesta de `/api/*` incluye `cache-control: private, no-store, max-age=0`.

## Flujos funcionales

| #   | Verificación                                                                                                | Resultado |
| --- | ----------------------------------------------------------------------------------------------------------- | --------- |
| 1   | AdminGest abre en Cloudflare (`/`, recarga directa de `/login` y `/verify/quote/…`).                        | Pendiente |
| 2   | Disponibilidad de la API (`/api/health` vía Pages).                                                         | Pendiente |
| 3   | Disponibilidad de SQL Server (`/api/health/ready` vía Pages).                                               | Pendiente |
| 4   | Registro de una empresa de prueba autorizada (con `PUBLIC_REGISTRATION=true` temporal o por operador).      | Pendiente |
| 5   | Inicio de sesión; `Set-Cookie` `admingest_refresh` con `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`. | Pendiente |
| 6   | Restauración de sesión al recargar la página.                                                               | Pendiente |
| 7   | Creación de clientes.                                                                                       | Pendiente |
| 8   | Creación de prospectos.                                                                                     | Pendiente |
| 9   | Gestión de oportunidades (pipeline).                                                                        | Pendiente |
| 10  | Registro de actividades.                                                                                    | Pendiente |
| 11  | Creación de cotizaciones (numeración por empresa).                                                          | Pendiente |
| 12  | Cálculo de ITBIS (18 % y exento, con descuento).                                                            | Pendiente |
| 13  | Impresión de cotizaciones.                                                                                  | Pendiente |
| 14  | Verificación pública por QR.                                                                                | Pendiente |
| 15  | Creación de proyectos.                                                                                      | Pendiente |
| 16  | Gestión de tareas.                                                                                          | Pendiente |
| 17  | Cronograma (Gantt).                                                                                         | Pendiente |
| 18  | Reportes y exportaciones.                                                                                   | Pendiente |
| 19  | Plantillas y reglas de automatización.                                                                      | Pendiente |
| 20  | Notificaciones.                                                                                             | Pendiente |
| 21  | Consulta del plan SaaS y cuotas en Configuración.                                                           | Pendiente |
| 22  | Cambio de contraseña (revoca las demás sesiones).                                                           | Pendiente |
| 23  | Revocación de sesiones por dispositivo.                                                                     | Pendiente |
| 24  | Cierre de sesión (la recarga no restaura la sesión).                                                        | Pendiente |
| 25  | Persistencia tras reiniciar la API (**Render → Manual Deploy → Restart service**).                          | Pendiente |

## Aislamiento Empresa A / Empresa B

- [ ] Con la sesión de la empresa B, abrir por URL un cliente, proyecto y cotización de la empresa A → 404.
- [ ] Los listados de B no muestran registros de A.
- [ ] Asignar en B un responsable o cliente de A → rechazado por la API.

## Estados de error

- [ ] Sin `API_ORIGIN` (en una _preview_): el login muestra «El servidor de AdminGest todavía no está
      configurado…» y no «credenciales incorrectas».
- [ ] Servicio Render suspendido: aparece «Conectando con el servidor…» y el login funciona en ~1 minuto.
- [ ] Base pausada o firewall cerrado: «La base de datos no está disponible en este momento».
- [ ] Contraseña incorrecta: «Correo o contraseña incorrectos.» (mismo mensaje exista o no la cuenta).
- [ ] Sesión revocada desde otro dispositivo: aviso de sesión expirada y regreso al login.
- [ ] Rol `VIEWER` sin permiso de edición: acciones ocultas y la API responde 403.

Registrar fecha, commit desplegado y resultado de cada verificación en el PR o en las notas de la release.
