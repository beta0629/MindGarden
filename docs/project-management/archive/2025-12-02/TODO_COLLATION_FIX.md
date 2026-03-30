# MySQL Collation 문제 근본 해결 TODO

**작성일:** 2025-12-02  
**우선순위:** 🔴 긴급 (CRITICAL)  
**담당자:** 개발팀  
**목표:** 프로시저 Collation 문제 완전 해결 (우회 금지)

---

## ⚠️ 중요 원칙

**절대 우회하면 안 됩니다!**
- 임시 방편은 금지
- 근본 원인을 완전히 해결해야 함
- 다음번에 같은 오류가 발생하면 안 됨

---

## 📋 작업 체크리스트

### Phase 1: 문제 분석 및 진단 ✅

- [x] 현재 상황 파악
  - [x] `ProcessOnboardingApproval` 프로시저 실패 확인
  - [x] Collation 불일치 오류 확인 (`utf8mb4_unicode_ci` vs `utf8mb4_0900_ai_ci`)
  - [x] 영향 범위 파악 (역할/대시보드 미생성)

- [x] 근본 원인 분석
  - [x] 데이터베이스 기본 collation 확인: `utf8mb4_unicode_ci` ✅
  - [x] 테이블 collation 확인: 모두 `utf8mb4_unicode_ci` ✅
  - [x] 컬럼 collation 확인: 모두 `utf8mb4_unicode_ci` ✅
  - [x] 세션 변수 문제 확인: `collation_connection` 기본값이 `utf8mb4_0900_ai_ci`

---

### Phase 2: 모든 프로시저 Collation 수정 (필수) ⏳

#### 2.1 하위 프로시저 목록 확인
- [ ] 모든 온보딩 관련 프로시저 목록 작성
  - [ ] `ProcessOnboardingApproval` (메인)
  - [ ] `CreateOrActivateTenant`
  - [ ] `CopyDefaultTenantCodes`
  - [ ] `SetupTenantCategoryMapping`
  - [ ] `ActivateDefaultComponents`
  - [ ] `CreateDefaultSubscription`
  - [ ] `ApplyDefaultRoleTemplates` (부분 수정됨)
  - [ ] `GenerateErdOnOnboardingApproval`
  - [ ] `CreateTenantAdminAccount`

#### 2.2 각 프로시저 Collation 수정
- [x] `ApplyDefaultRoleTemplates` 수정 (V20251202_015)
  - [x] 파라미터에 `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` 추가
  - [x] 변수에 collation 명시
  - [x] WHERE 절에 `COLLATE utf8mb4_unicode_ci` 추가

- [ ] `CreateOrActivateTenant` 수정
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] 비교 연산에 COLLATE 절 추가

- [ ] `CopyDefaultTenantCodes` 수정
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] JOIN/WHERE 절에 COLLATE 절 추가

- [ ] `SetupTenantCategoryMapping` 수정
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] 비교 연산에 COLLATE 절 추가

- [ ] `ActivateDefaultComponents` 수정
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] 비교 연산에 COLLATE 절 추가

- [ ] `CreateDefaultSubscription` 수정
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] 비교 연산에 COLLATE 절 추가

- [ ] `GenerateErdOnOnboardingApproval` 수정
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] 비교 연산에 COLLATE 절 추가

- [ ] `CreateTenantAdminAccount` 수정
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] 비교 연산에 COLLATE 절 추가

- [ ] `ProcessOnboardingApproval` 수정 (메인)
  - [ ] 파라미터 collation 명시
  - [ ] 변수 collation 명시
  - [ ] 하위 프로시저 호출 시 collation 보장

#### 2.3 마이그레이션 스크립트 작성
- [ ] `V20251202_016__fix_all_onboarding_procedures_collation.sql` 생성
  - [ ] 모든 프로시저 DROP 및 재생성
  - [ ] Collation 명시적 지정
  - [ ] 롤백 스크립트 준비

---

### Phase 3: 데이터베이스 연결 설정 강화 (보완) ⏳

#### 3.1 JDBC URL 설정 검증
- [x] `application.yml` 확인
  - [x] `connectionCollation=utf8mb4_unicode_ci` 설정 확인 ✅
  - [x] 모든 프로파일에 적용 확인

#### 3.2 세션 변수 설정 (이미 구현됨)
- [x] `OnboardingApprovalServiceImpl` 수정
  - [x] 프로시저 실행 전 세션 변수 설정
  - [x] `SET collation_connection = 'utf8mb4_unicode_ci'`
  - [x] `SET collation_database = 'utf8mb4_unicode_ci'`

#### 3.3 추가 안전장치
- [ ] HikariCP 설정에 `connectionInitSql` 추가
  ```yaml
  spring:
    datasource:
      hikari:
        connection-init-sql: >
          SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
          SET collation_connection = utf8mb4_unicode_ci;
          SET collation_database = utf8mb4_unicode_ci;
  ```

---

### Phase 4: 테스트 및 검증 (필수) ⏳

#### 4.1 단위 테스트
- [ ] 각 프로시저 개별 테스트
  - [ ] `CreateOrActivateTenant` 테스트
  - [ ] `CopyDefaultTenantCodes` 테스트
  - [ ] `SetupTenantCategoryMapping` 테스트
  - [ ] `ActivateDefaultComponents` 테스트
  - [ ] `CreateDefaultSubscription` 테스트
  - [ ] `ApplyDefaultRoleTemplates` 테스트
  - [ ] `GenerateErdOnOnboardingApproval` 테스트
  - [ ] `CreateTenantAdminAccount` 테스트

