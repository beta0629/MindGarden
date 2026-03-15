# 관리자 대시보드 지표 영역 마크업 스펙 (옵션 A — 파이프라인 유지·개선)

**버전**: 1.0  
**상태**: 퍼블리싱 가이드 (HTML 마크업 전용)  
**참조**: `ADMIN_DASHBOARD_METRICS_VISUALIZATION_SPEC.md`, `COMMON_UI_IMPLEMENTATION_SPEC.md`, `.cursor/skills/core-solution-publisher/SKILL.md`  
**역할**: core-publisher 산출 → core-coder가 JSX/스타일 연동

---

## 1. 개요

- **옵션 A**: CoreFlowPipeline(5단계) + PipelineStepCard + ContentCard 구조 유지, 비주얼·레이아웃·접근성만 개선.
- **산출물**: 아토믹 디자인 기반 HTML 조각 및 계층 설명. **마크업만** 정의하며, JS/React·CSS 파일 작성은 하지 않음.

---

## 2. 아토믹 계층 정의

### 2.1 Atoms (원자)

| Atom | 설명 | 클래스 | 비고 |
|------|------|--------|------|
| **지표 배지 (숫자+라벨)** | 단계별 건수/상태 표시 (예: "5건", "매칭됨") | `pipeline-step-badge`, `pipeline-step-badge--{variant}` | value + label, variant: success \| warning \| info \| neutral \| auto |
| **아이콘 래퍼** | 단계 카드 내 아이콘 감싸기 | `pipeline-step-card__icon` | B0KlA 톤 유지 시 `mg-v2-ad-b0kla__step-icon` 병행 가능 |

- 배지에 공통 배지를 쓸 수 있는 경우: 상태 의미가 있으면 `mg-v2-status-badge`, `mg-v2-badge--success` 등(`COMMON_UI_IMPLEMENTATION_SPEC`) 사용. **지표 숫자+라벨**은 기존 `pipeline-step-badge` 유지.

### 2.2 Molecules (분자)

| Molecule | 설명 | 구성 |
|----------|------|------|
| **단일 지표 카드 (PipelineStepCard)** | 제목 + 배지(숫자+라벨) + 아이콘 래퍼 | `pipeline-step-card` + `__icon` + `__content`(제목 + 배지) |

### 2.3 Organisms (유기체)

| Organism | 설명 | 구성 |
|----------|------|------|
| **5단계 파이프라인 영역** | 카드 그룹 + 단계 간 커넥터 | `core-flow-pipeline` > `core-flow-pipeline__steps`(스크롤 영역) 내 StepCard + connector |
| **ContentCard 래퍼** | 지표 영역 전체를 하나의 카드로 감쌈 | `mg-v2-content-card` (이중 카드 제거 시 1개만 사용) |

---

## 3. 레이아웃 개선 — 이중 카드 제거

- **현재**: `mg-v2-ad-b0kla__card` > `CoreFlowPipeline` → 파이프라인이 별도 카드처럼 보임.
- **개선**: 파이프라인 영역이 **ContentCard와 시각적으로 하나**로 보이도록, **외곽에만** 카드 래퍼 1개.
  - **스크롤**: `overflow-x: auto`(및 `-webkit-overflow-scrolling: touch`)는 **스크롤 가능한 영역**(`core-flow-pipeline__steps`)에만 적용.
  - **상위 컨테이너**: `overflow: visible` 유지(스크롤 영역 제외).

제안 구조:

```
[래퍼 1개 — 카드 비주얼]
  section 또는 div.mg-v2-content-card  (또는 mg-v2-ad-b0kla__card 단일 사용 시)
    [파이프라인 섹션 — 내부 카드 없음]
    section.core-flow-pipeline.mg-v2-ad-b0kla  (선택) aria-label="…"
      div.core-flow-pipeline__steps  (여기만 overflow-x: auto)
        article.pipeline-step-card ...
        div.core-flow-pipeline__connector  aria-hidden
        ...
```

- 파이프라인 **내부**에는 `mg-v2-ad-b0kla__card` 같은 추가 카드 래퍼를 두지 않음.

---

## 4. 접근성

