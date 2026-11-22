// Remotion configuration for the AdminGest trailer.
// https://www.remotion.dev/docs/config
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
// Concurrency defaults to half of the CPU cores; override with --concurrency.
// Use a locally installed Chrome/Chromium when Remotion cannot download its own headless shell
// (for example behind a corporate proxy): REMOTION_BROWSER=/path/to/chrome npm run render.
if (process.env.REMOTION_BROWSER) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
Config.setChromiumOpenGlRenderer('swangle');
