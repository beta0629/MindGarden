# 공통코드 시스템 최종 아키텍처

**작성일**: 2025-12-03  
**목적**: 시스템 공통코드 vs 테넌트 공통코드 명확한 구분

---

## 🎯 핵심 개념 정리

### 문제 인식
```
❌ 잘못된 이해:
- 테넌트 공통코드 = 테넌트가 자유롭게 추가/삭제
- 테넌트마다 독립적인 코드 관리

✅ 올바른 이해:
- 시스템 공통코드 = CoreSolution 관리자만 관리
- 테넌트 공통코드 = 테넌트 생성 시 기본 삽입, 모든 역할이 공통 사용
- 대시보드 생성/삭제는 별도 시스템 (권한 그룹 기반)
```

---

## 📊 3-Tier 코드 시스템

### 1. 시스템 공통코드 (System Common Codes)
```
관리자: CoreSolution 관리자 (SUPER_ADMIN)
접근: 읽기 전용 (모든 테넌트)
용도: 플랫폼 전역 표준 코드

예시:
- USER_STATUS (사용자 상태: ACTIVE, INACTIVE, SUSPENDED)
- GENDER (성별: MALE, FEMALE, OTHER)
- BANK (은행: KB, SHINHAN, WOORI)
- NOTIFICATION_TYPE (알림 타입: EMAIL, SMS, PUSH)
- SYSTEM_STATUS (시스템 상태)

특징:
- tenant_id = NULL
- 절대 수정 불가 (테넌트)
- 플랫폼 전체 일관성 유지
```

### 2. 테넌트 공통코드 (Tenant Common Codes)
```
관리자: 테넌트 관리자 (TENANT_ADMIN)
접근: 읽기 전용 (해당 테넌트의 모든 역할)
용도: 테넌트 내부 공통 사용 코드

예시:
- CONSULTATION_PACKAGE (상담 패키지) ⭐ 입점사마다 다름!
  → A 상담소: 개인상담, 가족상담, 그룹상담
  → B 상담소: 단기상담, 장기상담, 심리검사
  → C 상담소: 청소년상담, 성인상담, 부부상담
  
- PAYMENT_METHOD (결제 방법)
  → A 상담소: 현금, 카드, 계좌이체
  → B 상담소: 현금, 카드만
  
- SPECIALTY (전문 분야)
  → A 상담소: 우울증, 불안장애, 가족상담
  → B 상담소: 청소년, 진로, 학습상담
  
- CONSULTATION_TYPE (상담 유형)
- FINANCIAL_CATEGORY (재무 카테고리)

특징:
- tenant_id = {테넌트 UUID}
- 테넌트 관리자만 추가/수정/삭제 ⭐
- 해당 테넌트의 모든 역할(ADMIN, STAFF, CONSULTANT, CLIENT)이 공통 사용
- 테넌트 생성 시 기본 샘플 코드만 삽입 (참고용)
- 입점사가 자유롭게 커스터마이징!
```

### 3. 권한 그룹 (Permission Groups) - **별도 시스템!**
```
관리자: 테넌트 관리자 (TENANT_ADMIN)
접근: 역할별 차등 접근
용도: 대시보드 섹션/컴포넌트 표시 제어

예시:
- DASHBOARD_STATISTICS (통계 섹션) → 모든 역할
- DASHBOARD_MANAGEMENT (관리 섹션) → ADMIN, STAFF
- DASHBOARD_ERP (ERP 섹션) → ADMIN만
- CONSULT_MANAGEMENT (상담 관리) → CONSULTANT, ADMIN

특징:
- permission_groups 테이블 (별도!)
- role_permission_groups로 역할별 매핑
- 대시보드 동적 생성/표시 제어
```

---

## 🔄 테넌트 생성 시 자동 처리

