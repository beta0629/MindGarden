# 계좌 관리 (Account Management) 화면 설계서

**문서 정보**
- 대상 화면: Commercial P2 G2-07 (계좌 관리)
- 경로: `/admin/accounts`
- 작성 주체: core-designer
- 참조 기준: `docs/project-management/2026-06-30/ADMIN_COMMERCIAL_UX_PER_PAGE_ANALYSIS.md` § G2-07

## 1. 개요 및 화면 목적
재무 담당자가 등록된 계좌번호, 잔액, 연동 상태를 신속하게(3초 이내) 스캔하고 관리할 수 있는 화면입니다. 
숫자와 계좌 정보의 명확한 비교를 위해 `Table Comfortable`을 기본(default) 뷰로 사용하며, 행 액션은 SSOT(`EntityRowActions`)를 활용해 일관되게 제공합니다.

## 2. 레이아웃 구조 (`AdminCommonLayout` 기반)

- **전체 감싸기**: `AdminCommonLayout` 사용 (사이드바, 탑바 자동 적용)
- **메인 영역**: `mg-v2-ad-b0kla__container` 내부 `ContentArea`
- **상단 바**: 
  - `ContentHeader` 사용
  - 타이틀: "계좌 관리"
  - 서브타이틀: "정산·입금 안내에 사용할 계좌를 등록·관리합니다."
  - 우측 액션: `[ + 계좌 등록 ]` (Primary 버튼)
- **섹션 블록**: 
  - `mg-v2-ad-b0kla__card` 적용
  - 섹션 타이틀: "등록된 계좌 목록" (좌측 악센트 바 `mg-v2-ad-b0kla__section-title` 적용)
  - 목록 컴포넌트: `ListTableView` (native table 대체)

## 3. UI 컴포넌트 상세 스펙

### 3.1. 테이블 영역 (`ListTableView`)
- **형태**: 편안한 간격(Comfortable)의 ListTableView. page-specific 컴팩트 뷰나 별도 카드 형태 UI로 전환하는 분기/옵션은 제공하지 않습니다. (Card fallback 없음)
- **컬럼 구성**:
  1. 기본(Primary) 뱃지: 기본 계좌 여부 (배지 컴포넌트)
  2. 은행명: 은행 아이콘 + 은행명 (예: 신한은행)
  3. 계좌번호: `toDisplayString` 등을 거친 안전한 텍스트로 표시
  4. 예금주: 마스킹 정책이 있다면 적용된 상태
  5. 설명(Description): 메모용
  6. 활성 상태: `safeDisplay` 적용된 활성/비활성 뱃지
  7. 액션(Actions): 우측 정렬

### 3.2. 행 단위 액션 (`EntityRowActions` SSOT)
행 단위 작업 버튼은 인라인으로 길게 나열하지 않고 아래 정책을 따릅니다.
- **Primary Action (1개)**: `[수정/상세]` (인라인 아이콘+텍스트 버튼)
- **Overflow Menu (더보기, ⋯)**:
  - `기본 계좌로 설정`
  - `활성 상태 변경`
  - `삭제` (Danger 색상, 최하단 배치)

### 3.3. 상태별 표시 경계 (`safeDisplay`)
- **React #130 방어**: `API`에서 받아오는 필드 원본(객체)을 JSX에 바로 노출하지 않습니다.
- 모든 텍스트/수치 렌더링 시 `frontend/src/utils/safeDisplay.js`의 `toDisplayString` 적용을 강제합니다. (코더 DoD)

## 4. 와이어프레임 (1280px / 768px)

```text
[1280px 이상 (PC)]
┌──────────────────────────────────────────────────────────────────────────────┐
│ AdminCommonLayout                                                            │
├──────────────────┬───────────────────────────────────────────────────────────┤
│ SIDEBAR (260px)  │ 브레드크럼 > 계좌 관리                                    │
│ [다크 배경]       │ 계좌 관리                              [ + 계좌 등록 ] │
│                  ├───────────────────────────────────────────────────────────┤
│                  │ ┌───────────────────────────────────────────────────────┐ │
│                  │ │ ▌ 등록된 계좌 목록                                    │ │
│                  │ │                                                       │ │
│                  │ │ [ListTableView]                                       │ │
│                  │ │ 기본   | 은행    | 계좌번호     | 예금주 | 상태  | 액션│ │
│                  │ │ ───────────────────────────────────────────────────── │ │
│                  │ │ [기본] | 신한은행| 110-123-***  | 주식*  | [활성]| [수정] ⋯ │
│                  │ │        | 우리은행| 1002-123-*** | 주식*  | [휴면]| [수정] ⋯ │
│                  │ └───────────────────────────────────────────────────────┘ │
│                  │                                                           │
└──────────────────┴───────────────────────────────────────────────────────────┘

[768px (태블릿/수직배치)]
동일한 ListTableView 컴포넌트의 반응형 속성을 상속받아 자연스럽게 스크롤 혹은 축소 렌더링.
별도 모바일 전용 "Card UI" 분기를 신설하지 않음 (SSOT 강제).
```

## 5. Must Not (금지 사항)
1. **카드형 UI 신설 금지**: "모바일을 위한다"는 명분으로 `ProfileCard`나 커스텀 카드 컴포넌트를 이 화면에 이중 분기하여 적용하지 마십시오.
2. **다중 인라인 버튼 금지**: 수정, 삭제, 기본설정 등을 행 안에 버튼 3~4개로 줄줄이 늘어놓지 마십시오.
3. **Ajax/Raw Fetch 레거시 유지 금지**: `fetch` API 원본을 바로 사용하는 코드를 남겨두지 말고 `StandardizedApi` 사용 구조로 개편해야 합니다.
4. **로컬 CSS 파일로 레이아웃 강제 금지**: 간격 및 색상 토큰은 `var(--mg-*)` 또는 `mg-v2-ad-b0kla__*` 클래스를 사용하십시오.

## 6. Coder DoD (완료 조건 체크리스트)
개발 단계(`core-coder`)에서 반드시 확인해야 할 항목입니다.

- [ ] `AccountManagement.js`의 레이아웃이 `AdminCommonLayout`, `ContentArea`, `ContentHeader` 조합으로 일관되게 래핑되었는가?
- [ ] 데이터 테이블 렌더링이 HTML `<table native>`가 아닌 공통 `ListTableView`로 치환되었는가?
- [ ] 행당 버튼이 `EntityRowActions` 공통 모듈을 사용하여 1 Primary + Overflow 구조로 변경되었는가?
- [ ] API 호출이 `ACCOUNT_API_ENDPOINTS.BASE`를 통한 `fetch` 생코드가 아닌 `StandardizedApi` 패턴으로 전환되었는가? (tenantId 명시)
- [ ] 테이블 셀 내 모든 텍스트/숫자 렌더링에 `safeDisplay.js` 로직(예: `toDisplayString`)이 방어적으로 적용되었는가? (React #130 예방)
- [ ] 섹션 배경, 보더 등 컴포넌트 스타일에 `unified-design-tokens.css`의 `var(--mg-*)` 계열 변수가 올바르게 적용되었는가?