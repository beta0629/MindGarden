# 매칭 카드 컴팩트 레이아웃 스펙

**대상**: 내담자 관리 > 매칭 탭 — 매칭 카드 (`.mg-v2-card.mg-v2-mapping-card`)  
**목표**: 카드 크기 축소, 정보 밀도·가독성 개선 (디테일·간결)  
**참조**: [어드민 대시보드 샘플](https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), `CLIENT_MAPPING_TAB_LAYOUT_SPEC.md`, `unified-design-tokens.css`, B0KlA 토큰  
**버전**: 1.0.0  
**작성**: Core Designer (디자인 전용 스펙, **코드 수정 없음** — 구현은 core-coder 담당)

---

## 1. 목표·참조

### 1.1 목표

- **크기 축소**: 매칭 카드가 한 줄에 꽉 차지 않도록(예: width 1185px, height 451px 해소) **max-width·그리드 2열·패딩/간격 축소**로 전체 높이·가로 폭을 줄인다.
- **디테일 개선**: 상담사·패키지·회기·시작일·종료일·메모를 **라벨-값 쌍**으로 정리(2열 그리드, 작은 폰트), **중요 정보(상태·회기·기간) 강조**, 메모는 **말줄임 또는 1~2줄**만 표시하여 가독성·정보 밀도를 높인다.

### 1.2 참조

| 항목 | 기준 |
|------|------|
| 디자인 시스템 | 어드민 대시보드 샘플, `mindgarden-design-system.pen`, `unified-design-tokens.css` |
| 토큰 | `--ad-b0kla-*`, `--mg-*`, `--spacing-*`, `--font-size-*` (신규 하드코딩 색/간격 금지) |
| 클래스 체계 | `mg-v2-*` 유지. 신규 시 `mg-v2-mapping-card__*` 형태로 제안 |
| 기존 스펙 | `docs/design-system/CLIENT_MAPPING_TAB_LAYOUT_SPEC.md` 3.7절 매칭 카드 구조 유지·확장 |

---

## 2. DOM/클래스 구조 (컴팩트 카드)

기존 **매칭 카드 1건** 구조를 유지하되, **본문을 라벨-값 그리드**로 바꾸고 **컴팩트 전용 서브클래스**를 추가한다. 코더는 아래 구조에 맞춰 마크업·클래스명을 적용한다.

### 2.1 카드 컨테이너

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-card mg-v2-mapping-card` | 카드 루트 | **기존 유지**. 컴팩트용 스타일은 이 선택자 또는 `.mg-v2-mapping-client-block .mg-v2-mapping-card` 스코프로 오버라이드 |
| `mg-v2-mapping-card__compact` | (선택) 컴팩트 레이아웃 플래그 | 컴팩트만 적용할 때 사용. 없으면 매칭 탭 내 카드 전역에 컴팩트 스타일 적용 가능 |

### 2.2 헤더 (기존 + 정리)

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-card-header` | 상단 한 줄 | **기존 유지** |
| `mg-v2-mapping-card__header` | 헤더 래퍼(선택) | 매칭 #id + 날짜 + 상태 배지 묶음 |
| `mg-v2-mapping-info` | 매칭 #id + 날짜 | **기존 유지** |
| `mg-v2-mapping-card__title` | "매칭 #id" 텍스트 | `mg-v2-h4` 대신 또는 함께. 컴팩트 시 폰트 크기 축소(아래 3절) |
| `mg-v2-mapping-date` | Calendar 아이콘 + 날짜 | **기존 유지**, 폰트 크기만 12px 수준 |
| `mg-v2-mapping-status` | 상태 배지 영역 | **기존 유지** |
| `mg-v2-status-badge` | 배지 | **기존 유지**, `--status-bg-color` 유지 |

