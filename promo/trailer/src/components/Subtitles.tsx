import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { useIsPortrait } from '../layout';
import { colors, fonts } from '../theme';
import { FPS, segments } from '../time';

/** Segments whose text is already on screen as a title card (the closing) are not subtitled. */
const HIDDEN = new Set(['s9a', 's9b']);
const cues = segments.filter((s) => !HIDDEN.has(s.id)).flatMap((s) => s.cues);

/** Short, synchronised Spanish subtitles (one phrase at a time). */
export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const portrait = useIsPortrait();
  const t = frame / FPS;
  const cue = cues.find((c) => t >= c.start - 0.08 && t <= c.end + 0.35);
  if (!cue) return null;
  const opacity = Math.min(
    interpolate(t, [cue.start - 0.08, cue.start + 0.08], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    interpolate(t, [cue.end + 0.15, cue.end + 0.35], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: portrait ? 250 : 54,
      }}
    >
      <div
        style={{
          opacity,
          maxWidth: portrait ? 940 : 1400,
          padding: portrait ? '16px 30px' : '12px 28px',
          borderRadius: 14,
          background: 'rgba(5,13,24,0.72)',
          border: '1px solid rgba(159,179,198,0.16)',
          fontFamily: fonts.body,
          fontWeight: 500,
          fontSize: portrait ? 44 : 38,
          lineHeight: 1.3,
          color: colors.white,
          textAlign: 'center',
          textShadow: '0 2px 10px rgba(0,0,0,0.6)',
        }}
      >
        {cue.text}
      </div>
    </AbsoluteFill>
  );
};
