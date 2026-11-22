# Capturas de pantalla del tráiler

Capturas reales del frontend de AdminGest con datos **ficticios** (`mock-demo.cjs`): no se conectan a la API
ni a ninguna base de datos.

```bash
# 1. Compilar el frontend con la URL pública para el QR de las cotizaciones
cd apps/web && VITE_PUBLIC_APP_URL=https://admingest.pages.dev npx vite build --outDir /tmp/admingest-dist
npx vite preview --outDir /tmp/admingest-dist --port 4174 --strictPort &
# 2. Capturar (Playwright, 1600 × 900 a 2×, tema oscuro) → tools/capture/shots/
cd promo/trailer/tools/capture
node capture-pages.cjs dark && node capture-states.cjs dark && node capture-quote.cjs dark
```

Después se convierten a WebP en `public/screens/` (calidad 88; la cotización se recorta al documento).
