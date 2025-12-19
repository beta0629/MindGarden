# 홈페이지 데이터베이스 문서

## 개요

마인드가든 홈페이지는 코어솔루션과 완전히 분리된 독립적인 데이터베이스를 사용합니다. 이를 통해 홈페이지 운영이 코어솔루션에 영향을 주지 않도록 설계되었습니다.

## 데이터베이스 정보

### 기본 정보
- **데이터베이스명**: `mindgarden_homepage`
- **사용자명**: `homepage_user`
- **비밀번호**: `Homepage2025` (환경 변수로 설정 가능)
- **호스트**: `localhost` (환경 변수로 설정 가능)
- **포트**: `3306` (환경 변수로 설정 가능)
- **문자셋**: `utf8mb4`
- **콜레이션**: `utf8mb4_unicode_ci`

### 환경 변수 설정

`.env.local` 파일에 다음 변수를 설정할 수 있습니다:

```env
# 데이터베이스 호스트
DB_HOST=localhost

# 데이터베이스 포트
DB_PORT=3306

# 데이터베이스 사용자명
DB_USER=homepage_user
# 또는
DB_USERNAME=homepage_user

# 데이터베이스 비밀번호
DB_PASSWORD=Homepage2025

# 데이터베이스명
DB_NAME=mindgarden_homepage
```

## 데이터베이스 생성

### 초기 설정 스크립트

데이터베이스와 테이블을 생성하려면 `scripts/create_homepage_db.sql` 스크립트를 실행하세요:

```bash
mysql -u root -p < scripts/create_homepage_db.sql
```

또는 MySQL 클라이언트에서 직접 실행:

```sql
-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS mindgarden_homepage 
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER IF NOT EXISTS 'homepage_user'@'localhost' IDENTIFIED BY 'Homepage2025';
CREATE USER IF NOT EXISTS 'homepage_user'@'127.0.0.1' IDENTIFIED BY 'Homepage2025';

GRANT ALL PRIVILEGES ON mindgarden_homepage.* TO 'homepage_user'@'localhost';
GRANT ALL PRIVILEGES ON mindgarden_homepage.* TO 'homepage_user'@'127.0.0.1';

FLUSH PRIVILEGES;
```

## 테이블 구조

### 1. blog_posts (블로그 포스트)

블로그 게시글을 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | BIGINT | 고유 ID | PRIMARY KEY, AUTO_INCREMENT |
| title | VARCHAR(500) | 제목 | NOT NULL |
| content | TEXT | 본문 내용 | NOT NULL |
| summary | TEXT | 요약 | NULL |
| thumbnail_image_url | VARCHAR(1000) | 썸네일 이미지 URL | NULL |
| status | ENUM | 상태 ('draft', 'published') | DEFAULT 'draft' |
| published_at | DATETIME | 발행일시 | NULL |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 수정일시 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |
| is_homepage_only | BOOLEAN | 홈페이지 전용 여부 | DEFAULT TRUE |

**인덱스**:
- `idx_status`: status 컬럼
- `idx_published_at`: published_at 컬럼
- `idx_created_at`: created_at 컬럼
- `idx_is_homepage_only`: is_homepage_only 컬럼

### 2. blog_images (블로그 이미지)

블로그 포스트에 연결된 이미지를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | BIGINT | 고유 ID | PRIMARY KEY, AUTO_INCREMENT |
| post_id | BIGINT | 블로그 포스트 ID | NOT NULL, FOREIGN KEY |
| image_url | VARCHAR(1000) | 이미지 URL | NOT NULL |
| alt_text | VARCHAR(500) | 대체 텍스트 | NULL |
| display_order | INT | 표시 순서 | DEFAULT 0 |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |

**인덱스**:
- `idx_post_id`: post_id 컬럼
- `idx_display_order`: display_order 컬럼

**외래키**:
- `post_id` → `blog_posts(id)` ON DELETE CASCADE

### 3. gallery_images (갤러리 이미지)

홈페이지 갤러리 섹션에 표시되는 이미지를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | BIGINT | 고유 ID | PRIMARY KEY, AUTO_INCREMENT |
| image_url | VARCHAR(1000) | 이미지 URL | NOT NULL |
| alt_text | VARCHAR(500) | 대체 텍스트 | NULL |
| display_order | INT | 표시 순서 | DEFAULT 0 |
| is_active | BOOLEAN | 활성화 여부 | DEFAULT TRUE |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 수정일시 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

**인덱스**:
- `idx_is_active`: is_active 컬럼
- `idx_display_order`: display_order 컬럼

**특징**:
- 이미지는 서버 사이드에서 자동으로 리사이징됩니다 (최대 1920x1080, 품질 90%)
- 업로드된 이미지는 `/public/uploads/gallery/` 디렉토리에 저장됩니다

