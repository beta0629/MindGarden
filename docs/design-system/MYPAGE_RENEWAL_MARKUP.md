# 마이페이지 리뉴얼 — 순수 HTML 마크업 스펙

**문서 유형**: 퍼블리셔(core-publisher) 산출물 — React/JS 없음, HTML 조각 + BEM  
**입력**: `SCREEN_SPEC_MYPAGE_RENEWAL.md`, `MYPAGE_RENEWAL_KICKOFF.md`  
**시각 토큰**: `frontend/src/styles/unified-design-tokens.css`의 `var(--mg-*)` (코더가 CSS에 적용)  
**금지**: `MyPage.css`, `ProfileSection.css` 등 레거시 마이페이지 전용 클래스명·구조 참조·복제

---

## 목차

1. [설계 원칙](#1-설계-원칙)
2. [B0KlA·토큰·공통 클래스 배치](#2-b0kla토큰공통-클래스-배치)
3. [BEM 블록 명세 표 (`mg-mypage`)](#3-bem-블록-명세-표-mg-mypage)
4. [아토믹 계층과 HTML 대응](#4-아토믹-계층과-html-대응)
5. [페이지 템플릿(전체 골격)](#5-페이지-템플릿전체-골격)
6. [탭별 패널 HTML 예시](#6-탭별-패널-html-예시)
7. [UnifiedModal 바디 전용 HTML 예시](#7-unifiedmodal-바디-전용-html-예시)
8. [코더용 완료 체크리스트 (React 이관 대조)](#8-코더용-완료-체크리스트-react-이관-대조)
9. [참조 문서](#9-참조-문서)

---

## 1. 설계 원칙

- **접두사**: 페이지 전용 BEM 블록은 **`mg-mypage`** (요소: `mg-mypage__*`). 어드민 샘플과 동일 리듬의 카드·탭 pill은 스펙대로 **`mg-v2-ad-b0kla__*`** 를 그대로 사용한다.
- **레이아웃**: 역할별 앱 셸(GNB/LNB)의 children으로 들어가는 **본문 단일 컬럼**. 루트에 B0KlA 스코프 + 컨테이너를 둔다.
- **탭**: 5개 — 프로필, 설정, 보안, 소셜 계정, 개인정보·동의. 제품 정책으로 숨김 시 해당 `li`·패널 자체 비렌더.
- **카드**: 각 탭 본문은 하나 이상의 `article` 카드. 섹션 제목 행은 **좌측 세로 악센트 바 + 제목 + 우측 보조 액션**을 `mg-mypage__section-head` 계열로 표현한다 (스타일은 토큰으로 코더 연결).
- **모달**: 커스텀 오버레이 없음. 아래 예시는 **UnifiedModal 내부 바디**에 넣는 마크업만 기술한다.
- **인라인 스타일**: 마크업 스펙에서는 사용하지 않는다. 시각은 클래스 + 토큰 문서를 따른다.

---

## 2. B0KlA·토큰·공통 클래스 배치

`SCREEN_SPEC_MYPAGE_RENEWAL.md` 10.1–10.3 및 공통 UI 스펙과의 정렬:

| 용도 | 클래스 (마크업에 부착) | 비고 |
|------|-------------------------|------|
| 페이지 B0KlA 스코프 | `mg-v2-ad-b0kla` | 루트 래퍼 |
| 최대 너비·좌우 패딩 | `mg-v2-ad-b0kla__container` | 컨테이너 |
| 탭 pill 그룹 | `mg-v2-ad-b0kla__pill-toggle` | `nav` 내부 `ul` 래퍼로 감싸도 됨 |
| 탭 항목 | `mg-v2-ad-b0kla__pill` | 비활성 |
| 탭 항목 활성 | `mg-v2-ad-b0kla__pill--active` | 활성 탭 |
| 카드 외곽 | `mg-v2-ad-b0kla__card` | 스펙 10.3과 동일 |
| 상태 배지 | `mg-v2-status-badge`, `mg-v2-badge--success` 등 | `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md` |
| 버튼 | `mg-v2-button`, `mg-v2-button--primary`, `mg-v2-button--outline`, `mg-v2-button--danger` | 파괴적 액션은 `--danger` 검토 |
| 카드 하단 액션 정렬 | `mg-v2-card-actions` | 저장/취소 행 |
| 모달 바디 구역 | `mg-v2-ad-modal__body` 내부 + 필요 시 `mg-v2-ad-modal__section` | UnifiedModal 쉘이 감싼 뒤 이 마크업만 바디에 해당 |

**토큰 (코더 CSS 연결용, 마크업 주석으로만 안내 가능)**  
배경: `var(--mg-color-background-main)`, 카드: `var(--mg-color-surface-main)`, 테두리: `var(--mg-color-border-main)`, 본문: `var(--mg-color-text-main)`, 보조: `var(--mg-color-text-secondary)`, 주조: `var(--mg-color-primary-main)`, 악센트 바: 주조와 동일 계열, 간격: `var(--mg-spacing-xs)` ~ `var(--mg-spacing-xl)`.

---

## 3. BEM 블록 명세 표 (`mg-mypage`)

| 요소 클래스 | 역할 |
|-------------|------|
| `mg-mypage` | 페이지 루트 (B0KlA와 병행: `mg-v2-ad-b0kla mg-mypage`) |
| `mg-mypage__main` | `main` 래퍼 |
| `mg-mypage__content-header` | ContentHeader 패턴: 제목·부제·actions 한 행(또는 열) |
| `mg-mypage__content-header-main` | 제목+부제 묶음 (좌측 열) |
| `mg-mypage__title` | 페이지 제목 |
| `mg-mypage__subtitle` | 부제(선택) |
| `mg-mypage__header-actions` | 우측 보조 액션 슬롯 (고객센터, 로그아웃 등) |
| `mg-mypage__tabs` | 1차 탭 내비 래퍼 (`nav`) |
| `mg-mypage__tab-list` | 탭 목록 `ul` |
| `mg-mypage__tab-item` | 탭 `li` |
| `mg-mypage__tab-panels` | 탭 패널 영역 래퍼 |
| `mg-mypage__panel` | 단일 탭 패널 (`section`, `role="tabpanel"`) |
| `mg-mypage__panel-inner` | 패널 내부 세로 스택 (카드 간 gap은 토큰) |
| `mg-mypage__card` | 카드 식별용 보조 클래스 (시각은 `mg-v2-ad-b0kla__card`와 병행) |
| `mg-mypage__section-head` | 섹션 제목 행 (악센트 + 제목 + 액션) |
| `mg-mypage__section-accent` | 세로 악센트 바 (4px, 스펙 수치는 CSS) |
| `mg-mypage__section-head-text` | 제목 블록 래퍼 |
| `mg-mypage__section-title` | 섹션 제목 |
| `mg-mypage__section-description` | 섹션 보조 설명(선택) |
| `mg-mypage__section-action` | 제목 행 우측 텍스트/아웃라인 버튼 슬롯 |
| `mg-mypage__card-body` | 카드 본문 (필드·리스트) |
| `mg-mypage__card-divider` | 카드 내부 구분선 블록 |
| `mg-mypage__form-row` | 라벨+컨트롤 한 줄 (Molecule) |
| `mg-mypage__form-label` | 필드 라벨 |
| `mg-mypage__form-control` | 입력 슬롯 (실제 `input`/`select`/`textarea`는 코더) |
| `mg-mypage__readonly-value` | 읽기 전용·마스킹 텍스트 |
| `mg-mypage__preference-row` | 설정 탭 토글 행 (제목+설명+토글) |
| `mg-mypage__list` | 세션·소셜 등 목록 `ul` |
| `mg-mypage__list-item` | 목록 행 `li` |
| `mg-mypage__list-item-main` | 행 주 텍스트 블록 |
| `mg-mypage__list-item-meta` | 보조 메타 |
| `mg-mypage__empty` | EmptyState 슬롯 래퍼 |
| `mg-mypage__danger-zone` | 탈퇴·위험 액션 분리 블록 |
| `mg-mypage__profile-header` | 프로필 헤더 카드 내 아바타+요약 가로 묶음 |
| `mg-mypage__avatar-wrap` | 원형 아바타 테두리·크기 래퍼 |
| `mg-mypage__avatar` | 프로필 이미지 |
| `mg-mypage__profile-summary` | 표시 이름·배지·테넌트명 세로 묶음 |
| `mg-mypage__display-name` | 표시 이름 타이포 슬롯 |
| `mg-mypage__tenant-name` | 테넌트·센터 보조 텍스트 |
| `mg-mypage__fieldset` | 폼 필드 그룹 |
| `mg-mypage__visually-hidden` | 스크린리더 전용 숨김 (코더: 프로젝트 `sr-only` 등으로 치환 가능) |
| `mg-mypage__preference-title` | 알림/동의 행의 굵은 제목 |
| `mg-mypage__device-name` | 기기명·제공자명 등 행 주 라벨 |
| `mg-mypage__provider-name` | 소셜 아이콘·로고 자리 표시 |
| `mg-mypage__link` | 약관·외부 링크 (주조색·밑줄은 토큰) |
| `mg-mypage__modal-scroll` | 약관 모달 등 스크롤 구역 래퍼 |
| `mg-mypage__legal-body` | 약관 본문 블록 |

---

## 4. 아토믹 계층과 HTML 대응

| 계층 | 이 화면에서의 예시 | 마크업에서의 구분 |
|------|-------------------|------------------|
| **Atoms** | 버튼, 배지, 구분선, 아바타 `img`, 링크 | `mg-v2-button*`, `mg-v2-status-badge*`, `mg-mypage__section-accent` |
| **Molecules** | 폼 한 행, 토글 행, 프로필 헤더 좌우 묶음 | `mg-mypage__form-row`, `mg-mypage__preference-row`, 헤더 내부 flex 묶음 |
| **Organisms** | 탭 바, 프로필 헤더 카드, 설정/보안/소셜/동의 카드 묶음 | `nav.mg-mypage__tabs` + pill, 각 `article.mg-v2-ad-b0kla__card` |
| **Template** | ContentHeader + 탭 + 패널 컨테이너 | `mg-mypage__content-header`, `mg-mypage__tab-panels` |
| **Page** | `mg-mypage` 루트 + `mg-v2-ad-b0kla__container` | 역할 셸 아래 최상위 블록 |

---

## 5. 페이지 템플릿(전체 골격)

```html
<!--
  Template / Page: 마이페이지 루트 (역할 셸 children 내부)
  B0KlA 스코프 + 컨테이너. 레거시 MyPage/ProfileSection 클래스 금지.
-->
<div class="mg-v2-ad-b0kla mg-mypage">
  <div class="mg-v2-ad-b0kla__container">
    <!-- Organism: ContentHeader 패턴 -->
    <header class="mg-mypage__content-header" aria-labelledby="mg-mypage-page-title">
      <div class="mg-mypage__content-header-main">
        <h1 id="mg-mypage-page-title" class="mg-mypage__title">마이페이지</h1>
        <p class="mg-mypage__subtitle">프로필, 설정, 보안, 소셜 계정, 개인정보 동의를 한곳에서 관리합니다.</p>
      </div>
      <div class="mg-mypage__header-actions">
        <!-- Atoms: 보조 액션 -->
        <button type="button" class="mg-v2-button mg-v2-button--outline">고객센터</button>
        <button type="button" class="mg-v2-button mg-v2-button--outline">로그아웃</button>
      </div>
    </header>

    <!-- Organism: 탭 내비 (pill) -->
    <nav class="mg-mypage__tabs" aria-label="마이페이지 섹션">
      <ul class="mg-mypage__tab-list mg-v2-ad-b0kla__pill-toggle" role="tablist">
        <li class="mg-mypage__tab-item" role="presentation">
          <button type="button" class="mg-v2-ad-b0kla__pill mg-v2-ad-b0kla__pill--active" role="tab" aria-selected="true" aria-controls="mg-mypage-panel-profile" id="mg-mypage-tab-profile">프로필</button>
        </li>
        <li class="mg-mypage__tab-item" role="presentation">
          <button type="button" class="mg-v2-ad-b0kla__pill" role="tab" aria-selected="false" aria-controls="mg-mypage-panel-settings" id="mg-mypage-tab-settings">설정</button>
        </li>
        <li class="mg-mypage__tab-item" role="presentation">
          <button type="button" class="mg-v2-ad-b0kla__pill" role="tab" aria-selected="false" aria-controls="mg-mypage-panel-security" id="mg-mypage-tab-security">보안</button>
        </li>
        <li class="mg-mypage__tab-item" role="presentation">
          <button type="button" class="mg-v2-ad-b0kla__pill" role="tab" aria-selected="false" aria-controls="mg-mypage-panel-social" id="mg-mypage-tab-social">소셜 계정</button>
        </li>
        <li class="mg-mypage__tab-item" role="presentation">
          <button type="button" class="mg-v2-ad-b0kla__pill" role="tab" aria-selected="false" aria-controls="mg-mypage-panel-privacy" id="mg-mypage-tab-privacy">개인정보·동의</button>
        </li>
      </ul>
    </nav>

    <main class="mg-mypage__main">
      <div class="mg-mypage__tab-panels">
        <!-- 각 탭 panel: 아래 섹션 6에서 확장. id는 aria-controls와 쌍을 이룸 -->
        <section class="mg-mypage__panel" role="tabpanel" id="mg-mypage-panel-profile" aria-labelledby="mg-mypage-tab-profile" data-mypage-tab="profile">
          <!-- 6.1 프로필 -->
        </section>
        <section class="mg-mypage__panel" role="tabpanel" id="mg-mypage-panel-settings" aria-labelledby="mg-mypage-tab-settings" hidden data-mypage-tab="settings">
          <!-- 6.2 설정 -->
        </section>
        <section class="mg-mypage__panel" role="tabpanel" id="mg-mypage-panel-security" aria-labelledby="mg-mypage-tab-security" hidden data-mypage-tab="security">
          <!-- 6.3 보안 -->
        </section>
        <section class="mg-mypage__panel" role="tabpanel" id="mg-mypage-panel-social" aria-labelledby="mg-mypage-tab-social" hidden data-mypage-tab="social">
          <!-- 6.4 소셜 -->
        </section>
        <section class="mg-mypage__panel" role="tabpanel" id="mg-mypage-panel-privacy" aria-labelledby="mg-mypage-tab-privacy" hidden data-mypage-tab="privacy">
          <!-- 6.5 개인정보·동의 -->
        </section>
      </div>
    </main>
  </div>
</div>
```

---

## 6. 탭별 패널 HTML 예시

### 6.1 프로필 탭

```html
<div class="mg-mypage__panel-inner">
  <!-- Organism: 카드 A — 프로필 헤더 -->
  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-profile-header-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-profile-header-title" class="mg-mypage__section-title">프로필</h2>
        <p class="mg-mypage__section-description">다른 사용자에게 보이는 정보입니다.</p>
      </div>
    </div>
    <div class="mg-mypage__card-body">
      <!-- Molecule: 아바타 + 요약 -->
      <div class="mg-mypage__profile-header">
        <div class="mg-mypage__avatar-wrap">
          <img class="mg-mypage__avatar" src="" alt="" width="96" height="96" />
        </div>
        <div class="mg-mypage__profile-summary">
          <p class="mg-mypage__display-name">홍길동</p>
          <span class="mg-v2-status-badge mg-v2-badge--info" role="status">상담사</span>
          <p class="mg-mypage__tenant-name">테넌트·센터명</p>
        </div>
      </div>
      <div class="mg-mypage__card-divider" role="presentation"></div>
      <!-- Atom: 파일 입력은 코더가 연결; 라벨 버튼만 마크업 -->
      <label class="mg-v2-button mg-v2-button--primary">
        사진 변경
        <input class="mg-mypage__visually-hidden" type="file" accept="image/*" tabindex="-1" aria-hidden="true" />
      </label>
    </div>
  </article>

  <!-- Organism: 카드 B — 기본 정보 -->
  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-profile-basic-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-profile-basic-title" class="mg-mypage__section-title">기본 정보</h2>
      </div>
    </div>
    <form class="mg-mypage__card-body" action="#" method="post">
      <fieldset class="mg-mypage__fieldset">
        <legend class="mg-mypage__visually-hidden">기본 프로필 필드</legend>
        <!-- Molecule -->
        <div class="mg-mypage__form-row">
          <label class="mg-mypage__form-label" for="mg-mypage-nickname">닉네임</label>
          <input class="mg-mypage__form-control" id="mg-mypage-nickname" name="nickname" type="text" autocomplete="nickname" />
        </div>
        <div class="mg-mypage__form-row">
          <label class="mg-mypage__form-label" for="mg-mypage-bio">소개</label>
          <textarea class="mg-mypage__form-control" id="mg-mypage-bio" name="bio" rows="4"></textarea>
        </div>
        <div class="mg-mypage__form-row">
          <span class="mg-mypage__form-label" id="mg-mypage-email-label">이메일</span>
          <p class="mg-mypage__readonly-value" aria-labelledby="mg-mypage-email-label">ab***@example.com</p>
          <button type="button" class="mg-v2-button mg-v2-button--outline">변경</button>
        </div>
        <div class="mg-mypage__form-row">
          <span class="mg-mypage__form-label" id="mg-mypage-phone-label">휴대전화</span>
          <p class="mg-mypage__readonly-value" aria-labelledby="mg-mypage-phone-label">010-****-5678</p>
          <button type="button" class="mg-v2-button mg-v2-button--outline">변경</button>
        </div>
      </fieldset>
      <div class="mg-v2-card-actions">
        <button type="submit" class="mg-v2-button mg-v2-button--primary">저장</button>
        <button type="button" class="mg-v2-button mg-v2-button--outline">취소</button>
      </div>
    </form>
  </article>
</div>
```

> 코더: `mg-mypage__visually-hidden`은 프로젝트 표준 스크린리더 전용 클래스로 치환. 파일 라벨 패턴은 `FormInput`/`ProfileImageInput` 등 공통 모듈로 대체 가능.

### 6.2 설정 탭

```html
<div class="mg-mypage__panel-inner">
  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-settings-general-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-settings-general-title" class="mg-mypage__section-title">일반</h2>
      </div>
    </div>
    <div class="mg-mypage__card-body">
      <div class="mg-mypage__form-row">
        <label class="mg-mypage__form-label" for="mg-mypage-lang">언어</label>
        <select class="mg-mypage__form-control" id="mg-mypage-lang" name="locale"></select>
      </div>
      <div class="mg-mypage__form-row">
        <label class="mg-mypage__form-label" for="mg-mypage-tz">시간대</label>
        <select class="mg-mypage__form-control" id="mg-mypage-tz" name="timezone"></select>
      </div>
    </div>
  </article>

  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-settings-notify-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-settings-notify-title" class="mg-mypage__section-title">알림</h2>
      </div>
    </div>
    <ul class="mg-mypage__list">
      <!-- Molecule: 토글 행 — 실제 스위치는 코더(FormInput 토글 등) -->
      <li class="mg-mypage__list-item mg-mypage__preference-row">
        <div class="mg-mypage__list-item-main">
          <p class="mg-mypage__preference-title">푸시 알림</p>
          <p class="mg-mypage__section-description">앱 푸시로 예약·메시지를 받습니다.</p>
        </div>
        <div class="mg-mypage__list-item-meta">
          <input type="checkbox" id="mg-mypage-notify-push" name="notifyPush" role="switch" aria-checked="false" />
        </div>
      </li>
      <li class="mg-mypage__list-item mg-mypage__preference-row">
        <div class="mg-mypage__list-item-main">
          <p class="mg-mypage__preference-title">이메일 알림</p>
          <p class="mg-mypage__section-description">이메일로 요약을 받습니다.</p>
        </div>
        <div class="mg-mypage__list-item-meta">
          <input type="checkbox" id="mg-mypage-notify-email" name="notifyEmail" role="switch" aria-checked="false" />
        </div>
      </li>
    </ul>
    <div class="mg-v2-card-actions">
      <button type="button" class="mg-v2-button mg-v2-button--primary">설정 저장</button>
    </div>
  </article>
</div>
```

### 6.3 보안 탭

```html
<div class="mg-mypage__panel-inner">
  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-security-pw-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-security-pw-title" class="mg-mypage__section-title">비밀번호</h2>
      </div>
    </div>
    <div class="mg-mypage__card-body">
      <p class="mg-mypage__section-description">비밀번호는 목록에 표시되지 않습니다. 변경 시 확인이 필요합니다.</p>
      <button type="button" class="mg-v2-button mg-v2-button--primary">비밀번호 변경</button>
    </div>
  </article>

  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-security-2fa-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-security-2fa-title" class="mg-mypage__section-title">2단계 인증</h2>
      </div>
    </div>
    <div class="mg-mypage__card-body">
      <span class="mg-v2-status-badge mg-v2-badge--neutral" role="status">미사용</span>
      <button type="button" class="mg-v2-button mg-v2-button--outline">설정</button>
    </div>
  </article>

  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-security-sessions-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-security-sessions-title" class="mg-mypage__section-title">로그인된 기기</h2>
      </div>
    </div>
    <ul class="mg-mypage__list">
      <li class="mg-mypage__list-item">
        <div class="mg-mypage__list-item-main">
          <p class="mg-mypage__device-name">Mac · Chrome</p>
          <p class="mg-mypage__section-description">서울 근처 · 마지막 활동 10분 전</p>
        </div>
        <div class="mg-mypage__list-item-meta">
          <span class="mg-v2-status-badge mg-v2-badge--success" role="status">이 기기</span>
        </div>
      </li>
      <li class="mg-mypage__list-item">
        <div class="mg-mypage__list-item-main">
          <p class="mg-mypage__device-name">iPhone · 앱</p>
          <p class="mg-mypage__section-description">부산 근처 · 마지막 활동 3일 전</p>
        </div>
        <button type="button" class="mg-v2-button mg-v2-button--outline">로그아웃</button>
      </li>
    </ul>
    <div class="mg-v2-card-actions">
      <button type="button" class="mg-v2-button mg-v2-button--danger mg-v2-button--outline">다른 기기 모두 로그아웃</button>
    </div>
  </article>
</div>
```

### 6.4 소셜 계정 탭

```html
<div class="mg-mypage__panel-inner">
  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-social-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-social-title" class="mg-mypage__section-title">연결된 계정</h2>
      </div>
    </div>
    <ul class="mg-mypage__list">
      <li class="mg-mypage__list-item">
        <div class="mg-mypage__list-item-main">
          <span class="mg-mypage__provider-name" aria-hidden="true"></span>
          <p class="mg-mypage__device-name">Google</p>
          <p class="mg-mypage__readonly-value">go***@gmail.com</p>
        </div>
        <div class="mg-mypage__list-item-meta">
          <span class="mg-v2-status-badge mg-v2-badge--success" role="status">연결됨</span>
          <button type="button" class="mg-v2-button mg-v2-button--outline mg-v2-button--danger">연결 해제</button>
        </div>
      </li>
      <li class="mg-mypage__list-item">
        <div class="mg-mypage__list-item-main">
          <p class="mg-mypage__device-name">Kakao</p>
          <p class="mg-mypage__section-description">아직 연결되지 않았습니다.</p>
        </div>
        <div class="mg-mypage__list-item-meta">
          <span class="mg-v2-status-badge mg-v2-badge--neutral" role="status">미연결</span>
          <button type="button" class="mg-v2-button mg-v2-button--primary">연결하기</button>
        </div>
      </li>
    </ul>
    <div class="mg-mypage__empty" hidden>
      <p class="mg-mypage__section-description">연동 가능한 계정이 없습니다.</p>
      <button type="button" class="mg-v2-button mg-v2-button--primary">고객센터</button>
    </div>
  </article>
</div>
```

### 6.5 개인정보·동의 탭

```html
<div class="mg-mypage__panel-inner">
  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-privacy-summary-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-privacy-summary-title" class="mg-mypage__section-title">동의 요약</h2>
        <p class="mg-mypage__section-description">최종 업데이트: 2026-04-01</p>
      </div>
    </div>
    <div class="mg-mypage__card-body">
      <a class="mg-mypage__link" href="#">전체 약관 보기</a>
    </div>
  </article>

  <article class="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-privacy-list-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-privacy-list-title" class="mg-mypage__section-title">항목별 동의</h2>
      </div>
    </div>
    <ul class="mg-mypage__list">
      <li class="mg-mypage__list-item mg-mypage__preference-row">
        <div class="mg-mypage__list-item-main">
          <p class="mg-mypage__device-name">서비스 이용약관</p>
          <span class="mg-v2-status-badge mg-v2-badge--danger" role="status">필수</span>
          <p class="mg-mypage__section-description">서비스 이용에 필요한 최소 동의입니다.</p>
          <button type="button" class="mg-v2-button mg-v2-button--outline">약관 전문</button>
        </div>
        <div class="mg-mypage__list-item-meta">
          <input type="checkbox" id="mg-mypage-consent-terms" checked disabled role="switch" aria-checked="true" />
        </div>
      </li>
      <li class="mg-mypage__list-item mg-mypage__preference-row">
        <div class="mg-mypage__list-item-main">
          <p class="mg-mypage__device-name">마케팅 수신</p>
          <span class="mg-v2-status-badge mg-v2-badge--neutral" role="status">선택</span>
          <p class="mg-mypage__section-description">이벤트·혜택 정보를 받습니다.</p>
        </div>
        <div class="mg-mypage__list-item-meta">
          <input type="checkbox" id="mg-mypage-consent-marketing" role="switch" aria-checked="false" />
        </div>
      </li>
    </ul>
  </article>

  <article class="mg-v2-ad-b0kla__card mg-mypage__card mg-mypage__danger-zone" aria-labelledby="mg-mypage-privacy-danger-title">
    <div class="mg-mypage__section-head">
      <span class="mg-mypage__section-accent" aria-hidden="true"></span>
      <div class="mg-mypage__section-head-text">
        <h2 id="mg-mypage-privacy-danger-title" class="mg-mypage__section-title">데이터 및 계정</h2>
      </div>
    </div>
    <div class="mg-mypage__card-body">
      <button type="button" class="mg-v2-button mg-v2-button--outline">내 데이터 요청</button>
      <button type="button" class="mg-v2-button mg-v2-button--danger mg-v2-button--outline">회원 탈퇴</button>
    </div>
  </article>
</div>
```

---

## 7. UnifiedModal 바디 전용 HTML 예시

쉘(헤더/닫기/포커스 트랩)은 `UnifiedModal`이 담당. 아래는 **`mg-v2-ad-modal__body` 안에 들어갈 내용**만 예시한다.

### 7.1 비밀번호 변경 폼

```html
<div class="mg-v2-ad-modal__body">
  <div class="mg-v2-ad-modal__section">
    <h3 class="mg-mypage__section-title">비밀번호 변경</h3>
    <p class="mg-mypage__section-description">현재 비밀번호 확인 후 새 비밀번호를 입력하세요.</p>
    <form class="mg-mypage__card-body" action="#" method="post">
      <div class="mg-mypage__form-row">
        <label class="mg-mypage__form-label" for="mg-mypage-modal-current-pw">현재 비밀번호</label>
        <input class="mg-mypage__form-control" id="mg-mypage-modal-current-pw" name="currentPassword" type="password" autocomplete="current-password" />
      </div>
      <div class="mg-mypage__form-row">
        <label class="mg-mypage__form-label" for="mg-mypage-modal-new-pw">새 비밀번호</label>
        <input class="mg-mypage__form-control" id="mg-mypage-modal-new-pw" name="newPassword" type="password" autocomplete="new-password" />
      </div>
      <div class="mg-mypage__form-row">
        <label class="mg-mypage__form-label" for="mg-mypage-modal-confirm-pw">새 비밀번호 확인</label>
        <input class="mg-mypage__form-control" id="mg-mypage-modal-confirm-pw" name="confirmPassword" type="password" autocomplete="new-password" />
      </div>
    </form>
  </div>
</div>
<!-- 푸터: UnifiedModal 푸터 슬롯 — 주조 저장 / 아웃라인 취소 (코더) -->
```

### 7.2 약관 전문(스크롤 바디)

```html
<div class="mg-v2-ad-modal__body">
  <div class="mg-v2-ad-modal__section mg-mypage__modal-scroll">
    <h3 class="mg-mypage__section-title">서비스 이용약관</h3>
    <div class="mg-mypage__legal-body" tabindex="0">
      <p>약관 본문 영역입니다. 세로 스크롤은 코더가 오버플로·max-height 토큰으로 적용합니다.</p>
    </div>
  </div>
</div>
```

### 7.3 연결 해제 확인(문구 강조)

```html
<div class="mg-v2-ad-modal__body">
  <div class="mg-v2-ad-modal__section">
    <p class="mg-mypage__section-title">연결을 해제할까요?</p>
    <p class="mg-mypage__section-description">해제 후에는 해당 계정으로 로그인할 수 없을 수 있습니다.</p>
  </div>
</div>
<!-- 확인/취소는 ConfirmModal 또는 UnifiedModal 확인 패턴 푸터 (코더) -->
```

---

## 8. 코더용 완료 체크리스트 (React 이관 대조)

마크업 스펙 대비 구현 시 다음을 대조한다.

- [ ] 최상위에 `mg-v2-ad-b0kla` + `mg-mypage`, 내부에 `mg-v2-ad-b0kla__container`가 있다.
- [ ] ContentHeader 패턴: `mg-mypage__title`, `mg-mypage__subtitle`, `mg-mypage__header-actions`가 분리되어 있다.
- [ ] 탭은 `mg-v2-ad-b0kla__pill-toggle` / `mg-v2-ad-b0kla__pill` / `mg-v2-ad-b0kla__pill--active`를 사용하고, 5개 라벨 순서가 스펙과 같다 (프로필 → 설정 → 보안 → 소셜 계정 → 개인정보·동의).
- [ ] 각 탭에 대응하는 `role="tabpanel"` 섹션이 있고, `aria-labelledby` / `aria-controls` / `id` 쌍이 맞다.
- [ ] 모든 카드 외곽에 `mg-v2-ad-b0kla__card`가 있고, 섹션 제목 행에 `mg-mypage__section-head` + `mg-mypage__section-accent` + `mg-mypage__section-title` 구조가 유지된다.
- [ ] 버튼·배지는 `mg-v2-button*`, `mg-v2-status-badge` 계열만 사용한다 (레거시 마이페이지 클래스 없음).
- [ ] 카드 하단 주요 액션에 `mg-v2-card-actions`를 사용할 수 있는 곳에는 배치했다.
- [ ] 모달은 커스텀 오버레이 없이 UnifiedModal/ConfirmModal만 사용하고, 바디 마크업은 `mg-v2-ad-modal__body` 규칙을 따른다.
- [ ] 색·간격·타이포는 `unified-design-tokens.css` (및 확장)의 `var(--mg-*)` 위주로 연결했다 (하드코딩 색상 금지 정책과 운영 게이트 문서 준수).
- [ ] `MyPage.css`, `ProfileSection.css` 등 레거시 클래스 의존이 없다.
- [ ] 숨김 탭은 빈 탭이 아니라 항목 자체를 렌더하지 않는다 (킥오프 합의).
- [ ] 모바일에서 탭 가로 스크롤 등 반응형 동작은 스펙 문서(`RESPONSIVE_LAYOUT_SPEC.md`)와 맞춘다.

---

## 9. 참조 문서

- `docs/design-system/SCREEN_SPEC_MYPAGE_RENEWAL.md`
- `docs/project-management/2026-04-03/MYPAGE_RENEWAL_KICKOFF.md`
- `docs/design-system/v2/COMMON_UI_IMPLEMENTATION_SPEC.md`
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`
- `docs/standards/MODAL_STANDARD.md`
- `frontend/src/styles/unified-design-tokens.css`
- `frontend/src/styles/dashboard-tokens-extension.css`

---

**문서 끝**
