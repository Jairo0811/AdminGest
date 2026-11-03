# SaaS Foundation — AdminGest

## Objetivo

Esta fase convierte la arquitectura multiempresa existente en una base SaaS comercial sin introducir todavía un proveedor de pagos.

## Planes iniciales

| Plan | Usuarios activos | Clientes activos | Proyectos | Almacenamiento | Reportes avanzados | API |
|---|---:|---:|---:|---:|---|---|
| Starter | 3 | 100 | 10 | 1 GB | No | No |
| Pro | 10 | 1,000 | 100 | 10 GB | Sí | No |
| Business | 50 | 10,000 | 1,000 | 50 GB | Sí | Sí |

Los precios permanecen en 0 de forma intencional hasta integrar billing y definir la estrategia comercial definitiva.

## Provisionamiento

Cada empresa creada mediante POST /api/auth/register recibe automáticamente un plan Starter, estado TRIAL y 14 días de prueba.
La migración también provisiona un trial Starter para empresas existentes que todavía no tengan suscripción.

## Enforcement

Los límites se validan en la API antes de crear usuarios activos, clientes activos o proyectos.
Al llegar al límite, la API responde 403 Forbidden. Un trial expirado o una suscripción no utilizable también impide nuevas altas de estos recursos.

## Consulta administrativa

GET /api/subscriptions/current devuelve estado, vigencia, plan, límites, consumo real y capacidad restante del tenant.
El endpoint está restringido a ADMIN y SUPER_ADMIN.

## Siguiente etapa

La capa queda preparada para precios definitivos, checkout, proveedor de pagos, renovación, cancelación, upgrades/downgrades, webhooks, historial de facturación y feature flags por plan.
