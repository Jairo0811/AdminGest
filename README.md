<p align="center">
  <img src="docs/branding-reference.png" alt="AdminGest" width="420" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ITLA-2018--C3-0057B8?style=for-the-badge" alt="ITLA 2018-C3">
</p>
<p align="center">
  Plataforma web modular para CRM, administración empresarial y gestión de proyectos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-en%20desarrollo-2563EB?style=for-the-badge" alt="Estado: en desarrollo" />
  <img src="https://img.shields.io/badge/arquitectura-monorepo-0F172A?style=for-the-badge" alt="Arquitectura monorepo" />
  <img src="https://img.shields.io/badge/licencia-no%20definida-64748B?style=for-the-badge" alt="Licencia no definida" />
</p>

---

## 📌 Descripción

**AdminGest** es una plataforma de gestión empresarial concebida para centralizar, en un solo sistema, la relación con clientes, la planificación de proyectos y las operaciones administrativas de una pequeña o mediana empresa.

La solución está diseñada con una arquitectura modular y escalable para evolucionar progresivamente hacia módulos de CRM, proyectos, tareas, ventas, compras, inventario, gastos, reportes, auditoría y notificaciones.

> El proyecto se encuentra actualmente en **Fase 0: inicialización técnica y arquitectura base**. La estructura principal ya está creada, pero los módulos funcionales todavía están en desarrollo.

---

## 🎓 Origen del proyecto

AdminGest surge como una reconstrucción independiente del proyecto final **GestorAdministrativo**, desarrollado originalmente para la asignatura **Administración de Proyectos de Software** del **Instituto Tecnológico de Las Américas (ITLA)**.

El repositorio original fue eliminado posteriormente y el código fuente dejó de estar disponible. Por esa razón, esta versión se diseña y desarrolla completamente desde cero, conservando el contexto académico del proyecto, pero aplicando una arquitectura moderna, buenas prácticas de desarrollo y una visión de producto más profesional.

La identidad visual y el módulo de proyectos también hacen referencia a la asignatura original mediante conceptos como planificación, cronogramas, costos, recursos, tareas, hitos y diagramas de Gantt inspirados en Microsoft Project.

---

## 🎯 Objetivo general

Desarrollar una plataforma web moderna, segura, modular y escalable que permita a las empresas administrar sus clientes, prospectos, proyectos, tareas y operaciones internas desde una única solución.

---

## 🧩 Módulos previstos

| Módulo | Alcance |
|---|---|
| 👥 CRM | Prospectos, clientes, contactos, seguimiento y oportunidades |
| 📁 Proyectos | Alcance, cronograma, recursos, presupuesto, riesgos e hitos |
| ✅ Tareas | Responsables, prioridades, estados, fechas y progreso |
| 🧾 Ventas | Cotizaciones, facturas, pagos y seguimiento comercial |
| 🛒 Compras | Proveedores, órdenes de compra, recepción y pagos |
| 📦 Inventario | Productos, servicios, almacenes y movimientos |
| 💳 Finanzas administrativas | Gastos, cuentas por cobrar y cuentas por pagar |
| 📊 Reportes | Indicadores, gráficas, análisis y exportaciones |
| 🔐 Seguridad | Usuarios, roles, permisos y control de acceso |
| 🧾 Auditoría | Registro de acciones, cambios y trazabilidad |
| 🔔 Notificaciones | Alertas, recordatorios y eventos del sistema |

---

## ✅ Funcionalidades disponibles actualmente

- Monorepositorio con `pnpm workspaces`.
- Aplicación web inicial con React, TypeScript y Vite.
- API REST inicial con NestJS.
- Endpoint de estado de la API.
- Documentación Swagger/OpenAPI.
- PostgreSQL mediante Docker Compose.
- Prisma ORM con entidades iniciales.
- Base multiempresa mediante `companyId`.
- Entidades iniciales para empresas, usuarios, prospectos, proyectos y tareas.
- Interfaz responsive con identidad visual azul y verde.
- Flujo básico de integración continua con GitHub Actions.

---

## 🛠️ Stack tecnológico

### Frontend

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="42" alt="React" title="React" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="42" alt="TypeScript" title="TypeScript" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="42" alt="Vite" title="Vite" />
</p>

- React
- TypeScript
- Vite
- TanStack Query
- React Router
- Lucide React

### Backend

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="42" alt="Node.js" title="Node.js" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg" width="42" alt="NestJS" title="NestJS" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="42" alt="TypeScript" title="TypeScript" />
</p>

- Node.js
- NestJS
- TypeScript
- REST API
- Swagger / OpenAPI
- Class Validator

