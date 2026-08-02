# Implementación RBAC

La autorización se resuelve en dos niveles:

1. **Backend:** `RolesGuard` identifica el recurso a partir de la URL y distingue lectura (`GET`) de escritura (`POST`, `PATCH`, `PUT`, `DELETE`).
2. **Frontend:** las rutas y la navegación consultan la misma matriz conceptual para evitar mostrar módulos no disponibles.

Los decoradores `@Roles(...)` siguen teniendo prioridad para operaciones explícitamente administrativas. La matriz global cubre los controladores que no tenían restricciones declarativas y evita que cualquier usuario autenticado herede privilegios administrativos por omisión.
