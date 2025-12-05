# 다음 표준화 작업 계획

**작성일**: 2025-12-05  
**버전**: 1.0.0  
**상태**: 계획 수립 완료

---

## 📊 현재 완료된 작업

### ✅ 완료된 표준화 작업

1. **프로시저 표준화** (100% 완료)
   - 46개 프로시저 모두 표준화 완료
   - 테넌트 격리 보안 강화
   - Java 코드 수정 완료 (12개 파일)

2. **마이그레이션 표준화** (Phase 1, 2 완료)
   - 브랜치 코드 제거 (우선순위 파일)
   - 테넌트 격리 검증 완료

3. **Service 계층 브랜치 코드 제거** (100% 완료)
   - 15개 핵심 서비스 완료
   - TenantContextFilter, TenantContext, TenantContextHolder 표준화
   - Repository 쿼리 표준화

---

## 🎯 다음 표준화 작업 우선순위

### 🔴 Priority 1: 보안 및 핵심 아키텍처 (진행 중)

#### 1.1 브랜치 코드 완전 제거 (진행 중 - 80% 완료)

**완료된 작업**:
- ✅ TenantContextFilter: 브랜치 추출 로직 제거
- ✅ Repository 쿼리: branch_code 조건 제거
- ✅ Service 계층: 15개 핵심 서비스 branchCode 제거 완료

**남은 작업**:
- ⏳ TenantContext에서 branchId 필드 제거 (Deprecated 상태 유지 중)
- ⏳ Entity에서 branchId 필드 검토 (레거시 호환용으로 유지)
- ⏳ Frontend 브랜치 코드 제거
- ⏳ 나머지 Service 파일들 (레거시 호환용 유지)

**예상 기간**: 2-3일

---

#### 1.2 API 경로 표준화 (다음 작업)

**현황**:
- 비표준 API 경로: 15개 컨트롤러 발견
- 표준: `/api/v1/` 접두사 필수

**작업 내용**:
1. 컨트롤러별 API 경로 확인
2. `/api/v1/` 접두사 추가
3. 프론트엔드 API 호출 경로 수정
4. API 문서 업데이트

**대상 파일**:
- Controller 파일 15개
- Frontend API 호출 파일들

**예상 기간**: 3-5일

**참조 문서**:
- [API 설계 표준](../../standards/API_DESIGN_STANDARD.md)

---

### 🟡 Priority 2: 하드코딩 제거 (2주)

#### 2.1 역할 이름 하드코딩 제거

**현황**:
- 역할 이름 하드코딩: 19+ 파일 발견
- 표준: 공통코드에서 동적 조회

**작업 내용**:
1. 하드코딩된 역할 이름 검색
2. CommonCodeService를 통한 동적 조회로 변경
3. Enum 하드코딩 제거
4. 상수 클래스 제거

**대상 파일**:
- Service 파일 19개 이상
- Controller 파일
- Frontend 파일

**예상 기간**: 3일

**참조 문서**:
- [공통코드 시스템 표준](../../standards/COMMON_CODE_SYSTEM_STANDARD.md)
- [테넌트 역할 시스템 표준](../../standards/TENANT_ROLE_SYSTEM_STANDARD.md)

---

#### 2.2 색상 하드코딩 제거

**현황**:
- 색상 하드코딩: 50+ 파일 발견
- 표준: CSS 변수 사용

**작업 내용**:
1. 하드코딩된 색상값 검색
2. CSS 변수로 변경
3. 인라인 스타일 제거
4. 테마 시스템 적용

**대상 파일**:
- Frontend CSS/SCSS 파일
- React 컴포넌트 파일 50개 이상

**예상 기간**: 5일

**참조 문서**:
- [디자인 중앙화 표준](../../standards/DESIGN_CENTRALIZATION_STANDARD.md)

---

#### 2.3 상태값 하드코딩 제거

**현황**:
- 상태값 하드코딩: 다수 파일 발견
- 표준: 공통코드에서 동적 조회

**작업 내용**:
1. 하드코딩된 상태값 검색
2. CommonCodeService를 통한 동적 조회로 변경
3. Enum 하드코딩 제거

**대상 파일**:
- Service 파일
- Controller 파일
- Frontend 파일

**예상 기간**: 3일

**참조 문서**:
- [공통코드 시스템 표준](../../standards/COMMON_CODE_SYSTEM_STANDARD.md)

---

### 🟢 Priority 3: 프론트엔드 표준화 (3주)

#### 3.1 컴포넌트 템플릿 적용

**작업 내용**:
1. 표준 컴포넌트 템플릿 확인
2. 기존 컴포넌트를 템플릿 기반으로 리팩토링
3. 공통 처리 자동화 적용

**예상 기간**: 5일

**참조 문서**:
- [컴포넌트 템플릿 표준](../../standards/COMPONENT_TEMPLATE_STANDARD.md)

---

#### 3.2 표준 컴포넌트 사용

**작업 내용**:
1. 표준 컴포넌트 목록 확인
2. 커스텀 컴포넌트를 표준 컴포넌트로 교체
3. 일관된 디자인 적용

**예상 기간**: 5일

**참조 문서**:
- [컴포넌트 템플릿 표준](../../standards/COMPONENT_TEMPLATE_STANDARD.md)
- [버튼 디자인 표준](../../standards/BUTTON_DESIGN_STANDARD.md)
- [리스트 UI 카드 형태 표준](../../standards/LIST_UI_CARD_STANDARD.md)

---

#### 3.3 UI/UX 표준화

**작업 내용**:
1. 반응형 레이아웃 적용
2. 카드 형태 리스트 적용
3. 대시보드 데이터 표시 표준 적용
4. 연속 스크롤 적용

**예상 기간**: 5일

**참조 문서**:
- [반응형 레이아웃 표준](../../standards/RESPONSIVE_LAYOUT_STANDARD.md)
- [리스트 UI 카드 형태 표준](../../standards/LIST_UI_CARD_STANDARD.md)
- [대시보드 데이터 표시 표준](../../standards/DASHBOARD_DATA_DISPLAY_STANDARD.md)
- [데이터 리스트 관리 표준](../../standards/DATA_LIST_MANAGEMENT_STANDARD.md)

---

## 📅 전체 일정

### Week 1-2: Priority 1 완료
- 브랜치 코드 완전 제거 (2-3일)
- API 경로 표준화 (3-5일)

### Week 3-4: Priority 2 완료
- 역할 이름 하드코딩 제거 (3일)
- 색상 하드코딩 제거 (5일)
- 상태값 하드코딩 제거 (3일)

### Week 5-7: Priority 3 완료
- 컴포넌트 템플릿 적용 (5일)
- 표준 컴포넌트 사용 (5일)
- UI/UX 표준화 (5일)

---

## 📋 다음 작업 상세 계획

### 즉시 시작 가능한 작업

1. **API 경로 표준화** (우선순위 높음)
   - 보안 및 일관성 향상
   - 작업 범위 명확
   - 예상 기간: 3-5일

2. **역할 이름 하드코딩 제거** (우선순위 높음)
   - 동적 역할 관리 완성
   - 작업 범위 명확
   - 예상 기간: 3일

---

## 🔗 참조 문서

- [시스템 표준화 우선순위 계획](../2025-12-04/SYSTEM_STANDARDIZATION_PRIORITY_PLAN.md)
- [표준 문서 목록](../../standards/README.md)
- [작업 로그](./WORK_LOG.md)

---

**최종 업데이트**: 2025-12-05

