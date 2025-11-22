# 코어솔루션 마스터 TODO 및 개선 방향

## 📋 개요

이 문서는 CoreSolution 플랫폼의 모든 TODO 리스트와 개선 방향을 날짜별로 정리한 중앙 집중식 문서입니다.

**최종 업데이트**: 2025-01-XX  
**버전**: 1.0.0  
**상태**: 활성 관리 중

---

## 📅 날짜별 TODO 리스트

### 2025-01-XX (오늘)

#### ✅ 완료된 작업
- [x] **동적 대시보드 시스템 Phase 1-2 완료**
  - 대시보드 목록 페이지 구현
  - 대시보드 생성/수정 모달 구현
  - CSS 변수 상수화 및 인라인 스타일 제거
  - 레거시 코드 정리 (하드코딩된 역할 매핑 제거)
  - 역할별 고정 라우트 정리

- [x] **표준화 계획 수립 및 Phase 0 완료**
  - 표준화 계획 문서 작성 (`CORESOLUTION_STANDARDIZATION_PLAN.md`)
  - ApiResponse 표준 응답 래퍼 생성
  - ErrorResponse 통합 (core.dto로 통합)
  - BaseApiController 기본 클래스 생성
  - GlobalExceptionHandler 업데이트

- [x] **문서화 작업**
  - 동적 대시보드 개발자 가이드 작성
  - 동적 대시보드 관리자 가이드 작성
  - 통합 테스트 체크리스트 작성

#### 🚧 진행 중인 작업
- [ ] **표준화 Phase 1: 핵심 Controller 마이그레이션**
  - [x] TenantRoleController 표준화 ✅ (완료)
  - [ ] UserRoleAssignmentController 표준화
  - [ ] TenantDashboardController 표준화

#### ⏳ 대기 중인 작업
- [ ] **동적 대시보드 Phase 3: 테스트 및 검증**
  - 시스템 재부팅 후 실제 환경 테스트 필요
  - 테스트 체크리스트 사용 (`DYNAMIC_DASHBOARD_TEST_CHECKLIST.md`)

---

## 🎯 주요 개선 방향

### 1. 표준화 작업 (우선순위: 높음) 🔥

#### 현재 상태
- ✅ Phase 0 완료 (표준 정의 및 기본 인프라)
- 🚧 Phase 1 진행 중 (핵심 Controller 표준화)

#### 다음 단계
1. **TenantRoleController 표준화** (예상 시간: 1-2시간)
   - BaseApiController 상속
   - ApiResponse로 응답 래핑
   - 직접 try-catch 제거

2. **UserRoleAssignmentController 표준화** (예상 시간: 1-2시간)
   - 동일한 패턴 적용

3. **TenantDashboardController 표준화** (예상 시간: 1-2시간)
   - 동일한 패턴 적용

#### 참고 문서
- `docs/mgsb/CORESOLUTION_STANDARDIZATION_PLAN.md`

---

### 2. 메타 시스템 기반 자동화 (우선순위: 높음) 🔥

#### 현재 상태 (2025-11-22)
- ✅ Phase 1 완료: 대시보드 설정 JSON 스키마 문서화
- ✅ Phase 1 완료: DynamicDashboard.js 확장 (dashboard_config 기반 위젯 동적 생성)
- ✅ Phase 1 완료: 백엔드 dashboardConfig 검증 로직 추가
- ✅ Phase 2 완료: business_rule_mappings 테이블 생성 (V38)
- ✅ Phase 2 완료: BusinessRuleEngine 서비스 구현
- ✅ Phase 2 완료: 기본 비즈니스 규칙 삽입 (V39)
- ✅ Phase 2 완료: AdminRoleUtils 메타 시스템 어댑터 생성
- 🚧 Phase 1 진행 중: 기존 MindGarden 컴포넌트 위젯화 (AdminDashboard, CommonDashboard, ClientDashboard)
- ⏳ Phase 1 대기: 기존 섹션 컴포넌트 위젯화 (SummaryPanels, RecentActivities, WelcomeSection 등)

#### 다음 단계

**Phase 1: 대시보드 레이아웃 메타 시스템 확장 (진행 중)**
1. **기존 컴포넌트 위젯화** (예상 시간: 1-2주)
   - AdminDashboard.js → 위젯 기반으로 변환
   - CommonDashboard.js → 위젯 기반으로 변환
   - ClientDashboard.js → 위젯 기반으로 변환
   - SummaryPanels → Statistics Widget
   - RecentActivities → Table Widget
   - WelcomeSection → Custom Widget
   - QuickActions → Custom Widget

