# Guía de usuario de AdminGest 1.0

## Inicio de sesión

Accede con el correo y la contraseña configurados para tu empresa. La sesión se protege mediante JWT y todos los datos se filtran por la empresa asociada al usuario.

## Dashboard Premium

El dashboard presenta:

- prospectos nuevos;
- clientes activos;
- oportunidades abiertas;
- valor estimado del pipeline;
- cotizaciones pendientes;
- proyectos activos;
- variaciones frente al período anterior;
- evolución comercial mensual;
- oportunidades por etapa;
- actividades de los próximos siete días.

## Navegación avanzada

### Barra lateral

Utiliza el botón de la cabecera para colapsar o expandir el menú. La preferencia se guarda en el navegador.

### Búsqueda global

Escribe al menos dos caracteres para buscar prospectos, clientes, oportunidades, proyectos y cotizaciones. Los resultados respetan el aislamiento de la empresa autenticada.

### Notificaciones

El panel de notificaciones muestra actividades próximas, cotizaciones cercanas a vencer y proyectos con cierre durante los próximos siete días.

### Tema oscuro

El botón de sol o luna cambia el tema. La preferencia se almacena en `localStorage` y se restaura al volver a abrir AdminGest.

## CRM

### Prospectos

Registra datos de contacto, prioridad, origen, responsable, estado y notas. Utiliza búsqueda y filtros para segmentar la lista.

### Clientes

Administra empresas o clientes activos y sus datos fiscales y de contacto.

### Oportunidades

La vista de tabla facilita filtros, edición y exportación. La vista Kanban permite mover oportunidades entre etapas mediante arrastrar y soltar.

## Actividades

La vista de lista permite crear y actualizar llamadas, correos, reuniones, visitas, tareas y seguimientos. La vista calendario organiza las actividades por mes y hora.

## Cotizaciones

AdminGest calcula subtotal, descuento, ITBIS y total. El botón de impresión abre una versión profesional preparada para imprimir o guardar como PDF.

## Proyectos

La vista de lista muestra estado, progreso, presupuesto y cantidad de tareas. El cronograma compara visualmente las fechas de inicio, finalización y avance.

## Exportaciones

Las tablas permiten exportar la información filtrada a:

- Excel compatible (`.xls`);
- documento imprimible que puede guardarse como PDF desde el navegador.

Las exportaciones se generan localmente y no envían información a servicios externos.

## Filtros y paginación

Cada listado admite búsqueda textual, filtro por estado cuando corresponde y páginas de 10, 25 o 50 registros.

## Seguridad operativa

- Cierra la sesión al terminar en equipos compartidos.
- No compartas contraseñas ni tokens.
- Utiliza una contraseña diferente de la cuenta de demostración.
- Revisa periódicamente la auditoría y las actividades pendientes.
