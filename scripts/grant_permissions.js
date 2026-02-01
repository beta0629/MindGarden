/**
 * 개발 서버에 popups, banners 테이블 권한 부여 스크립트
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

// MySQL root 또는 관리자 계정 정보 (권한 부여를 위해 필요)
// 주의: 실제 root 비밀번호를 입력해야 합니다
const adminConfig = {
  host: process.env.DB_HOST || 'beta0629.cafe24.com',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: 'root', // 권한 부여를 위해 root 또는 관리자 계정 필요
  password: process.env.DB_ROOT_PASSWORD || '', // 환경 변수에 설정하거나 직접 입력
  charset: 'utf8mb4',
};

const targetUser = process.env.DB_USER || 'mindgarden_dev';
const targetDatabase = process.env.DB_NAME || 'core_solution';

async function grantPermissions() {
  let connection;
  
  try {
    console.log('MySQL 관리자 계정으로 연결 중...');
    console.log(`호스트: ${adminConfig.host}`);
    console.log(`사용자: ${adminConfig.user}`);
    
    // 비밀번호가 없으면 프롬프트
    if (!adminConfig.password) {
      console.error('\n❌ 오류: DB_ROOT_PASSWORD 환경 변수가 설정되지 않았습니다.');
      console.error('다음 중 하나를 선택하세요:');
      console.error('1. .env.local 파일에 DB_ROOT_PASSWORD=your_password 추가');
      console.error('2. 또는 MySQL root 계정으로 직접 접속하여 다음 SQL 실행:');
      console.error('\n' + getGrantSQL());
      process.exit(1);
    }
    
    connection = await mysql.createConnection(adminConfig);
    console.log('✅ MySQL 연결 성공\n');

    console.log(`권한 부여 대상: ${targetUser}`);
    console.log(`데이터베이스: ${targetDatabase}`);
    console.log(`테이블: popups, banners\n`);

    // 권한 부여 SQL 실행
    const grantSQL = getGrantSQL();
    const statements = grantSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await connection.execute(trimmed);
          console.log(`✅ 실행 완료: ${trimmed.substring(0, 50)}...`);
        } catch (error) {
          // 이미 권한이 있는 경우 무시
          if (error.code === 'ER_GRANT_PLUGIN_EXISTS' || error.message.includes('already exists')) {
            console.log(`⚠️  이미 권한이 있습니다: ${trimmed.substring(0, 50)}...`);
          } else {
            console.error(`❌ 오류: ${error.message}`);
          }
        }
      }
    }

    console.log('\n✅ 권한 부여 완료');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n접근 거부: root 비밀번호가 올바르지 않습니다.');
      console.error('또는 다음 SQL을 MySQL root 계정으로 직접 실행하세요:');
      console.error('\n' + getGrantSQL());
    } else if (error.code === 'ECONNREFUSED') {
      console.error('연결 거부: 호스트 또는 포트를 확인하세요.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nMySQL 연결 종료');
    }
  }
}

function getGrantSQL() {
  return `
-- popups 테이블에 대한 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON ${targetDatabase}.popups TO '${targetUser}'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON ${targetDatabase}.popups TO '${targetUser}'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON ${targetDatabase}.popups TO '${targetUser}'@'127.0.0.1';

-- banners 테이블에 대한 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON ${targetDatabase}.banners TO '${targetUser}'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON ${targetDatabase}.banners TO '${targetUser}'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON ${targetDatabase}.banners TO '${targetUser}'@'127.0.0.1';

FLUSH PRIVILEGES;
`.trim();
}

grantPermissions();
