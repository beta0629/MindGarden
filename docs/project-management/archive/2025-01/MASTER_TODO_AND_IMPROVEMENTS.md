# 코어솔루션 마스터 TODO 및 개선 방향

## 📋 개요

이 문서는 CoreSolution 플랫폼의 모든 TODO 리스트와 개선 방향을 날짜별로 정리한 중앙 집중식 문서입니다.

**최종 업데이트**: 2025-01-XX  
**버전**: 1.0.0  
**상태**: 활성 관리 중

---

## 📅 날짜별 TODO 리스트

### [오늘 날짜별 체크리스트](./$(date +%Y-%m-%d)/TODAY_TODO_CHECKLIST.md) ⭐

**오늘의 상세 작업 내역은 날짜별 폴더의 체크리스트를 확인하세요.**

### 2025-01-XX (이전 작업)

#### ✅ 완료된 작업
- [x] **동적 대시보드 시스템 Phase 1-2 완료**
  - 대시보드 목록 페이지 구현
  - 대시보드 생성/수정 모달 구현
  - CSS 변수 상수화 및 인라인 스타일 제거
  - 레거시 코드 정리 (하드코딩된 역할 매핑 제거)
  - 역할별 고정 라우트 정리

- [x] **표준화 계획 수립 및 Phase 0-1 완료**
  - 표준화 계획 문서 작성 (`CORESOLUTION_STANDARDIZATION_PLAN.md`)
  - ApiResponse 표준 응답 래퍼 생성
  - ErrorResponse 통합 (core.dto로 통합)
  - BaseApiController 기본 클래스 생성
  - GlobalExceptionHandler 업데이트
  - **Phase 1: 핵심 Controller 표준화 완료**
    - TenantRoleController 표준화 ✅
    - UserRoleAssignmentController 표준화 ✅
    - TenantDashboardController 표준화 ✅

- [x] **문서화 작업**
  - 동적 대시보드 개발자 가이드 작성
  - 동적 대시보드 관리자 가이드 작성
  - 통합 테스트 체크리스트 작성
  - 마스터 TODO 문서 작성 및 날짜별 폴더 정리

#### 🚧 진행 중인 작업
- [x] **표준화 Phase 1: 핵심 Controller 마이그레이션** ✅ (완료)
  - [x] TenantRoleController 표준화 ✅
  - [x] UserRoleAssignmentController 표준화 ✅
  - [x] TenantDashboardController 표준화 ✅

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

### 2. 동적 대시보드 시스템 (우선순위: 중간)

#### 현재 상태
- ✅ Phase 1-2 완료 (UI 구현 및 레거시 코드 정리)
- ⏳ Phase 3 대기 중 (테스트 및 검증)

#### 다음 단계
1. **시스템 재부팅 후 테스트 실행**
   - 테스트 체크리스트 사용
   - 모든 시나리오 검증
   - 에러 케이스 확인

2. **성능 최적화 (Phase 4)**
   - 대시보드 정보 캐싱
   - 컴포넌트 지연 로딩

#### 참고 문서
- `docs/mgsb/DYNAMIC_DASHBOARD_NEXT_STEPS.md`
- `docs/mgsb/DYNAMIC_DASHBOARD_TEST_CHECKLIST.md`
- `docs/mgsb/DYNAMIC_DASHBOARD_DEVELOPER_GUIDE.md`
- `docs/mgsb/DYNAMIC_DASHBOARD_ADMIN_GUIDE.md`

---

### 3. 공통코드 시스템 (우선순위: 중간)

#### 현재 상태
- ✅ 표준화 완료 (CRUD API, DTO, 권한 관리)
- ✅ 프론트엔드 통합 완료

#### 다음 단계
- 다른 프론트엔드 컴포넌트 마이그레이션 (점진적)

#### 참고 문서
- `docs/mgsb/2025-01/COMMON_CODE_STANDARDIZATION_PLAN.md`
- `docs/mgsb/2025-01/COMMON_CODE_USAGE_PRINCIPLES.md`

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

### 동적 대시보드 시스템
```
Phase 1: ████████████████████ 100% ✅
Phase 2: ████████████████████ 100% ✅
Phase 3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳ (시스템 재부팅 대기)
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 5: ████████████████████ 100% ✅ (문서화 완료)
```

---

## 🔥 즉시 조치 필요 사항

### 1. 표준화 Phase 1 완료 ✅ (우선순위: 높음)
**이유**: 추후 Controller가 더 많아지면 마이그레이션 비용 증가

**작업**:
- [x] TenantRoleController 표준화 ✅
- [x] UserRoleAssignmentController 표준화 ✅
- [x] TenantDashboardController 표준화 ✅

**완료 시간**: 약 2시간

**참고**: `docs/mgsb/2025-01/CORESOLUTION_STANDARDIZATION_PLAN.md` Phase 1 참조

### 1-1. 표준화 Phase 2 시작 (우선순위: 중간)
**다음 단계**: DTO 표준화

**작업**:
- [ ] 기존 DTO 파일 식별 및 분류
- [ ] 마이그레이션 계획 수립
- [ ] 우선순위 결정

**예상 시간**: 2-3시간 (계획 수립)

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

### 동적 대시보드 관련
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

**마지막 업데이트**: 2025-01-XX  
**다음 리뷰 예정일**: 2025-01-XX (주간 회의)

