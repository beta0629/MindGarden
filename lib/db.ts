/**
 * 데이터베이스 연결 유틸리티
 * 모든 API에서 공통으로 사용
 */

import mysql, { Pool, PoolConnection } from 'mysql2/promise';

// 풀에서 받은 커넥션은 사용 후 release()로 반납. end() 호출 금지.

let pool: Pool | null = null;

function poolConnectionLimit(): number {
  const raw = process.env.DB_POOL_LIMIT;
  if (raw == null || raw === '') return 12;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 12;
  return Math.min(50, n);
}

function getPool(): Pool {
  if (!pool) {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'mindgarden_homepage';
    const dbUser = process.env.DB_USER || process.env.DB_USERNAME || 'homepage_user';
    const dbPassword = process.env.DB_PASSWORD || 'Homepage2025';

    pool = mysql.createPool({
      host: dbHost,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: dbUser,
      password: dbPassword,
      database: dbName,
      connectTimeout: 10000,
      timezone: '+09:00',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: poolConnectionLimit(),
      queueLimit: 0,
    });
  }
  return pool;
}

export async function getDbConnection(): Promise<PoolConnection> {
  return await getPool().getConnection();
}
