"""Música original del tráiler (síntesis por código) → public/audio/generated/music.wav.

Estilo: cinematic corporate technology / electronic ambient, 100 BPM, re menor → resolución en Fa.
Toda la pista se genera aquí con osciladores, filtros, ruido y una reverberación por convolución;
no usa muestras ni fragmentos de obras de terceros, por lo que se puede publicar libremente como
parte del tráiler (autoría del proyecto AdminGest).

Estructura (tiempos tomados de src/data/timeline.json):
  intro (ambiental) → crecimiento (logotipo, arpegio) → ritmo (CRM a reportes)
  → resolución (sin percusión) → acorde final con el logotipo.
La música se atenúa automáticamente (ducking) mientras suena la narración.
"""
import numpy as np
import pyloudnorm
from scipy.signal import butter, fftconvolve, lfilter, sosfilt

from audio_util import GEN, SR, data, db, load, save

RNG = np.random.default_rng(1202)
T = data("timeline.json")
M = T["music"]
TOTAL = T["total"]
N = int(TOTAL * SR)
BEAT = 60 / M["bpm"]
BAR = 4 * BEAT
G = M["grooveStart"]


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def t_axis(n: int) -> np.ndarray:
    return np.arange(n, dtype=np.float32) / SR


def place(buf: np.ndarray, sig: np.ndarray, start: float, gain: float = 1.0) -> None:
    i = int(start * SR)
    if i >= len(buf):
        return
    if i < 0:
        sig, i = sig[-i:], 0
    j = min(len(buf), i + len(sig))
    buf[i:j] += gain * sig[: j - i]


def saw(freq: float, n: int, harmonics: int = 18, phase: float = 0.0) -> np.ndarray:
    t = t_axis(n)
    out = np.zeros(n, np.float32)
    for k in range(1, harmonics + 1):
        if freq * k > 16000:
            break
        out += np.sin(2 * np.pi * freq * k * t + phase * k) / k
    return out * 0.55


def adsr(n: int, a: float, d: float, s: float, r: float) -> np.ndarray:
    env = np.full(n, s, np.float32)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    env[:na] = np.linspace(0, 1, na)
    nd = min(nd, max(n - na, 0))
    env[na : na + nd] = np.linspace(1, s, nd)
    if nr:
        nr = min(nr, n)
        env[-nr:] *= np.linspace(1, 0, nr)
    return env


def lowpass_sweep(x: np.ndarray, cutoff: np.ndarray, block: int = 512) -> np.ndarray:
    """Two-pole low-pass whose cutoff follows `cutoff` (Hz per sample), processed in blocks."""
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        fc = float(np.clip(cutoff[min(i, len(cutoff) - 1)], 40, 18000))
        b, a = butter(2, fc / (SR / 2))
        y[i : i + block], zi = lfilter(b, a, x[i : i + block], zi=zi)
    return y


def reverb_ir(seconds: float, damp: float) -> np.ndarray:
    n = int(seconds * SR)
    t = t_axis(n)
    ir = RNG.standard_normal((n, 2)).astype(np.float32) * np.exp(-6.9 * t / seconds)[:, None]
    sos = butter(1, damp / (SR / 2), output="sos")
    ir = sosfilt(sos, ir, axis=0)
    ir[: int(0.012 * SR)] = 0  # pre-delay
    return ir / np.sqrt((ir**2).sum(axis=0))


def to_stereo(mono: np.ndarray, pan: float = 0.0) -> np.ndarray:
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([mono * left, mono * right], axis=1)


# Harmony -------------------------------------------------------------------------------------
CHORDS = {
    "Dm": [50, 57, 62, 65],
    "Bb": [46, 53, 62, 65],
    "F": [53, 57, 60, 65],
    "C": [48, 55, 60, 64],
    "Csus": [48, 55, 60, 65],
    "Fadd9": [41, 53, 60, 67, 69],
}
PROGRESSION = ["Dm", "Bb", "F", "C"]
ROOTS = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "Csus": 36, "Fadd9": 29}


