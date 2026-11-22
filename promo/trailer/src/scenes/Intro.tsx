import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { Reveal } from '../components/Text';
import { useIsPortrait } from '../layout';
import { colors, fonts } from '../theme';
import { wordAt } from '../time';

/** Scene 1 — «Una empresa crece… cuando tiene claridad para avanzar». A growth line draws itself. */
export const Intro: React.FC<{ at: (s: number) => number; length: number }> = ({ at, length }) => {
  const frame = useCurrentFrame();
  const portrait = useIsPortrait();
  const W = portrait ? 1080 : 1920;
  const H = portrait ? 1920 : 1080;
  const draw = interpolate(frame, [6, length - 10], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateRight: 'clamp',
  });
  const pts = [0, 0.12, 0.08, 0.27, 0.22, 0.43, 0.38, 0.62, 0.58, 0.86].map((v, i, arr) => [
    (i / (arr.length - 1)) * W * 0.8 + W * 0.1,
    H * (portrait ? 0.62 : 0.7) - v * H * (portrait ? 0.28 : 0.42),
  ]);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const total = 2600;
  const headIndex = Math.min(pts.length - 1, Math.floor(draw * (pts.length - 1)));
  const clarity = at(wordAt('s1', 'claridad')) - 4;
  return (
    <AbsoluteFill>
      <svg width={W} height={H} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="growth" x1="0" x2="1">
            <stop offset="0%" stopColor={colors.blue} />
            <stop offset="60%" stopColor={colors.cyan} />
            <stop offset="100%" stopColor={colors.green} />
          </linearGradient>
          <filter id="soft">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#growth)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={total}
          strokeDashoffset={total * (1 - draw)}
          filter="url(#soft)"
          opacity={0.65}
        />
        <path
          d={path}
          fill="none"
          stroke="url(#growth)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={total}
          strokeDashoffset={total * (1 - draw)}
        />
        {pts.slice(0, headIndex + 1).map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === headIndex ? 9 : 5}
            fill={i % 3 === 2 ? colors.green : colors.cyan}
            opacity={i === headIndex ? 1 : 0.7}
          />
        ))}
      </svg>
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          paddingBottom: portrait ? 520 : 300,
        }}
      >
        <Reveal from={clarity}>
          <div
            style={{
              fontFamily: fonts.heading,
              fontWeight: 800,
              fontSize: portrait ? 96 : 92,
              letterSpacing: -1.5,
              color: colors.white,
              textAlign: 'center',
              lineHeight: 1.05,
            }}
          >
            Claridad <span style={{ color: colors.cyan }}>para avanzar</span>
          </div>
        </Reveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
