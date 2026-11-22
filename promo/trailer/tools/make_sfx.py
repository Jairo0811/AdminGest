"""Efectos de interfaz y transición (síntesis propia) → public/audio/generated/sfx.wav.

whoosh: barrido de ruido filtrado (transiciones de escena) · swoosh: versión corta y brillante
(cambios de pantalla) · click: pulsación de interfaz · shimmer: brillo agudo para el logotipo.
Las posiciones vienen de src/data/timeline.json; el nivel es discreto para no competir con la voz.
"""
import numpy as np
from scipy.signal import butter, sosfilt

from audio_util import GEN, SR, data, save

RNG = np.random.default_rng(45)


def band_sweep(length: float, f0: float, f1: float, peak: float) -> np.ndarray:
    n = int(length * SR)
    noise = RNG.standard_normal((n, 2)).astype(np.float32)
    out = np.zeros_like(noise)
    freqs = np.geomspace(f0, f1, n // 256 + 1)
    zi = None
    for k, i in enumerate(range(0, n, 256)):
        f = freqs[k]
        sos = butter(2, [f * 0.6 / (SR / 2), min(f * 1.6, 20000) / (SR / 2)], btype="band", output="sos")
        if zi is None or zi.shape[0] != sos.shape[0]:
            zi = np.zeros((sos.shape[0], 2, 2))
        out[i : i + 256], zi = sosfilt(sos, noise[i : i + 256], axis=0, zi=zi)
    t = np.linspace(0, 1, n)
    env = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.6)
    pan = np.stack([1 - 0.4 * t, 0.6 + 0.4 * t], axis=1)  # slight left → right movement
    return out * env[:, None] * pan


def click() -> np.ndarray:
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    tone = np.sin(2 * np.pi * 2400 * t) * np.exp(-t / 0.006) + 0.5 * np.sin(2 * np.pi * 1200 * t) * np.exp(-t / 0.01)
    return np.stack([tone, tone], axis=1).astype(np.float32)


def shimmer() -> np.ndarray:
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    sos = butter(4, 6000 / (SR / 2), btype="high", output="sos")
    noise = sosfilt(sos, RNG.standard_normal((n, 2)), axis=0)
    sparkle = noise * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t))[:, None]
    env = np.minimum(t / 0.15, 1) * np.exp(-t / 0.5)
    return (sparkle * env[:, None]).astype(np.float32)


SOUNDS = {
    "whoosh": (lambda: band_sweep(0.9, 300, 4000, 0.55), 0.22, -0.55),
    "swoosh": (lambda: band_sweep(0.45, 900, 7000, 0.45), 0.13, -0.3),
    "click": (click, 0.18, 0.0),
    "shimmer": (shimmer, 0.10, 0.0),
}


def main() -> None:
    timeline = data("timeline.json")
    n = int(timeline["total"] * SR)
    out = np.zeros((n, 2), np.float32)
    for event in timeline["sfx"]:
        make, gain, offset = SOUNDS[event["type"]]
        sig = make() * gain
        i = int((event["t"] + offset) * SR)  # whooshes peak on the cut
        j = min(n, i + len(sig))
        if i < 0:
            sig, i = sig[-i:], 0
        out[i:j] += sig[: j - i]
    save(GEN / "sfx.wav", out)
    print(f"sfx.wav: {len(timeline['sfx'])} efectos, pico {20 * np.log10(np.abs(out).max() + 1e-9):.1f} dBFS")


if __name__ == "__main__":
    main()
