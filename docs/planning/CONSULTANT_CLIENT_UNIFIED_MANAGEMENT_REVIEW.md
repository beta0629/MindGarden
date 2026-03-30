# 상담사·내담자 관리 통합 검토 및 계획

> **문서 성격**: 서브에이전트(explore + generalPurpose) 회의 결과물. 코드 수정 없이 문서 작성·정리만 수행.

---

## 1. 제목·개요

| 항목 | 내용 |
|------|------|
| **문서 제목** | 상담사·내담자 관리 통합 검토 및 계획 |
| **목적** | 상담사 관리·내담자 관리를 **통합할지 vs 현재처럼 분리 유지할지** 검토하고, 통합 시 실행 계획을 정리함. |
| **범위** | 라우트·메뉴·공통 컴포넌트·API·UI 차이 현황, 통합 시 장단점·리스크, 권장안, 통합 시 Phase별 실행 계획 및 결론·다음 단계. |

---

## 2. 현황 요약

### 2.1 라우트·메뉴

- **라우트**
  - 상담사: `/admin/consultant-comprehensive`
  - 내담자: `/admin/client-comprehensive`
- **사이드 메뉴**: "사용자 관리" 그룹 아래에 "상담사 관리", "내담자 관리"가 나란히 노출됨.
- **메뉴 정의**: `menu.js`에서 역할별로 반복 정의되어 있음. 두 메뉴 항목이 독립적으로 등록된 상태.

### 2.2 컴포넌트 구조

| 구분 | 상담사 | 내담자 |
|------|--------|--------|
| **페이지** | 단일 파일에 인라인 구성 | `ClientComprehensiveManagement` + 하위 탭 4개, `ClientModal` 등 |
| **탭 수** | 2개 | 4개 |

**공통으로 사용하는 요소**

- 레이아웃: `AdminCommonLayout`, `ContentArea`, `ContentHeader`
- UI: `SearchInput`, `PasswordResetModal`, `ProfileCard.css`
- 스타일: mapping-management 관련 CSS 등

### 2.3 API

- **목록·통계**: 엔드포인트만 다름  
  - 상담사: `consultants/with-stats`  
  - 내담자: `clients/with-stats`
- **공통 API**: mappings, reset-password, duplicate-check/email 등 동일하게 사용 가능.

### 2.4 UI 차이

- KPI·모달 구조는 유사함.
- 상담사: 인라인 모달 방식.
- 내담자: `ClientModal`로 통합된 모달 사용.

### 2.5 통합 시 고려사항

- **전환 방식 후보**: 단일 진입점에서 URL 쿼리(`?type=consultant|client`) 또는 상단 pill 탭으로 상담사/내담자 전환.
- **영향 범위**: `App.js` 라우트, `menu.js`, `adminRoutes.js`, 대시보드/위젯 링크.

---

## 3. 통합 vs 분리 검토

### 3.1 통합 시 장점

- **UX**: 한 화면(단일 진입점)에서 상담사/내담자 전환 가능. "사용자 관리" 개념과 맞춤.
- **메뉴 단순화**: "사용자 관리" 그룹 내 항목을 하나로 줄여 메뉴 깔끔해짐.
- **코드 재사용**: 공통 레이아웃·ContentHeader·KPI·검색·ProfileCard·모달 패턴을 한 곳에서 재사용 가능.
- **일관성**: KPI·카드·모달 패턴을 통합 페이지에서 통일하면 유지보수와 확장에 유리.

### 3.2 통합 시 단점·리스크

- **탭/상태 복잡도**: 상담사 2탭 + 내담자 4탭을 한 페이지에서 다루면 상태·탭 계층이 복잡해질 수 있음.
- **역할별 메뉴 수정**: `menu.js` 등에서 역할별 노출을 "사용자 관리" 단일 항목 기준으로 재정의 필요.
- **기존 링크**: `/admin/consultant-comprehensive`, `/admin/client-comprehensive` 직접 URL·북마크 사용자에게는 리다이렉트 또는 안내 필요.

### 3.3 분리 유지 시

- 현재 구조 유지로 **역할(상담사 vs 내담자)이 명확**하고, 기존 **URL·북마크가 그대로 유효**.
- 대신 메뉴 항목이 두 개로 남고, 레이아웃·KPI·모달 등 공통화는 별도 리팩터링으로만 진행 가능.

### 3.4 권장안

**통합 추천.**

