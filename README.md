<p align="center">
  <img src="docs/branding-reference.png" alt="AdminGest" width="720" />
</p>

<p align="center">
  <strong>CRM, proyectos y gestión inteligente para tu empresa.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/versión-1.0.0-18A96F?style=for-the-badge" alt="Versión 1.0.0" />
  <img src="https://img.shields.io/badge/estado-MVP%20completo-1677DF?style=for-the-badge" alt="MVP completo" />
  <img src="https://img.shields.io/badge/arquitectura-npm%20workspaces-0F172A?style=for-the-badge" alt="npm workspaces" />
</p>

## Descripción

**AdminGest** es una plataforma web multiempresa que centraliza CRM, cotizaciones, agenda comercial y gestión de proyectos. La versión 1.0 convierte la maqueta inicial en un MVP funcional con API segura, persistencia SQL Server e interfaz responsive.

El proyecto reconstruye de forma independiente el trabajo final **GestorAdministrativo**, realizado para **Administración de Proyectos de Software (SOF-013)** en el ITLA durante **2018-C3**.

## Funcionalidades

- Registro de empresa, inicio de sesión y sesiones JWT.
- Usuarios con roles `ADMIN`, `SALES_MANAGER`, `SALES_REP`, `PROJECT_MANAGER` y `VIEWER`.
- Aislamiento de datos por empresa.
- Prospectos con prioridad, origen, responsable y ciclo de conversión.
- Clientes y contactos.
- Pipeline, oportunidades, valor estimado y probabilidad.
- Llamadas, correos, reuniones, visitas y seguimientos.
- Catálogo de productos y servicios.
- Cotizaciones con descuento, ITBIS y cálculo de totales.
- Proyectos, tareas, responsables, fechas y progreso automático.
- Dashboard, reportes ejecutivos y auditoría.
- Swagger/OpenAPI, validación de entradas, Helmet y rate limiting.
- Pruebas automatizadas y GitHub Actions.

## Stack tecnológico

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router, TanStack Query, Lucide |
| Backend | Node.js 24, NestJS 11, Passport, JWT, Swagger |
| Persistencia | Microsoft SQL Server 2022, Prisma ORM |
| Calidad | ESLint, Prettier, Jest, Vitest, Testing Library |
| Infraestructura | Docker Compose, npm workspaces, GitHub Actions |

## Arquitectura

```text
React + TypeScript
        │
        │ HTTPS / REST + JWT
        ▼
NestJS modular
        │
        ├── Autenticación y roles
        ├── Servicios multiempresa
        ├── Auditoría
        ▼
Prisma ORM ── Microsoft SQL Server 2022
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para las decisiones y límites entre capas.

## Requisitos

- Node.js 22 o 24 LTS.
- npm 11.
- Docker Desktop o SQL Server 2019+.

## Instalación

```bash
git clone https://github.com/Jairo0811/AdminGest.git
cd AdminGest
npm install
```

Crea los archivos de entorno:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Define una contraseña segura para SQL Server en `.env`, actualiza `DATABASE_URL` con ese mismo valor y genera un secreto JWT de al menos 32 caracteres.

## Base de datos

Inicia SQL Server:

```bash
docker compose up -d
```

Prepara la base y los datos iniciales:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

El seed crea el usuario local `admin@example.test`. Si `SEED_ADMIN_PASSWORD` está vacío, genera una contraseña aleatoria y la muestra una sola vez en la consola.

```text
Correo: admin@example.test
```

Estas credenciales son únicamente para desarrollo.

## Ejecución

```bash
npm run dev
```

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/docs |
| Health check | http://localhost:3000/api/health |

## Validación

```bash
npm run db:validate
npm run lint
npm run test
npm run build
```

El workflow de CI ejecuta estas validaciones en cada pull request hacia `main` o `develop`.

## Estructura

```text
AdminGest/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   └── src/modules/
│   └── web/
│       └── src/
├── docs/
├── .github/workflows/
├── docker-compose.yml
└── package-lock.json
```

## Equipo académico original

| Integrante |
|---|
| Francis Jairo Matías Rosario |
| Isaías Pérez Moya |
| Enmanuel Avilez Valoy |
| Diana Caroline Mejía Encarnación |
| Andrés Eudoro Pujols |
| Alexander Dionicio Mercedes |
| Raymundo Eduardo Peña Sánchez |

## Información académica

| Información | Detalle |
|---|---|
| Asignatura | Administración de Proyectos de Software (SOF-013) |
| Profesor | Juan Martínez López |
| Institución | Instituto Tecnológico de Las Américas (ITLA) |
| Período | 2018-C3 |
| Tipo | Proyecto final grupal |
| Reconstrucción | 2026 |

El trabajo académico original fue grupal. La reconstrucción actual fue desarrollada desde cero por **Jairo Matías**, conservando el contexto de la asignatura y aplicando una arquitectura moderna.

## Licencia

Repositorio privado. No se concede una licencia de distribución pública.
