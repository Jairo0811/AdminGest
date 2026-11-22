"""Procesa la narración y la monta en la línea de tiempo → public/audio/generated/narration.wav.

Cadena (sutil, para conservar una voz cercana y natural):
  pasa-altos 75 Hz · reducción de ruido moderada · EQ (−2 dB 280 Hz, +1,5 dB 3,2 kHz, +1 dB aire)
  · de-esser · compresión ligera 2,2:1 · limitador de picos (−1,5 dBFS).
Sin reverberación, sin efecto de radio. Cada frase se coloca en su tiempo con fundidos de 12/45 ms.
"""
import glob

import numpy as np
from audio_util import GEN, ROOT, SR, data, save, load

CHAIN = ",".join([
    "highpass=f=75:poles=2",
    "afftdn=nr=6:nf=-55",
    "equalizer=f=280:t=q:w=1.1:g=-2",
    "equalizer=f=3200:t=q:w=1.2:g=1.5",
    "highshelf=f=9000:g=1",
    "deesser=i=0.35:m=0.5:f=0.45",
    "acompressor=threshold=-22dB:ratio=2.2:attack=12:release=180:makeup=2dB:knee=6",
    "alimiter=limit=-1.5dB:attack=3:release=60:level=disabled",
])


def main() -> None:
    narration = data("narration.json")
    source = ROOT / "public/audio" / narration["source"]
    voice = load(source, filters=CHAIN)
    out = np.zeros(int(narration["total"] * SR) + SR, np.float32)
    for seg in narration["segments"]:
        a, b = (int(x * SR) for x in seg["src"])
        clip = voice[a:b].copy()
        fi, fo = int(0.012 * SR), int(0.045 * SR)
        clip[:fi] *= np.linspace(0, 1, fi)
        clip[-fo:] *= np.linspace(1, 0, fo)
        start = int(seg["at"] * SR)
        out[start : start + len(clip)] += clip
    out = out[: int(narration["total"] * SR)]
    save(GEN / "narration.wav", out)
    peak = 20 * np.log10(np.abs(out).max() + 1e-9)
    print(f"narration.wav: {len(out) / SR:.2f} s, pico {peak:.1f} dBFS")


if __name__ == "__main__":
    main()
