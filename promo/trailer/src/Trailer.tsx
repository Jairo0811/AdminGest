import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { Background } from './components/Background';
import { SceneShell } from './components/SceneShell';
import { Subtitles } from './components/Subtitles';
import { LayoutContext, Orientation } from './layout';
import { Closing } from './scenes/Closing';
import { Crm, Platform, QuotesProjects, Reports, Unified } from './scenes/Features';
import { Fragments } from './scenes/Fragments';
import { Intro } from './scenes/Intro';

/**
 * AdminGest — tráiler oficial v1.2.0.
 * Audio in three separate, replaceable tracks (public/audio/generated): narration, music, sfx.
 */
export const Trailer: React.FC<{ orientation: Orientation }> = ({ orientation }) => (
  <LayoutContext.Provider value={orientation}>
    <AbsoluteFill style={{ backgroundColor: '#050d18' }}>
      <Background />
      <SceneShell id="intro">{({ at, length }) => <Intro at={at} length={length} />}</SceneShell>
      <SceneShell id="problem">{({ at }) => <Fragments at={at} mode="problem" />}</SceneShell>
      <SceneShell id="solution">{({ at }) => <Fragments at={at} mode="solution" />}</SceneShell>
      <SceneShell id="platform">
        {({ at, length }) => <Platform at={at} length={length} />}
      </SceneShell>
      <SceneShell id="crm">{({ at, length }) => <Crm at={at} length={length} />}</SceneShell>
      <SceneShell id="quotes">
        {({ at, length }) => <QuotesProjects at={at} length={length} />}
      </SceneShell>
      <SceneShell id="reports">
        {({ at, length }) => <Reports at={at} length={length} />}
      </SceneShell>
      <SceneShell id="unified">
        {({ at, length }) => <Unified at={at} length={length} />}
      </SceneShell>
      <SceneShell id="closing">
        {({ at, length }) => <Closing at={at} length={length} />}
      </SceneShell>
      <Subtitles />
      <Audio src={staticFile('audio/generated/narration.wav')} name="Narración" />
      <Audio src={staticFile('audio/generated/music.wav')} name="Música" />
      <Audio src={staticFile('audio/generated/sfx.wav')} name="Efectos" />
    </AbsoluteFill>
  </LayoutContext.Provider>
);
