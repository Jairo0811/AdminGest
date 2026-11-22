# Voz, música y mezcla

## Narración sintética (pista provisional y sustituible)

| Parámetro   | Valor                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Servicio    | Higgsfield → **ElevenLabs Eleven v4** (`elevenlabs_v4`)                                                                                          |
| Voz         | Preset «Andre» (`f1e8226e-2248-4d5f-b43c-0a79e9949dbf`), masculina, timbre medio-grave                                                           |
| Estabilidad | 0,4 (más expresiva; valores altos suenan monótonos)                                                                                              |
| Similitud   | 0,8                                                                                                                                              |
| Texto       | Guion completo en una sola toma, frases en párrafos separados y puntos suspensivos donde se quiere una pausa («crece…», «existe…», «AdminGest…») |
| Coste       | ≈2 créditos de Higgsfield por toma completa                                                                                                      |
| Archivo     | `public/audio/narration-source.mp3`                                                                                                              |

Candidatas evaluadas (escenas 1–3): Juan (más aguda, ~161 Hz de tono medio), **Andre** (~120 Hz, mayor
variación de entonación y pausas más naturales) y Xavier (~120 Hz, más plana). Las tres pronuncian
«AdminGest» con la _g_ española («Admin-jest»), como en «gestión».

**Limitación honesta:** ninguna voz prediseñada tiene acento dominicano auténtico; Andre suena a español
latinoamericano neutro. Para el acento dominicano real, grabar a un locutor con
[GUION-LOCUTOR.md](GUION-LOCUTOR.md) o clonar su voz con su consentimiento.

### Sustituir la narración

1. Guardar la toma como `public/audio/narration-source.wav` (o `.mp3`) y borrar la anterior.
2. `npm run align` — transcribe con Whisper, corta cada frase en sus silencios reales, recalcula las pausas
   (`tools/script.json`), los subtítulos, las escenas, la música y los efectos.
3. `npm run render:16x9 && npm run render:9x16 && npm run master`.

## Procesado de la voz (`tools/process_voice.py`)

Pasa-altos 75 Hz · reducción de ruido moderada · EQ natural (−2 dB a 280 Hz, +1,5 dB a 3,2 kHz, +1 dB de
aire) · de-esser · compresión ligera 2,2:1 · limitador de picos a −1,5 dBFS. Sin reverberación ni efecto de
radio. Cada frase se coloca en el montaje con fundidos de 12/45 ms para evitar cortes audibles.

## Música (`tools/compose_music.py`)

Pista **original generada por código** (osciladores, filtros, ruido y reverberación por convolución): no
usa muestras, bucles ni fragmentos de obras de terceros, por lo que puede publicarse en LinkedIn, YouTube e
Instagram como parte del tráiler. 100 BPM, re menor con resolución en Fa:

| Tramo                 | Contenido                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Intro → problema      | Pad ambiental filtrado, notas aisladas de campana                                        |
| Solución → plataforma | Golpe suave y destello con el logotipo, entra el bajo y el arpegio, percusión ligera     |
| CRM → reportes        | Ritmo completo (bombo suave, palmas, hi-hats, bajo en corcheas, arpegio en semicorcheas) |
| Centralización        | Se retira la percusión; suspensión Si♭ → Do sus4                                         |
| Cierre                | Acorde Fa add9 con impacto grave y campanas en el logotipo; cola natural                 |

Los cortes de escena del tramo rítmico están alineados a la rejilla de 100 BPM. La música se atenúa hasta
7 dB mientras habla el narrador (ducking con anticipación de 120 ms y liberación de 450 ms).

Alternativa: ElevenLabs Music v2.5 en Higgsfield (≈6,7 créditos por 46 s). No se usó porque las condiciones
de uso comercial de la música generada dependen del plan de la cuenta y deben verificarse antes de publicar.

## Efectos (`tools/make_sfx.py`)

_Whoosh_ y _swoosh_ de ruido filtrado en las transiciones, un clic de interfaz y un brillo agudo en los
logotipos. Todos sintetizados; nivel discreto.

## Mezcla y máster

Tres pistas separadas en Remotion (narración, música, efectos). Máster final (`tools/master.sh`):
normalización EBU R128 en dos pasadas a **−14 LUFS**, pico verdadero **−1 dBTP**, AAC 320 kb/s 48 kHz.
