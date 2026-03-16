# 급여·세금 고도화 — HTML 마크업 스펙

**작성일**: 2026-03-16  
**목적**: 급여·세금 고도화 시 적용할 블록 단위 HTML 마크업. core-coder가 JSX로 변환·연동할 수 있도록 클래스명·구조만 제공.  
**참조**: `SALARY_TAX_VERIFICATION_MEETING_RESULT.md`, `SalaryManagement.js`, `TaxManagement.js`, B0KlA(`mg-v2-ad-b0kla__*`), `COMMON_UI_IMPLEMENTATION_SPEC.md`, core-solution-publisher

---

## 1. 적용 규칙 요약

| 항목 | 규칙 |
|------|------|
| BEM | `mg-v2-ad-b0kla__card`, `mg-v2-ad-b0kla__section-title`, `mg-v2-ad-b0kla__admin-grid` 등 기존 어드민 패턴 |
| 블록 접두어 | 급여: `salary-*-block`, `salary-*-block__*` / 세금: `salary-tax-block`, `salary-tax-block__*` (페이지 통일 후 세무도 동일 네임스페이스) |
| 공통 UI | `mg-v2-status-badge`, `mg-v2-badge--*`, `mg-v2-button`, `mg-v2-button--primary` 등 common 모듈 클래스만 사용 |
| 시맨틱 | `section`, `header`, `nav`, `table`, `form`, `fieldset`, `legend`, `label` 우선 |
| 접근성 | `aria-labelledby`, `aria-label`, `role="tablist"` 등 디자인 스펙 반영 |

---

## 2. 급여 관리 페이지 블록

### 2.1 페이지 래퍼·헤더 (ContentHeader / ContentArea는 기존 유지)

```html
<!-- ContentArea 내부: B0KlA 컨텍스트 -->
<main class="mg-v2-ad-b0kla salary-management__main" aria-label="급여 관리 콘텐츠">
```

### 2.2 계산 대상 선택 (기간·상담사·급여지급일·계산하기)

```html
<!-- 섹션: 계산 대상 선택 -->
<section class="mg-v2-ad-b0kla__card salary-filter-block" aria-labelledby="salary-filter-title">
  <h2 id="salary-filter-title" class="mg-v2-ad-b0kla__section-title salary-filter-block__title">
    <span class="salary-filter-block__accent" aria-hidden></span>
    계산 대상 선택
  </h2>
  <div class="salary-filter-block__group">
    <div class="salary-filter-block__field">
      <label for="salary-period" class="mg-v2-form-label">기간</label>
      <select id="salary-period" class="mg-v2-select" aria-label="기간 선택">
        <option value="">기간 선택</option>
        <!-- 옵션: value="YYYY-MM", label="YYYY년 MM월" -->
      </select>
    </div>
    <div class="salary-filter-block__field salary-filter-block__period-display" role="status">
      <span class="mg-v2-form-label">실제 계산 기간</span>
      <span class="salary-filter-block__period-text"><!-- periodStart ~ periodEnd (기산일 기준) --></span>
    </div>
    <div class="salary-filter-block__field">
      <label for="salary-consultant" class="mg-v2-form-label">상담사</label>
      <select id="salary-consultant" class="mg-v2-select" aria-label="상담사 선택">
        <option value="">상담사 선택</option>
        <!-- 옵션: value=consultant.id, label=consultant.name -->
      </select>
    </div>
    <div class="salary-filter-block__field">
      <label for="salary-payday" class="mg-v2-form-label">급여 지급일</label>
      <select id="salary-payday" class="mg-v2-select" aria-label="급여 지급일 선택">
        <!-- 공통코드 SALARY_PAY_DAY -->
      </select>
    </div>
    <div class="salary-filter-block__run-calc">
      <button type="button" class="mg-v2-button mg-v2-button--primary">계산하기</button>
    </div>
  </div>
</section>
```

### 2.3 탭 래퍼 (급여 프로필 / 급여 계산 / 세금 관리)

```html
<!-- 섹션: 탭 영역 -->
<div class="mg-v2-ad-b0kla__section salary-management__tabs-wrap">
  <nav class="mg-tabs" role="tablist" aria-label="급여 관리 탭">
    <button type="button" role="tab" aria-selected="true" aria-controls="salary-profile-panel" id="tab-profiles" class="mg-tab mg-tab-active">급여 프로필</button>
    <button type="button" role="tab" aria-selected="false" aria-controls="salary-calc-panel" id="tab-calculations" class="mg-tab">급여 계산</button>
    <button type="button" role="tab" aria-selected="false" aria-controls="salary-tax-panel" id="tab-tax" class="mg-tab">세금 관리</button>
  </nav>
```

