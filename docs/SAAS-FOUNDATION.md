# SaaS Foundation — AdminGest

## Objetivo

Esta fase convierte la arquitectura multiempresa existente en una base SaaS comercial sin introducir todavía un proveedor de pagos.

## Planes iniciales

| Plan     | Usuarios activos | Clientes activos | Proyectos | Almacenamiento | Reportes avanzados | API |
| -------- | ---------------: | ---------------: | --------: | -------------: | ------------------ | --- |
| Starter  |                3 |              100 |        10 |           1 GB | No                 | No  |
| Pro      |               10 |            1,000 |       100 |          10 GB | Sí                 | No  |
| Business |               50 |           10,000 |     1,000 |          50 GB | Sí                 | Sí  |

Los precios permanecen en 0 de forma intencional hasta integrar billing y definir la estrategia comercial definitiva.

## Provisionamiento

Cada empresa creada mediante POST /api/auth/register recibe automáticamente un plan Starter, estado TRIAL y 14 días de prueba.
La migración también provisiona un trial Starter para empresas existentes que todavía no tengan suscripción.

## Enforcement

Los límites se validan en la API al crear usuarios activos, clientes activos o proyectos y al reactivar un
usuario. La verificación y el alta ocurren en la misma transacción, protegida por un bloqueo de aplicación
de SQL Server (`sp_getapplock`) por empresa y recurso, de modo que solicitudes simultáneas no superan la
cuota (probado con 6-8 solicitudes paralelas en CI).
Al llegar al límite, la API responde 403 Forbidden. Una suscripción `SUSPENDED` o `CANCELED`, un trial
expirado o una suscripción `ACTIVE` cuyo `currentPeriodEnd` ya pasó impiden nuevas altas.

Solo se aplican técnicamente los límites de usuarios, clientes y proyectos. `storageMb`, `advancedReports` y
`apiAccess` son atributos informativos del plan en v1.2.0 (la API los devuelve en `informativeFeatures`).

## Consulta administrativa

GET /api/subscriptions/current devuelve estado, vigencia, plan, límites, consumo real y capacidad restante del tenant.
El endpoint está restringido a ADMIN y SUPER_ADMIN. Configuración muestra el plan, el estado, el fin de la
prueba, el consumo, los límites y la capacidad restante, sin botones de compra.

## Facturación

AdminGest **no integra cobros**: no hay checkout, pasarela de pago, renovación automática ni historial de
facturación. El plan y el estado de la suscripción los asigna un operador directamente en la base de datos.

## Siguiente etapa

La capa queda preparada para precios definitivos, checkout, proveedor de pagos, renovación, cancelación, upgrades/downgrades, webhooks, historial de facturación y feature flags por plan.
