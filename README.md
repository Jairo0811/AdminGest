# AdminGest

**La gestión inteligente para tu empresa.**

AdminGest es una reconstrucción independiente del proyecto final realizado para la asignatura **Administración de Proyectos de Software** del ITLA. El repositorio original fue eliminado y esta versión se desarrolla desde cero con una arquitectura moderna, modular y escalable.

## Stack inicial

- Frontend: React, TypeScript y Vite
- Backend: Node.js, NestJS y TypeScript
- Base de datos: PostgreSQL con Prisma ORM
- Servicios complementarios previstos: Firebase Authentication, Storage y Cloud Messaging
- Infraestructura: Docker Compose, pnpm workspaces y GitHub Actions

## Estructura

```text
AdminGest/
├── apps/
│   ├── web/
│   └── api/
├── packages/
├── docs/
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js 24 LTS
- pnpm 10+
- Docker Desktop

## Puesta en marcha

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs
- Health check: http://localhost:3000/api/health

## Estado

> Fase 0 — Inicialización técnica y arquitectura base.
