/**
 * 시각 하네스 공용 경로·도구 로더.
 *
 * esbuild · playwright-core 는 expo-app 의존성에 넣지 않고 사용자 캐시(`run.sh` 가 설치)에서 불러온다.
 * → package.json·EAS 설치 경로에 영향 없음.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
'use strict';

const os = require('os');
const path = require('path');
const { createRequire } = require('module');

const HARNESS_DIR = __dirname;
const EXPO_APP_DIR = path.resolve(HARNESS_DIR, '..', '..');

const TOOLS_DIR =
  process.env.COVER_HARNESS_TOOLS_DIR ||
  path.join(
    process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'),
    'mindgarden-cover-harness',
  );

const OUT_DIR =
  process.env.COVER_HARNESS_OUT_DIR || path.join(os.tmpdir(), 'mindgarden-cover-harness', 'dist');

const ARTIFACTS_DIR = process.env.COVER_HARNESS_ARTIFACTS_DIR || '/opt/cursor/artifacts';

const CHROME_PATH = process.env.COVER_HARNESS_CHROME || '/usr/local/bin/google-chrome';

function requireTool(name) {
  const req = createRequire(path.join(TOOLS_DIR, 'package.json'));
  try {
    return req(name);
  } catch (err) {
    throw new Error(
      `[cover-harness] "${name}" not found in ${TOOLS_DIR}. Run scripts/cover-chapter-visual-harness/run.sh (installs pinned tools). ${err.message}`,
    );
  }
}

module.exports = {
  HARNESS_DIR,
  EXPO_APP_DIR,
  TOOLS_DIR,
  OUT_DIR,
  ARTIFACTS_DIR,
  CHROME_PATH,
  requireTool,
};
