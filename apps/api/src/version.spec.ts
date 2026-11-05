import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { API_VERSION } from './version';

const versionOf = (path: string) =>
  (JSON.parse(readFileSync(join(__dirname, path), 'utf8')) as { version: string }).version;

describe('version', () => {
  it('is consistent across the workspace packages', () => {
    expect(versionOf('../package.json')).toBe(API_VERSION);
    expect(versionOf('../../web/package.json')).toBe(API_VERSION);
    expect(versionOf('../../../package.json')).toBe(API_VERSION);
  });
});
