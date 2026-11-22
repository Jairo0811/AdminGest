import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

/** Official AdminGest logo (unaltered artwork) with an entrance spring, glow and light sweep. */
export const Logo: React.FC<{ from: number; height: number; glow?: number }> = ({
  from,
  height,
  glow = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - from,
    fps,
    config: { damping: 16, stiffness: 90, mass: 0.9 },
  });
  const sweep = interpolate(frame - from, [8, 38], [-60, 160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const width = (height * 695) / 650;
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        opacity: Math.min(1, enter * 1.4),
        transform: `scale(${0.82 + 0.18 * enter})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-25%',
          background: `radial-gradient(closest-side, rgba(0,126,225,${0.38 * glow}), rgba(21,210,109,${0.12 * glow}) 55%, transparent 75%)`,
          filter: 'blur(10px)',
        }}
      />
      <Img
        src={staticFile('brand/logo.png')}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.55))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: `url(${staticFile('brand/logo.png')})`,
          WebkitMaskSize: '100% 100%',
          maskImage: `url(${staticFile('brand/logo.png')})`,
          maskSize: '100% 100%',
          background: `linear-gradient(105deg, transparent ${sweep - 18}%, rgba(255,255,255,0.55) ${sweep}%, transparent ${sweep + 18}%)`,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
};
