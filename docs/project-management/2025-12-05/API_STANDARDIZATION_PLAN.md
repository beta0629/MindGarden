# API 경로 표준화 작업 계획

**작성일**: 2025-12-05  
**버전**: 1.0.0  
**상태**: 계획 수립 완료

---

## 📌 개요

모든 REST API를 `/api/v1/` 경로로 표준화하는 작업입니다.

**참조 문서**:
- [API 설계 표준](../../standards/API_DESIGN_STANDARD.md)
- [시스템 표준화 우선순위 계획](../2025-12-04/SYSTEM_STANDARDIZATION_PRIORITY_PLAN.md)

---

## 🔍 현재 상태 분석

### 발견된 패턴

1. **이미 `/api/v1/` 경로 포함 + 레거시 경로 유지** (대부분)
   - `AuthController`: `@RequestMapping({"/api/v1/auth", "/api/auth"})`
   - `UserController`: `@RequestMapping({"/api/v1/users", "/api/users"})`
   - `OAuth2ConfigController`: `@RequestMapping({"/api/v1/auth/config", "/api/auth/config"})`
   - `CssThemeController`: `@RequestMapping({"/api/v1/admin/css-themes", "/api/admin/css-themes"})`
   - `ConsultationMessageController`: `@RequestMapping({"/api/v1/consultation-messages", "/api/consultation-messages"})`
   - `WellnessAdminController`: `@RequestMapping({"/api/v1/admin/wellness", "/api/admin/wellness"})`

2. **뷰 컨트롤러** (API 표준화 대상 아님)
   - `TabletController`: `@RequestMapping("/tablet")` - 뷰 반환
   - `ClientDashboardController`: `@RequestMapping("/tablet/client")` - 뷰 반환

### 작업 방향

**옵션 1**: 레거시 경로 제거 (권장)
- 모든 컨트롤러에서 레거시 경로(`/api/...`) 제거
- `/api/v1/` 경로만 유지
- 프론트엔드 API 호출 경로 모두 수정 필요

**옵션 2**: 레거시 경로 유지 + Deprecated 표시
- 레거시 경로는 유지하되 `@Deprecated` 표시
- 새로운 코드에서는 `/api/v1/`만 사용
- 점진적 마이그레이션

**권장**: 옵션 1 (레거시 경로 제거)
- 표준화 원칙에 부합
- 일관성 확보
- 유지보수 용이

---

## 📋 작업 계획

### Phase 1: 컨트롤러 경로 표준화

#### 1.1 핵심 컨트롤러 (우선순위 높음)

**대상 컨트롤러**:
1. `AuthController` - 인증 관련
2. `AdminController` - 관리자 기능
3. `UserController` - 사용자 관리
4. `ConsultationMessageController` - 상담 메시지
5. `OAuth2ConfigController` - OAuth2 설정
6. `CssThemeController` - CSS 테마

**작업 내용**:
- `@RequestMapping`에서 레거시 경로 제거
- `/api/v1/` 경로만 유지
- 주석 추가 (표준화 2025-12-05)

**예상 기간**: 1일

---

#### 1.2 나머지 컨트롤러

**대상**: 모든 REST 컨트롤러 (약 70개)

**작업 내용**:
- 레거시 경로 제거
- `/api/v1/` 경로만 유지
- 일괄 처리 가능

**예상 기간**: 2일

---

### Phase 2: 프론트엔드 API 호출 경로 수정

**작업 내용**:
1. 프론트엔드 API 호출 파일 검색
2. 레거시 경로(`/api/...`)를 `/api/v1/...`로 변경
3. API 유틸리티 파일 수정

**예상 기간**: 2일

---

## 🎯 작업 원칙

### 1. 표준 준수
- 모든 REST API는 `/api/v1/` 접두사 필수
- 레거시 경로 완전 제거

### 2. 하위 호환성
- 레거시 경로 제거 시 프론트엔드 동시 수정 필요
- 배포 전 프론트엔드 수정 완료 확인

### 3. 문서화
- 변경된 경로 문서화
- API 문서 업데이트

---

## ✅ 완료 기준

### Phase 1 완료 기준
- [ ] 모든 REST 컨트롤러에서 레거시 경로 제거
- [ ] 모든 컨트롤러가 `/api/v1/` 경로만 사용
- [ ] 코드 검색: `/api/[^v]` 결과 0개 (뷰 컨트롤러 제외)

### Phase 2 완료 기준
- [ ] 프론트엔드 API 호출 경로 모두 수정
- [ ] 통합 테스트 통과
- [ ] API 문서 업데이트

---

## 📊 현재 진행 상황

### 전체 진행률: **0%** (시작 전)

### Phase별 상태
- Phase 1: 🔴 대기
- Phase 2: 🔴 대기

---

## 🔗 참조 문서

- [API 설계 표준](../../standards/API_DESIGN_STANDARD.md)
- [시스템 표준화 우선순위 계획](../2025-12-04/SYSTEM_STANDARDIZATION_PRIORITY_PLAN.md)
- [작업 로그](./WORK_LOG.md)

---

**최종 업데이트**: 2025-12-05


