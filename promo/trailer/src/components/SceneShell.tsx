import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { f, scene, SceneId } from '../time';

const PAD = 8; // frames of cross-fade shared with the neighbouring scenes

const Fade: React.FC<{
  length: number;
  children: React.ReactNode;
  first: boolean;
  last: boolean;
}> = ({ length, children, first, last }) => {
  const frame = useCurrentFrame();
  const opacity = Math.min(
    first ? 1 : interpolate(frame, [0, PAD * 2], [0, 1], { extrapolateRight: 'clamp' }),
    last ? 1 : interpolate(frame, [length - PAD * 2, length], [1, 0], { extrapolateLeft: 'clamp' }),
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/**
 * Places a scene on the global timeline. Children receive frames relative to `scene.start`
 * (the extra lead-in frames used by the cross-fade are subtracted through `offset`).
 */
export const SceneShell: React.FC<{
  id: SceneId;
  children: (helpers: { at: (seconds: number) => number; length: number }) => React.ReactNode;
}> = ({ id, children }) => {
  const { durationInFrames } = useVideoConfig();
  const s = scene(id);
  const first = s.start === 0;
  const start = Math.max(0, f(s.start) - (first ? 0 : PAD));
  const end = Math.min(durationInFrames, f(s.end) + PAD);
  const length = end - start;
  const offset = f(s.start) - start;
  // `at` converts an absolute time (s) into a frame relative to this sequence.
  const at = (seconds: number) => f(seconds) - f(s.start) + offset;
  return (
    <Sequence from={start} durationInFrames={length} name={id}>
      <Fade length={length} first={first} last={end >= durationInFrames}>
        {children({ at, length })}
      </Fade>
    </Sequence>
  );
};
