<p align="center">
  <img src="docs/branding-reference.png" alt="AdminGest" width="720" />
</p>

<p align="center">
  <strong>La gestión inteligente para tu empresa.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/versión-1.0.0-18A66F?style=for-the-badge" alt="Versión 1.0.0" />
  <img src="https://img.shields.io/badge/estado-MVP%20completo-1677E8?style=for-the-badge" alt="MVP completo" />
  <img src="https://img.shields.io/badge/ITLA-2018--C3-0057B8?style=for-the-badge" alt="ITLA 2018-C3" />
</p>

## Descripción

**AdminGest** es una plataforma web multiempresa que integra CRM, ventas, proyectos y operaciones administrativas. Esta versión reconstruye desde cero el antiguo proyecto académico **GestorAdministrativo** con una arquitectura moderna, seguridad JWT, Microsoft SQL Server y una interfaz responsive.

La versión 1.0 ofrece un flujo funcional de extremo a extremo: una empresa puede registrarse, invitar usuarios, captar y convertir prospectos, administrar clientes, mover oportunidades por el pipeline, programar actividades, emitir cotizaciones, gestionar proyectos y controlar compras, inventario y gastos.

## Funcionalidades

| Área | Funcionalidades |
|---|---|
| Seguridad | Registro de empresas, inicio de sesión JWT, hash bcrypt, roles, rate limiting y sesiones con vencimiento |
| Multiempresa | Aislamiento de datos mediante el `companyId` del usuario autenticado; no depende de encabezados manipulables |
| CRM | CRUD de prospectos, estados, prioridades, conversión a cliente, clientes y contactos |
| Ventas | Pipeline configurable, oportunidades, actividades de seguimiento y cotizaciones con ITBIS |
| Proyectos | Proyectos, responsables, tareas jerárquicas, progreso automático, fechas y presupuesto |
| Operaciones | Catálogo, inventario, movimientos, proveedores, órdenes de compra, recepción y gastos |
| Gestión | Dashboard ejecutivo, reportes exportables, usuarios, empresa, notificaciones y auditoría |
| Calidad | Validación de DTO, Swagger, migración SQL versionada, datos demo, pruebas y CI |

## Stack tecnológico

### Frontend

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="42" alt="React" title="React" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="42" alt="TypeScript" title="TypeScript" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="42" alt="Vite" title="Vite" />
</p>

- React 19, TypeScript y Vite.
- React Router, TanStack Query y Lucide React.
- CSS responsive con identidad visual azul y verde.

### Backend y datos

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="42" alt="Node.js" title="Node.js" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-original.svg" width="42" alt="NestJS" title="NestJS" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg" width="42" alt="SQL Server" title="SQL Server" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="42" alt="Prisma" title="Prisma" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="42" alt="Docker" title="Docker" />
</p>

- Node.js 24, NestJS y Prisma ORM.
- Microsoft SQL Server 2022.
- Passport JWT, bcrypt, Helmet y throttling.
- Swagger/OpenAPI, class-validator y Vitest.

## Arquitectura

```text
React + TypeScript
        │
        │ HTTPS / REST + JWT
        ▼
NestJS modular
        │
        ├── autenticación y autorización
        ├── servicios de dominio
        ├── auditoría
        └── Prisma ORM
                 │
                 ▼
        Microsoft SQL Server
```

El token identifica al usuario y su empresa. Todos los servicios filtran y validan entidades relacionadas con ese `companyId`, evitando que un identificador de otra empresa pueda utilizarse en consultas o mutaciones.

## Requisitos

- Node.js 24 LTS y npm 11.
- Docker Desktop, o una instancia de SQL Server 2019 o superior.
- Git.

## Instalación local

### 1. Instalar dependencias

```bash
git clone https://github.com/Jairo0811/AdminGest.git
cd AdminGest
npm ci
```

### 2. Preparar las variables

En PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

En Linux o macOS:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Sustituye `JWT_SECRET` por un valor aleatorio de al menos 32 caracteres antes de usar el sistema fuera de desarrollo.

Configura también:

- `DATABASE_URL` con la contraseña local de SQL Server.
- `SEED_ADMIN_PASSWORD` con una contraseña temporal segura.
- `MSSQL_SA_PASSWORD` en tu terminal antes de iniciar Docker.

Ejemplo en PowerShell:

```powershell
$env:MSSQL_SA_PASSWORD = Read-Host "Contraseña de SQL Server"
```

### 3. Iniciar SQL Server

```bash
docker compose up -d
```

El contenedor auxiliar crea automáticamente la base `AdminGestDb` cuando SQL Server está saludable.

### 4. Migrar y cargar datos demo

```bash
npm run db:generate
npm run db:deploy
npm run db:seed
```

Usuario demo predeterminado:

```text
Correo: admin@admingest.local
Contraseña: el valor local de SEED_ADMIN_PASSWORD
```

El correo puede modificarse mediante `SEED_ADMIN_EMAIL`. La contraseña no posee un valor predeterminado y nunca se versiona.

### 5. Ejecutar

```bash
npm run dev
```

| Servicio | Dirección |
|---|---|
| Aplicación web | `http://localhost:5173` |
| API | `http://localhost:3000/api` |
| Swagger | `http://localhost:3000/docs` |
| Health check | `http://localhost:3000/api/health` |

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia frontend y backend |
| `npm run build` | Genera Prisma Client y compila el monorepositorio |
| `npm run lint` | Ejecuta las reglas de calidad |
| `npm run test` | Ejecuta pruebas de API y frontend |
| `npm run db:generate` | Genera Prisma Client |
| `npm run db:migrate` | Crea una migración durante desarrollo |
| `npm run db:deploy` | Aplica migraciones versionadas |
| `npm run db:seed` | Crea empresa, usuario y datos demo |

## Seguridad

- Las contraseñas se almacenan con bcrypt y nunca se exponen en respuestas.
- Los secretos y credenciales locales permanecen fuera de Git.
- Todas las rutas empresariales requieren JWT.
- Los roles administrativos protegen la gestión de empresa y usuarios.
- La API aplica validación estricta, lista blanca de propiedades, Helmet, CORS y límite de solicitudes.
- Las operaciones relevantes se registran en auditoría.

## Validación del proyecto

```bash
npm run db:generate
npm run lint
npm run test
npm run build
```

GitHub Actions ejecuta estas verificaciones en cada `push` y pull request.

## Origen académico

AdminGest conserva el concepto del proyecto final **GestorAdministrativo**, realizado para **Administración de Proyectos de Software (SOF-013)** en el **Instituto Tecnológico de Las Américas (ITLA)**, período **2018-C3**, con el profesor **Juan Martínez López**.

| Integrante original | Matrícula |
|---|---|
| Francis Jairo Matías Rosario | 2015-2984 |
| Isaías Pérez Moya | 2016-3595 |
| Enmanuel Avilez Valoy | 2016-3789 |
| Diana Caroline Mejía Encarnación | 2016-3796 |
| Andrés Eudoro Pujols | 2016-3917 |
| Alexander Dionicio Mercedes | 2016-3962 |
| Raymundo Eduardo Peña Sánchez | 2016-4276 |

El repositorio original fue eliminado. La implementación actual fue reconstruida completamente por **Jairo Matías** en 2026 como proyecto de portafolio.

## Licencia

Repositorio privado sin licencia pública de distribución.
