import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { useIsPortrait } from '../layout';
import { colors, fonts } from '../theme';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

/** Rises from a mask and fades out; frames are relative to the parent Sequence. */
export const Reveal: React.FC<{
  from: number;
  to?: number;
  children: React.ReactNode;
  distance?: number;
  style?: React.CSSProperties;
}> = ({ from, to = Infinity, children, distance = 40, style }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [from, from + 16], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const exit = Number.isFinite(to) ? interpolate(frame, [to - 10, to], [1, 0], clamp) : 1;
  return (
    <div style={{ overflow: 'hidden', ...style }}>
      <div
        style={{
          transform: `translateY(${(1 - enter) * distance}px)`,
          opacity: enter * exit,
          filter: `blur(${(1 - enter) * 6}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Feature label: eyebrow + title (+ optional detail), placed left in 16:9 and on top in 9:16. */
export const FeatureTitle: React.FC<{
  eyebrow: string;
  title: string;
  detail?: string;
  from: number;
  to?: number;
}> = ({ eyebrow, title, detail, from, to }) => {
  const portrait = useIsPortrait();
  return (
    <div
      style={{
        display: 'grid',
        gap: portrait ? 14 : 16,
        textAlign: portrait ? 'center' : 'left',
        justifyItems: portrait ? 'center' : 'start',
      }}
    >
      <Reveal from={from} to={to} distance={24}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: fonts.body,
            fontWeight: 700,
            fontSize: portrait ? 30 : 24,
            letterSpacing: 5,
            color: colors.cyan,
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 36,
              height: 3,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${colors.cyan}, ${colors.green})`,
            }}
          />
          {eyebrow}
        </div>
      </Reveal>
      <Reveal from={from + 4} to={to}>
        <div
          style={{
            fontFamily: fonts.heading,
            fontWeight: 800,
            fontSize: portrait ? 84 : 76,
            lineHeight: 1.04,
            color: colors.white,
            letterSpacing: -1.5,
            maxWidth: portrait ? 940 : 460,
          }}
        >
          {title}
        </div>
      </Reveal>
      {detail ? (
        <Reveal from={from + 9} to={to} distance={20}>
          <div
            style={{
              fontFamily: fonts.body,
              fontWeight: 500,
              fontSize: portrait ? 36 : 28,
              lineHeight: 1.35,
              color: colors.muted,
              maxWidth: portrait ? 900 : 430,
            }}
          >
            {detail}
          </div>
        </Reveal>
      ) : null}
    </div>
  );
};
