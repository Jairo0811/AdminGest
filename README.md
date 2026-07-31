<p align="center">
  <img src="docs/branding-reference.png" alt="AdminGest" width="720" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ITLA-2018--C3-0057B8?style=for-the-badge" alt="ITLA 2018-C3" />
  <img src="https://img.shields.io/badge/estado-Estable-18A96F?style=for-the-badge" alt="Estado estable" />
  <img src="https://img.shields.io/badge/versión-1.0.1-1677DF?style=for-the-badge" alt="Versión 1.0.1" />
  <img src="https://img.shields.io/badge/arquitectura-Monorepo-0F172A?style=for-the-badge" alt="Arquitectura monorepo" />
</p>

<p align="center">
  <strong>CRM, proyectos, cotizaciones y gestión empresarial en una plataforma web multiempresa.</strong>
</p>

<p align="center">
  React · NestJS · Prisma · SQL Server · Docker · GitHub Actions
</p>

> **Estado actual:** AdminGest se encuentra en su versión estable `v1.0.1`. El núcleo funcional, la seguridad, las pruebas, la automatización de CI/CD, Docker, la documentación y la verificación pública de cotizaciones mediante QR están completados.

## 📘 Descripción

**AdminGest** es una plataforma web multiempresa orientada a la gestión comercial, administrativa y de proyectos. Centraliza prospectos, clientes, oportunidades, actividades, cotizaciones, reportes, usuarios, roles y proyectos en una sola solución moderna.

El proyecto reconstruye de forma independiente el trabajo final académico **GestorAdministrativo**, desarrollado para la asignatura **Administración de Proyectos de Software (SOF-013)** del Instituto Tecnológico de Las Américas (ITLA), período **2018-C3**.

La versión actual transforma aquella propuesta académica en una aplicación funcional, modular, segura y preparada para despliegue profesional.

## ✨ Funcionalidades principales

### 🤝 CRM y operación comercial

- Registro de empresa e inicio de sesión con JWT.
- Aislamiento de datos por empresa.
- Gestión de prospectos con origen, prioridad, responsable y ciclo de conversión.
- Gestión de clientes y contactos.
- Pipeline comercial configurable.
- Oportunidades con valor estimado, probabilidad y fecha esperada de cierre.
- Vista Kanban de oportunidades.
- Actividades comerciales: llamadas, correos, reuniones, visitas, tareas y seguimientos.
- Calendario comercial.
- Catálogo de productos y servicios.

### 🧾 Cotizaciones profesionales

- Creación de cotizaciones con uno o varios conceptos.
- Descuento configurable.
- ITBIS fijo del 18 %.
- Cálculo automático de subtotal, descuento, base imponible, impuesto y total.
- Documento imprimible con branding corporativo.
- Guardado como PDF desde el navegador.
- Código QR de autenticidad dentro del documento.
- Logo oficial de AdminGest incrustado dentro del QR.
- Código público UUID único y no predecible por cotización.
- Página pública de verificación sin necesidad de iniciar sesión.
- Validación de estado, empresa emisora, cliente, fechas e importes.
- URL pública configurable mediante `VITE_PUBLIC_APP_URL`.

### 📊 Proyectos y productividad

- Proyectos asociados a clientes y oportunidades.
- Presupuesto, fechas, estado y progreso.
- Gestión de tareas y responsables.
- Jerarquía de tareas.
- Cronograma visual.
- Impresión de cronograma tipo Gantt.
- Importación y exportación CSV compatible con Microsoft Project.

### 🖥️ Administración y experiencia de usuario

- Dashboard ejecutivo con KPIs, tendencias, gráficos y embudo comercial.
- Reportes ejecutivos.
- Exportación de listados a Excel.
- Impresión y exportación PDF desde el navegador.
- Navegación avanzada con breadcrumbs.
- Buscador y notificaciones.
- Tema claro y oscuro.
- Sidebar colapsable.
- Diseño responsive.
- Configuración de empresa.
- Validación dominicana de cédula y RNC.

### 👤 Usuarios, roles y perfil

- Gestión de usuarios por empresa.
- Roles disponibles:
  - `SUPER_ADMIN`
  - `ADMIN`
  - `SALES_MANAGER`
  - `SALES_REP`
  - `PROJECT_MANAGER`
  - `VIEWER`
- Activación y desactivación de cuentas.
- Prevención de auto-desactivación.
- Perfil personal.
- Cambio de contraseña verificando la contraseña actual.
- Restablecimiento administrativo de contraseña.
- Recuperación de contraseña mediante enlace temporal.
- Cierre automático de sesión al expirar el JWT.

## 🛡️ Seguridad

AdminGest incorpora:

