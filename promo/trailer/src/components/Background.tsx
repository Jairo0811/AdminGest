import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../theme';

/** Deep navy backdrop with a slow perspective grid, drifting particles and soft light. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const drift = (frame / durationInFrames) * 120;
  const particles = Array.from({ length: 46 }, (_, i) => {
    const x = random(`px${i}`) * width;
    const y =
      (random(`py${i}`) * height * 1.2 - frame * (0.25 + random(`pv${i}`) * 0.6)) % (height * 1.2);
    const size = 1.5 + random(`ps${i}`) * 3.5;
    const alpha = 0.15 + random(`pa${i}`) * 0.45;
    const twinkle = 0.6 + 0.4 * Math.sin(frame / (12 + random(`pt${i}`) * 20) + i);
    return {
      x,
      y: y < -20 ? y + height * 1.2 : y,
      size,
      alpha: alpha * twinkle,
      green: random(`pg${i}`) > 0.8,
    };
  });
  const glow = interpolate(Math.sin(frame / 70), [-1, 1], [0.35, 0.6]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 40%, ${colors.navySoft} 0%, ${colors.navy} 45%, ${colors.night} 100%)`,
      }}
    >
      <AbsoluteFill style={{ perspective: 900, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: '-50%',
            width: '200%',
            height: '120%',
            top: '45%',
            transform: `rotateX(72deg) translateY(${drift % 80}px)`,
            transformOrigin: '50% 0%',
            backgroundImage: `linear-gradient(rgba(34,211,238,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.10) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 70%)',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(40% 35% at 78% 20%, rgba(0,126,225,${glow * 0.45}) 0%, transparent 70%), radial-gradient(35% 30% at 15% 85%, rgba(21,210,109,${glow * 0.18}) 0%, transparent 70%)`,
        }}
      />
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.green ? colors.green : colors.cyan,
            opacity: p.alpha,
            boxShadow: `0 0 ${p.size * 4}px ${p.green ? colors.green : colors.cyan}`,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(100% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
