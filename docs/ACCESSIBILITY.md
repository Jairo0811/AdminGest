# Accesibilidad de AdminGest

AdminGest incorpora una base transversal de accesibilidad alineada con los principios de **NORTIC B2:2017** y con el objetivo de calidad **WCAG 2.2 nivel AA**.

> Este documento describe una implementación técnica alineada con dichos criterios. No constituye una certificación formal emitida por una entidad auditora.

## Alcance implementado

- Idioma principal definido en español.
- Enlace para saltar directamente al contenido principal.
- Landmarks semánticos para navegación, encabezado y contenido.
- Breadcrumbs identificados como ruta de navegación.
- Foco visible en enlaces, botones, campos y controles interactivos.
- Gestión de foco al cambiar de vista.
- Cierre de menús y popovers con la tecla `Escape`.
- Estados `aria-expanded`, `aria-controls`, `aria-current` y `aria-live` donde corresponde.
- Mensajes de error anunciados mediante `role="alert"`.
- Estados de carga anunciados mediante `role="status"`.
- Iconos decorativos ocultos para tecnologías asistivas.
- Etiquetas y ayudas asociadas a formularios.
- Compatibilidad con preferencia de movimiento reducido.
- Reglas de alto contraste y foco para `forced-colors`.
- Base responsive preparada para ampliación de texto y zoom.

## Criterios de referencia

La implementación se orienta especialmente a:

- Contenido no textual.
- Información y relaciones.
- Secuencia significativa.
- Uso del color.
- Contraste mínimo.
- Cambio de tamaño del texto.
- Teclado.
- Sin trampas para el foco.
- Evitar bloques repetitivos.
- Titulado de páginas.
- Orden de foco.
- Encabezados y etiquetas.
- Foco visible.
- Idioma de la página.
- Navegación coherente.
- Identificación de errores.
- Etiquetas o instrucciones.
- Nombre, función y valor.

## Validación manual recomendada

Antes de cada versión estable debe comprobarse:

1. Navegación completa con `Tab`, `Shift + Tab`, `Enter`, `Espacio` y `Escape`.
2. Foco visible en todos los controles.
3. Uso correcto con zoom al 200 %.
4. Ausencia de desplazamiento horizontal innecesario en procesos principales.
5. Lectura básica con NVDA o Narrator en Windows.
6. Contraste mediante Lighthouse, axe DevTools o WAVE.
7. Formularios con errores identificables sin depender únicamente del color.
8. Modales y confirmaciones sin pérdida ni trampa de foco.

## Verificación de la versión 1.2.0

- **Automatizada:** axe-core (reglas WCAG 2.0, 2.1 y 2.2 A/AA) sobre 16 rutas, a 375 y 1440 px, en tema
  claro y oscuro. La primera auditoría encontró 78 violaciones graves o críticas (contraste, `aria-expanded`
  no permitido en la búsqueda y un gráfico SVG sin nombre accesible); tras las correcciones no quedan
  violaciones graves ni críticas.
- **Diseño adaptable:** 320, 375, 390, 768, 1024 y 1440 px sin desplazamiento horizontal en ninguna ruta.
- **Modal:** pruebas automatizadas de foco inicial, contención de `Tab`/`Shift + Tab`, cierre con `Escape`,
  restauración del foco y clic fuera seguro (`components.spec.tsx`).
- **Movimiento reducido:** las animaciones se anulan con `prefers-reduced-motion`.

Pendiente: lectura completa con NVDA o Narrator y verificación con zoom al 200 % en dispositivos físicos.
Estos resultados no constituyen una certificación.

## Política de mantenimiento

Toda funcionalidad nueva debe:

- utilizar HTML semántico antes que roles ARIA;
- incluir nombre accesible en controles;
- mantener navegación por teclado;
- conservar foco visible;
- anunciar cambios relevantes de estado;
- evitar transmitir información únicamente mediante color;
- funcionar con ampliación de texto y movimiento reducido.
