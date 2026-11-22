"""Genera src/data/timeline.json (escenas, marcas de música y efectos) a partir de narration.json.

Es la única fuente de tiempos: la composición de Remotion, la música y los efectos la leen, así que
al sustituir la narración (npm run align) todo se resincroniza automáticamente.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT


def main() -> None:
    n = json.loads((ROOT / "src/data/narration.json").read_text(encoding="utf-8"))
    seg = {s["id"]: s for s in n["segments"]}
    at = lambda k: seg[k]["at"]
    end = lambda k: seg[k]["at"] + seg[k]["duration"]
    total = n["total"]

    # Rhythm section (CRM → reports) is locked to a 100 BPM grid anchored on the CRM entrance.
    groove = at("s5a") - 0.45
    snap = lambda t: groove + round((t - groove) / BEAT) * BEAT

    scenes = [
        {"id": "intro", "start": 0.0},
        {"id": "problem", "start": at("s2") - 0.35},
        {"id": "solution", "start": at("s3a") - 0.25},
        {"id": "platform", "start": at("s4") - 0.5},
        {"id": "crm", "start": groove},
        {"id": "quotes", "start": snap(at("s6a") - 0.35)},
        {"id": "reports", "start": snap(at("s7") - 0.35)},
        {"id": "unified", "start": snap(at("s8") - 0.35)},
        {"id": "closing", "start": at("s9a") - 0.35},
    ]
    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else total
        sc["start"], sc["end"] = round(sc["start"], 3), round(sc["end"], 3)

    marks = {
        # Visual beats inside scenes (seconds, absolute).
        "logoReveal": round(at("s3b"), 3),
        "loginToDashboard": round(at("s4") + 1.6, 3),
        "customersToKanban": round(snap(at("s5b") - 0.25), 3),
        "quoteToGantt": round(snap(at("s6b") - 0.3), 3),
        "finalLogo": round(at("s9a"), 3),
        "tagline": round(at("s9b"), 3),
        "versionLine": round(end("s9b") + 0.25, 3),
    }
    music = {
        "bpm": BPM,
        "grooveStart": round(groove, 3),
        "growthStart": scenes[2]["start"],
        "resolveStart": scenes[7]["start"],
        "finalHit": marks["finalLogo"],
        "logoHit": marks["logoReveal"],
        "end": total,
    }
    sfx = [
        {"type": "whoosh", "t": scenes[1]["start"]},
        {"type": "shimmer", "t": marks["logoReveal"] - 0.05},
        {"type": "whoosh", "t": scenes[3]["start"]},
        {"type": "click", "t": marks["loginToDashboard"] - 0.35},
        {"type": "swoosh", "t": scenes[4]["start"]},
        {"type": "swoosh", "t": marks["customersToKanban"]},
        {"type": "swoosh", "t": scenes[5]["start"]},
        {"type": "swoosh", "t": marks["quoteToGantt"]},
        {"type": "swoosh", "t": scenes[6]["start"]},
        {"type": "whoosh", "t": scenes[7]["start"]},
        {"type": "shimmer", "t": marks["finalLogo"] - 0.05},
    ]
    data = {"fps": 30, "total": total, "scenes": scenes, "marks": marks, "music": music, "sfx": sfx}
    (ROOT / "src/data/timeline.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    for sc in scenes:
        print(f"{sc['id']:9s} {sc['start']:6.2f} → {sc['end']:6.2f}")


if __name__ == "__main__":
    main()
