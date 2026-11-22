import { Composition, continueRender, delayRender } from 'remotion';
import { fontsReady } from './fonts';
import { TOTAL_FRAMES, FPS } from './time';
import { Trailer } from './Trailer';

const handle = delayRender('Cargando tipografías de AdminGest');
fontsReady
  .then(() => continueRender(handle))
  .catch((error) => {
    console.error(error);
    continueRender(handle);
  });

export const Root: React.FC = () => (
  <>
    <Composition
      id="AdminGestTrailer"
      component={Trailer}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ orientation: 'landscape' as const }}
    />
    <Composition
      id="AdminGestTrailerVertical"
      component={Trailer}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ orientation: 'portrait' as const }}
    />
  </>
);
