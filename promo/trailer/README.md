# AdminGest — Tráiler oficial v1.2.0

Material promocional aislado del frontend y del backend: **no** forma parte de los workspaces de npm ni del
build de producción.

| Entregable                            | Ubicación                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| Storyboard y guion final              | [docs/GUION-Y-STORYBOARD.md](docs/GUION-Y-STORYBOARD.md)                              |
| Guion para locutor humano             | [docs/GUION-LOCUTOR.md](docs/GUION-LOCUTOR.md)                                        |
| Configuración de voz, música y mezcla | [docs/VOZ-Y-AUDIO.md](docs/VOZ-Y-AUDIO.md)                                            |
| Proyecto Remotion editable            | `src/` (escenas en `src/scenes/`, componentes en `src/components/`)                   |
| Tiempos (única fuente)                | `src/data/narration.json` (alineación de la voz) y `src/data/timeline.json` (escenas) |
| Capturas reales con datos ficticios   | `public/screens/`                                                                     |
| Herramientas de audio                 | `tools/`                                                                              |

## Formatos

| Composición                | Resolución                | Uso                              |
| -------------------------- | ------------------------- | -------------------------------- |
| `AdminGestTrailer`         | 1920 × 1080, 16:9, 30 fps | YouTube, LinkedIn                |
| `AdminGestTrailerVertical` | 1080 × 1920, 9:16, 30 fps | Instagram Reels, Stories, Shorts |

Salida: MP4 H.264 (CRF 18, yuv420p) con audio AAC 320 kb/s, normalizado a −14 LUFS.

## Uso

Requisitos: Node 20+, Python 3.11+ con `numpy`, `scipy`, `pyloudnorm` (y `faster-whisper` solo para
`npm run align`), y `ffmpeg`.

```bash
npm install
npm run studio            # editar y previsualizar
npm run render            # genera audio, renderiza 16:9 y 9:16 y masteriza → out/*.mp4
```

Si Remotion no puede descargar su navegador (proxy corporativo), usar uno local:
`REMOTION_BROWSER=/ruta/a/chrome npm run render`.

## Contenido y veracidad

- Todas las pantallas son capturas del frontend real de AdminGest v1.2.0 (tema oscuro) con datos ficticios
  servidos por una API simulada; ninguna pantalla ni función es inventada.
- El cierre indica «Versión 1.2.0 | Despliegue en desarrollo»: el tráiler no anuncia disponibilidad
  comercial ni afirma que la infraestructura pública (Render + Azure SQL) esté operativa.
- El logotipo es el oficial (`apps/web/public/brand/logo.png`), sin modificaciones.
- Tipografías Manrope y DM Sans (SIL Open Font License, ver `public/fonts/`).
- Remotion es gratuito para personas y empresas de hasta 3 empleados; organizaciones mayores necesitan una
  licencia de empresa (https://www.remotion.dev/license).