이유: "사용자 관리"라는 한 도메인 아래 상담사·내담자를 두 개의 독립 메뉴로 두기보다, **단일 진입점 + 타입 전환**으로 묶으면 UX와 메뉴 구조가 단순해지고, 공통 컴포넌트·API 패턴을 한 페이지에서 재사용할 수 있어 장기 유지보수에 유리하다. 탭/상태 복잡도는 Phase 2·3에서 "상단 타입 전환 + 타입별 하위 탭" 구조로 명확히 나누면 완화 가능하고, 기존 URL은 Phase 1에서 리다이렉트로 처리하면 된다.

---

## 4. 통합 시 실행 계획

(아래는 **통합을 추천하는 경우**의 상세 실행 계획이다.)

### Phase 1: 라우트·메뉴 통합

- **목표**: 단일 진입점 제공, 메뉴 1개로 통합, 기존 URL 리다이렉트.
- **수정·추가 대상**
  - `App.js`: 통합 라우트 추가 (예: `/admin/user-management` 또는 `/admin/members`), 기존 `/admin/consultant-comprehensive`, `/admin/client-comprehensive` → 통합 URL로 리다이렉트(쿼리 `?type=consultant` / `?type=client` 유지 권장).
  - `menu.js`: "사용자 관리" 그룹 내 "상담사 관리", "내담자 관리" 두 항목을 하나(예: "사용자 관리" 또는 "회원 관리")로 통합, 링크를 통합 URL로 변경.
  - `adminRoutes.js`: 통합 경로 및 리다이렉트 반영.

### Phase 2: 통합 페이지 컴포넌트

- **목표**: 상담사/내담자 전환용 상단 탭 또는 `type=consultant|client` 반영, ContentHeader·KPI·검색 공통화.
- **수정·추가 대상**
  - 새 페이지 컴포넌트 (예: `UserManagementPage.js` 또는 `UnifiedUserManagement.js`): URL 쿼리 `type` 또는 상단 pill 탭으로 타입 전환, 공통 `ContentHeader`, KPI 영역, `SearchInput` 배치.
  - 필요 시 `ContentHeader`, KPI 표시용 공통 컴포넌트/훅 정리.

### Phase 3: 기존 페이지를 통합 페이지의 탭/모드로 이전

- **목표**: `ConsultantComprehensiveManagement`, `ClientComprehensiveManagement`를 통합 페이지의 탭/모드 콘텐츠로 이전(리팩터링), ProfileCard·모달 재사용.
- **수정·추가 대상**
  - `ConsultantComprehensiveManagement.js`: 통합 페이지에서 "상담사" 모드일 때만 렌더하는 자식 컴포넌트로 역할 조정(필요 시 컴포넌트 분리).
  - `ClientComprehensiveManagement.js` 및 하위 탭 4개·`ClientModal`: "내담자" 모드일 때만 렌더하는 자식으로 이전, `ProfileCard.css`·공통 모달 계속 재사용.
  - 통합 페이지에서 타입별로 위 컴포넌트를 조건부 렌더링.

### Phase 4: 대시보드·위젯·adminRoutes 링크 업데이트 및 테스트

- **목표**: 모든 진입점을 통합 URL로 맞추고, 회귀 테스트 수행.
- **수정·추가 대상**
  - 대시보드 링크: 상담사/내담자 관리로 연결되는 카드·링크를 `/admin/user-management?type=consultant` 등으로 변경.
  - 위젯: 동일하게 통합 URL + `type` 쿼리로 수정.
  - `adminRoutes.js`: 최종 경로·리다이렉트 확인.
  - 테스트: 메뉴 클릭, 기존 URL 접근 시 리다이렉트, 타입 전환, KPI·검색·모달 동작 확인.

---

## 5. 결론·다음 단계

| 항목 | 내용 |
|------|------|
| **회의 결론** | 상담사·내담자 관리는 **통합** 진행을 권장한다. 단일 진입점 + 타입 전환으로 UX·메뉴 단순화와 공통 코드 재사용을 얻고, 기존 URL은 리다이렉트로 보존한다. |
| **다음 액션** | ① **스펙·UI 설계**: core-designer(또는 디자인 담당)가 통합 페이지 레이아웃·상단 탭·타입 전환 UX 스펙 정리. ② **구현**: core-coder가 Phase 1→2→3→4 순으로 라우트·메뉴·통합 페이지·기존 컴포넌트 이전·링크 수정 및 테스트 진행. ③ 필요 시 이 문서를 `docs/planning/` 또는 `docs/project-management/`에서 참조하여 진행 상황·변경 사항을 반영. |

---

*작성: 서브에이전트 회의 결과 | 문서 위치: `docs/planning/CONSULTANT_CLIENT_UNIFIED_MANAGEMENT_REVIEW.md`*
