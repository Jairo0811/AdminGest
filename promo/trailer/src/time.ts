import narration from './data/narration.json';
import timeline from './data/timeline.json';

export const FPS = timeline.fps;
export const TOTAL_FRAMES = Math.ceil(timeline.total * FPS);
export const f = (seconds: number) => Math.round(seconds * FPS);

export type SceneId =
  | 'intro'
  | 'problem'
  | 'solution'
  | 'platform'
  | 'crm'
  | 'quotes'
  | 'reports'
  | 'unified'
  | 'closing';

export const scene = (id: SceneId) => {
  const s = timeline.scenes.find((item) => item.id === id);
  if (!s) throw new Error(`Escena desconocida: ${id}`);
  return s;
};

export const marks = timeline.marks;
export const segments = narration.segments;

/** Absolute time (s) when a spoken word starts, searching from a given segment. */
export const wordAt = (segmentId: string, word: string): number => {
  const seg = narration.segments.find((s) => s.id === segmentId);
  const normal = (w: string) =>
    w
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]/g, '');
  const hit = seg?.words.find((w) => normal(w.w).startsWith(normal(word)));
  return hit?.start ?? seg?.at ?? 0;
};
