'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/verification/check-nginx-dev-real-ip.js');
const {
  directiveCounts,
  siteIssues,
  workflowIssues
} = require('./check-nginx-dev-real-ip');

const ENABLE_ONE = 'sudo ln -sf /etc/nginx/sites-available/core-solution-dev /etc/nginx/sites-enabled/core-solution-dev';
const REMOVE_OTHER = 'sudo rm -f /etc/nginx/sites-enabled/core-solution-dev.conf';

function run(args) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: res.status, out: (res.stdout || '') + (res.stderr || '') };
}

function write(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nginx-real-ip-'));
  Object.entries(files).forEach(([rel, text]) => write(path.join(dir, rel), text));
  return dir;
}

const GOOD_WORKFLOW = [
  ENABLE_ONE,
  REMOVE_OTHER,
  ''
].join('\n');

const GOOD_CORE = [
  'set_real_ip_from 173.245.48.0/20;',
  'set_real_ip_from 103.21.244.0/22;',
  'set_real_ip_from 103.22.200.0/22;',
  'set_real_ip_from 103.31.4.0/22;',
  'set_real_ip_from 141.101.64.0/18;',
  'set_real_ip_from 108.162.192.0/18;',
  'set_real_ip_from 190.93.240.0/20;',
  'set_real_ip_from 188.114.96.0/20;',
  'set_real_ip_from 197.234.240.0/22;',
  'set_real_ip_from 198.41.128.0/17;',
  'set_real_ip_from 162.158.0.0/15;',
  'set_real_ip_from 104.16.0.0/13;',
  'set_real_ip_from 104.24.0.0/14;',
  'set_real_ip_from 172.64.0.0/13;',
  'set_real_ip_from 131.0.72.0/22;',
  'set_real_ip_from 2400:cb00::/32;',
  'set_real_ip_from 2606:4700::/32;',
  'set_real_ip_from 2803:f800::/32;',
  'set_real_ip_from 2405:b500::/32;',
  'set_real_ip_from 2405:8100::/32;',
  'set_real_ip_from 2a06:98c0::/29;',
  'set_real_ip_from 2c0f:f248::/32;',
  'real_ip_header CF-Connecting-IP;',
  'real_ip_recursive on;',
  ''
].join('\n');

const GOOD_GARDEN = '# real_ip_header 는 core-solution-dev.conf 에만 둔다.\nserver { listen 80; }\n';

const tests = {
  '저장소 현재 상태는 단일 링크·단일 real_ip': () => {
    const res = run(['--root', ROOT]);
    assert.strictEqual(res.code, 0, res.out);
  },
  '두 이름을 동시에 켜면 실패': () => {
    const text = `${GOOD_WORKFLOW}for DEST_NAME in core-solution-dev core-solution-dev.conf; do\n  sudo ln -sf /etc/nginx/sites-available/$DEST_NAME /etc/nginx/sites-enabled/$DEST_NAME\ndone\n`;
    const issues = workflowIssues(text);
    assert.ok(issues.some((i) => i.includes('both')));
    assert.ok(issues.some((i) => i.includes('core-solution-dev.conf')));
  },
  '남은 .conf 링크를 지우지 않으면 실패': () => {
    const issues = workflowIssues(`${ENABLE_ONE}\n`);
    assert.ok(issues.some((i) => i.includes('does not remove leftover')));
  },
  '같은 파일을 두 번 include 하면 real_ip_header 가 2': () => {
    const twice = directiveCounts(`${GOOD_CORE}\n${GOOD_CORE}`);
    assert.strictEqual(twice.real_ip_header, 2);
    assert.ok(twice.set_real_ip_from > 22);
  },
  '형제 vhost 에 real_ip_header 를 다시 두면 실패': () => {
    const garden = `${GOOD_GARDEN}real_ip_header CF-Connecting-IP;\nreal_ip_recursive on;\nset_real_ip_from 173.245.48.0/20;\n`;
    const issues = siteIssues(GOOD_CORE, garden);
    assert.ok(issues.some((i) => i.includes('dev.m-garden.co.kr.conf real_ip_header')));
    assert.ok(issues.some((i) => i.includes('http include real_ip_header count 2')));
  },
  'Cloudflare real_ip 블록을 빼면 실패': () => {
    const issues = siteIssues('server { listen 80; }\n', GOOD_GARDEN);
    assert.ok(issues.some((i) => i.includes('real_ip_header count 0')));
    assert.ok(issues.some((i) => i.includes('not CF-Connecting-IP')));
    assert.ok(issues.some((i) => i.includes('173.245.48.0/20')));
  },
  '주석 속 지시어 이름은 세지 않음': () => {
    const commented = `# real_ip_header CF-Connecting-IP;\n# set_real_ip_from 173.245.48.0/20;\n${GOOD_GARDEN}`;
    assert.strictEqual(directiveCounts(commented).real_ip_header, 0);
    assert.deepStrictEqual(siteIssues(GOOD_CORE, commented), []);
  }
};

let failed = 0;
Object.entries(tests).forEach(([name, fn]) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failed += 1;
    console.log(`not ok - ${name}: ${e.message}`);
  }
});
process.exit(failed ? 1 : 0);
