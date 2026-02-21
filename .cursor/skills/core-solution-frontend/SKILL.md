---
name: core-solution-frontend
description: Core Solution(MindGarden) 프론트엔드 React/JS/TS 코딩 시 적용할 룰. StandardizedApi 사용, 디자인 토큰, 상수화, 컴포넌트 구조.
---

# Core Solution 프론트엔드 룰

React/JavaScript/TypeScript 코드를 작성·수정할 때 이 스킬을 적용하세요.

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
- 아토믹 디자인: `/core-solution-atomic-design` 스킬, `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`
- 디자인·소스 표준화: `/core-solution-standardization`, `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`