### Base de datos y persistencia

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="42" alt="PostgreSQL" title="PostgreSQL" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="42" alt="Prisma" title="Prisma" />
</p>

- PostgreSQL
- Prisma ORM
- Migraciones versionadas
- Modelo relacional preparado para multiempresa

### Servicios complementarios previstos

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="42" alt="Firebase" title="Firebase" />
</p>

- Firebase Authentication
- Firebase Storage
- Firebase Cloud Messaging

### Infraestructura y herramientas

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="42" alt="Docker" title="Docker" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="42" alt="GitHub" title="GitHub" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="42" alt="Git" title="Git" />
</p>

- Docker
- Docker Compose
- pnpm
- Git
- GitHub
- GitHub Actions

---

## 🏗️ Arquitectura

```text
React + TypeScript
        │
        │ HTTPS / REST
        ▼
NestJS + Node.js
        │
        ├── PostgreSQL
        ├── Prisma ORM
        ├── Firebase Authentication
        ├── Firebase Storage
        └── Firebase Cloud Messaging
```

La solución utiliza un enfoque de monorepositorio con separación entre frontend, backend, persistencia, documentación y paquetes compartidos.

Cada entidad empresarial se prepara con `companyId` para facilitar el aislamiento de datos y una futura evolución multiempresa.

---

## 📂 Estructura del repositorio

```text
AdminGest/
├── apps/
│   ├── web/                     # Frontend React
│   │   └── src/
│   └── api/                     # Backend NestJS
│       ├── src/
│       └── prisma/
├── packages/                    # Código compartido futuro
├── docs/                        # Arquitectura y material visual
├── .github/
│   └── workflows/               # Integración continua
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 📋 Requisitos

- Node.js 24 LTS
- pnpm 10 o superior
- Docker Desktop
- Git

---

## ⚙️ Configuración inicial

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jairo0811/AdminGest.git
cd AdminGest
```

### 2. Crear los archivos de entorno

#### Windows PowerShell

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

#### Linux / macOS

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Levantar PostgreSQL

```bash
docker compose up -d
```

### 4. Instalar dependencias

```bash
pnpm install
```

### 5. Preparar Prisma

```bash
pnpm db:generate
pnpm db:migrate
```

### 6. Ejecutar el proyecto

```bash
pnpm dev
```

---

## 🌐 Servicios locales

| Servicio | Dirección |
|---|---|
| Frontend | `http://localhost:5173` |
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/docs` |
| Health Check | `http://localhost:3000/api/health` |

---

## 🔐 Variables de entorno

### API

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://admingest:admingest_dev@localhost:5432/admingest?schema=public"
CORS_ORIGIN=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:3000/api
```

Las credenciales reales y los secretos no deben incluirse en el repositorio.

---

## 🗺️ Roadmap

- [x] Fase 0 — Arquitectura inicial y monorepositorio
- [x] Fase 0 — Frontend y backend base
- [x] Fase 0 — PostgreSQL, Prisma y Docker Compose
- [ ] Fase 1 — Autenticación con Firebase
- [ ] Fase 1 — Usuarios, roles y permisos
- [ ] Fase 2 — Empresas y sucursales
- [ ] Fase 3 — CRM: prospectos, clientes y contactos
- [ ] Fase 4 — Proyectos, tareas, hitos y Gantt
- [ ] Fase 5 — Cotizaciones, ventas y facturación
- [ ] Fase 6 — Compras, inventario y gastos
- [ ] Fase 7 — Reportes, auditoría y notificaciones
- [ ] Fase 8 — Pruebas, seguridad y despliegue

---

## 👨‍🎓 Equipo académico original

| Integrante | Matrícula |
|---|---|
| Francis Jairo Matías Rosario | 2015-2984 |
| Isaías Pérez Moya | 2016-3595 |
| Enmanuel Avilez Valoy | 2016-3789 |
| Diana Caroline Mejía Encarnación | 2016-3796 |
| Andrés Eudoro Pujols | 2016-3917 |
| Alexander Dionicio Mercedes | 2016-3962 |
| Raymundo Eduardo Peña Sánchez | 2016-4276 |

**Asignatura:** Administración de Proyectos de Software  
**Profesor:** Juan Martínez  
**Institución:** Instituto Tecnológico de Las Américas — ITLA

---

## 👨‍💻 Reconstrucción actual

La versión actual de AdminGest es una implementación completamente nueva, diseñada y desarrollada desde cero por **Jairo Matías**, tomando como referencia únicamente el contexto académico y la idea general del proyecto original.

---

## 📄 Licencia

Este repositorio es actualmente privado y no posee una licencia de distribución pública definida.

---

<p align="center">
  <strong>AdminGest</strong><br />
  La gestión inteligente para tu empresa.
</p>
