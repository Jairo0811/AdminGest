import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ScreenView } from '../components/ScreenView';
import { Logo } from '../components/Logo';
import { useIsPortrait } from '../layout';
import { colors, fonts } from '../theme';
import { marks, scene, wordAt } from '../time';

/** Real interface fragments used for the "problem" and "solution" scenes. */
const PIECES = [
  { src: 'customers.webp', cx: 0.42, cy: 0.33, zoom: 2.4, label: 'Clientes' },
  { src: 'projects-gantt.webp', cx: 0.6, cy: 0.42, zoom: 2.2, label: 'Tareas' },
  { src: 'quotes.webp', cx: 0.4, cy: 0.42, zoom: 2.3, label: 'Cotizaciones' },
  { src: 'opportunities-kanban.webp', cx: 0.38, cy: 0.42, zoom: 2.2 },
  { src: 'activities.webp', cx: 0.4, cy: 0.35, zoom: 2.3 },
  { src: 'dashboard.webp', cx: 0.45, cy: 0.3, zoom: 2.3 },
];

const LANDSCAPE = [
  [-560, -250],
  [540, -280],
  [-40, 30],
  [600, 230],
  [-620, 250],
  [60, -330],
];
const PORTRAIT = [
  [-230, -520],
  [240, -300],
  [-200, -40],
  [230, 220],
  [-220, 480],
  [200, 700],
];

const Piece: React.FC<{
  i: number;
  x: number;
  y: number;
  scatter: number;
  gather: number;
  dim: number;
}> = ({ i, x, y, scatter, gather, dim }) => {
  const frame = useCurrentFrame();
  const p = PIECES[i];
  const seed = (k: string) => random(`${k}${i}`);
  const depth = 0.75 + seed('d') * 0.4;
  const wobble = Math.sin(frame / (28 + seed('w') * 20) + i) * 10;
  const rot = (seed('r') - 0.5) * 16 * (1 - gather);
  const sx = x * (1 + 0.35 * scatter) * (1 - gather);
  const sy = (y + wobble) * (1 + 0.25 * scatter) * (1 - gather);
  const blur = (1 - depth) * 10 + dim * 6 + gather * 4;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate(${sx}px, ${sy}px) rotate(${rot}deg) scale(${depth * (1 - 0.7 * gather)})`,
        opacity: (1 - 0.65 * dim) * (1 - gather),
        filter: `blur(${blur}px) saturate(${1 - 0.7 * dim})`,
      }}
    >
      <div
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(159,179,198,0.25)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
        }}
      >
        <ScreenView
          src={p.src}
          width={520}
          height={300}
          focus={[{ at: 0, cx: p.cx, cy: p.cy, zoom: p.zoom }]}
        />
      </div>
    </div>
  );
};

export const Fragments: React.FC<{ at: (s: number) => number; mode: 'problem' | 'solution' }> = ({
  at,
  mode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const portrait = useIsPortrait();
  const positions = portrait ? PORTRAIT : LANDSCAPE;
  const lose = at(wordAt('s2', 'perderse')) - 6;
  const appear = (i: number) =>
    spring({ frame: frame - i * 5, fps, config: { damping: 20, stiffness: 60 } });
  const dim =
    mode === 'problem'
      ? interpolate(frame, [lose, lose + 30], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const scatter = dim;
  const solutionStart = at(scene('solution').start);
  const gather =
    mode === 'solution'
      ? interpolate(frame, [solutionStart, at(marks.logoReveal) + 2], [0, 1], {
          easing: Easing.in(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 0;
  const words = [
    { w: 'Clientes', t: at(wordAt('s2', 'clientes')) },
    { w: 'Tareas', t: at(wordAt('s2', 'tareas')) },
    { w: 'Cotizaciones', t: at(wordAt('s2', 'cotizaciones')) },
  ];
  const flash =
    mode === 'solution'
      ? interpolate(
          frame,
          [at(marks.logoReveal) - 2, at(marks.logoReveal) + 4, at(marks.logoReveal) + 26],
          [0, 0.85, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )
      : 0;
  return (
    <AbsoluteFill>
      {mode === 'problem' || gather < 1
        ? PIECES.map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: mode === 'problem' ? appear(i) : 1,
              }}
            >
              <Piece
                i={i}
                x={positions[i][0]}
                y={positions[i][1]}
                scatter={scatter}
                gather={gather}
                dim={dim}
              />
            </div>
          ))
        : null}
      {mode === 'problem' ? (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: portrait ? 'column' : 'row',
            gap: portrait ? 26 : 34,
          }}
        >
          {words.map(({ w, t }, i) => {
            const pop = spring({ frame: frame - t, fps, config: { damping: 14, stiffness: 120 } });
            const fade = interpolate(frame, [lose + 10, lose + 34], [1, 0.25], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={w}
                style={{
                  transform: `scale(${0.8 + 0.2 * pop}) translateY(${(1 - pop) * 20}px)`,
                  opacity: pop * fade,
                  padding: '16px 34px',
                  borderRadius: 999,
                  background: 'rgba(11,27,44,0.82)',
                  border: `2px solid ${i === 2 ? colors.green : colors.cyan}`,
                  boxShadow: `0 0 30px rgba(34,211,238,0.25)`,
                  fontFamily: fonts.heading,
                  fontWeight: 800,
                  fontSize: portrait ? 64 : 56,
                  color: colors.white,
                }}
              >
                {w}
              </div>
            );
          })}
        </AbsoluteFill>
      ) : null}
      {mode === 'solution' ? (
        <>
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(34,211,238,${flash}), transparent 55%)`,
            }}
          />
          <AbsoluteFill
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: portrait ? 160 : 90,
            }}
          >
            <Logo from={at(marks.logoReveal)} height={portrait ? 560 : 520} />
          </AbsoluteFill>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