- **섹션**: 파이프라인 최상위에 `aria-label` (예: `"5단계 핵심 파이프라인"`).
- **스크롤 영역**: `core-flow-pipeline__steps`에 `role="region"`, `aria-label="파이프라인 단계 목록, 가로 스크롤 가능"` (또는 동일 의미의 한글).
- **커넥터**: 장식용이면 `aria-hidden="true"`.
- **단계 카드 제목**: `h3` 등 제목 계층 유지(이미 `pipeline-step-card__title`).

---

## 5. HTML 마크업 조각

### 5.1 Atom — 지표 배지 (숫자+라벨)

```html
<!-- Atom: 파이프라인 단계 배지 (숫자 + 라벨) -->
<span class="pipeline-step-badge pipeline-step-badge--success" aria-label="5건 매칭됨">
  <span class="pipeline-step-badge__value">5건</span>
  <span class="pipeline-step-badge__label">매칭됨</span>
</span>
```

- variant: `pipeline-step-badge--success` | `--warning` | `--info` | `--neutral` | `--auto`

### 5.2 Atom — 아이콘 래퍼

```html
<!-- Atom: 단계 아이콘 래퍼 -->
<div class="pipeline-step-card__icon" aria-hidden="true">
  <!-- Lucide 등 아이콘 컴포넌트 삽입 위치 (퍼블은 비움) -->
</div>
```

### 5.3 Molecule — 단일 지표 카드 (PipelineStepCard)

```html
<!-- Molecule: 파이프라인 단계 카드 1개 -->
<article class="pipeline-step-card pipeline-step-card--success">
  <div class="pipeline-step-card__icon" aria-hidden="true">
    <!-- 아이콘 -->
  </div>
  <div class="pipeline-step-card__content">
    <h3 class="pipeline-step-card__title">내담자/상담사 매칭 (관리자)</h3>
    <span class="pipeline-step-badge pipeline-step-badge--success" aria-label="5건 매칭됨">
      <span class="pipeline-step-badge__value">5건</span>
      <span class="pipeline-step-badge__label">매칭됨</span>
    </span>
  </div>
</article>
```

### 5.4 Organism — 5단계 파이프라인 + ContentCard 계층 (이중 카드 제거 반영)

```html
<!-- Organism: 지표 영역 래퍼 (ContentCard 1개 — 이중 카드 제거) -->
<section class="mg-v2-content-card mg-v2-ad-b0kla__metrics-block" aria-labelledby="pipeline-heading">
  <h2 id="pipeline-heading" class="mg-v2-ad-b0kla__section-title">핵심 흐름</h2>

  <!-- 5단계 파이프라인 (내부 카드 없음, 스크롤만 steps에) -->
  <section class="core-flow-pipeline" aria-label="5단계 핵심 파이프라인">
    <div
      class="core-flow-pipeline__steps"
      role="region"
      aria-label="파이프라인 단계 목록, 가로 스크롤 가능"
    >
      <!-- Step 1 -->
      <article class="pipeline-step-card pipeline-step-card--success">
        <div class="pipeline-step-card__icon" aria-hidden="true"><!-- 아이콘 --></div>
        <div class="pipeline-step-card__content">
          <h3 class="pipeline-step-card__title">내담자/상담사 매칭 (관리자)</h3>
          <span class="pipeline-step-badge pipeline-step-badge--success" aria-label="5건 매칭됨">
            <span class="pipeline-step-badge__value">5건</span>
            <span class="pipeline-step-badge__label">매칭됨</span>
          </span>
        </div>
      </article>

      <div class="core-flow-pipeline__connector" aria-hidden="true"></div>

      <!-- Step 2 -->
      <article class="pipeline-step-card pipeline-step-card--warning">
        <div class="pipeline-step-card__icon" aria-hidden="true"><!-- 아이콘 --></div>
        <div class="pipeline-step-card__content">
          <h3 class="pipeline-step-card__title">입금 확인 (ERP 연동)</h3>
          <span class="pipeline-step-badge pipeline-step-badge--warning" aria-label="2건 대기중">
            <span class="pipeline-step-badge__value">2건</span>
            <span class="pipeline-step-badge__label">대기중</span>
          </span>
        </div>
      </article>

      <div class="core-flow-pipeline__connector" aria-hidden="true"></div>

      <!-- Step 3 -->
      <article class="pipeline-step-card pipeline-step-card--success">
        <div class="pipeline-step-card__icon" aria-hidden="true"><!-- 아이콘 --></div>
        <div class="pipeline-step-card__content">
          <h3 class="pipeline-step-card__title">회기(세션) 권한 부여</h3>
          <span class="pipeline-step-badge pipeline-step-badge--success" aria-label="3건 부여됨">
            <span class="pipeline-step-badge__value">3건</span>
            <span class="pipeline-step-badge__label">부여됨</span>
          </span>
        </div>
      </article>

      <div class="core-flow-pipeline__connector" aria-hidden="true"></div>

      <!-- Step 4 -->
      <article class="pipeline-step-card pipeline-step-card--info">
        <div class="pipeline-step-card__icon" aria-hidden="true"><!-- 아이콘 --></div>
        <div class="pipeline-step-card__content">
          <h3 class="pipeline-step-card__title">스케줄 등록 (관리자 전담)</h3>
          <span class="pipeline-step-badge pipeline-step-badge--info" aria-label="0건 의견수렴중">
            <span class="pipeline-step-badge__value">0건</span>
            <span class="pipeline-step-badge__label">의견수렴중</span>
          </span>
        </div>
      </article>

      <div class="core-flow-pipeline__connector" aria-hidden="true"></div>

      <!-- Step 5 -->
      <article class="pipeline-step-card pipeline-step-card--auto">
        <div class="pipeline-step-card__icon" aria-hidden="true"><!-- 아이콘 --></div>
        <div class="pipeline-step-card__content">
          <h3 class="pipeline-step-card__title">자동 회기차감/회계처리 (ERP)</h3>
          <span class="pipeline-step-badge pipeline-step-badge--auto" aria-label="배치/일지작성 연동">
            <span class="pipeline-step-badge__value">배치/일지작성</span>
            <span class="pipeline-step-badge__label">연동</span>
          </span>
        </div>
      </article>
    </div>
  </section>
</section>
```