def chord_plan():
    """List of (start, end, chord) covering the whole track."""
    plan = []
    bar = int(np.floor((0 - G) / BAR))
    while True:
        start = G + bar * BAR
        if start >= M["resolveStart"]:
            break
        in_groove = start >= G - 1e-6
        name = PROGRESSION[bar % 4] if in_groove else PROGRESSION[(bar // 2) % 4]
        end = min(start + BAR, M["resolveStart"])
        plan.append((max(start, 0.0), end, name))
        bar += 1
    mid = M["resolveStart"] + 0.55 * (M["finalHit"] - M["resolveStart"])
    plan += [(M["resolveStart"], mid, "Bb"), (mid, M["finalHit"], "Csus"), (M["finalHit"], TOTAL, "Fadd9")]
    merged = []
    for s, e, c in plan:
        if merged and merged[-1][2] == c and abs(merged[-1][1] - s) < 1e-6:
            merged[-1] = (merged[-1][0], e, c)
        elif e - s > 1e-3:
            merged.append((s, e, c))
    return merged


def section_curve(points) -> np.ndarray:
    """Piecewise-linear automation curve from (time, value) points."""
    times, values = zip(*points)
    return np.interp(t_axis(N), times, values).astype(np.float32)


# Instruments -------------------------------------------------------------------------------
def pad(plan) -> np.ndarray:
    out = np.zeros((N, 2), np.float32)
    for start, end, name in plan:
        final = name == "Fadd9"
        length = (end - start) + (0.0 if final else 1.2)
        n = int(length * SR)
        env = adsr(n, 1.4 if start < 1 else 0.6, 0.5, 0.9, 1.2 if not final else 3.5)
        for note in CHORDS[name]:
            for detune, pan in ((-0.09, -0.7), (0.0, 0.0), (0.1, 0.7)):
                f = midi(note + detune)
                voice = saw(f, n, harmonics=14, phase=RNG.uniform(0, 6.28)) * env
                place(out[:, 0], voice * np.cos((pan + 1) * np.pi / 4), start, 0.11)
                place(out[:, 1], voice * np.sin((pan + 1) * np.pi / 4), start, 0.11)
    cutoff = section_curve([
        (0, 420), (M["growthStart"], 900), (M["logoHit"], 1600), (G, 2600),
        (M["resolveStart"], 2400), (M["finalHit"] - 0.2, 1500), (M["finalHit"], 3800), (TOTAL, 1400),
    ])
    out[:, 0] = lowpass_sweep(out[:, 0], cutoff)
    out[:, 1] = lowpass_sweep(out[:, 1], cutoff)
    level = section_curve([
        (0, 0.0), (1.5, 0.75), (M["growthStart"], 0.8), (G, 0.7), (M["resolveStart"], 0.85),
        (M["finalHit"], 1.0), (TOTAL - 2.5, 0.8), (TOTAL, 0.0),
    ])
    return out * level[:, None]


def bass(plan) -> np.ndarray:
    out = np.zeros(N, np.float32)
    for start, end, name in plan:
        if end <= M["growthStart"]:
            continue
        root = midi(ROOTS[name])
        if start >= G and end <= M["resolveStart"] + 1e-6:
            # Eighth-note pulse in the groove.
            t = start
            while t < end - 1e-6:
                n = int(BEAT / 2 * SR)
                tt = t_axis(n)
                note = (np.sin(2 * np.pi * root * tt) + 0.25 * np.sin(4 * np.pi * root * tt)) * adsr(n, 0.005, 0.12, 0.6, 0.06)
                place(out, np.tanh(1.6 * note) * 0.5, t)
                t += BEAT / 2
        else:
            n = int((end - start + 0.8) * SR)
            tt = t_axis(n)
            note = np.sin(2 * np.pi * root * tt) * adsr(n, 0.4, 0.3, 0.8, 0.8 if name != "Fadd9" else 3.5)
            place(out, note * 0.45, start)
    level = section_curve([(0, 0), (M["growthStart"], 0.0), (M["logoHit"], 0.55), (G, 0.85), (M["resolveStart"], 0.6), (TOTAL - 2, 0.5), (TOTAL, 0)])
    return to_stereo(out * level)


def pluck(freq: float, length: float) -> np.ndarray:
    n = int(length * SR)
    tone = saw(freq, n, harmonics=10)
    env = np.exp(-t_axis(n) / 0.16)
    b, a = butter(2, min(5200, freq * 6) / (SR / 2))
    return lfilter(b, a, tone * env).astype(np.float32)


def arpeggio(plan) -> np.ndarray:
    out = np.zeros((N, 2), np.float32)
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    step_index = 0
    for start, end, name in plan:
        if end <= M["growthStart"] or name == "Fadd9":
            continue
        tones = [n + 12 for n in CHORDS[name][1:]] + [CHORDS[name][1] + 24]
        step = BEAT / 4 if (start >= G - 1e-6 and start < M["resolveStart"]) else BEAT / 2
        t = G + np.ceil((max(start, M["growthStart"]) - G) / step - 1e-6) * step
        while t < end - 1e-6:
            note = tones[pattern[step_index % len(pattern)] % len(tones)]
            pan = 0.35 if step_index % 2 else -0.35
            sig = pluck(midi(note), 0.5)
            place(out[:, 0], sig * np.cos((pan + 1) * np.pi / 4), t, 0.16)
            place(out[:, 1], sig * np.sin((pan + 1) * np.pi / 4), t, 0.16)
            step_index += 1
            t += step
    # Ping-pong delay (dotted eighth).
    d = int(BEAT * 0.75 * SR)
    delayed = np.zeros_like(out)
    delayed[d:, 1] += out[:-d, 0] * 0.32
    delayed[2 * d :, 0] += out[: -2 * d, 0] * 0.18
    delayed[d:, 0] += out[:-d, 1] * 0.32
    out += delayed
    level = section_curve([(0, 0), (M["growthStart"], 0), (M["logoHit"] + 0.3, 0.55), (G, 0.9), (M["resolveStart"], 0.7), (M["finalHit"], 0.0), (TOTAL, 0)])
    return out * level[:, None]


def kick() -> np.ndarray:
    n = int(0.45 * SR)
    t = t_axis(n)
    freq = 45 + 75 * np.exp(-t / 0.035)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    body = np.sin(phase) * np.exp(-t / 0.22)
    click = RNG.standard_normal(n) * np.exp(-t / 0.004) * 0.15
    return (np.tanh(1.5 * body) + click).astype(np.float32)


def clap() -> np.ndarray:
    n = int(0.3 * SR)
    t = t_axis(n)
    noise = RNG.standard_normal(n).astype(np.float32)
    sos = butter(2, [900 / (SR / 2), 3800 / (SR / 2)], btype="band", output="sos")
    burst = sum(np.roll(np.exp(-t / 0.008), int(k * 0.011 * SR)) * (0.6 if k else 1) for k in range(3))
    return sosfilt(sos, noise * (burst + np.exp(-t / 0.09) * 0.7)).astype(np.float32)


def hat(open_: bool = False) -> np.ndarray:
    n = int((0.18 if open_ else 0.06) * SR)
    t = t_axis(n)
    sos = butter(4, 7500 / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, RNG.standard_normal(n) * np.exp(-t / (0.06 if open_ else 0.014))).astype(np.float32)


def drums() -> tuple[np.ndarray, np.ndarray]:
    """Returns (stereo drums, sidechain envelope 0..1 used to pump pads and bass)."""
    out = np.zeros((N, 2), np.float32)
    side = np.zeros(N, np.float32)
    k, c, h, ho = kick(), clap(), hat(), hat(True)
    platform = next(s["start"] for s in T["scenes"] if s["id"] == "platform")
    beat = int(np.ceil((platform - G) / BEAT))
    while True:
        t = G + beat * BEAT
        if t >= M["resolveStart"] - 1e-6:
            break
        groove = t >= G - 1e-6
        if groove or beat % 2 == 0:
            place(out[:, 0], k, t, 0.55 if groove else 0.32)
            place(out[:, 1], k, t, 0.55 if groove else 0.32)
            n = int(0.25 * SR)
            place(side, np.exp(-t_axis(n) / 0.09), t, 1.0 if groove else 0.6)
        if groove:
            if beat % 4 in (1, 3):
                place(out[:, 0], c, t, 0.2)
                place(out[:, 1], c, t + 0.008, 0.2)
            for sub in range(4):
                vel = (0.09, 0.05, 0.12, 0.05)[sub]
                pan = -0.4 if sub % 2 else 0.4
                hh = ho if sub == 2 and beat % 2 else h
                place(out[:, 0], hh * np.cos((pan + 1) * np.pi / 4), t + sub * BEAT / 4, vel)
                place(out[:, 1], hh * np.sin((pan + 1) * np.pi / 4), t + sub * BEAT / 4, vel)
        beat += 1
    return out, np.clip(side, 0, 1)


def riser(end: float, length: float, gain: float) -> np.ndarray:
    out = np.zeros((N, 2), np.float32)
    n = int(length * SR)
    noise = RNG.standard_normal((n, 2)).astype(np.float32)
    cutoff = np.geomspace(400, 9000, n)
    for ch in range(2):
        noise[:, ch] = lowpass_sweep(noise[:, ch], cutoff)
    env = np.linspace(0, 1, n) ** 2.2
    place(out[:, 0], noise[:, 0] * env, end - length, gain)
    place(out[:, 1], noise[:, 1] * env, end - length, gain)
    return out


def impact(at: float, gain: float) -> np.ndarray:
    out = np.zeros((N, 2), np.float32)
    n = int(3.0 * SR)
    t = t_axis(n)
    freq = 36 + 30 * np.exp(-t / 0.12)
    boom = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-t / 0.9)
    sos = butter(2, 1800 / (SR / 2), output="sos")
    air = sosfilt(sos, RNG.standard_normal(n)) * np.exp(-t / 0.35) * 0.25
    sig = (np.tanh(1.3 * boom) + air).astype(np.float32)
    place(out[:, 0], sig, at, gain)
    place(out[:, 1], sig, at, gain)
    return out


def bells(at: float, notes, gain: float, spread: float = 0.09) -> np.ndarray:
    out = np.zeros((N, 2), np.float32)
    for i, note in enumerate(notes):
        n = int(3.2 * SR)
        t = t_axis(n)
        f = midi(note)
        tone = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.4)
                + 0.12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.15))
        sig = (tone * np.exp(-t / 1.1) * adsr(n, 0.004, 0.1, 1, 0.3)).astype(np.float32)
        pan = -0.5 + i / max(1, len(notes) - 1)
        place(out[:, 0], sig * np.cos((pan + 1) * np.pi / 4), at + i * spread, gain)
        place(out[:, 1], sig * np.sin((pan + 1) * np.pi / 4), at + i * spread, gain)
    return out