2. **대시보드 관리 UI 개선** (예상 시간: 1주)
   - 드래그 앤 드롭 레이아웃 편집기 (향후 구현)
   - 위젯 추가/제거/설정 UI

**Phase 2: 비즈니스 로직 메타화 (완료)**
- ✅ business_rule_mappings 테이블 생성
- ✅ BusinessRuleEngine 서비스 구현
- ✅ 기본 비즈니스 규칙 삽입
- ✅ AdminRoleUtils 어댑터 생성

**Phase 3: 역할/권한 시스템 메타화 강화 (예정)**
1. TenantRole metadata_json 활용 강화
2. 하드코딩된 권한 체크를 RolePermission 기반으로 전환

**Phase 4: 공통코드 시스템 메타화 (예정)**
1. CodeGroupMetadata 확장
2. 하드코딩된 매핑 제거

**Phase 5: 동적 SQL 생성 (예정)**
1. CriteriaBuilder 또는 QueryDSL 기반 동적 쿼리 생성
2. 복잡한 필터링 시나리오에서 성능 개선
3. 메모리 필터링 → DB 쿼리로 전환

#### 참고 문서
- `docs/mgsb/2025-11-22/META_SYSTEM_DASHBOARD_SCHEMA.md` ⭐
- `docs/mgsb/DYNAMIC_DASHBOARD_NEXT_STEPS.md`
- `docs/mgsb/DYNAMIC_DASHBOARD_TEST_CHECKLIST.md`
- `docs/mgsb/DYNAMIC_DASHBOARD_DEVELOPER_GUIDE.md`
- `docs/mgsb/DYNAMIC_DASHBOARD_ADMIN_GUIDE.md`
- `docs/mgsb/TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md`

---

### 3. 공통코드 시스템 (우선순위: 중간)

#### 현재 상태
- ✅ 표준화 완료 (CRUD API, DTO, 권한 관리)
- ✅ 프론트엔드 통합 완료

#### 다음 단계
- 다른 프론트엔드 컴포넌트 마이그레이션 (점진적)

#### 참고 문서
- `docs/mgsb/COMMON_CODE_STANDARDIZATION_PLAN.md`
- `docs/mgsb/COMMON_CODE_USAGE_PRINCIPLES.md`

---

## 📊 진행 상황 대시보드

### 표준화 작업
```
Phase 0: ████████████████████ 100% ✅
Phase 1: ████░░░░░░░░░░░░░░░░  20% 🚧
Phase 2: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 6: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

### 메타 시스템 기반 자동화 (2025-11-22 업데이트)
```
Phase 1 (대시보드 레이아웃):
  - JSON 스키마 문서화: ████████████████████ 100% ✅
  - DynamicDashboard.js 확장: ████████████████████ 100% ✅
  - 백엔드 검증 로직: ████████████████████ 100% ✅
  - 기존 컴포넌트 위젯화: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (진행 예정)
  - 드래그 앤 드롭 편집기: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (향후 구현)

Phase 2 (비즈니스 로직 메타화):
  - business_rule_mappings 테이블: ████████████████████ 100% ✅
  - BusinessRuleEngine 구현: ████████████████████ 100% ✅
  - 기본 규칙 삽입: ████████████████████ 100% ✅
  - AdminRoleUtils 어댑터: ████████████████████ 100% ✅