#### 4.2 통합 테스트
- [ ] 전체 온보딩 프로세스 테스트
  - [ ] 테넌트 생성 확인
  - [ ] 역할(tenant_roles) 생성 확인 (4개)
  - [ ] 대시보드 생성 확인 (4개)
  - [ ] 관리자 계정 생성 확인
  - [ ] 위젯 그룹 생성 확인

#### 4.3 반복 테스트 (멱등성)
- [ ] 3회 이상 반복 실행
  - [ ] 동일한 결과 확인
  - [ ] Collation 오류 미발생 확인
  - [ ] 모든 단계 성공 확인

#### 4.4 자동화 테스트
- [ ] `test-widget-grouping-system.sh` 업데이트
  - [ ] 역할 생성 검증 추가
  - [ ] 대시보드 생성 검증 추가
  - [ ] 11/11 테스트 통과 목표

---

### Phase 5: 문서화 및 모니터링 (필수) ⏳

#### 5.1 기술 문서 작성
- [ ] Collation 설정 가이드 작성
  - [ ] 문제 원인 설명
  - [ ] 해결 방법 상세 설명
  - [ ] 프로시저 작성 규칙 정의

#### 5.2 운영 가이드 작성
- [ ] 프로시저 수정 시 체크리스트
  - [ ] 파라미터 collation 명시 필수
  - [ ] 변수 collation 명시 필수
  - [ ] 비교 연산 COLLATE 절 필수

#### 5.3 모니터링 설정
- [ ] 프로시저 실행 로그 개선
  - [ ] 각 단계별 성공/실패 로그
  - [ ] Collation 오류 자동 감지
  - [ ] 알림 설정 (Slack/Email)

---

## 🎯 완료 조건

### 필수 조건 (모두 충족해야 함)
1. ✅ **Collation 오류 완전 제거**
   - [ ] 모든 프로시저에서 Collation 오류 미발생
   - [ ] 10회 이상 반복 테스트 통과

2. ✅ **역할 자동 생성**
   - [ ] 테넌트 생성 시 4개 역할 자동 생성
   - [ ] 역할 템플릿 정상 적용

3. ✅ **대시보드 자동 생성**
   - [ ] 역할별 대시보드 자동 생성
   - [ ] 위젯 그룹 정상 연결

4. ✅ **테스트 100% 통과**
   - [ ] 11/11 테스트 모두 통과
   - [ ] 자동화 테스트 스크립트 완성

5. ✅ **문서화 완료**
   - [ ] 기술 문서 작성
   - [ ] 운영 가이드 작성
   - [ ] 체크리스트 작성

---

## ⏱️ 예상 소요 시간

| Phase | 작업 내용 | 예상 시간 | 우선순위 |
|-------|----------|----------|---------|
| Phase 1 | 문제 분석 및 진단 | ✅ 완료 | 🔴 긴급 |
| Phase 2 | 모든 프로시저 수정 | 3-4시간 | 🔴 긴급 |
| Phase 3 | 연결 설정 강화 | 30분 | 🟡 중요 |
| Phase 4 | 테스트 및 검증 | 2시간 | 🔴 긴급 |
| Phase 5 | 문서화 및 모니터링 | 1시간 | 🟡 중요 |
| **합계** | | **6-7시간** | |

---

## 🚫 금지 사항

### 절대 하지 말아야 할 것
1. ❌ **임시 우회 금지**
   - Java fallback만으로 해결 금지
   - "일단 넘어가자" 금지
   - "나중에 수정하자" 금지

2. ❌ **부분 수정 금지**
   - 일부 프로시저만 수정 금지
   - "이 정도면 되겠지" 금지
   - 테스트 없이 배포 금지

3. ❌ **문서화 생략 금지**
   - "나만 알면 돼" 금지
   - "간단한 수정이라 문서 불필요" 금지
   - 체크리스트 생략 금지

---

## 📊 진행 상황 추적

### 현재 상태
- **Phase 1:** ✅ 완료 (100%)
- **Phase 2:** ⏳ 진행 중 (12.5% - ApplyDefaultRoleTemplates만 수정)
- **Phase 3:** ⏳ 진행 중 (66% - 세션 변수 설정 완료, HikariCP 설정 필요)
- **Phase 4:** ❌ 미시작 (0%)
- **Phase 5:** ❌ 미시작 (0%)

### 전체 진행률
**약 20%** (Phase 1 완료, Phase 2 일부 완료)

---

## 🔄 다음 작업

### 즉시 시작해야 할 작업 (우선순위 순)
1. **모든 프로시저 목록 확인 및 분석** (30분)
2. **CreateOrActivateTenant 프로시저 수정** (30분)
3. **CopyDefaultTenantCodes 프로시저 수정** (30분)
4. **나머지 프로시저 순차 수정** (2시간)
5. **통합 테스트 실행** (1시간)

---

## 📝 참고 자료

### 관련 문서
- `docs/project-management/archive/2025-12-02/2025-12-02_WIDGET_SYSTEM_IMPLEMENTATION.md`
- `docs/project-management/archive/2025-12-02/WIDGET_SYSTEM_TEST_REPORT.md`

### 관련 파일
- `src/main/resources/db/migration/V20251202_015__fix_apply_default_role_templates_collation_v2.sql`
- `src/main/java/com/coresolution/core/service/impl/OnboardingApprovalServiceImpl.java`

### 데이터베이스
- **개발 DB:** beta0629.cafe24.com:3306/core_solution
- **프로시저 위치:** `information_schema.ROUTINES`

---

**작성일:** 2025-12-02  
**최종 수정:** 2025-12-02  
**상태:** 🔴 진행 중 (20% 완료)  
**다음 리뷰:** Phase 2 완료 후