### 온보딩 프로세스
```sql
-- ========================================
-- 1. 테넌트 생성
-- ========================================
INSERT INTO tenants (tenant_id, name, business_type, status)
VALUES ('uuid-1234', '마음상담센터', 'CONSULTATION', 'ACTIVE');

-- ========================================
-- 2. 테넌트 공통코드 자동 삽입 (샘플만!)
-- ========================================
-- 2-1. 상담 패키지 (샘플 - 입점사가 수정/삭제 가능)
-- ⭐ extra_data에 금액, 시간 등 추가 정보 저장!
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, code_description, extra_data, sort_order)
VALUES 
('uuid-1234', 'CONSULTATION_PACKAGE', 'INDIVIDUAL', '개인상담', '1:1 개인 심리상담', 
 JSON_OBJECT('price', 80000, 'duration', 50, 'unit', '회'), 1),
 
('uuid-1234', 'CONSULTATION_PACKAGE', 'FAMILY', '가족상담', '가족 단위 상담', 
 JSON_OBJECT('price', 120000, 'duration', 60, 'unit', '회'), 2),
 
('uuid-1234', 'CONSULTATION_PACKAGE', 'GROUP', '집단상담', '그룹 심리상담', 
 JSON_OBJECT('price', 50000, 'duration', 90, 'unit', '회'), 3);

-- 예시: A 상담소
-- - 개인상담: 80,000원 / 50분
-- - 가족상담: 120,000원 / 60분

-- 예시: B 상담소 (다른 금액!)
-- - 개인상담: 100,000원 / 60분
-- - 단기상담: 60,000원 / 40분
-- - 장기상담 패키지: 700,000원 / 10회

-- 2-2. 결제 방법 (샘플)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, sort_order)
VALUES 
('uuid-1234', 'PAYMENT_METHOD', 'CASH', '현금', 1),
('uuid-1234', 'PAYMENT_METHOD', 'CARD', '카드', 2),
('uuid-1234', 'PAYMENT_METHOD', 'TRANSFER', '계좌이체', 3);

-- 2-3. 전문 분야 (샘플)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, sort_order)
VALUES 
('uuid-1234', 'SPECIALTY', 'DEPRESSION', '우울증', 1),
('uuid-1234', 'SPECIALTY', 'ANXIETY', '불안장애', 2),
('uuid-1234', 'SPECIALTY', 'FAMILY', '가족상담', 3);

-- 2-4. 상담 유형 (샘플)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, sort_order)
VALUES 
('uuid-1234', 'CONSULTATION_TYPE', 'FACE_TO_FACE', '대면상담', 1),
('uuid-1234', 'CONSULTATION_TYPE', 'ONLINE', '비대면상담', 2),
('uuid-1234', 'CONSULTATION_TYPE', 'PHONE', '전화상담', 3);

-- 2-5. 재무 카테고리 (샘플)
INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, sort_order)
VALUES 
('uuid-1234', 'FINANCIAL_CATEGORY', 'INCOME', '수입', 1),
('uuid-1234', 'FINANCIAL_CATEGORY', 'EXPENSE', '지출', 2),
('uuid-1234', 'FINANCIAL_CATEGORY', 'ASSET', '자산', 3);

-- ⭐ 중요: 이것은 샘플일 뿐!
-- 입점사(테넌트 관리자)가 자유롭게:
-- 1. 추가: INSERT INTO common_codes (tenant_id, ...)
-- 2. 수정: UPDATE common_codes WHERE tenant_id = 'uuid-1234' AND ...
-- 3. 삭제: DELETE FROM common_codes WHERE tenant_id = 'uuid-1234' AND ...

-- ========================================
-- 3. 기본 역할 생성
-- ========================================
INSERT INTO tenant_roles (tenant_id, tenant_role_id, name_ko, name_en)
VALUES 
('uuid-1234', 'role-admin', '관리자', 'ADMIN'),
('uuid-1234', 'role-staff', '사무원', 'STAFF'),
('uuid-1234', 'role-consultant', '상담사', 'CONSULTANT'),
('uuid-1234', 'role-client', '내담자', 'CLIENT');

-- ========================================
-- 4. 역할별 권한 그룹 매핑
-- ========================================
-- ADMIN: 모든 권한
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code)
SELECT 'uuid-1234', 'role-admin', permission_group_code
FROM permission_groups
WHERE (business_type IS NULL OR business_type = 'CONSULTATION')
  AND is_active = true;

-- STAFF: ERP 제외
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code)
SELECT 'uuid-1234', 'role-staff', permission_group_code
FROM permission_groups
WHERE (business_type IS NULL OR business_type = 'CONSULTATION')
  AND category != 'ERP'
  AND is_active = true;

-- CONSULTANT: 상담 전문 기능
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code)
SELECT 'uuid-1234', 'role-consultant', permission_group_code
FROM permission_groups
WHERE (business_type IS NULL OR business_type = 'CONSULTATION')
  AND (permission_group_code LIKE 'CONSULT_%' OR is_default = true)
  AND is_active = true;

-- CLIENT: 기본 조회만
INSERT INTO role_permission_groups (tenant_id, tenant_role_id, permission_group_code)
SELECT 'uuid-1234', 'role-client', permission_group_code
FROM permission_groups
WHERE is_default = true
  AND is_active = true;
```