Phase 3 (역할/권한 메타화): ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 4 (공통코드 메타화): ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 5 (동적 SQL 생성): ░░░░░░░░░░░░░░░░░░░░   0% ⏳
```

---

## 🔥 즉시 조치 필요 사항

### 1. 표준화 Phase 1 완료 (우선순위: 높음)
**이유**: 추후 Controller가 더 많아지면 마이그레이션 비용 증가

**작업**:
- [ ] TenantRoleController 표준화
- [ ] UserRoleAssignmentController 표준화
- [ ] TenantDashboardController 표준화

**예상 시간**: 4-6시간

**참고**: `docs/mgsb/CORESOLUTION_STANDARDIZATION_PLAN.md` Phase 1 참조

---

### 2. DTO 표준화 계획 수립 (우선순위: 중간)
**이유**: DTO 네이밍 불일치로 인한 개발자 혼란

**작업**:
- [ ] 기존 DTO 파일 식별 및 분류
- [ ] 마이그레이션 계획 수립
- [ ] 우선순위 결정

**예상 시간**: 2-3시간 (계획 수립)

**참고**: `docs/mgsb/CORESOLUTION_STANDARDIZATION_PLAN.md` Phase 2 참조

---

### 3. 권한 관리 표준화 (우선순위: 중간)
**이유**: 보안 취약점 가능성 및 유지보수 어려움

**작업**:
- [ ] DynamicPermissionService 표준화
- [ ] SecurityUtils, PermissionCheckUtils 통합
- [ ] 도메인별 권한 서비스 표준화

**예상 시간**: 1-2주

**참고**: `docs/mgsb/CORESOLUTION_STANDARDIZATION_PLAN.md` Phase 3 참조

---

## 📝 주간 진행 계획

### Week 1 (현재 주)
- [x] 표준화 Phase 0 완료
- [ ] 표준화 Phase 1 완료 (3개 Controller)
- [ ] DTO 표준화 계획 수립

### Week 2
- [ ] DTO 표준화 시작 (우선순위 높은 DTO부터)
- [ ] 권한 관리 표준화 시작
- [ ] 동적 대시보드 테스트 (시스템 재부팅 후)

### Week 3-4
- [ ] API 경로 표준화
- [ ] 서비스 레이어 표준화
- [ ] 로깅 표준화

---

## 🔗 관련 문서 링크

### 표준화 관련
- [표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)
- [공통코드 표준화 계획](./COMMON_CODE_STANDARDIZATION_PLAN.md)
- [공통코드 사용 원칙](./COMMON_CODE_USAGE_PRINCIPLES.md)

### 메타 시스템 및 동적 대시보드 관련
- [메타 시스템 대시보드 스키마](./2025-11-22/META_SYSTEM_DASHBOARD_SCHEMA.md) ⭐ (2025-11-22)
- [동적 대시보드 다음 단계](./DYNAMIC_DASHBOARD_NEXT_STEPS.md)
- [동적 대시보드 테스트 체크리스트](./DYNAMIC_DASHBOARD_TEST_CHECKLIST.md)
- [동적 대시보드 개발자 가이드](./DYNAMIC_DASHBOARD_DEVELOPER_GUIDE.md)
- [동적 대시보드 관리자 가이드](./DYNAMIC_DASHBOARD_ADMIN_GUIDE.md)

### 아키텍처 관련
- [테넌트 대시보드 관리 시스템](./TENANT_DASHBOARD_MANAGEMENT_SYSTEM.md)
- [동적 대시보드 라우팅 시스템](./DYNAMIC_DASHBOARD_ROUTING_SYSTEM.md)
- [비즈니스 카테고리 역할 시스템](./BUSINESS_CATEGORY_ROLE_SYSTEM.md)

---

## 📌 중요 참고사항

### 작업 원칙
1. **하위 호환성 유지**: 모든 변경은 기존 기능과 호환되어야 함
2. **점진적 마이그레이션**: 한 번에 모든 것을 변경하지 않음
3. **문서화 필수**: 모든 표준 규칙과 변경사항 문서화
4. **테스트 우선**: 변경 전후 테스트 필수

### 우선순위 결정 기준
1. **보안 관련**: 즉시 조치 (P0)
2. **API 일관성**: 높은 우선순위 (P0-P1)
3. **개발자 경험**: 중간 우선순위 (P1-P2)
4. **운영 효율성**: 낮은 우선순위 (P2-P3)

---

## 🔄 문서 업데이트 규칙

### 업데이트 주기
- **일일**: 완료된 작업 체크, 진행 중 작업 상태 업데이트
- **주간**: 주간 진행 계획 업데이트, 다음 주 계획 수립
- **월간**: 전체 진행 상황 리뷰, 우선순위 재조정

### 업데이트 담당
- 개발 진행 시 즉시 업데이트
- 주간 회의에서 리뷰 및 계획 수정
- 월간 회고에서 전체 리뷰

---

**마지막 업데이트**: 2025-11-22 (메타 시스템 도입 시작)  
**다음 리뷰 예정일**: 2025-11-29 (주간 회의)

