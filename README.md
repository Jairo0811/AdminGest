<p align="center">
  <img src="docs/branding-reference.png" alt="AdminGest" width="720" />
</p>

<p align="center">
    <img src="https://img.shields.io/badge/ITLA-2018--C3-0057B8?style=for-the-badge" alt="ITLA 2018-C3" />
</p>

<p align="center">

  <img src="https://img.shields.io/badge/estado-Release%20Candidate-1677DF?style=for-the-badge" alt="Estado Release Candidate" />
  <img src="https://img.shields.io/badge/versión-próxima%201.0.0-18A96F?style=for-the-badge" alt="Próxima versión 1.0.0" />
  <img src="https://img.shields.io/badge/arquitectura-npm%20workspaces-0F172A?style=for-the-badge" alt="npm workspaces" />
</p>

<p align="center">
  <strong>CRM, proyectos y gestión empresarial en una plataforma web multiempresa.</strong>
</p>

> Estado actual: **AdminGest se encuentra en fase RC3. El núcleo funcional está completo y estable; antes de publicar `v1.0.0` quedan el endurecimiento final de seguridad, la ampliación de pruebas, la revisión controlada de dependencias, la documentación de despliegue y la publicación formal del release.**

## 📘 Descripción

**AdminGest** es una plataforma web multiempresa para centralizar CRM, cotizaciones, agenda comercial, reportes, usuarios y gestión de proyectos. La reconstrucción moderna convierte la maqueta académica original en una aplicación funcional con API segura, persistencia en SQL Server, interfaz responsive y una arquitectura modular preparada para evolucionar.

El proyecto reconstruye de forma independiente el trabajo final **GestorAdministrativo**, realizado para **Administración de Proyectos de Software (SOF-013)** en el ITLA durante **2018-C3**.

## ✨ Funcionalidades principales

### 🤝 CRM y operación comercial

- Registro de empresa e inicio de sesión con JWT.
- Aislamiento de datos por empresa.
- Prospectos con origen, prioridad, responsable y ciclo de conversión.
- Clientes y contactos.
- Pipeline comercial y oportunidades.
- Kanban de oportunidades.
- Actividades: llamadas, correos, reuniones, visitas, tareas y seguimientos.
- Calendario comercial.
- Catálogo de productos y servicios.
- Cotizaciones con descuento configurable e ITBIS fijo del 18%.
- Generación de cotizaciones imprimibles con branding, datos empresariales y resumen financiero.

### 📊 Proyectos y productividad

- Proyectos con cliente, presupuesto, fechas, estado y progreso.
- Tareas, responsables y seguimiento de avance.
- Cronograma visual.
- Importación y exportación CSV compatible con Microsoft Project.
- Impresión de cronograma tipo Gantt.

### 🖥️ Administración y experiencia de usuario

- Dashboard con indicadores, tendencias, gráficos y embudo comercial.
- Reportes ejecutivos.
- Exportación de listados a Excel.
- Impresión y guardado como PDF desde el navegador.
- Navegación avanzada, breadcrumbs, buscador y notificaciones.
- Tema claro y oscuro.
- Sidebar colapsable y diseño responsive.
- Configuración de empresa.
- Validación dominicana de cédula y RNC con formato automático.

### 👤 Usuarios, roles y seguridad funcional

- Gestión de usuarios por empresa.
- Roles:
  - `SUPER_ADMIN`
  - `ADMIN`
  - `SALES_MANAGER`
  - `SALES_REP`
  - `PROJECT_MANAGER`
  - `VIEWER`
- Activación y desactivación de cuentas.
- Prevención de auto-desactivación.
- Restablecimiento administrativo de contraseña.
- Perfil personal.
- Cambio de contraseña verificando la contraseña actual.
- Contraseñas protegidas con bcrypt.
- Auditoría de operaciones sensibles.
- Exclusión de hashes de contraseña de los registros de auditoría.

## 🧰 Stack tecnológico

### ⚛️ Frontend

<p>
  <img src="https://skillicons.dev/icons?i=react,ts,vite,html,css" alt="React, TypeScript, Vite, HTML y CSS" />
</p>

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Lucide React
- Vitest
- Testing Library

### ⚙️ Backend

<p>
  <img src="https://skillicons.dev/icons?i=nodejs,nestjs,ts" alt="Node.js, NestJS y TypeScript" />
</p>

- Node.js
- NestJS 11
- Passport
- JWT
- Swagger/OpenAPI
- `class-validator`
- bcrypt
- Jest

### 🗄️ Base de datos y persistencia

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoftsqlserver/microsoftsqlserver-plain.svg" width="42" alt="Microsoft SQL Server" title="Microsoft SQL Server" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg" width="42" alt="Prisma ORM" title="Prisma ORM" />
</p>

