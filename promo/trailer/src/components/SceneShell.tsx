import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { f, scene, SceneId } from '../time';

const PAD = 8; // frames of cross-fade shared with the neighbouring scenes

/**
 * Default transition: the outgoing scene fades to the background and the next one rises from it
 * (no double exposure of two interfaces). `dissolve` keeps a classic cross-fade for scenes that
 * continue the same imagery (problem → solution).
 */
const Fade: React.FC<{
  length: number;
  children: React.ReactNode;
  first: boolean;
  last: boolean;
  enter: 'dip' | 'dissolve';
  exit: 'dip' | 'dissolve';
}> = ({ length, children, first, last, enter, exit }) => {
  const frame = useCurrentFrame();
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
  const fadeIn =
    enter === 'dip'
      ? interpolate(frame, [PAD - 2, PAD * 2], [0, 1], clamp)
      : interpolate(frame, [0, PAD * 2], [0, 1], clamp);
  const fadeOut =
    exit === 'dip'
      ? interpolate(frame, [length - PAD * 2, length - PAD + 2], [1, 0], clamp)
      : interpolate(frame, [length - PAD * 2, length], [1, 0], clamp);
  const opacity = Math.min(first ? 1 : fadeIn, last ? 1 : fadeOut);
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/**
 * Places a scene on the global timeline. Children receive frames relative to `scene.start`
 * (the extra lead-in frames used by the cross-fade are subtracted through `offset`).
 */
export const SceneShell: React.FC<{
  id: SceneId;
  enter?: 'dip' | 'dissolve';
  exit?: 'dip' | 'dissolve';
  children: (helpers: { at: (seconds: number) => number; length: number }) => React.ReactNode;
}> = ({ id, enter = 'dip', exit = 'dip', children }) => {
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
      <Fade length={length} first={first} last={end >= durationInFrames} enter={enter} exit={exit}>
        {children({ at, length })}
      </Fade>
    </Sequence>
  );
};
