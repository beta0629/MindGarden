---
name: core-solution-frontend
description: Core Solution(MindGarden) 프론트엔드 React/JS/TS 코딩 시 적용할 룰. StandardizedApi 사용, 디자인 토큰, 상수화, 컴포넌트 구조.
---

# Core Solution 프론트엔드 룰

React/JavaScript/TypeScript 코드를 작성·수정할 때 이 스킬을 적용하세요.

## 서브에이전트 활용

- **프론트엔드 코드 수정**: 반드시 `core-coder` 서브에이전트를 호출하여 작업한다. 직접 수정하지 않는다.
- **UI/비주얼 변경이 큰 경우**: `core-designer`로 시안·스펙을 먼저 정의한 뒤, `core-coder`가 구현한다.
- **레이아웃·헤더·스케줄·모달** 등 B0KlA 적용 수정 시에도 `core-coder` + 해당 스킬 적용.

### 모달

- **UnifiedModal 사용**: 새 모달은 `frontend/src/components/common/modals/UnifiedModal.js` 사용. `size` prop으로 small/medium/large/fullscreen 지정.
- MgModal, mg-v2-ad-modal, BaseModal, ErpModal 등 사용 금지.
- 참조: `/core-solution-unified-modal` 스킬, `docs/standards/MODAL_STANDARD.md`

## When to Use

- `frontend/**`, `frontend-ops/**`, `frontend-trinity/**` 등 프론트엔드 소스 수정·추가
- 컴포넌트, API 호출, 스타일, 상수 정의 작업

## Rules (필수 준수)

### API 호출

- **모든 API 호출은 `StandardizedApi` 사용**. `utils/standardizedApi.js` import
- `ajax.js`의 `apiGet`/`apiPost` 등 직접 호출 금지 (표준 위반)
- 엔드포인트는 `/api/v1/`로 시작. tenantId 수동 설정 금지 (StandardizedApi가 자동 처리)

```javascript
// ✅
import StandardizedApi from '../../utils/standardizedApi';
const data = await StandardizedApi.get('/api/v1/...');

// ❌
import { apiGet } from '../../utils/ajax';
const data = await apiGet('/api/v1/...');
```

### 스타일·디자인

- 인라인 스타일 금지. `mg-v2-*` 등 디자인 토큰·CSS 클래스 사용
- `constants/css.js` 등에서 클래스명 상수화

### 상수화

- API URL, CSS 클래스명, 라벨, 매직 넘버는 상수로 정의 (`constants/` 등)
- 하드코딩 문자열·숫자 금지

### 페이지 수정 시 연관 요소 전체 수정

**한 페이지를 수정할 때는 메인 페이지뿐 아니라 연관된 모든 부수 요소를 찾아 함께 수정**합니다.

- **모달**: 해당 페이지에서 열리는 모달(생성·수정·상세·확인·환불 등) — 디자인·아이콘·버튼 스타일 통일
- **버튼**: 메인/보조/목록 내 액션 버튼 — 어드민 대시보드 표준 스타일 적용
- **연관 컴포넌트**: import되는 컴포넌트, Route·위젯으로 연결되는 카드·요소
- **절차**: import·모달·라우트 검색으로 연관 파일 파악 → 함께 수정

메인 페이지와 모달·버튼·위젯이 동일한 디자인 시스템으로 일관되게 표시되어야 합니다.

### 공통 컴포넌트 모듈화 (필수)

**버튼·배지·카드 등 공통 UI는 반드시 `common/` 모듈을 사용한다. 새로 만들지 않는다.**

| 용도 | 사용할 컴포넌트 | import 경로 |
|------|----------------|-------------|
| 상태 배지 | StatusBadge | `common/StatusBadge` 또는 `common` |
| 회기 배지 | RemainingSessionsBadge | `common/RemainingSessionsBadge` |
| 버튼 | ActionButton | `common/ActionButton` |
| 카드 컨테이너 | CardContainer | `common/CardContainer` |
| 카드 액션 그룹 | CardActionGroup | `common/CardActionGroup` |

- `integrated-schedule__card-status`, `mg-v2-status-badge` 등 **컴포넌트별로 중복 정의 금지**
- 참조: `docs/project-management/COMMON_UI_ENCAPSULATION_PLAN.md`, `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md`

### 컴포넌트 (아토믹 디자인)

- **아토믹 디자인 준수**: Atoms → Molecules → Organisms → Templates → Pages 계층
- atoms/molecules/organisms 폴더 구조 또는 동등한 계층 유지
- 단일 책임. div 중첩 최대 5단계
- 시맨틱 태그 사용: `header`, `main`, `section`, `article` 등
- 표준 레이아웃: `SimpleLayout`, `DashboardLayout` 등 사용

### 네이밍·포맷

- 컴포넌트: PascalCase. 함수/변수: camelCase. 상수: UPPER_SNAKE_CASE
- 들여쓰기 2칸, 세미콜론 사용, 문자열 작은따옴표 우선

## Reference

- 전체 규칙: `docs/standards/FRONTEND_DEVELOPMENT_STANDARD.md`, `docs/standards/API_CALL_STANDARD.md`, `docs/standards/COMPONENT_STRUCTURE_STANDARD.md`
- **공통 모듈 우선**: `/core-solution-common-modules` 스킬, `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` — 새 기능·UI 구현 시 공통 모듈 검토 필수
- 아토믹 디자인: `/core-solution-atomic-design` 스킬, `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- 디자인·소스 표준화: `/core-solution-standardization`, `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
