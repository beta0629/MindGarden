# 테스트 옵션 가이드

**작성일**: 2025-12-10  
**목적**: 대시보드 생성 로직 추가 후 테스트 방법 결정

---

## 📊 현재 상태 확인

### 기존 테스트 데이터
- **테넌트 ID**: tenant-incheon-consultation-001
- **온보딩 요청자**: beta0629@gmail.com
- **상태**: APPROVED
- **대시보드 생성**: ❌ (대시보드 생성 로직이 추가되기 전에 승인됨)

---

## 🔄 테스트 옵션

### 옵션 1: 기존 데이터 삭제 후 온보딩부터 다시 진행 ⭐ (권장)

#### 장점
- 전체 프로세스 검증 가능
- 대시보드 생성 로직 포함한 전체 플로우 테스트
- 실제 운영 시나리오와 동일

#### 단점
- 시간이 더 소요됨
- 온보딩 폼 입력 필요

#### 진행 방법
1. **기존 데이터 삭제**
   ```sql
   -- 온보딩 요청 삭제
   UPDATE onboarding_request 
   SET is_deleted = TRUE 
   WHERE tenant_id = 'tenant-incheon-consultation-001';
   
   -- 테넌트 삭제 (또는 비활성화)
   UPDATE tenants 
   SET is_deleted = TRUE, status = 'INACTIVE'
   WHERE tenant_id = 'tenant-incheon-consultation-001';
   
   -- 관리자 계정 삭제
   UPDATE users 
   SET is_deleted = TRUE 
   WHERE tenant_id = 'tenant-incheon-consultation-001';
   
   -- 역할 삭제
   UPDATE tenant_roles 
   SET is_deleted = TRUE 
   WHERE tenant_id = 'tenant-incheon-consultation-001';
   
   -- 역할 할당 삭제
   UPDATE user_role_assignments 
   SET is_deleted = TRUE 
   WHERE tenant_id = 'tenant-incheon-consultation-001';
   ```

2. **온보딩부터 다시 진행**
   - 온보딩 폼 입력
   - 승인 진행
   - 대시보드 자동 생성 확인

---

### 옵션 2: 기존 테넌트에 대시보드만 수동 생성

#### 장점
- 빠른 테스트
- 온보딩 입력 불필요

#### 단점
- 전체 프로세스 검증 불가
- 대시보드 생성 로직만 테스트

#### 진행 방법
1. **대시보드 생성 API 호출**
   - CoreSolution 백엔드의 `TenantDashboardService.createDefaultDashboards` 호출
   - 또는 Ops 백엔드에서 직접 SQL로 생성

2. **수동 SQL 실행**
   ```sql
   -- 역할별 대시보드 생성 (CONSULTATION 업종)
   -- 원장 대시보드
   INSERT INTO tenant_dashboards (
       dashboard_id, tenant_id, tenant_role_id,
       dashboard_name, dashboard_name_ko, dashboard_name_en,
       description, dashboard_type, is_default, is_active,
       display_order, dashboard_config, created_at, updated_at,
       is_deleted, version
   ) VALUES (
       UUID(), 'tenant-incheon-consultation-001', 
       (SELECT tenant_role_id FROM tenant_roles WHERE tenant_id = 'tenant-incheon-consultation-001' AND name_ko = '원장' LIMIT 1),
       '원장 대시보드', '원장 대시보드', 'Principal Dashboard',
       '원장 역할의 기본 대시보드', 'CONSULTATION_DIRECTOR',
       TRUE, TRUE, 1, '{"widgets": []}', NOW(), NOW(), FALSE, 0
   );
   
   -- 상담사, 내담자, 사무원 대시보드도 동일하게 생성
   ```

---

## ✅ 권장 사항

### 옵션 1 권장 이유
1. **전체 프로세스 검증**: 온보딩부터 승인까지 전체 플로우 테스트
2. **대시보드 자동 생성 확인**: 새로 추가된 로직이 정상 작동하는지 확인
3. **실제 운영 시나리오**: 실제 사용자 경험과 동일한 테스트

### 옵션 2 사용 시기
- 대시보드 생성 로직만 빠르게 확인하고 싶을 때
- 기존 테넌트에 대시보드가 필요한 경우

---

## 🔍 확인 체크리스트

### 옵션 1 선택 시
- [ ] 기존 데이터 삭제 완료
- [ ] 온보딩 폼 입력 완료
- [ ] 승인 진행 완료
- [ ] 테넌트 생성 확인
- [ ] 관리자 계정 생성 확인
- [ ] 기본 역할 생성 확인 (4개 또는 5개)
- [ ] **대시보드 자동 생성 확인** ⭐
- [ ] 브랜드 정보 저장 확인

### 옵션 2 선택 시
- [ ] 기존 테넌트 확인
- [ ] 역할 확인
- [ ] 대시보드 수동 생성 완료
- [ ] 대시보드 조회 확인

---

## 📝 다음 단계

사용자가 선택한 옵션에 따라:
1. **옵션 1 선택**: 데이터 삭제 스크립트 실행 → 온보딩 재진행
2. **옵션 2 선택**: 대시보드 수동 생성 스크립트 실행

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10

