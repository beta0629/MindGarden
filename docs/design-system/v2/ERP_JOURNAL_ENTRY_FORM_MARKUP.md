# ERP 분개 입력 폼 — HTML 마크업 (퍼블리싱 산출물)

**작성일**: 2025-03-14  
**담당**: core-publisher  
**참조**: `ERP_RENEWAL_PLANNING.md`, `COMMON_UI_IMPLEMENTATION_SPEC.md`, `core-solution-publisher` SKILL

---

## B0KlA·unified-design-tokens 적용 정리

| 구역 | 클래스명 | 토큰·스타일 참고 |
|------|----------|------------------|
| 전체 래퍼 | `mg-v2-ad-b0kla` | B0KlA 어드민 스코프. `AdminDashboardB0KlA.css` 적용 |
| 카드 섹션 | `mg-v2-card-container` | `var(--mg-spacing-16)`, `var(--mg-radius-lg)`, `var(--mg-shadow-sm)` |
| 버튼 | `mg-v2-button mg-v2-button--primary` 등 | `var(--mg-radius-md)`, `var(--mg-spacing-*)` |
| 버튼 그룹 | `mg-v2-card-actions` | `gap: var(--mg-spacing-8)` |
| 입력 필드 | `mg-v2-input` (코더 연결) | `var(--input-padding)` 등 토큰 |
| 테이블 | `mg-v2-erp-journal-form__table` | border, radius는 토큰 기반으로 코더가 정의 |

---

## HTML 마크업 (JSX 변환용)

아래 마크업은 **class** 기준. React 사용 시 `className`으로 치환. 이벤트·상태·API 연동은 코더 담당.

