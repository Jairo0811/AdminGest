import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { useIsPortrait } from '../layout';

/** Viewport size of the application window for each orientation. */
export const useViewport = () =>
  useIsPortrait() ? { width: 1000, height: 860 } : { width: 1240, height: 698 };

/**
 * Feature scene layout: title on the left and the app window on the right (16:9), or title on top
 * and the window below (9:16). The window floats in with a gentle 3D tilt.
 */
export const FeatureLayout: React.FC<{
  title: React.ReactNode;
  children: React.ReactNode;
  enterFrom?: 'right' | 'below';
  length: number;
}> = ({ title, children, enterFrom = 'right', length }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const portrait = useIsPortrait();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 70 } });
  const drift = interpolate(frame, [0, length], [0, 1], { easing: Easing.inOut(Easing.sin) });
  const rotY = portrait ? 0 : -11 + 6 * drift;
  const rotX = portrait ? 8 - 6 * drift : 3;
  const shift = (1 - enter) * (enterFrom === 'right' && !portrait ? 260 : 0);
  const rise = (1 - enter) * (portrait || enterFrom === 'below' ? 180 : 0);
  const media = (
    <div style={{ perspective: 1900 }}>
      <div
        style={{
          transform: `translate(${shift}px, ${rise}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${0.94 + 0.06 * enter})`,
          opacity: enter,
        }}
      >
        {children}
      </div>
    </div>
  );
  if (portrait) {
    return (
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 190 }}>
        <div style={{ height: 330, display: 'flex', alignItems: 'flex-end', marginBottom: 40 }}>
          {title}
        </div>
        {media}
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 100, paddingBottom: 60 }}
    >
      <div style={{ width: 470, flex: 'none' }}>{title}</div>
      <div style={{ marginLeft: 30 }}>{media}</div>
    </AbsoluteFill>
  );
};
