"""Alinea la narración grabada con el guion y genera src/data/narration.json.

Uso: python3 tools/align.py [ruta-audio]   (por defecto public/audio/narration-source.*)
Requiere: pip install faster-whisper (modelo «small», se descarga de Hugging Face la primera vez).

Para cada frase del guion (tools/script.json) calcula el tramo de la grabación que le corresponde
(cortes en mitad de los silencios), su posición en el montaje (leadIn + gapBefore) y los subtítulos
con tiempos de palabra. Así una grabación humana sustituye a la sintética sin tocar el código.
"""
import glob, json, re, subprocess, sys, unicodedata
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = json.loads((ROOT / "tools/script.json").read_text(encoding="utf-8"))


def norm(word: str) -> str:
    word = unicodedata.normalize("NFD", word.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in word if unicodedata.category(c) != "Mn"))


def source_path() -> Path:
    if len(sys.argv) > 1:
        return Path(sys.argv[1]).resolve()
    found = sorted(glob.glob(str(ROOT / "public/audio/narration-source.*")))
    if not found:
        sys.exit("No se encontró public/audio/narration-source.(wav|mp3)")
    return Path(found[0])


def transcribe(path: Path):
    from faster_whisper import WhisperModel

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    audio = np.frombuffer(raw, np.float32)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio, language="es", word_timestamps=True, initial_prompt="AdminGest")
    words = [w for s in segments for w in s.words]
    duration = len(audio) / 16000
    # 10 ms RMS envelope in dBFS, used to place cuts in real silences.
    frames = audio[: len(audio) // 160 * 160].reshape(-1, 160)
    env = 20 * np.log10(np.sqrt((frames**2).mean(axis=1)) + 1e-9)
    return [{"w": w.word.strip(), "n": norm(w.word), "s": float(w.start), "e": float(w.end)} for w in words if norm(w.word)], duration, env


def main() -> None:
    src = source_path()
    words, duration, env = transcribe(src)
    floor = np.percentile(env, 95) - 35  # silence threshold relative to speech level

    def quietest(a: float, b: float) -> float:
        """Middle of the longest silent run in [a, b]; ASR word times can be off by ~0.3 s."""
        i, j = max(int(a * 100), 0), min(int(b * 100), len(env) - 1)
        if j <= i:
            return (a + b) / 2
        best, run_start, best_len = None, None, 0
        for k in range(i, j + 2):
            silent = k <= j and env[k] < floor
            if silent and run_start is None:
                run_start = k
            elif not silent and run_start is not None:
                if k - run_start > best_len:
                    best, best_len = (run_start + k) / 2, k - run_start
                run_start = None
        return best / 100 if best is not None else (i + int(np.argmin(env[i : j + 1]))) / 100

    def first_voiced(a: float, b: float) -> float:
        for k in range(int(a * 100), min(int(b * 100), len(env))):
            if env[k] > floor: return k / 100
        return a

    def last_voiced(a: float, b: float) -> float:
        for k in range(min(int(b * 100), len(env) - 1), int(a * 100), -1):
            if env[k] > floor: return (k + 1) / 100
        return b
    script_words = [[norm(t) for t in seg["text"].split() if norm(t)] for seg in SCRIPT["segments"]]

    # Sequential matching of script words to recognised words (tolerant to small ASR differences).
    cursor, spans = 0, []
    for seg, expected in zip(SCRIPT["segments"], script_words):
        first = None
        matched = []
        for token in expected:
            for k in range(cursor, min(cursor + 4, len(words))):
                if words[k]["n"] == token or (len(token) > 4 and words[k]["n"][:4] == token[:4]):
                    matched.append(k); cursor = k + 1; break
        if not matched:
            sys.exit(f"No se pudo alinear la frase {seg['id']}: «{seg['text']}»")
        spans.append((matched[0], matched[-1]))
        print(f"{seg['id']}: {' '.join(words[i]['w'] for i in range(matched[0], matched[-1] + 1))}")

    # Cut points: the quietest 10 ms frame between consecutive phrases (ASR word times are only
    # approximate); each segment is then trimmed to its voiced part with a little air around it.
    cuts = [0.0]
    for (a1, b1), (a2, b2) in zip(spans, spans[1:]):
        cuts.append(quietest(words[b1]["e"] - 0.35, words[a2]["s"] + 0.6))
    cuts.append(duration)
    out, t = [], SCRIPT["leadIn"]
    for idx, (seg, (a, b)) in enumerate(zip(SCRIPT["segments"], spans)):
        lo, hi = cuts[idx], cuts[idx + 1]
        start = max(first_voiced(lo, hi) - 0.06, lo)
        end = min(last_voiced(lo, hi) + 0.14, hi)
        t += seg["gapBefore"]
        at = t
        seg_words = [{"w": words[i]["w"], "start": round(at + words[i]["s"] - start, 3), "end": round(at + words[i]["e"] - start, 3)} for i in range(a, b + 1)]
        cues = []
        texts = seg.get("cues") or [seg["text"]]
        k = 0
        for text in texts:
            count = len([w for w in text.split() if norm(w)])
            chunk = seg_words[k : k + count] or seg_words[-1:]
            cues.append({"text": text, "start": chunk[0]["start"], "end": chunk[-1]["end"]})
            k += count
        out.append({
            "id": seg["id"], "text": seg["text"],
            "src": [round(start, 3), round(end, 3)],
            "at": round(at, 3), "duration": round(end - start, 3),
            "words": seg_words, "cues": cues,
        })
        t = at + (end - start)

    total = round(t + SCRIPT["tail"], 3)
    data = {"source": src.name, "total": total, "segments": out}
    (ROOT / "src/data/narration.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Duración del montaje: {total:.2f} s → src/data/narration.json")


if __name__ == "__main__":
    main()