def intro_motif() -> np.ndarray:
    """Sparse high notes over the intro ("claridad"), outside the voice's main range."""
    out = np.zeros((N, 2), np.float32)
    for t, note in ((0.9, 81), (3.3, 77), (5.8, 81), (8.2, 84)):
        out += bells(t, [note], 0.05)
    return out


def duck_envelope(voice: np.ndarray) -> np.ndarray:
    """Gain (linear) that lowers the music by up to 7 dB while the narration is speaking."""
    hop = int(0.01 * SR)
    frames = voice[: len(voice) // hop * hop].reshape(-1, hop)
    rms = 20 * np.log10(np.sqrt((frames**2).mean(axis=1)) + 1e-9)
    active = (rms > -45).astype(np.float32)
    # Look ahead 120 ms so the music dips just before the first syllable; slow release (450 ms).
    active = np.maximum(active, np.roll(active, -12))
    smooth = np.zeros_like(active)
    level = 0.0
    for i, a in enumerate(active):
        coef = 0.25 if a > level else 0.022
        level += coef * (a - level)
        smooth[i] = level
    gain_db = -7.0 * smooth
    curve = np.repeat(db(gain_db), hop)
    curve = np.pad(curve, (0, max(0, N - len(curve))), constant_values=1.0)[:N]
    return curve.astype(np.float32)


def main() -> None:
    plan = chord_plan()
    print("Acordes:", ", ".join(f"{c}@{s:.1f}" for s, _, c in plan))
    drum_bus, side = drums()
    pump = 1 - 0.28 * side  # subtle sidechain feel in the groove
    harmonic = pad(plan) * pump[:, None] + bass(plan) * pump[:, None]
    melodic = arpeggio(plan) + intro_motif()
    hits = (
        impact(M["logoHit"], 0.55) + bells(M["logoHit"], [74, 81, 86], 0.09)
        + impact(M["finalHit"], 0.7) + bells(M["finalHit"], [77, 81, 84, 89], 0.1, 0.12)
        + riser(G, 2.2, 0.06) + riser(M["finalHit"], 2.6, 0.05) + riser(M["logoHit"], 1.6, 0.04)
    )
    dry = harmonic + melodic + drum_bus + hits
    send = harmonic * 0.35 + melodic * 0.6 + hits * 0.5 + drum_bus * 0.06
    ir = reverb_ir(2.6, 6500)
    wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1).astype(np.float32)
    mix = dry + 0.42 * wet
    # Gentle master: low cut, soft clip, fades.
    sos = butter(2, 30 / (SR / 2), btype="high", output="sos")
    mix = sosfilt(sos, mix, axis=0).astype(np.float32)
    mix[: int(0.4 * SR)] *= np.linspace(0, 1, int(0.4 * SR))[:, None]
    tail = int(1.2 * SR)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 1.5
    meter = pyloudnorm.Meter(SR)
    loudness = meter.integrated_loudness(mix)
    mix = pyloudnorm.normalize.loudness(mix, loudness, -20.0)
    mix = np.tanh(mix * 1.1) / 1.1
    save(GEN / "music-raw.wav", mix)

    voice = load(GEN / "narration.wav")
    ducked = mix * duck_envelope(voice)[:, None]
    # Music bed level under the narration (~-26 LUFS while ducked, voice at about -18 LUFS).
    ducked *= db(-4.5)
    save(GEN / "music.wav", ducked.astype(np.float32))
    print(f"music.wav: {N / SR:.2f} s, sonoridad sin ducking −20 LUFS; con ducking {meter.integrated_loudness(ducked):.1f} LUFS")


if __name__ == "__main__":
    main()