### 2.3 본문 — 라벨-값 2열 그리드

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-card-content` | 본문 영역 | **기존 유지**, 패딩 축소(3절) |
| `mg-v2-mapping-details` | 라벨-값 그리드 컨테이너 | **신규 스타일**: `display: grid`, 2열, gap 작게 |
| `mg-v2-mapping-card__row` | 라벨-값 한 쌍(한 줄) | **신규 권장**. `<div class="mg-v2-mapping-card__row">` 내부에 라벨 + 값 |
| `mg-v2-mapping-card__label` | 라벨(상담사, 패키지, 회기 등) | **신규**. `mg-v2-form-label` 대체 또는 함께. 12px, `var(--ad-b0kla-text-secondary)` |
| `mg-v2-mapping-card__value` | 값 | **신규**. 13px 또는 `var(--font-size-sm)`, 본문 색. **회기·기간**은 강조(굵게 또는 색 강조) |

**라벨-값 쌍 구성 (순서·표시 권장)**  
1. 상담사  
2. 패키지 (있을 때만)  
3. 회기 (used/total, 남은 N) — **강조**  
4. 시작일  
5. 종료일 (있을 때만)  
6. 메모 (있을 때만, **말줄임 1~2줄**)

**메모 말줄임**  
- 클래스: `mg-v2-mapping-card__memo` (같은 행에 라벨 "메모", 값 영역에 적용)  
- CSS: `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;` (2줄 말줄임) 또는 1줄(`line-clamp: 1`).  
- 툴팁/상세보기에서 전체 메모 노출 권장.

### 2.4 푸터 (기존 유지)

| 클래스명 | 역할 | 비고 |
|----------|------|------|
| `mg-v2-card-footer` | 하단 버튼 영역 | **기존 유지**, 패딩만 축소(3절) |
| 버튼 | 상세보기, 수정 | **기존 유지** (Eye + 텍스트, size="small") |

### 2.5 권장 DOM 요약 (한 카드)

```
.mg-v2-card.mg-v2-mapping-card [.mg-v2-mapping-card__compact]
├── .mg-v2-card-header [.mg-v2-mapping-card__header]
│   ├── .mg-v2-mapping-info
│   │   ├── .mg-v2-mapping-card__title 또는 h4.mg-v2-h4  ("매칭 #id")
│   │   └── .mg-v2-mapping-date  (Calendar + 날짜)
│   └── .mg-v2-mapping-status
│       └── .mg-v2-status-badge
├── .mg-v2-card-content
│   └── .mg-v2-mapping-details  (grid 2열)
│       ├── .mg-v2-mapping-card__row
│       │   ├── .mg-v2-mapping-card__label  상담사
│       │   └── .mg-v2-mapping-card__value  {이름}
│       ├── .mg-v2-mapping-card__row  (패키지, 있을 때)
│       ├── .mg-v2-mapping-card__row  회기 (강조)
│       ├── .mg-v2-mapping-card__row  시작일
│       ├── .mg-v2-mapping-card__row  종료일 (있을 때)
│       └── .mg-v2-mapping-card__row  메모 (있을 때, .mg-v2-mapping-card__memo 값에 말줄임)
└── .mg-v2-card-footer
    ├── Button 상세보기
    └── Button 수정
```

---

## 3. 간격·타이포·max-width 수치

### 3.1 카드 크기·그리드

| 항목 | 값 | 비고 |
|------|-----|------|
| **그리드 레이아웃** | `mg-v2-mapping-list-block__grid`: `display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--mg-spacing-md, 1rem);` | 카드가 **2열**로 배치. 반응형 시 768px 이하에서 `1fr` 1열 권장 |
| **카드 max-width** | **520px** (또는 `min(100%, 520px)`) | 한 카드가 한 줄에 꽉 차지 않도록. 그리드 셀 안에서만 적용 시 2열 시 자연스럽게 ~50% |
| **카드 min-width** | 280px ~ 300px | 2열일 때 너무 좁아지지 않도록 (선택) |

### 3.2 카드 내부 패딩·간격

| 영역 | 속성 | 값 | 비고 |
|------|------|-----|------|
| 카드 루트 | padding | **0** (헤더/콘텐츠/푸터에만 패딩 부여) 또는 `var(--spacing-sm) var(--spacing-md)` | 기존 `mg-v2-card`의 `padding: var(--spacing-lg)` 오버라이드 |
| 헤더 | padding | `var(--spacing-xs) var(--spacing-md)` 또는 **8px 16px** | `mg-v2-card-header` 오버라이드 (매칭 탭 스코프) |
| 본문 | padding | `var(--spacing-sm) var(--spacing-md)` 또는 **12px 16px** | `mg-v2-card-content` 오버라이드 |
| 본문 그리드 | gap | `var(--spacing-xs) var(--spacing-sm)` 또는 **행 6px, 열 12px** | `.mg-v2-mapping-details` |
| 푸터 | padding | `var(--spacing-xs) var(--spacing-md)` 또는 **8px 16px** | `mg-v2-card-footer` 오버라이드 |

### 3.3 타이포그래피

| 요소 | font-size | font-weight | color | 비고 |
|------|-----------|-------------|-------|------|
| 매칭 #id (제목) | **13px** 또는 `var(--font-size-sm)` | 600 | `var(--ad-b0kla-title-color)` | 기존 h4보다 축소 |
| 날짜 (헤더) | **12px** 또는 `var(--font-size-xs)` | 400 | `var(--ad-b0kla-text-secondary)` | |
| 상태 배지 | **11px ~ 12px** | 600 | 흰색(배경은 기존 `--status-bg-color`) | |
| 라벨 (상담사, 패키지 등) | **12px** 또는 `var(--font-size-xs)` | 500 | `var(--ad-b0kla-text-secondary)` | `.mg-v2-mapping-card__label` |
| 값 (일반) | **13px** 또는 `var(--font-size-sm)` | 400 | `var(--ad-b0kla-title-color)` 또는 본문 색 | `.mg-v2-mapping-card__value` |
| 회기·기간 값 | **13px** | **600** | `var(--ad-b0kla-title-color)` | 강조 |
| 메모 값 | **12px** | 400 | 본문 색, 말줄임 2줄 | `.mg-v2-mapping-card__memo` |

### 3.4 카드 시각 (B0KlA 일관)

| 항목 | 값 | 비고 |
|------|-----|------|
| 배경 | `var(--ad-b0kla-card-bg)` 또는 `#F5F3EF` | 기존 카드 블록과 동일 |
| 테두리 | 1px solid `var(--ad-b0kla-border)` | #D4CFC8 |
| border-radius | **12px** 또는 `var(--ad-b0kla-radius-sm)` | 16px보다 약간 작게 해도 됨 |
| 헤더 하단선 | 1px solid `var(--ad-b0kla-border)` | |
| 푸터 상단선 | 1px solid `var(--ad-b0kla-border)` | |

