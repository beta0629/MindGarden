---
name: core-solution-publisher
description: 퍼블리셔(core-publisher) HTML 마크업 표준. 아토믹 디자인·BEM·시맨틱 HTML 기반 일관된 마크업 규칙. core-designer 스펙을 HTML로 변환할 때 적용.
---

# Core Solution Publisher — HTML 마크업 표준

core-publisher가 **core-designer 스펙**을 바탕으로 **일관된 HTML**을 작성할 때 적용하는 규칙입니다.  
core-coder는 이 HTML을 기반으로 JSX·React·스타일을 연결합니다.

## 워크플로우

```
core-planner (기획)
    ↓
core-designer (디자인 스펙·토큰·클래스명)
    ↓
core-publisher (HTML 마크업) ← 이 스킬 적용
    ↓
core-coder (JSX·컴포넌트화·로직·CSS)
```

## 1. 입력 산출물 (core-designer)

퍼블리셔는 다음을 입력으로 받습니다.

- **디자인 스펙 문서**: `docs/design-system/v2/*.md`, `docs/project-management/*_PLAN.md` 등
- **필수 포함**: 레이아웃 구조, 사용 클래스명(`mg-v2-*` 등), 토큰(`var(--mg-*)`)
- **참조**: `PENCIL_DESIGN_GUIDE.md`, `unified-design-tokens.css`, `AdminDashboardB0KlA.css`

## 2. HTML 마크업 규칙

### 2.1 시맨틱 태그 우선

| 용도 | 사용 태그 | 비고 |
|------|-----------|------|
| 페이지 헤더 | `<header>` | 제목·브레드크럼·액션 |
| 메인 콘텐츠 | `<main>` | 본문 영역 |
| 독립 섹션 | `<section>`, `<article>` | 레이블 가능 시 `aria-labelledby` |
| 사이드바 | `<aside>` | 보조 콘텐츠 |
| 내비게이션 | `<nav>` | 메뉴·탭 |
| 리스트 | `<ul>`, `<ol>`, `<li>` | 정렬·카드 목록 |
| 폼 | `<form>`, `<fieldset>`, `<legend>`, `<label>` | 라벨은 `for` 연결 |
| 테이블 | `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` | 데이터 표 |

- **div 사용**: 시맨틱 태그로 대체 불가한 레이아웃·스타일용 래퍼에 한해 사용
- **div 중첩**: 최대 5단계. 6단계 이상이면 구조 재검토

### 2.2 BEM·클래스 네이밍

- **베이스**: `mg-v2-*` (프로젝트 공통), `mg-v2-ad-b0kla__*` (B0KlA 어드민)
- **블록**: `integrated-schedule__card`, `mg-v2-mapping-card`
- **요소**: `integrated-schedule__card-body`, `mg-v2-mapping-card__title`
- **모디파이어**: `integrated-schedule__card--selected`, `mg-v2-button-primary`

디자인 스펙에 명시된 클래스명을 **그대로** 사용합니다. 임의로 새 클래스를 만들지 않습니다.

### 2.3 아토믹 계층 반영

| 계층 | 마크업 예 |
|------|-----------|
| Atoms | `<button class="mg-v2-button mg-v2-button-primary">`, `<span class="mg-v2-badge">` |
| Molecules | `<div class="mg-v2-form-group">` + label + input |
| Organisms | `<section class="integrated-schedule__sidebar">` + filter + list |
| Template | `<header>` + `<main>` + `<aside>` 구조 |

### 2.4 접근성

- 버튼·링크: `aria-label`(아이콘만 있을 때)
- 필드셋: `legend` 숨김 시 `class="sr-only"` 또는 `aria-label`
- 모달·드롭다운: `role`, `aria-*` 디자인 스펙에 있으면 그대로 반영

## 3. 산출물 형식

### 3.1 HTML만 출력

- `<html>`, `<head>`, `<body>` 불필요 시 **해당 영역 HTML 조각**만 출력
- 주석으로 섹션 구분: `<!-- 섹션: 매칭 목록 카드 -->`

### 3.2 JSX 호환 (선택)

React 프로젝트이므로, 필요 시 **JSX 형식**으로 마크업을 작성할 수 있음.  
`class` → `className`, `for` → `htmlFor` 등 JSX 규칙 적용.  
**로직·이벤트·상태는 작성하지 않음.**

### 3.3 예시

```html
<!-- Organism: 통합 스케줄 카드 -->
<li class="integrated-schedule__card" data-mapping-id="">
  <div class="integrated-schedule__card-body">
    <div class="integrated-schedule__card-parties">
      <span class="integrated-schedule__card-consultant">상담사명</span>
      <span class="integrated-schedule__card-arrow">→</span>
      <span class="integrated-schedule__card-client">내담자명</span>
    </div>
    <div class="integrated-schedule__card-meta">
      <span class="integrated-schedule__card-status">활성</span>
      <span class="integrated-schedule__card-remaining">1회 남음</span>
    </div>
  </div>
  <div class="integrated-schedule__card-actions">
    <button type="button" class="mg-v2-button mg-v2-button-primary">스케줄 등록</button>
  </div>
</li>
```

## 4. 금지 사항

- **인라인 스타일**: `style="..."` 사용 금지. 클래스만 사용
- **새 클래스 임의 생성**: 디자인 스펙에 없는 클래스는 만들지 않음
- **JS·이벤트**: `onclick`, `onChange` 등 작성 금지
- **CSS 파일 수정**: 퍼블리셔는 HTML만 작성. CSS는 core-coder 담당

## 5. 체크리스트 (퍼블리싱 완료 전)

- [ ] 디자인 스펙의 클래스명을 그대로 반영했는가?
- [ ] 시맨틱 태그를 우선 사용했는가?
- [ ] div 중첩이 5단계 이내인가?
- [ ] `aria-label`, `label` for 등 접근성을 반영했는가?
- [ ] 인라인 스타일·임의 클래스가 없는가?
- [ ] core-coder가 그대로 JSX로 옮겨 쓸 수 있는가?

## 6. 참조 문서

- `docs/standards/COMPONENT_STRUCTURE_STANDARD.md` — div 중첩·시맨틱
- `.cursor/skills/core-solution-atomic-design/SKILL.md` — Atoms → Pages
- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — B0KlA·토큰
- `frontend/src/styles/unified-design-tokens.css` — 클래스명 참고