- Microsoft SQL Server 2022
- Prisma ORM 6
- Migraciones versionadas
- Modelo relacional multiempresa

### 🧪 Calidad e infraestructura

<p>
  <img src="https://skillicons.dev/icons?i=docker,npm,git,github,githubactions" alt="Docker, npm, Git, GitHub y GitHub Actions" />
</p>

- npm workspaces
- ESLint
- Prettier
- Jest
- Vitest
- GitHub Actions
- Docker Compose (opcional)

## 🏗️ Arquitectura

```text
React + TypeScript
        │
        │ REST + JWT
        ▼
NestJS modular
        │
        ├── Autenticación y autorización
        ├── CRM y operación comercial
        ├── Proyectos y tareas
        ├── Usuarios y perfil
        ├── Auditoría
        └── Servicios multiempresa
        ▼
Prisma ORM
        │
        ├── SQL Server Express 2022 (recomendado)
        └── SQL Server en Docker Compose (opcional)
```

La solución usa un monorepo con npm workspaces:

```text
AdminGest/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   └── src/
│   └── web/
│       └── src/
├── docs/
├── .github/workflows/
├── docker-compose.yml
├── package.json
└── package-lock.json
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para las decisiones de arquitectura y separación de responsabilidades.

## 🚦 Estado del proyecto

| Área | Estado |
|---|---|
| Arquitectura monorepo | ✅ Completada |
| Frontend React | ✅ Funcional |
| API NestJS | ✅ Funcional |
| SQL Server y Prisma | ✅ Funcionales |
| CRM y pipeline | ✅ Completados |
| Actividades y calendario | ✅ Completados |
| Cotizaciones e ITBIS | ✅ Completados |
| Proyectos y Microsoft Project CSV | ✅ Completados |
| Dashboard y reportes | ✅ Completados |
| Usuarios, roles y perfil | ✅ RC3.1 completado |
| Validación de cédula y RNC | ✅ Completada |
| Pruebas automatizadas | 🟡 Implementadas; cobertura en ampliación |
| Seguridad y dependencias | 🟡 Endurecimiento pendiente |
| Docker y despliegue | 🟡 Soporte disponible; documentación final pendiente |
| Documentación de release | 🟡 En progreso |
| Release `v1.0.0` | ⏳ Pendiente |

## 📋 Requisitos

- Git
- Node.js 22 LTS recomendado
- npm compatible con el `package-lock.json`
- SQL Server Express 2022 recomendado para desarrollo local
- Docker Desktop opcional, solo para el entorno reproducible con Docker Compose

Comprueba las herramientas:

```bash
git --version
node --version
npm --version
```

## 🔀 Modalidades de ejecución

AdminGest mantiene dos modalidades soportadas:

| Modalidad | Recomendación | Uso principal |
|---|---|---|
| SQL Server Express 2022 | ✅ Recomendada | Desarrollo diario, depuración y trabajo con SSMS |
| Docker Compose | Opcional | Entornos reproducibles, incorporación de nuevos desarrolladores y validaciones controladas |

El entorno utilizado principalmente durante el desarrollo de AdminGest es **Windows 11 + SQL Server Express 2022 + Prisma ORM**. Docker se conserva como alternativa compatible, pero no es un requisito obligatorio.

## 🚀 Instalación local recomendada

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jairo0811/AdminGest.git
cd AdminGest
```

### 2. Instalar dependencias

```bash
npm ci
```

### 3. Crear archivos de entorno

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Linux y macOS:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Crear la base de datos

En SQL Server Management Studio o Azure Data Studio:

```sql
CREATE DATABASE AdminGestDb;
GO
```

### 5. Configurar la API

