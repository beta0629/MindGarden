/**
 * 개발 DB에 홈페이지 테이블 확인 및 생성 스크립트
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// .env.local 파일에서 환경 변수 읽기
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

loadEnvFile();

const dbConfig = {
  host: process.env.DB_HOST || 'beta0629.cafe24.com',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'mindgarden_dev',
  password: process.env.DB_PASSWORD || 'MindGardenDev2025!@#',
  database: process.env.DB_NAME || 'core_solution',
  charset: 'utf8mb4',
};

// 필요한 테이블 목록
const tables = {
  blog_posts: `
    CREATE TABLE IF NOT EXISTS blog_posts (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      thumbnail_image_url VARCHAR(1000),
      status ENUM('draft', 'published') DEFAULT 'draft',
      published_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_homepage_only BOOLEAN DEFAULT TRUE,
      INDEX idx_status (status),
      INDEX idx_published_at (published_at),
      INDEX idx_created_at (created_at),
      INDEX idx_is_homepage_only (is_homepage_only)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  blog_images: `
    CREATE TABLE IF NOT EXISTS blog_images (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      post_id BIGINT NOT NULL,
      image_url VARCHAR(1000) NOT NULL,
      alt_text VARCHAR(500),
      display_order INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
      INDEX idx_post_id (post_id),
      INDEX idx_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  gallery_images: `
    CREATE TABLE IF NOT EXISTS gallery_images (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      image_url VARCHAR(1000) NOT NULL,
      alt_text VARCHAR(500),
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_is_active (is_active),
      INDEX idx_display_order (display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  consultation_inquiries: `
    CREATE TABLE IF NOT EXISTS consultation_inquiries (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      email VARCHAR(200),
      preferred_contact_method ENUM('phone', 'email', 'both') DEFAULT 'phone',
      inquiry_type VARCHAR(50) DEFAULT 'general',
      message TEXT,
      preferred_date DATE,
      preferred_time TIME,
      status ENUM('pending', 'contacted', 'completed', 'cancelled') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  popups: `
    CREATE TABLE IF NOT EXISTS popups (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      image_url VARCHAR(1000),
      link_url VARCHAR(1000),
      start_datetime DATETIME NOT NULL,
      end_datetime DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      priority INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_is_active (is_active),
      INDEX idx_datetime_range (start_datetime, end_datetime),
      INDEX idx_priority (priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  banners: `
    CREATE TABLE IF NOT EXISTS banners (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      image_url VARCHAR(1000),
      link_url VARCHAR(1000),
      start_datetime DATETIME NOT NULL,
      end_datetime DATETIME NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      priority INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_is_active (is_active),
      INDEX idx_datetime_range (start_datetime, end_datetime),
      INDEX idx_priority (priority)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  homepage_settings: `
    CREATE TABLE IF NOT EXISTS homepage_settings (
      setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
      setting_value MEDIUMTEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
};

async function checkAndCreateTables() {
  let connection;
  
  try {
    console.log('데이터베이스 연결 중...');
    console.log(`호스트: ${dbConfig.host}`);
    console.log(`데이터베이스: ${dbConfig.database}`);
    console.log(`사용자: ${dbConfig.user}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 데이터베이스 연결 성공\n');

    // 각 테이블 확인 및 생성
    for (const [tableName, createSQL] of Object.entries(tables)) {
      try {
        // 테이블 존재 여부 확인
        const [rows] = await connection.execute(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = ? AND table_name = ?`,
          [dbConfig.database, tableName]
        );

        const exists = rows[0].count > 0;

        if (exists) {
          console.log(`✅ ${tableName} 테이블 존재함`);
        } else {
          console.log(`⚠️  ${tableName} 테이블 없음 - 생성 중...`);
          await connection.execute(createSQL);
          console.log(`✅ ${tableName} 테이블 생성 완료`);
        }
      } catch (error) {
        console.error(`❌ ${tableName} 테이블 처리 중 오류:`, error.message);
      }
    }

    console.log('\n✅ 모든 테이블 확인 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('접근 거부: 사용자명 또는 비밀번호를 확인하세요.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('연결 거부: 호스트 또는 포트를 확인하세요.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('데이터베이스 없음: 데이터베이스 이름을 확인하세요.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n데이터베이스 연결 종료');
    }
  }
}

checkAndCreateTables();