---

## 💻 사용 시나리오

### 시나리오 1: 시스템 공통코드 사용
```
상황: 사용자 상태 표시

1. 프론트엔드 요청
   GET /api/v1/common-codes?codeGroup=USER_STATUS

2. 백엔드 조회
   SELECT * FROM common_codes
   WHERE tenant_id IS NULL
     AND code_group = 'USER_STATUS'
     AND is_active = true;

3. 응답
   [
     { codeValue: 'ACTIVE', koreanName: '활성' },
     { codeValue: 'INACTIVE', koreanName: '비활성' },
     { codeValue: 'SUSPENDED', koreanName: '정지' }
   ]

4. 모든 테넌트 동일한 결과
```

### 시나리오 2: 테넌트 공통코드 사용
```
상황: 상담 패키지 선택

1. 프론트엔드 요청 (테넌트 A)
   GET /api/v1/common-codes?codeGroup=CONSULTATION_PACKAGE

2. 백엔드 조회
   SELECT * FROM common_codes
   WHERE tenant_id = 'uuid-1234'  -- 테넌트 A
     AND code_group = 'CONSULTATION_PACKAGE'
     AND is_active = true;

3. 응답 (테넌트 A)
   [
     { codeValue: 'INDIVIDUAL', koreanName: '개인상담' },
     { codeValue: 'FAMILY', koreanName: '가족상담' },
     { codeValue: 'GROUP', koreanName: '집단상담' }
   ]

4. 테넌트 B는 다른 패키지 목록 가능
   (테넌트 관리자가 추가/수정/삭제)
```

### 시나리오 3: 테넌트 관리자가 공통코드 관리
```
상황: 새로운 상담 패키지 추가

1. 테넌트 관리자 로그인
   - 역할: ADMIN
   - 테넌트: uuid-1234

2. 공통코드 관리 페이지 접근
   GET /api/v1/tenant/common-codes

3. 새 패키지 추가
   POST /api/v1/tenant/common-codes
   {
     "codeGroup": "CONSULTATION_PACKAGE",
     "codeValue": "COUPLE",
     "koreanName": "부부상담",
     "sortOrder": 4
   }

4. 자동으로 tenant_id 설정
   INSERT INTO common_codes (tenant_id, ...)
   VALUES ('uuid-1234', ...);

5. 해당 테넌트의 모든 역할이 즉시 사용 가능
   - ADMIN: 관리 페이지에서 사용
   - STAFF: 예약 등록 시 사용
   - CONSULTANT: 상담 기록 시 사용
   - CLIENT: 패키지 선택 시 사용
```

### 시나리오 4: 대시보드 섹션 표시 제어 (별도 시스템!)
```
상황: STAFF는 ERP 섹션 안 보임

1. STAFF 로그인
   - 역할: STAFF
   - 테넌트: uuid-1234

2. 대시보드 구조 조회
   GET /api/v1/dashboard/structure

3. 백엔드 로직
   -- STAFF에게 할당된 권한 그룹만 조회
   SELECT pg.*
   FROM permission_groups pg
   JOIN role_permission_groups rpg
     ON pg.permission_group_code = rpg.permission_group_code
   WHERE rpg.tenant_id = 'uuid-1234'
     AND rpg.tenant_role_id = 'role-staff'
     AND pg.is_active = true;

4. 응답
   {
     groups: [
       { code: 'DASHBOARD_STATISTICS', name: '통계' },
       { code: 'DASHBOARD_MANAGEMENT', name: '관리' },
       { code: 'CONSULT_MANAGEMENT', name: '상담 관리' }
       // ERP 섹션 없음!
     ]
   }

5. 프론트엔드 렌더링
   - 통계 섹션: 표시
   - 관리 섹션: 표시
   - 상담 관리 섹션: 표시
   - ERP 섹션: 표시 안 함 (권한 없음)
```

