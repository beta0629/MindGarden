#!/usr/bin/env node
/**
 * homepage_settings 테이블이 없을 때 1회 실행.
 * 서버: cd /var/www/homepage && node scripts/ensure-homepage-settings-table.js
 * 로컬: 프로젝트 루트에서 동일 (DB_HOST/DB_NAME 등은 .env 또는 .env.local)
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const APP_ROOT = path.join(__dirname, '..');

function loadEnvFile(filePath, overwrite) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (overwrite || process.env[k] === undefined) process.env[k] = v;
  }
}

// 순서대로 읽으며 뒤 파일이 앞 값을 덮어씀(.env → .env.production → .env.local)
for (const name of ['.env', '.env.production', '.env.local']) {
  loadEnvFile(path.join(APP_ROOT, name), true);
}

const DDL = `
CREATE TABLE IF NOT EXISTS homepage_settings (
  setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
  setting_value MEDIUMTEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function main() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || process.env.DB_USERNAME || 'homepage_user';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'mindgarden_homepage';

  console.log('Connecting:', { host, port, user, database });

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    multipleStatements: false,
  });

  await conn.query(DDL);
  console.log('OK: homepage_settings ensured on database', database);
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