### 2.4 급여 프로필 탭 — 상담사 목록 카드 그리드

```html
  <!-- 탭패널: 급여 프로필 -->
  <section id="salary-profile-panel" role="tabpanel" aria-labelledby="tab-profiles" class="salary-profile-block">
    <div class="salary-profile-block__header">
      <h2 class="mg-v2-ad-b0kla__section-title salary-profile-block__title">
        <span class="salary-profile-block__accent" aria-hidden></span>
        상담사 급여 프로필
      </h2>
      <button type="button" class="mg-v2-button mg-v2-button--primary">새 프로필 생성</button>
    </div>
    <div class="salary-profile-block__empty salary-profile-block__empty--no-profiles" data-state="empty">
      <p class="salary-profile-block__empty-message">급여 프로필이 없습니다. 위의 &quot;새 프로필 생성&quot; 버튼을 클릭하여 작성해주세요.</p>
      <button type="button" class="mg-v2-button mg-v2-button--primary">지금 프로필 작성하기</button>
    </div>
    <div class="mg-v2-ad-b0kla__admin-grid salary-profile-block__grid">
      <article class="mg-v2-ad-b0kla__card salary-profile-card" aria-labelledby="profile-name-1">
        <span class="salary-profile-card__accent" aria-hidden></span>
        <div class="salary-profile-card__name" id="profile-name-1">상담사명</div>
        <div class="salary-profile-card__meta">이메일</div>
        <div class="salary-profile-card__grade">등급: —</div>
        <div class="salary-profile-card__base">
          <span class="salary-management__stat-label">기본급</span>
          <span class="salary-management__stat-value">0원</span>
        </div>
        <div class="mg-v2-card-actions salary-profile-card__actions">
          <button type="button" class="mg-v2-button mg-v2-button--outline">프로필 조회</button>
          <button type="button" class="mg-v2-button mg-v2-button--outline">편집</button>
        </div>
      </article>
      <!-- 반복: 상담사별 카드 -->
    </div>
  </section>
```

### 2.5 급여 계산 탭 — 미리보기·확정·계산 내역

```html
  <!-- 탭패널: 급여 계산 -->
  <section id="salary-calc-panel" role="tabpanel" aria-labelledby="tab-calculations" class="salary-calc-block">
    <div class="salary-calc-block__header">
      <h2 class="mg-v2-ad-b0kla__section-title salary-calc-block__title">
        <span class="salary-calc-block__accent" aria-hidden></span>
        급여 계산
      </h2>
    </div>
    <!-- 블록: 계산 결과 미리보기 -->
    <div class="salary-calc-block__preview">
      <div class="mg-v2-ad-b0kla__card salary-calc-block__preview-card">
        <h3 class="salary-calc-block__preview-title">계산 결과 미리보기</h3>
        <p class="salary-calc-block__preview-period">적용 기간: YYYY-MM-DD ~ YYYY-MM-DD (기산일 기준)</p>
        <div class="salary-calc-block__preview-summary">
          <div class="salary-calc-block__preview-card-item">
            <span class="salary-management__stat-label">총 급여</span>
            <span class="salary-management__stat-value">0원</span>
          </div>
          <div class="salary-calc-block__preview-card-item">
            <span class="salary-management__stat-label">세금·공제</span>
            <span class="salary-management__stat-value">-0원</span>
          </div>
          <div class="salary-calc-block__preview-card-item salary-calc-block__preview-card-item--net">
            <span class="salary-management__stat-label">실지급액</span>
            <span class="salary-management__stat-value">0원</span>
          </div>
        </div>
        <dl class="salary-calc-block__preview-grid">
          <dt class="salary-management__stat-label">상담사</dt>
          <dd class="salary-management__stat-value">이름</dd>
          <dt class="salary-management__stat-label">기간</dt>
          <dd class="salary-management__stat-value">YYYY-MM</dd>
          <dt class="salary-management__stat-label">상담 건수</dt>
          <dd class="salary-management__stat-value">0건</dd>
        </dl>
        <div class="mg-v2-card-actions salary-calc-block__preview-actions">
          <button type="button" class="mg-v2-button mg-v2-button--primary">확정</button>
          <button type="button" class="mg-v2-button mg-v2-button--outline">다시 계산</button>
        </div>
        <p class="salary-calc-block__preview-notice">미리보기 후 확정하면 해당 기간 급여가 저장됩니다.</p>
      </div>
    </div>
    <!-- 블록: 급여 계산 내역 목록 -->
    <div class="salary-calc-block__list">
      <h3 class="mg-v2-ad-b0kla__section-title salary-calc-block__list-title">급여 계산 내역</h3>
      <article class="mg-v2-ad-b0kla__card salary-calc-block__card">
        <div class="salary-calc-block__card-header">
          <span>YYYY-MM (계산 기간)</span>
          <span class="mg-v2-status-badge mg-v2-badge--neutral" role="status">확정</span>
        </div>
        <div class="salary-calc-block__card-details">
          <div class="salary-management__detail-row"><span>기본 급여</span><span>0원</span></div>
          <div class="salary-management__detail-row"><span>옵션 급여</span><span>0원</span></div>
          <div class="salary-management__detail-row"><span>총 급여 (세전)</span><span>0원</span></div>
          <div class="salary-management__detail-row salary-management__detail-row--tax"><span>원천징수 (3.3%)</span><span>-0원</span></div>
          <div class="salary-management__detail-row salary-management__detail-row--total"><span>실지급액 (세후)</span><span>0원</span></div>
          <div class="salary-management__detail-row"><span>상담 건수</span><span>0건</span></div>
        </div>
        <div class="mg-v2-card-actions salary-calc-block__actions">
          <button type="button" class="mg-v2-button mg-v2-button--secondary">세금 내역 보기</button>
          <button type="button" class="mg-v2-button mg-v2-button--primary">출력</button>
        </div>
      </article>
      <!-- 반복: 계산 건별 카드 -->
    </div>
  </section>
```