```html
<!-- ============================================== -->
<!-- ERP 분개 입력 폼 (Organism)                    -->
<!-- B0KlA + unified-design-tokens 적용             -->
<!-- ============================================== -->
<div class="mg-v2-ad-b0kla mg-v2-erp-journal-form" role="region" aria-labelledby="mg-erp-journal-form-title">

  <form class="mg-v2-erp-journal-form__form" method="post" aria-label="분개 입력">
    
    <!-- 섹션: 폼 상단 (제목·일자·적요) -->
    <header class="mg-v2-erp-journal-form__header mg-v2-card-container">
      <h2 id="mg-erp-journal-form-title" class="mg-v2-erp-journal-form__title mg-v2-ad-b0kla__section-title">분개 입력</h2>
      
      <fieldset class="mg-v2-erp-journal-form__meta">
        <legend class="sr-only">분개 기본 정보</legend>
        
        <div class="mg-v2-erp-journal-form__field">
          <label for="mg-erp-journal-date" class="mg-v2-erp-journal-form__label">일자</label>
          <input type="date" id="mg-erp-journal-date" name="entryDate" class="mg-v2-input mg-v2-erp-journal-form__input" aria-required="true" value="" />
        </div>
        
        <div class="mg-v2-erp-journal-form__field">
          <label for="mg-erp-journal-description" class="mg-v2-erp-journal-form__label">적요</label>
          <input type="text" id="mg-erp-journal-description" name="description" class="mg-v2-input mg-v2-erp-journal-form__input" placeholder="적요를 입력하세요" aria-required="true" />
        </div>
      </fieldset>
    </header>

    <!-- 섹션: 차변 라인 테이블 -->
    <section class="mg-v2-erp-journal-form__section mg-v2-card-container" aria-labelledby="mg-erp-debit-title">
      <div class="mg-v2-erp-journal-form__section-header">
        <h3 id="mg-erp-debit-title" class="mg-v2-erp-journal-form__section-title mg-v2-ad-b0kla__section-title">차변</h3>
        <button type="button" class="mg-v2-button mg-v2-button--outline mg-v2-button--small" aria-label="차변 라인 추가">
          라인 추가
        </button>
      </div>
      
      <div class="mg-v2-erp-journal-form__table-wrapper">
        <table class="mg-v2-erp-journal-form__table" role="table" aria-label="차변 분개 라인">
          <thead>
            <tr>
              <th scope="col">No</th>
              <th scope="col">계정과목</th>
              <th scope="col">금액</th>
              <th scope="col" class="mg-v2-erp-journal-form__col-action">작업</th>
            </tr>
          </thead>
          <tbody>
            <!-- 샘플 데이터 행 (코더가 map으로 렌더링) -->
            <tr class="mg-v2-erp-journal-form__row">
              <td class="mg-v2-erp-journal-form__cell-num">1</td>
              <td class="mg-v2-erp-journal-form__cell-account">
                <input type="text" name="debitLines[0].accountCode" class="mg-v2-input mg-v2-erp-journal-form__cell-input" placeholder="계정코드" />
              </td>
              <td class="mg-v2-erp-journal-form__cell-amount">
                <input type="number" name="debitLines[0].amount" class="mg-v2-input mg-v2-erp-journal-form__cell-input" placeholder="0" min="0" step="1" inputmode="numeric" />
              </td>
              <td class="mg-v2-erp-journal-form__cell-action">
                <button type="button" class="mg-v2-button mg-v2-button--secondary mg-v2-button--small" aria-label="행 삭제">삭제</button>
              </td>
            </tr>
            <!-- 빈 행 또는 추가 버튼 위치: 코더가 동적 라인 추가 시 위 tr을 템플릿으로 사용 -->
            <tr class="mg-v2-erp-journal-form__row mg-v2-erp-journal-form__row--empty">
              <td colspan="4" class="mg-v2-erp-journal-form__cell-empty">
                빈 행 (라인 추가 시 여기에 행이 추가됨)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 섹션: 대변 라인 테이블 -->
    <section class="mg-v2-erp-journal-form__section mg-v2-card-container" aria-labelledby="mg-erp-credit-title">
      <div class="mg-v2-erp-journal-form__section-header">
        <h3 id="mg-erp-credit-title" class="mg-v2-erp-journal-form__section-title mg-v2-ad-b0kla__section-title">대변</h3>
        <button type="button" class="mg-v2-button mg-v2-button--outline mg-v2-button--small" aria-label="대변 라인 추가">
          라인 추가
        </button>
      </div>
      
      <div class="mg-v2-erp-journal-form__table-wrapper">
        <table class="mg-v2-erp-journal-form__table" role="table" aria-label="대변 분개 라인">
          <thead>
            <tr>
              <th scope="col">No</th>
              <th scope="col">계정과목</th>
              <th scope="col">금액</th>
              <th scope="col" class="mg-v2-erp-journal-form__col-action">작업</th>
            </tr>
          </thead>
          <tbody>
            <tr class="mg-v2-erp-journal-form__row">
              <td class="mg-v2-erp-journal-form__cell-num">1</td>
              <td class="mg-v2-erp-journal-form__cell-account">
                <input type="text" name="creditLines[0].accountCode" class="mg-v2-input mg-v2-erp-journal-form__cell-input" placeholder="계정코드" />
              </td>
              <td class="mg-v2-erp-journal-form__cell-amount">
                <input type="number" name="creditLines[0].amount" class="mg-v2-input mg-v2-erp-journal-form__cell-input" placeholder="0" min="0" step="1" inputmode="numeric" />
              </td>
              <td class="mg-v2-erp-journal-form__cell-action">
                <button type="button" class="mg-v2-button mg-v2-button--secondary mg-v2-button--small" aria-label="행 삭제">삭제</button>
              </td>
            </tr>
            <tr class="mg-v2-erp-journal-form__row mg-v2-erp-journal-form__row--empty">
              <td colspan="4" class="mg-v2-erp-journal-form__cell-empty">
                빈 행 (라인 추가 시 여기에 행이 추가됨)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 섹션: 합계·균형 표시 -->
    <section class="mg-v2-erp-journal-form__summary mg-v2-card-container" aria-live="polite" role="status">
      <h3 class="mg-v2-erp-journal-form__summary-title mg-v2-ad-b0kla__section-title">합계·균형</h3>
      <dl class="mg-v2-erp-journal-form__summary-list">
        <div class="mg-v2-erp-journal-form__summary-item">
          <dt>차변 합계</dt>
          <dd class="mg-v2-erp-journal-form__summary-value" data-total-debit="">0원</dd>
        </div>
        <div class="mg-v2-erp-journal-form__summary-item">
          <dt>대변 합계</dt>
          <dd class="mg-v2-erp-journal-form__summary-value" data-total-credit="">0원</dd>
        </div>
        <div class="mg-v2-erp-journal-form__summary-item mg-v2-erp-journal-form__summary-item--balance">
          <dt>균형</dt>
          <dd class="mg-v2-erp-journal-form__summary-value mg-v2-erp-journal-form__summary-value--balance" data-balance-status="">
            <span class="mg-v2-status-badge mg-v2-badge--neutral">확인 중</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- 섹션: 버튼 그룹 -->
    <footer class="mg-v2-erp-journal-form__actions mg-v2-card-actions">
      <button type="submit" class="mg-v2-button mg-v2-button--primary">저장</button>
      <button type="button" class="mg-v2-button mg-v2-button--success">승인</button>
      <button type="button" class="mg-v2-button mg-v2-button--outline">전기</button>
    </footer>

  </form>

</div>
```

