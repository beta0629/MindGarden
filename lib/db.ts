/**
 * 데이터베이스 연결 유틸리티
 * 모든 API에서 공통으로 사용
 */

import mysql from 'mysql2/promise';

// MySQL 연결 설정
// 홈페이지 전용 데이터베이스 사용 (코어솔루션과 완전 분리)
export const getDbConnection = async () => {
  // 홈페이지 전용 데이터베이스 설정
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_NAME || 'mindgarden_homepage';
  const dbUser = process.env.DB_USER || process.env.DB_USERNAME || 'homepage_user';
  const dbPassword = process.env.DB_PASSWORD || 'Homepage2025!@#';
  
  return await mysql.createConnection({
    host: dbHost,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: dbUser,
    password: dbPassword,
    database: dbName,
    // 연결 타임아웃 설정
    connectTimeout: 10000,
    // 연결 옵션
    ssl: false,
    timezone: '+09:00',
    charset: 'utf8mb4',
  });
};