### 2.6 세금 관리 탭 (급여 페이지 내) — 세금 통계·breakdown 일치

```html
  <!-- 탭패널: 세금 관리 (급여 페이지 내) -->
  <section id="salary-tax-panel" role="tabpanel" aria-labelledby="tab-tax" class="salary-tax-block">
    <div class="salary-tax-block__header">
      <h2 class="mg-v2-ad-b0kla__section-title salary-tax-block__title">
        <span class="salary-tax-block__accent" aria-hidden></span>
        세금 관리
      </h2>
      <button type="button" class="mg-v2-button mg-v2-button--primary">세금 통계 조회</button>
    </div>
    <div class="mg-v2-ad-b0kla__card salary-tax-block__card">
      <h3 class="salary-tax-block__card-title">세금 통계 내역</h3>
      <div class="salary-tax-block__card-body">
        <div class="salary-management__detail-row">
          <span>총 세금액</span>
          <span class="salary-tax-block__value">0원</span>
        </div>
        <div class="salary-management__detail-row"><span>세금 건수</span><span>0건</span></div>
        <!-- 항목별 breakdown (백엔드 구조와 일치) -->
        <div class="salary-management__detail-row"><span>원천징수세 (3.3%)</span><span>-0원</span></div>
        <div class="salary-management__detail-row"><span>지방소득세 (0.33%)</span><span>-0원</span></div>
        <div class="salary-management__detail-row"><span>부가가치세 (10%)</span><span>-0원</span></div>
        <div class="salary-management__detail-row"><span>국민연금 (4.5%)</span><span>-0원</span></div>
        <div class="salary-management__detail-row"><span>건강보험 (3.545%)</span><span>-0원</span></div>
        <div class="salary-management__detail-row"><span>장기요양보험 (0.545%)</span><span>-0원</span></div>
        <div class="salary-management__detail-row"><span>고용보험 (0.9%)</span><span>-0원</span></div>
        <div class="salary-management__detail-row salary-management__detail-row--total"><span>총 공제액</span><span>-0원</span></div>
      </div>
      <div class="mg-v2-card-actions salary-tax-block__actions">
        <button type="button" class="mg-v2-button mg-v2-button--secondary">세금 상세 내역 보기</button>
        <button type="button" class="mg-v2-button mg-v2-button--primary">출력</button>
      </div>
    </div>
    <div class="salary-tax-block__empty" data-state="empty">
      <p>세금 통계를 조회하려면 기간을 선택한 뒤 &quot;세금 통계 조회&quot; 버튼을 클릭하세요.</p>
    </div>
  </section>
</div>
```

---

## 3. 세무 관리 페이지(통일 후) 블록