### 3.5 반응형

| 브레이크포인트 | 동작 |
|----------------|------|
| **≤ 768px** | `mg-v2-mapping-list-block__grid`: `grid-template-columns: 1fr` (1열) |
| **> 768px** | 2열 유지, 카드 max-width 520px 또는 그리드 셀에 맞춤 |

---

## 4. 체크리스트 (구현 후 검증)

- [ ] 매칭 탭 내 매칭 카드가 **한 줄에 2개(2열)** 로 배치되고, 카드 가로 폭이 **1185px 전체를 쓰지 않는다** (max-width 또는 그리드로 제한).
- [ ] 카드 **높이**가 이전보다 **축소**되어 있고(패딩·폰트·행 간격 축소), **정보는 빠짐없이** 표시된다.
- [ ] **헤더**: 매칭 #id, 날짜(아이콘), 상태 배지가 한 줄에 정리되고, **폰트 크기**는 13px/12px 수준이다.
- [ ] **본문**: 상담사·패키지·회기·시작일·종료일·메모가 **라벨-값 쌍**으로 표시되고, **2열 그리드**로 배치되어 있다(한 행에 라벨 | 값 또는 2열 그리드로 여러 쌍).
- [ ] **회기**(used/total, 남은 N)와 **기간**(시작일·종료일)이 **굵게 또는 색**으로 강조되어 있다.
- [ ] **메모**는 **1~2줄 말줄임**이며, 필요 시 툴팁/상세보기에서 전체 내용을 볼 수 있다.
- [ ] **푸터**에 상세보기·수정 버튼이 있고, 버튼 크기·패딩이 **작게(small)** 유지된다.
- [ ] 색상·테두리·radius는 **`--ad-b0kla-*`·`unified-design-tokens`** 만 사용하며, 어드민 대시보드 샘플·매칭 탭 블록과 **시각적 톤이 일치**한다.
- [ ] **클래스명**은 `mg-v2-*`, 서브는 `mg-v2-mapping-card__*` 형태를 유지한다.
- [ ] **768px 이하**에서 카드가 **1열**로 전환되는지 확인한다.

---

## 5. 참고 파일 (구현 시)

- **컴포넌트**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientMappingTab.js`
- **스타일**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientMappingTab.css`
- **레이아웃 스펙**: `docs/design-system/CLIENT_MAPPING_TAB_LAYOUT_SPEC.md`
- **토큰**: `frontend/src/styles/unified-design-tokens.css`, `frontend/src/styles/dashboard-tokens-extension.css` (ad-b0kla)
- **디자인 기준**: `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`, [어드민 대시보드 샘플](https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)

이 스펙은 **디자인 전용**이며, 실제 코드 수정은 **core-coder**가 수행한다.
