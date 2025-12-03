# 최근 생성된 테스트 데이터

**생성일:** 2025-12-03  
**용도:** Phase 1-4 통합 테스트 및 대시보드 디자인 개선 테스트

---

## 최근 생성된 테스트 테넌트

### 1. 가장 최근 테스트 테넌트 (2025-12-03 14:21)

**테넌트 정보:**
- **테넌트 ID:** `tenant-seoul-consultation-053`
- **테넌트명:** 테스트 상담소 Phase1-4
- **비즈니스 타입:** CONSULTATION
- **생성일:** 2025-12-03 14:21:11

**관리자 계정:**
- **이메일:** `test-onboarding-1764739270@test.com`
- **비밀번호:** `Test1234!@#`
- **역할:** ADMIN
- **이름:** 테스트 상담소 Phase1-4 관리자

---

### 2. 두 번째 테스트 테넌트 (2025-12-03 14:19)

**테넌트 정보:**
- **테넌트 ID:** `tenant-seoul-consultation-052`
- **테넌트명:** 테스트 상담소 Phase1-4
- **비즈니스 타입:** CONSULTATION
- **생성일:** 2025-12-03 14:19:02

**관리자 계정:**
- **이메일:** `test-onboarding-1764739141@test.com`
- **비밀번호:** `Test1234!@#`
- **역할:** ADMIN
- **이름:** 테스트 상담소 Phase1-4 관리자

---

### 3. 세 번째 테스트 테넌트 (2025-12-03 14:17)

**테넌트 정보:**
- **테넌트 ID:** `tenant-seoul-consultation-051`
- **테넌트명:** 테스트 상담소 Phase1-4
- **비즈니스 타입:** CONSULTATION
- **생성일:** 2025-12-03 14:17:48

**관리자 계정:**
- **이메일:** `test-onboarding-1764739066@test.com`
- **비밀번호:** `Test1234!@#`
- **역할:** ADMIN
- **이름:** 테스트 상담소 Phase1-4 관리자

---

## 로그인 정보

### 테스트 환경 접속
- **서버:** `http://localhost:3000` (프론트엔드)
- **API 서버:** `http://localhost:8080` (백엔드)

### 로그인 방법

1. **최신 테스트 계정 (추천)**
   ```
   이메일: test-onboarding-1764739270@test.com
   비밀번호: Test1234!@#
   ```

2. **두 번째 테스트 계정**
   ```
   이메일: test-onboarding-1764739141@test.com
   비밀번호: Test1234!@#
   ```

3. **세 번째 테스트 계정**
   ```
   이메일: test-onboarding-1764739066@test.com
   비밀번호: Test1234!@#
   ```

---

## 테스트 데이터 확인 방법

### 1. 데이터베이스에서 직접 확인

```sql
-- 최근 생성된 테넌트 확인
SELECT tenant_id, tenant_name, business_type, created_at 
FROM tenants 
WHERE is_deleted = 0 
ORDER BY created_at DESC 
LIMIT 5;

-- 최근 생성된 관리자 계정 확인
SELECT email, name, role, tenant_id, created_at 
FROM users 
WHERE email LIKE '%test-onboarding%' 
ORDER BY created_at DESC 
LIMIT 10;

-- 특정 테넌트의 역할 확인
SELECT tr.*, rt.name_ko, rt.name_en
FROM tenant_roles tr
JOIN role_templates rt ON tr.role_template_id = rt.role_template_id
WHERE tr.tenant_id = 'tenant-seoul-consultation-053'
ORDER BY tr.display_order;

-- 테넌트 공통코드 확인
SELECT COUNT(*) as code_count
FROM common_codes
WHERE tenant_id = 'tenant-seoul-consultation-053';

-- 권한 그룹 할당 확인
SELECT rpg.*, pg.group_code, pg.display_name
FROM role_permission_groups rpg
JOIN permission_groups pg ON rpg.permission_group_code = pg.group_code
WHERE rpg.tenant_id = 'tenant-seoul-consultation-053';
```

### 2. 웹 인터페이스에서 확인

1. 로그인 후 대시보드 접속
   - 관리자 대시보드에서 테넌트 통계 확인 가능
   
2. 공통코드 관리 메뉴 확인
   - `/admin/common-codes` 경로에서 테넌트 공통코드 확인 가능
   
3. 권한 관리 메뉴 확인
   - `/admin/permission-groups` 경로에서 권한 그룹 확인 가능

---

## 테스트 시나리오

### 1. 기본 로그인 테스트
```
1. http://localhost:3000/login 접속
2. 위 테스트 계정으로 로그인
3. 관리자 대시보드 접속 확인
```

### 2. 공통코드 테스트
```
1. 관리자 메뉴 → 공통코드 관리 접속
2. 테넌트 공통코드 그룹 확인 (17개 이상)
3. 공통코드 값 확인 및 수정 테스트
```

### 3. 권한 그룹 테스트
```
1. 관리자 메뉴 → 권한 그룹 관리 접속
2. ADMIN 역할에 할당된 권한 그룹 확인
3. 권한 그룹별 컴포넌트 접근 테스트
```

### 4. 대시보드 디자인 테스트
```
1. 관리자 대시보드 접속
2. 표준화된 디자인 시스템 적용 확인
3. CSS 변수 기반 스타일 확인
```

---

## 참고사항

- 모든 테스트 계정의 비밀번호는 동일합니다: `Test1234!@#`
- 테스트 테넌트는 실제 운영 데이터와 격리되어 있습니다
- 테스트 후 정리할 수 있도록 테넌트 ID를 기록해 두세요

---

**작성자:** AI Assistant  
**최종 업데이트:** 2025-12-03