---

## 클래스·토큰 사용 위치 요약

| 클래스 | 용도 | 토큰 참고 |
|--------|------|-----------|
| `mg-v2-ad-b0kla` | B0KlA 어드민 스코프 (버튼·배지 스타일 오버라이드) | `--ad-b0kla-green`, `--ad-b0kla-border` 등 |
| `mg-v2-card-container` | 카드형 섹션 | `--mg-spacing-16`, `--mg-radius-lg`, `--mg-shadow-sm` |
| `mg-v2-card-actions` | 버튼 그룹 | `gap: var(--mg-spacing-8)` |
| `mg-v2-button` | 공통 버튼 | `--mg-radius-md`, `--mg-spacing-*` |
| `mg-v2-button--primary` | 주요 액션 (저장) | `--mg-color-primary-main` |
| `mg-v2-button--success` | 승인 | `--mg-success-500` |
| `mg-v2-button--outline` | 보조 액션 (전기·라인 추가) | 테두리 스타일 |
| `mg-v2-button--secondary` | 삭제 등 | `--mg-color-surface-main` |
| `mg-v2-input` | 입력 필드 | `--input-padding` (unified-design-tokens) |
| `mg-v2-status-badge` | 균형 상태 표시 | `COMMON_UI_IMPLEMENTATION_SPEC` §2 |
| `mg-v2-badge--neutral` | 균형 확인 중 | `--mg-gray-100`, `--mg-gray-600` |
| `mg-v2-badge--success` | 균형 일치 | 균형이 맞을 때 |
| `mg-v2-badge--danger` | 균형 불일치 | 균형이 안 맞을 때 |

---

## 아토믹 계층

| 계층 | 마크업 |
|------|--------|
| Atoms | `input`, `button`, `span.mg-v2-status-badge` |
| Molecules | `fieldset`+label+input, `tr`+td |
| Organisms | `mg-v2-erp-journal-form` 전체 (헤더+차변 테이블+대변 테이블+합계+버튼) |
| Template | `AdminCommonLayout` 내부에 이 Organism 배치 |

---

## 코더 전달 사항

- **라인 추가**: 차변/대변 각각 `라인 추가` 버튼 클릭 시 tbody에 새 `tr` 추가. name 속성 `debitLines[n]`, `creditLines[n]` 형식으로 인덱스 증가.
- **균형 검증**: `data-total-debit`, `data-total-credit`, `data-balance-status`에 코더가 JS로 값 주입. 균형 일치 시 `mg-v2-badge--success`, 불일치 시 `mg-v2-badge--danger`.
- **계정과목**: 실제 구현 시 select+options 또는 자동완성 input으로 교체 가능. 현재는 placeholder용 text input.
- **sr-only**: `class="sr-only"` legend는 화면에는 숨기고 스크린 리더용. CSS: `position:absolute;width:1px;height:1px;clip:rect(0,0,0,0);overflow:hidden;` 등으로 구현.
