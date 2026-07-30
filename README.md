<p align="center">
  <img src="docs/branding-reference.png" alt="AdminGest" width="720" />
</p>

<p align="center">
<img src="https://img.shields.io/badge/ITLA-2018--C3-0057B8?style=for-the-badge" alt="ITLA 2018-C3" />
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

**AdminGest** es una plataforma web multiempresa que centraliza CRM, cotizaciones, agenda comercial y gestión de proyectos. La versión 1.0 convierte la maqueta inicial en un MVP funcional con API segura, persistencia en SQL Server e interfaz responsive.

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

### Frontend

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="42" alt="React" title="React" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="42" alt="TypeScript" title="TypeScript" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="42" alt="Vite" title="Vite" />
</p>

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Lucide React

### Backend

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="42" alt="Node.js" title="Node.js" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg" width="42" alt="NestJS" title="NestJS" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="42" alt="TypeScript" title="TypeScript" />
</p>

- Node.js 22 o 24 LTS
- NestJS 11
- Passport
- JWT
- Swagger/OpenAPI
- `class-validator`
- Helmet
- Rate limiting

### Base de datos y persistencia

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg" width="42" alt="Microsoft SQL Server" title="Microsoft SQL Server" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="42" alt="Prisma ORM" title="Prisma ORM" />
</p>

- Microsoft SQL Server 2022
- Prisma ORM
- Migraciones versionadas
- Modelo relacional multiempresa

### Calidad e infraestructura

<p>
    <img src="https://skillicons.dev/icons?i=docker,git,github" alt="Git, Github y Docker" />
 
</p>

- Docker Compose
- npm workspaces
- ESLint
- Prettier
- Jest
- Vitest
- Testing Library
- GitHub Actions

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

Antes de clonar el proyecto, instala:

- Git.
- Node.js 22 o 24 LTS.
- npm 11.
- Docker Desktop con contenedores Linux habilitados, o una instancia local de SQL Server 2019+.

Comprueba las herramientas:

```bash
git --version
node --version
npm --version
docker --version
```

## Clonar y probar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jairo0811/AdminGest.git
cd AdminGest
```

### 2. Instalar las dependencias

```bash
npm ci
```

Usa `npm install` únicamente cuando necesites actualizar dependencias o regenerar el `package-lock.json`.

### 3. Crear los archivos de entorno

Linux y macOS:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

### 4. Configurar variables sensibles

En `.env` define una contraseña segura para SQL Server:

```env
MSSQL_SA_PASSWORD=TU_CONTRASENA_SEGURA
```

En `apps/api/.env` configura la conexión y los secretos:

```env
DATABASE_URL="sqlserver://localhost:1433;database=AdminGestDb;user=sa;password=TU_CONTRASENA_SEGURA;encrypt=true;trustServerCertificate=true"
JWT_SECRET=UNA_CLAVE_ALEATORIA_DE_AL_MENOS_32_CARACTERES
SEED_ADMIN_PASSWORD=UNA_CONTRASENA_LOCAL_SEGURA
```

No subas estos archivos al repositorio.

### 5. Levantar SQL Server

```bash
docker compose up -d
```

Comprueba el estado del contenedor:

```bash
docker compose ps
```

Si Docker Desktop todavía está iniciando, espera hasta que `docker info` muestre correctamente las secciones `Client` y `Server`.

### 6. Preparar Prisma y la base de datos

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

El seed crea el usuario local:

```text
Correo: admin@example.test
Contraseña: valor definido en SEED_ADMIN_PASSWORD
```

Si `SEED_ADMIN_PASSWORD` queda vacío, el proceso genera una contraseña aleatoria y la muestra una sola vez en la consola.

### 7. Iniciar el proyecto

```bash
npm run dev
```

### 8. Abrir los servicios

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/docs |
| Health check | http://localhost:3000/api/health |

### 9. Validar la instalación

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

| Integrante | Matrícula |
|---|---|
| Francis Jairo Matías Rosario | 2015-2984 |
| Isaías Pérez Moya | 2016-3595 |
| Enmanuel Avilez Valoy | 2016-3789 |
| Diana Caroline Mejía Encarnación | 2016-3796 |
| Andrés Eudoro Pujols | 2016-3917 |
| Alexander Dionicio Mercedes | 2016-3962 |
| Raymundo Eduardo Peña Sánchez | 2016-4276 |

## Información académica

| Información | Detalle |
|---|---|
| Asignatura | Administración de Proyectos de Software (SOF-013) |
| Profesor | Juan Martínez López |
| Institución | Instituto Tecnológico de Las Américas (ITLA) |
| Período Academico | 2018-C3 |
| Tipo | Proyecto Final Grupal |
| Reconstrucción | Julio 2026 |

El trabajo académico original fue grupal. La reconstrucción actual fue desarrollada desde cero por **Jairo Matías**, conservando el contexto de la asignatura y aplicando una arquitectura moderna.

## 🧭 Continuidad académica

AdminGest forma parte de una continuidad de proyectos realizados con el profesor **Juan Martínez López** en el ITLA:

| Orden | Asignatura | Proyecto | Período |
|---:|---|---|---|
| 1 | Diseño Centrado en el Usuario (SOF-010) | [RadioEmisora RD](https://github.com/Jairo0811/RadioEmisora) | 2018-C1 |
| 2 | Administración de Proyectos de Software (SOF-013) | AdminGest / GestorAdministrativo | 2018-C3 |

Esta continuidad refleja la evolución desde una aplicación centrada en experiencia de usuario hacia una plataforma empresarial con arquitectura modular, seguridad, persistencia y gestión de procesos comerciales.

## Licencia

Repositorio privado. No se concede una licencia de distribución pública.