---

## 6. CSS 책임 (core-coder)

- **스크롤**: `core-flow-pipeline__steps`에만 `overflow-x: auto`, `-webkit-overflow-scrolling: touch` 적용.
- **상위**: 파이프라인을 감싼 `mg-v2-content-card`(또는 동일 래퍼)는 `overflow: visible`(기본) 유지.
- **카드 비주얼**: `mg-v2-content-card` 한 겹만 사용해, 파이프라인이 ContentCard와 한 덩어리로 보이도록 함.

---

## 7. 클래스명 정리 (B0KlA 유지)

| 용도 | 클래스 |
|------|--------|
| 지표 영역 외곽 카드 1개 | `mg-v2-content-card`, 필요 시 `mg-v2-ad-b0kla__metrics-block` |
| 섹션 제목 (선택) | `mg-v2-ad-b0kla__section-title` |
| 파이프라인 섹션 | `core-flow-pipeline` |
| 스크롤 가능 단계 컨테이너 | `core-flow-pipeline__steps` |
| 단계 카드 | `pipeline-step-card`, `pipeline-step-card--{variant}` |
| 단계 카드 내부 | `pipeline-step-card__icon`, `pipeline-step-card__content`, `pipeline-step-card__title` |
| 단계 배지 | `pipeline-step-badge`, `pipeline-step-badge__value`, `pipeline-step-badge__label`, `pipeline-step-badge--{variant}` |
| 커넥터 | `core-flow-pipeline__connector` |

---

## 8. 체크리스트 (퍼블 완료 전)

- [ ] Atoms: 배지(숫자+라벨), 아이콘 래퍼만 정의했는가?
- [ ] Molecule: 단일 지표 카드(제목+배지+아이콘) 구조가 스펙과 일치하는가?
- [ ] Organism: 5단계 파이프라인 + ContentCard 1겹, 이중 카드 제거 반영했는가?
- [ ] 스크롤은 `core-flow-pipeline__steps`에만, 상위는 overflow visible인가?
- [ ] section `aria-label`, 스크롤 영역 `role="region"` 및 `aria-label` 적용했는가?
- [ ] JS/React·CSS 파일 작성 없이 마크업만 산출했는가?

---

**문서 버전**: 1.0  
**작성**: core-publisher (퍼블리싱 전용)
