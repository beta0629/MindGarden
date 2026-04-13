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

module.exports = {
  apps: [
    {
      name: process.env.HOMEPAGE_PM2_APP || 'homepage',
      cwd: appRoot,
      script: 'node_modules/.bin/next',
      args: 'start -p 4000',
      env: {
        ...parsed,
        NODE_ENV: 'production',
      },
    },
  ],
};
