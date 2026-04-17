# Trinity Apply Onboarding Markup

본 문서는 `pencil-new.pen` (노드 SqpCX, E7w72, qgIzo, eCumG) 및 `SCREEN_SPEC_TRINITY_APPLY_ONBOARDING.md` 스펙을 바탕으로 작성된 Trinity 공개 파트너 입점 신청 폼의 HTML 마크업 구조입니다.

이 마크업은 `frontend-trinity/components/onboarding/` 내에서 React 컴포넌트로 변환되어 사용될 수 있습니다.

## 1. 전역 레이아웃 (Split View)

```html
<!-- Templates: Onboarding Split Layout -->
<main class="mg-v2-onboarding-layout">
  <div class="mg-v2-onboarding-layout__container">
    
    <!-- Left Column: Visual & Guide -->
    <aside class="mg-v2-onboarding-layout__visual">
      <div class="mg-v2-onboarding-visual">
        <div class="mg-v2-onboarding-visual__image-wrapper">
          <!-- 3D 일러스트 이미지 -->
          <img src="/images/trinity-onboarding-hero.png" alt="Trinity 파트너 입점 환영" class="mg-v2-onboarding-visual__image" />
        </div>
        <div class="mg-v2-onboarding-visual__content">
          <h1 class="mg-v2-onboarding-visual__title">Trinity 파트너 입점을 환영합니다! 🎉</h1>
          <p class="mg-v2-onboarding-visual__description">
            파트너 입점을 위한 첫 걸음입니다. 아래 폼을 통해 기본 정보를 입력해주시면, 담당자가 신속하게 확인 후 다음 절차를 안내해 드립니다.<br><br>
            • 1단계: 기본 정보 입력 (현재)<br>
            • 2단계: 사업자 정보 및 서류 제출<br>
            • 3단계: 담당자 검토 및 승인<br><br>
            모든 정보는 안전하게 보호되며, 입점 심사 목적으로만 사용됩니다.
          </p>
        </div>
      </div>
    </aside>

    <!-- Right Column: Form -->
    <section class="mg-v2-onboarding-layout__form">
      <!-- Organisms: Onboarding Form Card -->
      <article class="mg-v2-card-container mg-v2-onboarding-form-card">
        
        <!-- Form Header (Progress) -->
        <header class="mg-v2-onboarding-form-card__header">
          <div class="mg-v2-onboarding-progress">
            <span class="mg-v2-onboarding-progress__step">1 / 3 기본 정보</span>
            <span class="mg-v2-onboarding-progress__percent">진행률 33%</span>
          </div>
          <p class="mg-v2-onboarding-form-card__subtitle">상호·대표자·연락처를 입력해 주세요.</p>
        </header>

        <!-- Form Body -->
        <form class="mg-v2-onboarding-form" aria-label="파트너 입점 기본 정보 입력 폼">
          
          <!-- Molecules: Form Field (상호명) -->
          <fieldset class="mg-v2-form-field">
            <label for="companyName" class="mg-v2-form-field__label">
              상호명 <span class="mg-v2-form-field__required" aria-hidden="true">*</span>
            </label>
            <div class="mg-v2-form-field__control">
              <input type="text" id="companyName" class="mg-v2-input" placeholder="상호명을 입력해주세요" required aria-describedby="companyName-helper" />
            </div>
            <p id="companyName-helper" class="mg-v2-form-field__helper-text">
              사업자등록증에 기재된 공식 상호명을 입력해주세요.
            </p>
          </fieldset>

          <!-- Molecules: Form Field (대표자명) -->
          <fieldset class="mg-v2-form-field">
            <label for="representativeName" class="mg-v2-form-field__label">
              대표자명 <span class="mg-v2-form-field__required" aria-hidden="true">*</span>
            </label>
            <div class="mg-v2-form-field__control">
              <input type="text" id="representativeName" class="mg-v2-input" placeholder="대표자명을 입력해주세요" required aria-describedby="representativeName-helper" />
            </div>
            <p id="representativeName-helper" class="mg-v2-form-field__helper-text">
              실제 계약을 진행할 대표자 성함을 입력해주세요.
            </p>
          </fieldset>

          <!-- Molecules: Form Field (휴대전화) -->
          <fieldset class="mg-v2-form-field">
            <label for="phoneNumber" class="mg-v2-form-field__label">
              휴대전화 <span class="mg-v2-form-field__required" aria-hidden="true">*</span>
            </label>
            <div class="mg-v2-form-field__control">
              <input type="tel" id="phoneNumber" class="mg-v2-input" placeholder="010-0000-0000" required aria-describedby="phoneNumber-helper" />
            </div>
            <p id="phoneNumber-helper" class="mg-v2-form-field__helper-text">
              진행 상황을 안내받으실 수 있는 연락처를 남겨주세요.
            </p>
          </fieldset>

          <!-- Molecules: Error Box (에러 발생 시 노출) -->
          <div class="mg-v2-alert mg-v2-alert--error" role="alert" aria-live="assertive">
            <p class="mg-v2-alert__message">상호명을 2자 이상 입력해 주세요.</p>
          </div>

          <!-- Form Actions -->
          <footer class="mg-v2-card-actions mg-v2-onboarding-form__actions">
            <button type="button" class="mg-v2-button mg-v2-button--secondary">
              이전
            </button>
            <button type="submit" class="mg-v2-button mg-v2-button--primary">
              다음
            </button>
          </footer>

        </form>
      </article>

      <!-- Footer Note -->
      <p class="mg-v2-onboarding-layout__footer-note">
        공개 API · tenant 컨텍스트 없음 · POST /api/v1/public/...
      </p>
    </section>

  </div>
</main>
```

