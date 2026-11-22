import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';

/** Fonts of the AdminGest interface (OFL), bundled locally so renders are deterministic. */
const FILES: Array<[string, string, string]> = [
  ['Manrope', '600', 'manrope-latin-600-normal.woff2'],
  ['Manrope', '700', 'manrope-latin-700-normal.woff2'],
  ['Manrope', '800', 'manrope-latin-800-normal.woff2'],
  ['DM Sans', '400', 'dm-sans-latin-400-normal.woff2'],
  ['DM Sans', '500', 'dm-sans-latin-500-normal.woff2'],
  ['DM Sans', '700', 'dm-sans-latin-700-normal.woff2'],
];

export const fontsReady = Promise.all(
  FILES.map(([family, weight, file]) =>
    loadFont({
      family,
      weight,
      url: staticFile(`fonts/${file}`),
      format: 'woff2',
      display: 'block',
    }),
  ),
);