- autenticación JWT;
- contraseñas protegidas con bcrypt;
- autorización basada en roles;
- aislamiento multiempresa;
- recuperación de contraseña con tokens aleatorios de un solo uso;
- almacenamiento exclusivo del hash SHA-256 del token;
- expiración automática de enlaces de recuperación;
- invalidación de solicitudes anteriores;
- rate limiting global y específico para autenticación y rutas públicas;
- Helmet y encabezados HTTP endurecidos;
- CORS configurable por entorno;
- validación estricta de DTO;
- rechazo de propiedades desconocidas;
- eliminación de `X-Powered-By`;
- Swagger deshabilitado por defecto en producción;
- manejo global y uniforme de errores;
- auditoría de operaciones sensibles;
- secretos gestionados mediante variables de entorno.

Consulta [SECURITY.md](SECURITY.md) para la política completa.

## 🇩🇴 Validación dominicana

AdminGest valida:

- cédula dominicana de 11 dígitos;
- RNC de 9 dígitos;
- máscara y formato automático;
- validación en frontend y backend;
- almacenamiento normalizado sin guiones.

La implementación de cédula fue adaptada con atribución al proyecto público de OGTIC **Cuenta Única Registry**. Consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

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
- QRCode
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
- Docker Compose
- Workflows de CI y Release

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
        ├── Cotizaciones y verificación pública
        ├── Proyectos y tareas
        ├── Usuarios y perfil
        ├── Auditoría
        └── Servicios multiempresa
        ▼
Prisma ORM
        │
        ├── SQL Server Express 2022
        └── SQL Server en Docker Compose
```

La solución utiliza un monorepo con npm workspaces:

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
| Verificación QR pública | ✅ Completada en `v1.0.1` |
| Proyectos y Microsoft Project CSV | ✅ Completados |
| Dashboard y reportes | ✅ Completados |
| Usuarios, roles y perfil | ✅ Completados |
| Recuperación de contraseña | ✅ Completada |
| Validación de cédula y RNC | ✅ Completada |
| Seguridad | ✅ Endurecida |
| Pruebas automatizadas | ✅ Implementadas |
| Docker | ✅ Compatible |
| GitHub Actions | ✅ CI y release automatizados |
| Documentación | ✅ Actualizada |
| Release estable | ✅ `v1.0.1` |

## 📋 Requisitos

- Git
- Node.js 22 o superior
- npm compatible con el `package-lock.json`
- SQL Server Express 2022 recomendado para desarrollo local
- Docker Desktop opcional para entornos reproducibles

Comprueba las herramientas:

```bash
git --version
node --version
npm --version
```

## 🔀 Modalidades de ejecución

| Modalidad | Recomendación | Uso principal |
|---|---|---|
| SQL Server Express 2022 | ✅ Recomendada | Desarrollo diario, depuración y trabajo con SSMS |
| Docker Compose | Opcional | Entornos reproducibles, incorporación de desarrolladores y validación de infraestructura |

El entorno principal utilizado durante el desarrollo fue **Windows 11 + SQL Server Express 2022 + Prisma ORM**. Docker se conserva como alternativa compatible.

## 🚀 Instalación local

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

Ejemplo con autenticación SQL:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="sqlserver://127.0.0.1:1433;database=AdminGestDb;user=admingest_app;password=TU_CONTRASENA;encrypt=true;trustServerCertificate=true"
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=UNA_CLAVE_ALEATORIA_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRES_IN=8h
SWAGGER_ENABLED=true
SEED_ADMIN_PASSWORD=UNA_CONTRASENA_LOCAL_SEGURA
PASSWORD_RESET_URL=http://localhost:5173/reset-password
RESEND_API_KEY=
MAIL_FROM=AdminGest <no-reply@tu-dominio.com>
```

En Windows también puede utilizarse autenticación integrada si la instalación y el controlador lo permiten:

```env
DATABASE_URL="sqlserver://127.0.0.1:1433;database=AdminGestDb;integratedSecurity=true;trustServerCertificate=true"
```

### 6. Configurar el frontend

```env
VITE_API_URL=http://localhost:3000/api
VITE_PUBLIC_APP_URL=http://localhost:5173
```

`VITE_PUBLIC_APP_URL` se utiliza para construir la URL del QR de verificación. En producción debe apuntar al dominio público real de AdminGest.

### 7. Preparar Prisma y la base de datos

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

El seed público crea un usuario de demostración utilizando la contraseña indicada en `SEED_ADMIN_PASSWORD`. No subas credenciales reales ni archivos `.env` al repositorio.

### 8. Iniciar el proyecto

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
| Verificación pública | http://localhost:5173/verify/quote/{publicCode} |

## 🐳 Docker Compose

Docker permite levantar SQL Server de forma reproducible sin reemplazar la instalación local recomendada.

### Configurar la contraseña

En el `.env` de la raíz:

```env
MSSQL_SA_PASSWORD=UNA_CONTRASENA_SEGURA_COMPATIBLE_CON_SQL_SERVER
```

### Levantar el entorno