## 2. 주요 CSS 클래스 및 토큰 매핑 가이드

core-coder가 스타일 연동 시 참고할 `unified-design-tokens.css` 기반의 매핑 가이드입니다.

| 요소 | CSS 클래스 | 디자인 토큰 / 스타일 |
|------|------------|----------------------|
| 배경 | `.mg-v2-onboarding-layout` | `background-color: var(--mg-bg);` |
| 텍스트 (기본) | `.mg-v2-onboarding-visual__title` | `color: var(--mg-foreground);` |
| 텍스트 (설명) | `.mg-v2-onboarding-visual__description` | `color: var(--mg-muted-foreground); line-height: 1.6;` |
| 카드 컨테이너 | `.mg-v2-card-container` | `background-color: var(--mg-card); border-radius: var(--mg-radius-xl); box-shadow: 0 8px 28px #0C2C5512;` |
| 입력 필드 | `.mg-v2-input` | `background-color: var(--mg-surface); border: 1px solid #E2E8F0; border-radius: var(--mg-radius-md);` |
| 에러 박스 | `.mg-v2-alert--error` | `background-color: #FEF2F2; border: 1px solid var(--mg-color-error); color: var(--mg-color-error); border-radius: var(--mg-radius-sm);` |
| 버튼 (Primary) | `.mg-v2-button--primary` | `background-color: var(--mg-primary); border-radius: var(--mg-radius-md);` |
| 버튼 (Secondary)| `.mg-v2-button--secondary`| `background-color: var(--mg-surface); border: 1px solid #E2E8F0; border-radius: var(--mg-radius-md);` |

## 3. 아토믹 디자인 계층 요약

- **Atoms**: `.mg-v2-input`, `.mg-v2-button`, `.mg-v2-form-field__label`, `.mg-v2-form-field__helper-text`
- **Molecules**: `.mg-v2-form-field` (Label + Input + Helper Text 조합), `.mg-v2-onboarding-progress`
- **Organisms**: `.mg-v2-onboarding-form-card` (Progress + 폼 필드들 + 에러 박스 + 액션 버튼)
- **Templates**: `.mg-v2-onboarding-layout` (좌우 분할 스플릿 뷰 레이아웃)
- **Pages**: Onboarding Page (위 Template에 실제 데이터를 주입하여 렌더링)