### 4. consultation_inquiries (상담 문의)

홈페이지를 통해 접수된 상담 문의를 저장하는 테이블입니다.

| 컬럼명 | 타입 | 설명 | 제약조건 |
|--------|------|------|----------|
| id | BIGINT | 고유 ID | PRIMARY KEY, AUTO_INCREMENT |
| name | VARCHAR(100) | 이름 | NOT NULL |
| phone | VARCHAR(20) | 전화번호 | NOT NULL |
| email | VARCHAR(200) | 이메일 | NULL |
| preferred_contact_method | ENUM | 선호 연락 방법 ('phone', 'email', 'both') | DEFAULT 'phone' |
| inquiry_type | VARCHAR(50) | 문의 유형 | DEFAULT 'general' |
| message | TEXT | 문의 내용 | NULL |
| preferred_date | DATE | 희망 상담 일자 | NULL |
| preferred_time | TIME | 희망 상담 시간 | NULL |
| status | ENUM | 상태 ('pending', 'contacted', 'completed', 'cancelled') | DEFAULT 'pending' |
| created_at | DATETIME | 생성일시 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | 수정일시 | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP |

**인덱스**:
- `idx_status`: status 컬럼
- `idx_created_at`: created_at 컬럼

## 데이터베이스 연결

### 코드에서 사용

모든 API 라우트에서 공통으로 사용하는 `getDbConnection()` 함수를 사용합니다:

```typescript
import { getDbConnection } from '@/lib/db';

// 연결 사용 예시
async function example() {
  let connection;
  try {
    connection = await getDbConnection();
    const [rows] = await connection.execute('SELECT * FROM blog_posts');
    // 결과 처리
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
```

### 연결 설정

`lib/db.ts` 파일에서 연결 설정을 관리합니다:

- **타임아웃**: 10초
- **타임존**: +09:00 (한국 시간)
- **문자셋**: utf8mb4

## 코어솔루션과의 분리

### 분리 이유

1. **독립성**: 홈페이지 운영이 코어솔루션에 영향을 주지 않음
2. **보안**: 홈페이지 데이터와 코어솔루션 데이터 분리
3. **확장성**: 홈페이지 전용 기능 확장 용이
4. **테넌트 시스템**: 코어솔루션의 테넌트 시스템과 무관하게 운영

### 차이점

| 항목 | 코어솔루션 | 홈페이지 |
|------|-----------|----------|
| 데이터베이스 | `core_solution` | `mindgarden_homepage` |
| 사용자 | `mindgarden_dev` | `homepage_user` |
| 테넌트 시스템 | 사용 (tenant_id 필수) | 미사용 |
| 용도 | 멀티테넌트 SaaS | 단일 홈페이지 |

## 백업 및 복구

### 백업

```bash
# 전체 데이터베이스 백업
mysqldump -u homepage_user -p mindgarden_homepage > backup_$(date +%Y%m%d).sql

# 특정 테이블만 백업
mysqldump -u homepage_user -p mindgarden_homepage blog_posts gallery_images > backup_tables.sql
```

### 복구

```bash
# 전체 데이터베이스 복구
mysql -u homepage_user -p mindgarden_homepage < backup_20250101.sql

# 특정 테이블만 복구
mysql -u homepage_user -p mindgarden_homepage < backup_tables.sql
```

## 주의사항

1. **비밀번호 보안**: 프로덕션 환경에서는 반드시 강력한 비밀번호를 사용하고 환경 변수로 관리하세요.
2. **백업**: 정기적으로 데이터베이스를 백업하세요.
3. **권한**: `homepage_user`는 `mindgarden_homepage` 데이터베이스에만 접근 권한이 있습니다.
4. **이미지 저장**: 업로드된 이미지는 `/public/uploads/` 디렉토리에 저장되며, `.gitignore`에 포함되어 있습니다.

## 마이그레이션

새로운 테이블이나 컬럼을 추가할 때는:

1. `scripts/create_homepage_db.sql` 파일에 `CREATE TABLE IF NOT EXISTS` 또는 `ALTER TABLE` 문을 추가
2. 변경사항을 문서화
3. 개발 환경에서 테스트 후 프로덕션에 적용

## 문제 해결

### 연결 오류

- 환경 변수가 올바르게 설정되었는지 확인
- 사용자 권한이 올바르게 부여되었는지 확인
- 방화벽 설정 확인

### 권한 오류

```sql
-- 권한 재부여
GRANT ALL PRIVILEGES ON mindgarden_homepage.* TO 'homepage_user'@'localhost';
FLUSH PRIVILEGES;
```

## 관련 파일

- `lib/db.ts`: 데이터베이스 연결 유틸리티
- `scripts/create_homepage_db.sql`: 데이터베이스 생성 스크립트
- `.env.local`: 환경 변수 설정 파일

