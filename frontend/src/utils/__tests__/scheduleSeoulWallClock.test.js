/**
 * 브라우저 TZ 가 운영 타임존일 때와 아닐 때 같은 벽시계 테스트를 각각 실행한다.
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { CONSULTATION_LOG_SESSION_START_TIME_ZONE } from '../../constants/consultationLogAutosaveConstants';

const FRONTEND_ROOT = path.resolve(__dirname, '../../..');
const CASES_FILE = 'src/utils/__tests__/scheduleSeoulWallClock.cases.test.js';
const OTHER_ZONE = 'UTC';

const runCases = (timeZone) => spawnSync(
  process.execPath,
  [
    require.resolve('react-scripts/scripts/test.js'),
    '--watchAll=false',
    '--runInBand',
    '--watchman=false',
    CASES_FILE
  ],
  {
    cwd: FRONTEND_ROOT,
    env: {
      ...process.env,
      TZ: timeZone,
      CI: 'true',
      FORCE_COLOR: '0'
    },
    encoding: 'utf8',
    timeout: 180000
  }
);

describe('schedule wall clock across browser time zones', () => {
  test.each([CONSULTATION_LOG_SESSION_START_TIME_ZONE, OTHER_ZONE])(
    'TZ=%s 에서 이동 본문·기본 날짜 벽시계',
    (timeZone) => {
      const result = runCases(timeZone);
      if (result.status !== 0) {
        const output = `${result.stdout || ''}\n${result.stderr || ''}`;
        throw new Error(output.slice(-4000));
      }
      expect(result.status).toBe(0);
    },
    180000
  );
});