**전제**: /erp/tax 단일 컴포넌트로 통일, 실데이터 `/api/v1/admin/salary/tax/*` 연동. B0KlA·ContentHeader/ContentArea·동일 BEM 사용.

### 3.1 페이지 래퍼

```html
<main class="mg-v2-ad-b0kla tax-management__main" aria-label="세무 관리 콘텐츠">
  <!-- ContentHeader actions: 기간 선택 select 등 -->
```

### 3.2 세금 통계·항목별(breakdown) 섹션

```html
  <!-- 섹션: 세금 통계 -->
  <section class="mg-v2-ad-b0kla__card salary-tax-block" aria-labelledby="tax-stats-title">
    <h2 id="tax-stats-title" class="mg-v2-ad-b0kla__section-title salary-tax-block__title">
      <span class="salary-tax-block__accent" aria-hidden></span>
      세금 통계
    </h2>
    <div class="mg-v2-ad-b0kla__admin-grid salary-tax-block__stats-grid">
      <div class="mg-v2-ad-b0kla__card salary-tax-block__stat-card">
        <span class="salary-tax-block__stat-label">총 세금액</span>
        <span class="salary-tax-block__stat-value">0원</span>
      </div>
      <div class="mg-v2-ad-b0kla__card salary-tax-block__stat-card">
        <span class="salary-tax-block__stat-label">세금 건수</span>
        <span class="salary-tax-block__stat-value">0건</span>
      </div>
      <div class="mg-v2-ad-b0kla__card salary-tax-block__stat-card">
        <span class="salary-tax-block__stat-label">기간</span>
        <span class="salary-tax-block__stat-value">YYYY-MM</span>
      </div>
    </div>
    <h3 class="mg-v2-ad-b0kla__section-title salary-tax-block__breakdown-title">항목별 세금 (breakdown)</h3>
    <div class="salary-tax-block__breakdown-list">
      <div class="salary-tax-block__breakdown-item">
        <span class="salary-tax-block__breakdown-name">원천징수세</span>
        <span class="salary-tax-block__breakdown-amount">-0원</span>
      </div>
      <div class="salary-tax-block__breakdown-item">
        <span class="salary-tax-block__breakdown-name">지방소득세</span>
        <span class="salary-tax-block__breakdown-amount">-0원</span>
      </div>
      <div class="salary-tax-block__breakdown-item">
        <span class="salary-tax-block__breakdown-name">부가가치세</span>
        <span class="salary-tax-block__breakdown-amount">-0원</span>
      </div>
      <div class="salary-tax-block__breakdown-item">
        <span class="salary-tax-block__breakdown-name">4대보험</span>
        <span class="salary-tax-block__breakdown-amount">-0원</span>
      </div>
      <!-- 백엔드 taxStatistics 구조와 동일한 키 순서로 출력 -->
    </div>
  </section>
```

### 3.3 추가 세금 계산 폼

```html
  <!-- 섹션: 추가 세금 계산 -->
  <section class="mg-v2-ad-b0kla__card salary-tax-block salary-tax-block--form" aria-labelledby="tax-additional-title">
    <h2 id="tax-additional-title" class="mg-v2-ad-b0kla__section-title salary-tax-block__title">
      <span class="salary-tax-block__accent" aria-hidden></span>
      추가 세금 계산
    </h2>
    <form class="salary-tax-block__form" aria-label="추가 세금 계산">
      <fieldset class="salary-tax-block__fieldset">
        <legend class="sr-only">추가 세금 입력</legend>
        <div class="mg-v2-ad-b0kla__form-row salary-tax-block__form-row">
          <div class="mg-v2-ad-b0kla__form-group salary-tax-block__field">
            <label for="tax-calculation-id" class="mg-v2-form-label">급여 계산 ID</label>
            <input type="number" id="tax-calculation-id" class="mg-v2-form-input" placeholder="급여 계산 ID" aria-label="급여 계산 ID" />
          </div>
          <div class="mg-v2-ad-b0kla__form-group salary-tax-block__field">
            <label for="tax-gross-amount" class="mg-v2-form-label">총 급여액(과세표준)</label>
            <input type="number" id="tax-gross-amount" class="mg-v2-form-input" placeholder="총 급여액" aria-label="총 급여액" />
          </div>
        </div>
        <div class="mg-v2-ad-b0kla__form-row salary-tax-block__form-row">
          <div class="mg-v2-ad-b0kla__form-group salary-tax-block__field">
            <label for="tax-type" class="mg-v2-form-label">세금 유형</label>
            <select id="tax-type" class="mg-v2-select" aria-label="세금 유형 선택">
              <option value="">세금 유형 선택</option>
              <option value="WITHHOLDING_TAX">원천징수</option>
              <option value="VAT">부가세</option>
              <option value="INCOME_TAX">소득세</option>
              <option value="FOUR_INSURANCE">4대보험</option>
              <option value="LOCAL_INCOME_TAX">지방소득세</option>
              <option value="ADDITIONAL_TAX">추가세금</option>
            </select>
          </div>
          <div class="mg-v2-ad-b0kla__form-group salary-tax-block__field">
            <label for="tax-rate" class="mg-v2-form-label">세율 (%)</label>
            <input type="number" id="tax-rate" step="0.01" class="mg-v2-form-input" placeholder="예: 3.3" aria-label="세율" />
          </div>
        </div>
        <div class="mg-v2-ad-b0kla__form-actions salary-tax-block__form-actions">
          <button type="submit" class="mg-v2-button mg-v2-button--primary">세금 계산</button>
        </div>
      </fieldset>
    </form>
  </section>
```