Ejemplo con SQL Server y autenticación SQL:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="sqlserver://127.0.0.1:1433;database=AdminGestDb;user=admingest_app;password=TU_CONTRASENA;encrypt=true;trustServerCertificate=true"
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=UNA_CLAVE_ALEATORIA_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRES_IN=8h
SEED_ADMIN_PASSWORD=UNA_CONTRASENA_LOCAL_SEGURA
```

En Windows también puede utilizarse autenticación integrada si la instalación y el controlador lo permiten:

```env
DATABASE_URL="sqlserver://127.0.0.1:1433;database=AdminGestDb;integratedSecurity=true;trustServerCertificate=true"
```

No subas archivos `.env` ni credenciales reales al repositorio.

### 6. Preparar Prisma y la base de datos

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

El seed público crea un usuario de demostración con el correo definido en el proyecto y la contraseña indicada en `SEED_ADMIN_PASSWORD`. Los datos institucionales o credenciales locales deben mantenerse fuera de Git.

### 7. Iniciar el proyecto

```bash
npm run dev
```

Servicios locales:

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/docs |
| Health check | http://localhost:3000/api/health |

## 🐳 Desarrollo con Docker Compose (opcional)

Docker permite levantar SQL Server de forma reproducible sin reemplazar la instalación local recomendada.

### 1. Configurar la contraseña del contenedor

En el archivo `.env` de la raíz:

```env
MSSQL_SA_PASSWORD=UNA_CONTRASENA_SEGURA_COMPATIBLE_CON_SQL_SERVER
```

### 2. Levantar SQL Server

```bash
docker compose up -d
```

Comprueba el contenedor:

```bash
docker compose ps
```

### 3. Configurar `apps/api/.env`

```env
DATABASE_URL="sqlserver://127.0.0.1:1433;database=AdminGestDb;user=sa;password=UNA_CONTRASENA_SEGURA_COMPATIBLE_CON_SQL_SERVER;encrypt=true;trustServerCertificate=true"
```

### 4. Preparar y ejecutar AdminGest

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Para detener el contenedor:

```bash
docker compose down
```

Los datos persistidos en volúmenes no se eliminan con `docker compose down`. Evita usar `docker compose down -v` salvo que realmente quieras borrar el almacenamiento local del contenedor.

## ✅ Validación técnica

```bash
npm run db:generate
npm run lint
npm run test
npm run build
```

Estado validado durante RC3.1:

- API: 4 suites y 10 pruebas aprobadas.
- Web: 3 archivos y 7 pruebas aprobadas.
- Lint limpio.
- Build de NestJS y Vite exitoso.

## 🛡️ Seguridad

AdminGest implementa actualmente:

- autenticación JWT;
- contraseñas con bcrypt;
- autorización basada en roles;
- aislamiento multiempresa;
- validación de DTO;
- auditoría de operaciones sensibles;
- protección contra auto-desactivación;
- secretos mediante variables de entorno.

Antes de `v1.0.0` está planificado completar:

- revisión controlada de dependencias y vulnerabilidades;
- endurecimiento de encabezados HTTP;
- política CORS por entorno;
- rate limiting definitivo;
- revisión de Swagger en producción;
- sanitización y manejo centralizado de errores;
- mayor cobertura de pruebas de permisos y aislamiento.

## 🇩🇴 Validación dominicana

AdminGest incluye validación de:

- cédula dominicana de 11 dígitos;
- RNC de 9 dígitos;
- máscara y formato automático;
- verificación en frontend y backend;
- almacenamiento normalizado sin guiones.

La implementación de cédula fue adaptada con atribución al proyecto público de OGTIC **Cuenta Única Registry**. Consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## 🗺️ Roadmap hacia `v1.0.0`

- [x] RC3.1 — Usuarios, roles y perfil.
- [ ] RC3.2 — Recuperación de contraseña.
- [ ] RC3.3 — Seguridad y actualización controlada de dependencias.
- [ ] RC3.4 — Testing ampliado, Docker y CI.
- [ ] RC3.5 — Documentación final, changelog y release `v1.0.0`.

## 👥 Equipo académico original

| 👤 Integrante | 🆔 Matrícula |
|---|---|
| 🙎🏻‍♂️ Francis Jairo Matías Rosario | 2015-2984 |
| 🙎🏻‍♂️ Isaías Pérez Moya | 2016-3595 |
| 🙎🏻‍♂️ Enmanuel Avilez Valoy | 2016-3789 |
| 🙎🏻‍♀️ Diana Caroline Mejía Encarnación | 2016-3796 |
| 🙎🏻‍♂️ Andrés Eudoro Pujols | 2016-3917 |
| 🙎🏻‍♂️ Alexander Dionicio Mercedes | 2016-3962 |
| 🙎🏻‍♂️ Raymundo Eduardo Peña Sánchez | 2016-4276 |

## 🎓 Información académica

| Información | Detalle |
|---|---|
| 📖 Asignatura | Administración de Proyectos de Software (SOF-013) |
| 👨‍🏫 Profesor | Juan Martínez López |
| 🏫 Institución | Instituto Tecnológico de Las Américas (ITLA) |
| 📅 Período académico | 2018-C3 |
| 🧑‍🤝‍🧑 Tipo | Proyecto Final Grupal |
| 🛠️ Reconstrucción | Julio 2026 |

El trabajo académico original fue grupal. La reconstrucción moderna fue desarrollada desde cero por **Jairo Matías**, conservando el contexto de la asignatura e incorporando una arquitectura web moderna.

## 🧭 Continuidad académica

| Orden | Asignatura | Proyecto | Período |
|---:|---|---|---|
| 1 | Diseño Centrado en el Usuario (SOF-010) | [RadioEmisora RD](https://github.com/Jairo0811/RadioEmisora) | 2018-C1 |
| 2 | Administración de Proyectos de Software (SOF-013) | AdminGest / GestorAdministrativo | 2018-C3 |

## 📄 Licencia

Repositorio privado. No se concede una licencia de distribución pública.