```bash
docker compose up -d
docker compose ps
```

Configura `apps/api/.env`:

```env
DATABASE_URL="sqlserver://127.0.0.1:1433;database=AdminGestDb;user=sa;password=UNA_CONTRASENA_SEGURA_COMPATIBLE_CON_SQL_SERVER;encrypt=true;trustServerCertificate=true"
```

Prepara y ejecuta:

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

Los volúmenes no se eliminan con `docker compose down`. Evita `docker compose down -v` salvo que realmente quieras borrar el almacenamiento local.

## ✅ Validación técnica

Validación completa:

```bash
npm run db:generate
npm run db:validate
npm run lint
npm run test
npm run build
```

Validación de release:

```bash
npm run release:check
```

Estado validado para `v1.0.1`:

- API: 6 suites y 17 pruebas aprobadas.
- Web: 5 archivos y 12 pruebas aprobadas.
- Total: 29 pruebas aprobadas.
- Prisma generate y validate aprobados.
- Migraciones SQL Server aplicadas correctamente.
- Lint limpio.
- Build de NestJS y Vite exitoso.
- QR con logo escaneado correctamente.
- Página pública de autenticidad validada manualmente.

## 🔄 Integración continua y releases

El workflow de CI ejecuta:

- instalación reproducible con `npm ci`;
- generación y validación de Prisma;
- SQL Server 2022 real como servicio;
- creación de base de datos;
- despliegue de migraciones;
- lint;
- pruebas;
- build;
- auditoría de vulnerabilidades críticas;
- publicación de artefactos.

El workflow de Release se activa mediante tags `v*` y genera:

- paquete compilado de la API;
- paquete compilado del frontend;
- GitHub Release con notas automáticas.

## 📦 Versiones

### `v1.0.1`

- Verificación pública de cotizaciones.
- Código QR dentro del PDF.
- Logo oficial incrustado en el QR.
- Código público único por cotización.
- Endpoint público con rate limiting.
- Página responsive de autenticidad.

### `v1.0.0`

- Primera versión estable completa.
- CRM, proyectos, cotizaciones, reportes, seguridad, recuperación de contraseña, Docker, CI/CD y documentación.

Consulta [CHANGELOG.md](CHANGELOG.md) para el historial detallado.

## 🗺️ Roadmap completado

- [x] RC1 — Experiencia visual, dashboard y navegación.
- [x] RC2 — Exportaciones, Kanban, calendario y cronograma.
- [x] RC3.1 — Usuarios, roles y perfil.
- [x] RC3.2 — Recuperación de contraseña.
- [x] RC3.3 — Seguridad y dependencias.
- [x] RC3.4 — Testing, Docker y CI.
- [x] RC3.5 — Documentación y release `v1.0.0`.
- [x] `v1.0.1` — Verificación QR de cotizaciones.

El MVP se considera completado. Las siguientes mejoras deberán desarrollarse en versiones evolutivas como `v1.1.0` o `v2.0.0`.

## 👥 Equipo académico original

| 👤 Integrante | 🆔 Matrícula |
|---|---|
| 👨🏻‍💻 Francis Jairo Matías Rosario | 2015-2984 |
| 👨🏻‍💻 Isaías Pérez Moya | 2016-3595 |
| 👨🏻‍💻 Enmanuel Avilez Valoy | 2016-3789 |
| 👩🏻‍💻 Diana Caroline Mejía Encarnación | 2016-3796 |
| 👨🏻‍💻 Andrés Eudoro Pujols | 2016-3917 |
| 👨🏻‍💻 Alexander Dionicio Mercedes | 2016-3962 |
| 👨🏻‍💻 Raymundo Eduardo Peña Sánchez | 2016-4276 |

## 🎓 Información académica

| Información | Detalle |
|---|---|
| 📖 Asignatura | Administración de Proyectos de Software (SOF-013) |
| 🏫 Institución | Instituto Tecnológico de Las Américas (ITLA) |
| 📅 Período académico | 2018-C3 |
| 🧩 Proyecto original | GestorAdministrativo |
| 🚀 Reconstrucción moderna | AdminGest |

## 📚 Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Recuperación de contraseña](docs/RC3.2-PASSWORD-RECOVERY.md)
- [Checklist de pruebas RC3.2](docs/RC3.2-TEST-CHECKLIST.md)
- [Cierre de RC3](docs/RC3-COMPLETION.md)
- [Checklist del release 1.0.0](docs/RELEASE-1.0.0-CHECKLIST.md)
- [Política de seguridad](SECURITY.md)
- [Avisos de terceros](THIRD_PARTY_NOTICES.md)
- [Historial de cambios](CHANGELOG.md)

## 📄 Licencia

Este repositorio conserva el contexto académico original y su reconstrucción moderna. Revisa la licencia y los avisos de terceros antes de reutilizar componentes fuera de este proyecto.
