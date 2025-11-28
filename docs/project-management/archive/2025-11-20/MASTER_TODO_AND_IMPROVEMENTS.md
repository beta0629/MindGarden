# 코어솔루션 마스터 TODO 및 개선 방향

## 📋 개요

이 문서는 CoreSolution 플랫폼의 모든 TODO 리스트와 개선 방향을 날짜별로 정리한 중앙 집중식 문서입니다.

**최종 업데이트**: 2025-11-20  
**버전**: 1.0.0  
**상태**: 활성 관리 중

**위치**: `docs/mgsb/2025-11-20/MASTER_TODO_AND_IMPROVEMENTS.md` (오늘 작업용)

---

## 📅 날짜별 TODO 리스트

### [오늘 할 일 체크리스트](./TODAY_TODO_CHECKLIST.md) ⭐

**오늘의 상세 작업 내역은 위 체크리스트를 확인하세요.**

---

## ✅ 완료된 작업 (누적)

### 표준화 작업
- [x] **표준화 계획 수립 및 Phase 0-2 완료**
  - 표준화 계획 문서 작성 (`CORESOLUTION_STANDARDIZATION_PLAN.md`)
  - ApiResponse 표준 응답 래퍼 생성
  - ErrorResponse 통합 (core.dto로 통합)
  - BaseApiController 기본 클래스 생성
  - GlobalExceptionHandler 업데이트
  - **Phase 1: 핵심 Controller 표준화 완료**
    - TenantRoleController 표준화 ✅
    - UserRoleAssignmentController 표준화 ✅
    - TenantDashboardController 표준화 ✅
  - **Phase 2: DTO 표준화 완료 ✅ (2025-11-20)**
    - UserDto → UserResponse 마이그레이션 ✅
    - BranchDto Deprecated (이미 표준화 완료) ✅
    - ScheduleDto 관련 표준화 완료 ✅
    - Phase 2.4: 나머지 8개 DTO 표준화 완료 ✅
      - PrivacyConsentDto, ClientRegistrationDto, ConsultantRegistrationDto
      - ConsultantAvailabilityDto, ConsultantClientMappingDto
      - UserTransferDto, BranchStatisticsDto, UserAddressDto

### 문서화
- [x] 문서 폴더 날짜별 정리
- [x] 마스터 TODO 문서 생성
- [x] 오늘 날짜 폴더 생성 및 체크리스트 작성

---

## 🚧 진행 중인 작업

없음

---

## ⏳ 대기 중인 작업

### 표준화 Phase 2.3: 명확성 개선 (선택적) ✅ 완료 (2025-11-20)
- [x] PaymentRequest → PaymentCreateRequest (선택적) ✅
- [x] EmailRequest → EmailSendRequest (선택적) ✅
- [x] AuthRequest → LoginRequest (선택적) ✅
- [x] 기존 DTO Deprecated 표시 및 하위 호환성 변환 메서드 제공 ✅

**완료 시간**: 2025-11-20

### 표준화 Phase 3.4: PermissionMatrix 마이그레이션 ✅ 완료 (2025-11-20)
- [x] PermissionMatrix 권한 정보 데이터베이스 마이그레이션 계획 수립 ✅
- [x] 데이터베이스 스키마 설계 ✅
- [x] 마이그레이션 스크립트 작성 ✅ (V34__migrate_permission_matrix_to_database.sql)
- [x] SecurityUtils 메뉴/API/기능 권한 체크 변경 ✅
- [x] 하위 호환성 유지 ✅

**완료 시간**: 2025-11-20 15:00-17:00

### 표준화 Phase 2: DTO 표준화
- [x] 기존 DTO 파일 전체 조사 ✅ (2025-11-20 완료)
- [x] 네이밍 규칙 불일치 분석 ✅ (2025-11-20 완료)
- [x] 마이그레이션 우선순위 결정 ✅ (2025-11-20 완료)
- [x] 마이그레이션 계획 문서 작성 ✅ (2025-11-20 완료)
- [x] 핵심 DTO 마이그레이션 완료 ✅ (2025-11-20 완료)
  - [x] UserDto → UserResponse
  - [x] BranchDto Deprecated (이미 표준화 완료)
  - [x] ScheduleDto 관련 표준화

### 표준화 Phase 3: 권한 관리 표준화
- [x] Phase 3.0: 분석 및 계획 수립 ✅ (2025-11-20 완료)
  - [x] SecurityUtils 사용처 조사 (3개 파일)
  - [x] PermissionCheckUtils 사용처 조사 (12개 파일)
  - [x] DynamicPermissionService 사용처 조사 (38개 파일)
  - [x] 통합 방안 수립
  - [x] 마이그레이션 계획 작성 (PERMISSION_STANDARDIZATION_ANALYSIS.md)
- [x] Phase 3.1: PermissionCheckUtils 표준화 ✅ (2025-11-20 완료)
  - [x] 표준 유틸리티로 정의
  - [x] 가이드 문서 작성 (PERMISSION_CHECK_UTILS_GUIDE.md)
  - [x] 하위 호환성 메서드 제공
- [x] Phase 3.2: SecurityUtils 마이그레이션 ✅ (2025-11-20 완료)
  - [x] SecurityUtils Deprecated 표시
  - [x] 사용처 점진적 마이그레이션 (SecurityAspect, MenuController)

---

## 🔗 관련 문서

- [오늘 할 일 체크리스트](./TODAY_TODO_CHECKLIST.md) ⭐
- [표준화 계획](./CORESOLUTION_STANDARDIZATION_PLAN.md)

---

**참고**: 이 문서는 오늘 날짜 폴더에 복사된 작업용 문서입니다.  
원본은 `docs/mgsb/2025-01/MASTER_TODO_AND_IMPROVEMENTS.md`에 있습니다.