### 3.4 세금 내역 테이블 (유형별 목록)

```html
  <!-- 섹션: 세금 내역 (유형별) -->
  <section class="mg-v2-ad-b0kla__card salary-tax-block" aria-labelledby="tax-list-title">
    <h2 id="tax-list-title" class="mg-v2-ad-b0kla__section-title salary-tax-block__title">
      <span class="salary-tax-block__accent" aria-hidden></span>
      세금 내역
    </h2>
    <div class="salary-tax-block__toolbar">
      <label for="tax-type-filter" class="mg-v2-form-label">세금 유형</label>
      <select id="tax-type-filter" class="mg-v2-select" aria-label="세금 유형 필터">
        <option value="">세금 유형 선택</option>
        <!-- 동일 옵션 -->
      </select>
    </div>
    <div class="mg-v2-ad-b0kla__data-table-wrapper">
      <table class="mg-v2-ad-b0kla__data-table salary-tax-block__table" role="table">
        <thead>
          <tr>
            <th scope="col">세금명</th>
            <th scope="col">유형</th>
            <th scope="col">세율</th>
            <th scope="col">과세표준</th>
            <th scope="col">세금액</th>
            <th scope="col">계산일</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>원천징수</td>
            <td><span class="mg-v2-status-badge mg-v2-badge--info" role="status">원천징수</span></td>
            <td>3.3%</td>
            <td>0원</td>
            <td>0원</td>
            <td>YYYY-MM-DD</td>
          </tr>
          <!-- 반복: 계산 건별 행 -->
        </tbody>
      </table>
    </div>
  </section>
</main>
```

---

## 4. 공통 클래스 매핑 (참조)

| 용도 | 클래스 |
|------|--------|
| 카드 컨테이너 | `mg-v2-ad-b0kla__card`, `mg-v2-card-container` |
| 섹션 제목 | `mg-v2-ad-b0kla__section-title` |
| 그리드 | `mg-v2-ad-b0kla__admin-grid` |
| 버튼 주/보조/아웃라인 | `mg-v2-button mg-v2-button--primary` / `--secondary` / `--outline` |
| 상태 배지 | `mg-v2-status-badge mg-v2-badge--success|warning|neutral|danger|info` |
| 카드 액션 그룹 | `mg-v2-card-actions` |
| 폼 라벨/입력/셀렉트 | `mg-v2-form-label`, `mg-v2-form-input`, `mg-v2-select` |
| 폼 행/그룹 (B0KlA) | `mg-v2-ad-b0kla__form-row`, `mg-v2-ad-b0kla__form-group`, `mg-v2-ad-b0kla__form-actions` |
| 테이블 | `mg-v2-ad-b0kla__data-table`, `mg-v2-ad-b0kla__data-table-wrapper` |
| 숨김 legend | `sr-only` (스크린리더 전용) |

---

## 5. 코더 전달 시 참고

- **JSX**: `class` → `className`, `for` → `htmlFor`. 데이터·이벤트·조건부 렌더는 코더가 연결.
- **breakdown 일치**: 회의 결과에 따라 세금 통계 항목 순서·키를 백엔드 응답(`taxStatistics`)과 동일하게 매핑.
- **테넌트**: 모든 API 호출에 `tenantId` 포함은 코더·백엔드 담당.
- **인라인 스타일**: 사용하지 않음. 스타일은 CSS/토큰으로만 적용.
