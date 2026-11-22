"""Utilidades de audio compartidas (lectura/escritura WAV con ffmpeg, 48 kHz)."""
import json, subprocess
from pathlib import Path

import numpy as np

SR = 48_000
ROOT = Path(__file__).resolve().parent.parent
GEN = ROOT / "public/audio/generated"


def load(path, channels=1, filters=None) -> np.ndarray:
    cmd = ["ffmpeg", "-v", "error", "-i", str(path)]
    if filters:
        cmd += ["-af", filters]
    cmd += ["-ac", str(channels), "-ar", str(SR), "-f", "f32le", "-"]
    data = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)
    return data.reshape(-1, channels) if channels > 1 else data.copy()


def save(path, audio: np.ndarray) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    audio = np.asarray(audio, np.float32)
    channels = 1 if audio.ndim == 1 else audio.shape[1]
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(channels), "-i", "-",
         "-c:a", "pcm_s24le", str(path)],
        input=audio.tobytes(), check=True,
    )


def data(name: str) -> dict:
    return json.loads((ROOT / "src/data" / name).read_text(encoding="utf-8"))


def db(x: float) -> float:
    return 10 ** (x / 20)
