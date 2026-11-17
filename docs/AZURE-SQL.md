# Base de datos en Azure SQL Database

AdminGest usa Prisma 6 con el conector `sqlserver`. Azure SQL Database es compatible con el esquema y las
migraciones de SQL Server 2022 que el CI valida en cada cambio.

> **Estado:** pendiente de configuración. No existe una suscripción ni una base Azure SQL asociada al
> proyecto, por lo que la conectividad real Render → Azure SQL y la aplicación de migraciones en Azure **no
> se han verificado**. El CI verifica las migraciones sobre SQL Server 2022 (base limpia, seed dos veces y
> actualización desde v1.1.0).

## 1. Crear la base (sin cargos inesperados)

- La [oferta gratuita de Azure SQL Database](https://learn.microsoft.com/azure/azure-sql/database/free-offer)
  permite hasta 10 bases _General Purpose serverless_ por suscripción, cada una con una asignación mensual de
  100 000 segundos de vCore, 32 GB de datos y 32 GB de respaldo. Verificar las condiciones vigentes antes de
  crearla; no está disponible en todas las suscripciones (por ejemplo, _Azure for Students Starter_).
- Al crearla, elegir **«Auto-pause the database until next month»** como comportamiento al agotar la
  asignación. La otra opción («continuar con cargos») genera costos y **requiere autorización del
  propietario**.
- La base se pausa tras un periodo sin actividad y tarda en reanudarse en la primera conexión. AdminGest
  lo tolera: la API arranca sin base, `/api/health/ready` responde 503 `DATABASE_UNAVAILABLE` y la interfaz
  muestra «La base de datos no está disponible en este momento».
- Elegir una región cercana a la región del servicio Render para reducir la latencia.

## 2. Cadena de conexión

```env
DATABASE_URL="sqlserver://SERVIDOR.database.windows.net:1433;database=AdminGestDb;user=admingest_app;password={CONTRASEÑA};encrypt=true;trustServerCertificate=false;connectTimeout=30;poolTimeout=30;connectionLimit=5"
```

| Parámetro                      | Motivo                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `encrypt=true`                 | TLS obligatorio. **Nunca** desactivarlo para «arreglar» una conexión.                              |
| `trustServerCertificate=false` | Valida el certificado de Azure. `true` solo se admite en el SQL Server local de desarrollo.        |
| `connectTimeout=30`            | Segundos de espera al conectar; da margen a la reanudación tras la pausa automática.               |
| `poolTimeout=30`               | Segundos de espera por una conexión libre del pool.                                                |
| `connectionLimit=5`            | Una instancia Free (0,1 CPU) no necesita más; evita agotar conexiones de la base serverless.       |
| `password={…}`                 | Las llaves permiten caracteres especiales (`;`, `=`) en la contraseña según la sintaxis de Prisma. |

Referencia: [Prisma — SQL Server](https://www.prisma.io/docs/orm/v6/overview/databases/sql-server).
La cadena solo se define en Render (y temporalmente en el equipo que aplica migraciones); nunca en Git,
Cloudflare ni variables `VITE_*`.

## 3. Firewall y usuarios con privilegios mínimos

**Firewall del servidor lógico (Networking):**

- No usar la regla `0.0.0.0 – 255.255.255.255`.
- «Allow Azure services» **no** incluye a Render.
- Añadir los rangos de salida del servicio Render (**Render → servicio → Connect → Outbound**). Son
  compartidos con otros clientes de Render de la región, por lo que la protección real la dan TLS, el
  usuario con privilegios mínimos y una contraseña robusta.
- Añadir temporalmente la IP del equipo que aplica migraciones y eliminarla al terminar.

**Usuarios contenidos en la base** (ejecutar conectado a `AdminGestDb` con el administrador del servidor):

```sql
-- Usuario de migraciones: solo se usa desde un equipo de confianza durante el despliegue.
CREATE USER admingest_migrator WITH PASSWORD = '<contraseña robusta>';
ALTER ROLE db_ddladmin ADD MEMBER admingest_migrator;
ALTER ROLE db_datareader ADD MEMBER admingest_migrator;
ALTER ROLE db_datawriter ADD MEMBER admingest_migrator;

-- Usuario de la aplicación (Render): lectura y escritura de datos, sin DDL.
CREATE USER admingest_app WITH PASSWORD = '<otra contraseña robusta>';
ALTER ROLE db_datareader ADD MEMBER admingest_app;
ALTER ROLE db_datawriter ADD MEMBER admingest_app;
```

La API usa `sp_getapplock` (permitido al rol `public`) para la numeración de cotizaciones y consultas
parametrizadas; no necesita `db_owner` ni permisos de esquema.

## 4. Migraciones

Render Free no tiene _pre-deploy command_ ni shell, por lo que las migraciones se aplican **manualmente**
desde un equipo de confianza con el repositorio en la versión que se va a desplegar. Nunca se recrea ni se
vacía la base productiva para resolver un error de migración.

1. **Preflight.** `npm ci && npm run db:generate && npm run db:validate`. Comprobar la conexión con
   `admingest_migrator` (por ejemplo, Azure Data Studio o `sqlcmd`) y revisar el estado:
   `npx prisma migrate status --schema apps/api/prisma/schema.prisma`.
2. **Datos incompatibles.** La migración `20261103120000_tenant_integrity_hardening` cuenta primero las
   referencias entre empresas distintas y, si existen, se detiene con `THROW 51000` **sin aplicar
   cambios**. Las consultas de diagnóstico están en el bloque «Preflight» de su `migration.sql`; corregir
   esos registros y repetir. En una base nueva no aplica.
3. **Respaldo.** Azure SQL mantiene restauración a un punto en el tiempo (PITR). Antes de migrar una base
   con datos, anotar la hora UTC exacta o crear una copia (**Copy**) si el presupuesto lo permite (la copia
   consume asignación o genera cargos).
4. **Aplicar.** Con `DATABASE_URL` del usuario de migraciones en la sesión del terminal (no en archivos
   versionados):

   ```bash
   npm run db:deploy        # prisma migrate deploy; nunca db:migrate en producción
   ```

5. **Verificar tablas.** `prisma migrate status` debe indicar que no hay migraciones pendientes y
   `_prisma_migrations` debe tener 7 filas con `finished_at` y sin `rolled_back_at`.
6. **Verificar índices y restricciones.**

   ```sql
   SELECT COUNT(*) AS foreign_keys FROM sys.foreign_keys;
   SELECT COUNT(*) AS indexes FROM sys.indexes WHERE object_id IN (SELECT object_id FROM sys.tables);
   SELECT name FROM sys.indexes WHERE has_filter = 1;          -- índices únicos filtrados
   ```

   Los resultados deben coincidir con los de una base local recién migrada (`npm run db:deploy` contra
   Docker) en la misma versión.

7. **Inicialización segura.** `npm run db:seed` con `NODE_ENV=production` solo crea los planes que falten;
   no crea datos demo, no modifica administradores ni límites existentes. Ejecutarlo desde el mismo equipo
   (requiere las devDependencies). La primera empresa se crea con `PUBLIC_REGISTRATION=true` temporalmente
   o con el seed y `SEED_DEMO_DATA=true` + `SEED_ADMIN_PASSWORD` **solo** en un entorno de pruebas.
8. **Conectividad.** Con la API desplegada: `GET /api/health/ready` → 200. Si responde 503, revisar el
   firewall (rangos de Render), el usuario y `encrypt=true`, y los logs de Render (muestran el tipo de error,
   no la cadena de conexión).
9. **Recuperación ante fallos.**
   - Migración abortada por el preflight: no hay cambios; corregir datos y repetir.
   - Migración fallida a mitad: `prisma migrate status` la muestra como fallida. Revisar el error, corregir
     la causa y, solo si el script no dejó cambios, `npx prisma migrate resolve --rolled-back <nombre>` y
     repetir. Si dejó cambios parciales, restaurar con PITR a la hora anotada en el paso 3 sobre una base
     nueva, verificarla y apuntar `DATABASE_URL` a ella.
   - Credencial expuesta: rotar la contraseña del usuario (`ALTER USER … WITH PASSWORD`) y actualizar Render.

## 5. Coste y consumo

Con la oferta gratuita, cada consulta mientras la base está activa consume segundos de vCore. Los
recordatorios de AdminGest se ejecutan cada 15 minutos **solo mientras la API está despierta**; con Render
Free la API se suspende tras 15 minutos sin tráfico, lo que también permite la pausa de la base. Si el
consumo se acerca al límite, definir `REMINDERS_DISABLED=true` en Render.
