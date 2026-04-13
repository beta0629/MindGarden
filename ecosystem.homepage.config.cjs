/**
 * 운영 PM2용: /var/www/homepage/.env 만 로드 (shell·다른 앱의 DB_* 오염 방지)
 * 사용: pm2 startOrReload ecosystem.homepage.config.cjs
 */
const fs = require('fs');
const path = require('path');

const appRoot = __dirname;
const envPath = path.join(appRoot, '.env');

if (!fs.existsSync(envPath)) {
  console.error('ecosystem.homepage: .env 가 없습니다:', envPath);
  process.exit(1);
}

function parseEnvFile(buf) {
  const env = {};
  buf
    .toString('utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      const i = t.indexOf('=');
      if (i === -1) return;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      env[k] = v;
    });
  return env;
}

const parsed = parseEnvFile(fs.readFileSync(envPath));

const env = {
  ...parsed,
  NODE_ENV: 'production',
};
// lib/db.ts 가 DB_USERNAME(root 등 셸 오염)보다 DB_USER를 우선하지만, mysql 드라이버 혼동 방지
if (env.DB_USER) {
  env.DB_USERNAME = env.DB_USER;
}

module.exports = {
  apps: [
    {
      name: process.env.HOMEPAGE_PM2_APP || 'homepage',
      cwd: appRoot,
      // package.json 의 "start": "next start -p 4000" 사용 (next 바이너리+args 조합은 PM2에서 포트 중복 인자 버그 유발)
      script: 'npm',
      args: 'start',
      env,
    },
  ],
};
