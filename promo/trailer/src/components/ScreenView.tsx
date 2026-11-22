import { Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';

export type Focus = { at: number; cx: number; cy: number; zoom: number };

type Props = {
  src: string;
  width: number;
  height: number;
  /** Natural size of the image (defaults to the 3200 × 1800 captures). */
  imageWidth?: number;
  imageHeight?: number;
  /** Camera keyframes (frames relative to the parent Sequence). zoom 1 = image width fills the view. */
  focus: Focus[];
  children?: React.ReactNode;
  radius?: number;
  filter?: string;
};

/**
 * Shows a real AdminGest capture inside a fixed viewport, with a smooth camera (pan + zoom).
 * The image is only scaled uniformly, never stretched; the camera is clamped so the viewport is
 * always covered. Children are positioned in image coordinates (percentages) and move with it.
 */
export const ScreenView: React.FC<Props> = ({
  src,
  width,
  height,
  imageWidth = 3200,
  imageHeight = 1800,
  focus,
  children,
  radius = 0,
  filter,
}) => {
  const frame = useCurrentFrame();
  const keys = focus.length === 1 ? [focus[0], { ...focus[0], at: focus[0].at + 1 }] : focus;
  const ease = {
    easing: Easing.bezier(0.45, 0, 0.2, 1),
    extrapolateLeft: 'clamp' as const,
    extrapolateRight: 'clamp' as const,
  };
  const pick = (key: 'cx' | 'cy' | 'zoom') => {
    for (let i = 0; i < keys.length - 1; i++) {
      if (frame <= keys[i + 1].at || i === keys.length - 2) {
        return interpolate(
          frame,
          [keys[i].at, keys[i + 1].at],
          [keys[i][key], keys[i + 1][key]],
          ease,
        );
      }
    }
    return keys[0][key];
  };
  const minZoom = Math.max(1, (height / width) * (imageWidth / imageHeight));
  const zoom = Math.max(pick('zoom'), minZoom);
  const scale = (zoom * width) / imageWidth;
  const w = imageWidth * scale;
  const h = imageHeight * scale;
  const x = Math.min(0, Math.max(width - w, width / 2 - pick('cx') * w));
  const y = Math.min(0, Math.max(height - h, height / 2 - pick('cy') * h));
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        borderRadius: radius,
        filter,
      }}
    >
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
        <Img
          src={staticFile(`screens/${src}`)}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
        {children}
      </div>
    </div>
  );
};

/** Animated highlight drawn around a region of the capture (coordinates in % of the image). */
export const Highlight: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  from: number;
  to?: number;
  color?: string;
}> = ({ x, y, w, h, from, to = Infinity, color = '#22d3ee' }) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [from, from + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const vanish = Number.isFinite(to)
    ? interpolate(frame, [to - 8, to], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const opacity = appear * vanish;
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        borderRadius: 14,
        border: `3px solid ${color}`,
        boxShadow: `0 0 26px ${color}, inset 0 0 18px rgba(34,211,238,0.25)`,
        opacity,
        transform: `scale(${1.06 - 0.06 * appear})`,
      }}
    />
  );
};
