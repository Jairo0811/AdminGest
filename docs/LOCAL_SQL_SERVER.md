# Ejecutar AdminGest con SQL Server local

Esta guía permite probar AdminGest en Windows sin Docker.

## Requisitos

- Node.js 22 o superior.
- npm 11.
- SQL Server 2019 o 2022.
- `sqlcmd` o SQL Server Management Studio.
- Git.

## 1. Verificar SQL Server

```powershell
Get-Service |
  Where-Object {
    $_.Name -like "MSSQL*" -or
    $_.DisplayName -like "*SQL Server*"
  } |
  Select-Object Status, Name, DisplayName
```

Prueba la instancia predeterminada:

```powershell
sqlcmd -S localhost -E -Q "SELECT @@VERSION"
```

Para SQL Server Express:

```powershell
sqlcmd -S ".\SQLEXPRESS" -E -Q "SELECT @@VERSION"
```

## 2. Clonar e instalar

```powershell
git clone https://github.com/Jairo0811/AdminGest.git
cd AdminGest
npm ci
```

## 3. Crear los archivos de entorno

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Configura `apps/api/.env`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="sqlserver://localhost:1433;database=AdminGestDb;integratedSecurity=true;trustServerCertificate=true"
JWT_SECRET=CAMBIA_ESTA_CLAVE_POR_UNA_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRES_IN=8h
SEED_ADMIN_PASSWORD=CAMBIA_ESTA_CONTRASENA_LOCAL
CORS_ORIGIN=http://localhost:5173
```

Configura `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

## 4. Crear la base de datos

```powershell
sqlcmd -S localhost -E -Q "IF DB_ID('AdminGestDb') IS NULL CREATE DATABASE AdminGestDb"
```

## 5. Preparar Prisma

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

Para un entorno ya desplegado utiliza:

```powershell
npm run db:deploy
```

## 6. Validar

```powershell
npm run lint
npm run test
npm run build
```

## 7. Ejecutar

```powershell
npm run dev
```

Servicios:

| Servicio | Dirección |
|---|---|
| Aplicación | http://localhost:5173 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/docs |
| Health | http://localhost:3000/api/health |

## Errores frecuentes

### Error P3019 de Prisma

Confirma que `schema.prisma` y `migrations/migration_lock.toml` correspondan al proveedor SQL Server y que estés usando el historial versionado actual. No regeneres migraciones en una base con datos de producción.

### Error de autenticación

Verifica el nombre de la instancia y el modo de autenticación. Cuando la autenticación integrada no esté disponible, crea un usuario SQL dedicado y actualiza `DATABASE_URL`.

### Puerto 1433 ocupado

Comprueba el proceso o instancia que está usando el puerto:

```powershell
Get-NetTCPConnection -LocalPort 1433 -ErrorAction SilentlyContinue
```
