# Control de calidad — render del 22/11/2026

| Verificación                     | Resultado                                                           | Cómo se comprobó                                                               |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Palabras completas, sin cortes   | ✅                                                                  | Transcripción con Whisper del montaje de voz: texto idéntico al guion          |
| Pronunciación de «AdminGest»     | ✅ (_g_ española, «Admin-jest»)                                     | Transcripción sin pista del nombre + revisión humana de la muestra             |
| Naturalidad de la voz            | ✅ aprobada por el propietario (voz Andre)                          | Tres muestras comparadas; tono medio 120 Hz, rango ~18 semitonos               |
| Acento dominicano                | ⚠️ No auténtico (español latinoamericano neutro)                    | Limitación de las voces disponibles; ver GUION-LOCUTOR.md                      |
| La música no tapa la voz         | ✅                                                                  | Voz 8–12 dB por encima de la música durante la narración (ducking hasta −7 dB) |
| Silencios incómodos              | ✅                                                                  | Pausas de 0,4–1,1 s, siempre con música de fondo                               |
| Sincronía audio/video            | ✅ desfase 0 ms                                                     | Correlación cruzada entre el audio del MP4 y la suma de las pistas             |
| Subtítulos = narración           | ✅                                                                  | Generados de la alineación palabra a palabra (`src/data/narration.json`)       |
| Capturas del software real       | ✅                                                                  | Frontend v1.2.0 compilado, datos ficticios, sin datos personales               |
| Logotipo oficial sin alterar     | ✅                                                                  | `apps/web/public/brand/logo.png`                                               |
| Cierre profesional y estado real | ✅                                                                  | «Versión 1.2.0 \| Despliegue en desarrollo»; logotipo visible ~7 s             |
| Cuadros negros / transiciones    | ✅                                                                  | `blackdetect` sin resultados; transiciones sin doble exposición                |
| Sonoridad                        | ✅ −14,0 LUFS integrados, pico −0,8 dBFS                            | `ffmpeg ebur128` sobre los MP4 finales                                         |
| Formatos                         | ✅ 1920×1080 y 1080×1920, 30 fps, H.264 + AAC 320 kb/s 48 kHz, 46 s | `ffprobe`                                                                      |