---

## 📊 데이터베이스 구조 최종

### 1. common_codes (공통코드)
```sql
CREATE TABLE common_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 구분자
    tenant_id VARCHAR(36) COMMENT 'NULL=시스템, UUID=테넌트',
    
    -- 코드 정보
    code_group VARCHAR(50) NOT NULL,
    code_value VARCHAR(50) NOT NULL,
    korean_name VARCHAR(100) NOT NULL,
    code_description TEXT,
    
    -- 메타데이터
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    extra_data JSON,
    
    -- 감사
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_tenant (tenant_id),
    INDEX idx_code_group (code_group),
    
    -- 유니크 제약
    UNIQUE KEY uk_tenant_code (tenant_id, code_group, code_value)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. code_group_metadata (코드 그룹 메타데이터)
```sql
CREATE TABLE code_group_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    code_group VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(100) NOT NULL,
    
    -- 분류
    code_type VARCHAR(20) NOT NULL COMMENT 'SYSTEM, TENANT',
    category VARCHAR(50) COMMENT 'USER, BUSINESS, FINANCE, etc',
    
    -- 메타데이터
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. permission_groups (권한 그룹) - **별도!**
```sql
CREATE TABLE permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    permission_group_code VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(100) NOT NULL,
    
    -- 분류
    category VARCHAR(50) NOT NULL COMMENT 'STATISTICS, MANAGEMENT, ERP, SPECIALIZED',
    business_type VARCHAR(50) NULL COMMENT 'NULL=공통, CONSULTATION, ACADEMY',
    
    -- 메타데이터
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false COMMENT '기본 제공 여부',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4. role_permission_groups (역할-권한 그룹 매핑)
```sql
CREATE TABLE role_permission_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    tenant_id VARCHAR(36) NOT NULL,
    tenant_role_id VARCHAR(36) NOT NULL,
    permission_group_code VARCHAR(50) NOT NULL,
    
    access_level VARCHAR(20) DEFAULT 'READ' COMMENT 'READ, WRITE, FULL',
    is_active BOOLEAN DEFAULT true,
    
    assigned_by VARCHAR(100),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_role_group (tenant_id, tenant_role_id, permission_group_code),
    
    FOREIGN KEY (permission_group_code) 
        REFERENCES permission_groups(permission_group_code)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🎯 핵심 정리

### 시스템 공통코드
```
관리: CoreSolution 관리자만
접근: 모든 테넌트 읽기 전용
예시: USER_STATUS, GENDER, BANK
테이블: common_codes (tenant_id = NULL)
```

### 테넌트 공통코드
```
관리: 테넌트 관리자만
접근: 해당 테넌트의 모든 역할 읽기 전용
예시: CONSULTATION_PACKAGE, PAYMENT_METHOD
테이블: common_codes (tenant_id = UUID)
생성 시: 기본 코드 자동 삽입
```

### 권한 그룹 (별도!)
```
관리: 테넌트 관리자만
접근: 역할별 차등 접근
예시: DASHBOARD_ERP, CONSULT_MANAGEMENT
테이블: permission_groups, role_permission_groups
용도: 대시보드 섹션 표시/숨김 제어
```

---

## ✅ 결론

### 3개 시스템 명확히 구분!
```
1. 시스템 공통코드 (System Common Codes)
   → CoreSolution 관리자 전용

2. 테넌트 공통코드 (Tenant Common Codes)
   → 테넌트 관리자 관리, 모든 역할 공통 사용

3. 권한 그룹 (Permission Groups)
   → 대시보드 섹션 표시 제어 (역할별 차등)
```

**이제 명확합니다!** 🎉

---

**작성 완료**: 2025-12-03  
**핵심**: 공통코드 ≠ 권한 그룹! 완전히 다른 시스템!

