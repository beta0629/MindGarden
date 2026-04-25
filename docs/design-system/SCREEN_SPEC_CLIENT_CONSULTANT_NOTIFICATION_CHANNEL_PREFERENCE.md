# 화면설계서: 내담자·상담사 알림 수신 채널 선호 (카카오 알림톡 계열 / SMS / 테넌트 기본)

**버전**: 1.0  
**참조 비주얼**: [마인드가든 어드민 대시보드 샘플 (B0KlA)](https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)  
**펜슬·토큰 단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `frontend/src/styles/unified-design-tokens.css` (토큰명 참고만)  
**구현 컴포넌트 경로**: **[TBD: 경로]** — explore 서브에이전트 산출과 정합 후 본 문서 §13에 실경로를 반영한다.

---

## 목차

1. [문서 목적·범위](#1-문서-목적범위)
2. [화면 개요·역할·접근](#2-화면-개요역할접근)
3. [기획 §0.4 반영: 사용성·정보 노출·레이아웃](#3-기획-04-반영-사용성정보-노출레이아웃)
4. [AdminCommonLayout vs 일반 테넌트 프로필](#4-admincommonlayout-vs-일반-테넌트-프로필)
5. [프로필 내 섹션 배치](#5-프로필-내-섹션-배치)
6. [채널 선호 컨트롤 패턴](#6-채널-선호-컨트롤-패턴)
7. [테넌트 채널 가용성별 UI 상태](#7-테넌트-채널-가용성별-ui-상태)
8. [B0KlA·디자인 토큰·클래스](#8-b0kla디자인-토큰클래스)
9. [반응형](#9-반응형)
10. [접근성 (라디오/세그먼트)](#10-접근성-라디오세그먼트)
11. [공통 모듈 재사용 권장](#11-공통-모듈-재사용-권장)
12. [i18n 키 제안](#12-i18n-키-제안)
13. [구현 체크리스트·TBD 정합](#13-구현-체크리스트tbd-정합)

---

## 1. 문서 목적·범위

- **목적**: 내담자(CLIENT)·상담사(CONSULTANT) 프로필에서 **알림 수신 채널 선호**(카카오 알림톡 계열 vs SMS vs **테넌트 기본 따름**)를 설정하는 UX를 B0KlA·디자인 토큰에 맞춰 정의한다.
- **범위**: 레이아웃·비주얼·상태·접근성·역할별 정보 노출. API·DB·비즈니스 규칙은 별도 기획/백엔드 스펙에 따른다.
- **비범위**: 코드·CSS 파일 수정 (본 문서만).

---

## 2. 화면 개요·역할·접근

| 항목 | 내용 |
|------|------|
| **주요 사용자** | CLIENT(내담자), CONSULTANT(상담사) — 본인 프로필에서 본인 선호만 변경 |
| **부가 뷰어** | ADMIN — 타인 프로필 조회/편집 시 **동일 UI 블록**을 쓰되, §3.2의 노출·편집 가능 범위 적용 |
| **STAFF 등** | 제품 정책에 따라 프로필이 있다면 CLIENT/CONSULTANT와 동일 블록 패턴 적용 가능 ([TBD: 정책]) |
| **라우트** | [TBD: 경로] — 테넌트 프로필·어드민 사용자 상세 등 |

---

## 3. 기획 §0.4 반영: 사용성·정보 노출·레이아웃

`/core-solution-planning` §0.4(사용성 → 정보 노출 → 레이아웃) 순서에 맞춰 아래를 코더·기획과 공유한다.

### 3.1 사용성 (누가·무엇을·어떤 흐름)

- **CLIENT / CONSULTANT**: 예약·회기·결제 등 알림을 **어느 채널로 받을지** 한 곳에서 이해하고 선택한다. 기본값은 **「테넌트 기본 따름」**으로 두어, 테넌트가 정책을 바꿔도 사용자가 재설정하지 않아도 되게 한다.
- **선택 동작**: 단일 선택(상호 배타). 저장은 **명시적 저장 버튼** 또는 프로필 전체 저장 플로우에 포함 — 제품 표준에 맞춤 ([TBD: 저장 트리거]).
- **인지 부하 최소화**: 옵션은 3개(카카오 / SMS / 테넌트 기본)를 넘지 않도록 유지. 각 옵션에 **한 줄 설명**(보조 텍스트)만 허용.

### 3.2 정보 노출 범위 (역할별)

| 역할 | 노출 | 편집 | 비고 |
|------|------|------|------|
| **CLIENT** | 본인 채널 선호 UI 전체, 테넌트에서 쓰는 채널 안내(§7) | 본인만 | 마스킹 불필요(설정값) |
| **CONSULTANT** | 동일 | 본인만 | 동일 |
| **ADMIN** | 대상 사용자의 현재 선호·유효 채널(정책상 표시 시) | 정책 허용 시에만 편집 가능; 읽기 전용이면 컨트롤 `disabled` + 안내 | **테넌트에 어떤 채널이 켜져 있는지**는 관리 목적 메타로 표시 가능(읽기 전용 배지 등, [TBD]) |

- **비노출**: 타 사용자의 전화번호·카카오 수신 ID 등 **PII는 이 섹션에 넣지 않는다**. 채널 “종류”만 다룬다.

### 3.3 레이아웃 (배치)

- 프로필 본문은 **세로 스택**: 기존 프로필 섹션 순서를 유지하고, **「알림」 또는 「알림 수신」** 관련 그룹 안에 본 섹션 블록을 둔다 ([TBD: 경로] 기존 `TenantProfile` 등과 정합).
- 블록 순서 권장: 연락처·계정 정보 다음, 또는 **알림/마케팅 동의** 인근 — 제품 IA에 맞게 한 곳으로 고정.

---

## 4. AdminCommonLayout vs 일반 테넌트 프로필

| 화면 유형 | 레이아웃 래퍼 | 상단 영역 | 본문 토큰·톤 |
|-----------|---------------|-----------|----------------|
| **플랫폼/코어 어드민**에서 사용자·내담자·상담사 **상세/편집** | **AdminCommonLayout** 필수 (`frontend/src/components/layout/AdminCommonLayout.js` — 기획 §0.2.1) | GNB + LNB + 메인 상단 바(브레드크럼·페이지 제목·액션). 본 채널 블록은 **메인 scroll 영역** 안 섹션으로만 배치 | 어드민 B0KlA: `mg-v2-ad-b0kla__*` 및 `--ad-b0kla-*` 계열과 `var(--mg-color-*)` 병용. 메인 배경 `var(--mg-color-background-main)` |
| **테넌트 스코프 일반 프로필** (내담자·상담사가 로그인 후 **본인 설정**) | AdminCommonLayout **아님** — 기존 테넌트 대시보드/프로필 셸 ([TBD: 경로]) | 테넌트 앱의 **ContentHeader** 또는 동등 상단(제목·뒤로가기) | 동일 **색 팔레트·섹션 블록** 규칙(PENCIL 가이드)으로 시각 일관; 클래스는 테넌트 쪽 공통 레이아웃에 맞춤 |

- **디자인 일관성**: 래퍼가 달라도 **섹션 블록**(§8)의 카드·악센트·타이포는 동일해 사용자가 동일 기능임을 인지한다.

---

## 5. 프로필 내 섹션 배치

### 5.1 섹션 블록 (Organism)

- **컨테이너**: `docs/design-system/PENCIL_DESIGN_GUIDE.md` §2.3 준수  
  - 배경: `var(--mg-color-surface-main)`  
  - 테두리: `1px solid var(--mg-color-border-main)`  
  - `border-radius: 16px`  
  - 패딩: `24px` (`var(--mg-spacing-24)` 등 토큰 존재 시 토큰 우선)  
  - 내부 세로 `gap: 16px`
- **섹션 제목 행**  
  - 좌측 **세로 악센트 바**: 폭 `4px`, `background-color: var(--mg-color-primary-main)`, `border-radius: 2px`  
  - 제목: `font-size: 16px`, `font-weight: 600`, `color: ` `var(--mg-color-text-main)`  
  - (선택) 우측에 “저장됨” 토스트는 전역 패턴 따름

### 5.2 블록 내부 구조 (위 → 아래)

1. **섹션 제목** + 짧은 부제(1줄, `var(--mg-color-text-secondary)`, 12–14px) — i18n §12  
2. **테넌트 채널 요약** (둘 다 / 카카오만 / SMS만일 때 짧은 안내; §7)  
3. **채널 선호 컨트롤** (§6)  
4. **보조 안내 문구** (정책·요금·수신 불가 시 동작 등, 최대 2~3줄, secondary 색)

---

## 6. 채널 선호 컨트롤 패턴

### 6.1 권장 패턴: **라디오 그룹** (기본)

- **이유**: 3개 이하 상호 배타 옵션, 스크린 리더·키보드 탐색에 유리.
- **시각**: 세로 리스트 또는 **세그먼트형(가로 탭 버튼)** — 동일하게 `role="radiogroup"` + 각 `role="radio"` + `aria-checked` 로 구현 권장 (세그먼트형도 라디오 시맨틱 유지).

### 6.2 옵션 정의 (라벨 + 설명)

| 값(논리) | 라벨 | 설명(한 줄, 선택) |
|-----------|------|-------------------|
| `TENANT_DEFAULT` | (i18n) 테넌트 기본 설정 따름 | 테넌트가 정한 기본 채널을 사용합니다. |
| `KAKAO` | (i18n) 카카오 알림톡 | 카카오 알림톡으로 안내를 받습니다. |
| `SMS` | (i18n) 문자(SMS) | SMS로 안내를 받습니다. |

- **순서**: `TENANT_DEFAULT`를 **첫 옵션**으로 두어 안전한 기본 선택을 강조.

### 6.3 BadgeSelect 대안

- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md`: 소수 옵션은 **BadgeSelect** 우선 검토.  
- **조건**: BadgeSelect가 **키보드·스크린 리더에서 단일 선택 라디오 그룹과 동등**하게 동작하도록 구현되어 있을 때 채택. 그렇지 않으면 **네이티브 라디오 또는 접근성 검증된 RadioGroup**을 우선.

---

## 7. 테넌트 채널 가용성별 UI 상태

테넌트 설정(카카오·SMS 사용 여부)에 따른 UI. **실제 분기 데이터는 백엔드/설정 API** 기준.

### 7.1 카카오·SMS **둘 다** 사용 가능

- 세 옵션 모두 표시.  
- `TENANT_DEFAULT` 선택 시: 테넌트 기본이 카카오인지 SMS인지 **읽기 전용 힌트** 한 줄 표시 권장 (가능할 때만, [TBD: API 필드]).

### 7.2 **카카오만** 사용 가능 (SMS 없음)

| 옵션 | 처리 |
|------|------|
| `TENANT_DEFAULT` | **표시·활성** |
| `KAKAO` | **표시·활성** |
| `SMS` | **숨김** 권장 — “없는 선택지”를 비활성만 하는 것보다 인지 부하가 적음. 대안으로 **비활성 + 짧은 이유**도 가능 (제품 정책 선택) |

- **안내 문구**(블록 상단 또는 SMS 자리 대체): i18n `tenantProfile.notificationChannel.hintSmsUnavailable` — “이 센터는 문자 알림을 사용하지 않습니다.” (문구는 키로만 관리)

### 7.3 **SMS만** 사용 가능 (카카오 없음)

- `KAKAO` **숨김**(또는 비활성 + 안내).  
- `TENANT_DEFAULT`, `SMS` 활성.  
- 안내: `tenantProfile.notificationChannel.hintKakaoUnavailable`

### 7.4 **둘 다 없음** (비정상·미설정 테넌트)

- 전체 블록을 **정보 전용**으로 전환: 컨트롤 숨김 또는 전부 `disabled`.  
- **안내**: `tenantProfile.notificationChannel.hintNoChannelConfigured` — 관리자에게 문의하도록 안내.  
- ADMIN 뷰에서는 **테넌트 SMS/알림톡 설정 화면으로 이동** 링크(어드민 라우트) 허용 ([TBD: 경로]).

### 7.5 선택값과 가용성 충돌 (이전에 SMS 선택했는데 테넌트가 SMS 끔)

- 로드 시: 유효하지 않은 값이면 **`TENANT_DEFAULT`로 표시 보정** + 인라인 경고(secondary 또는 `var(--mg-warning-*)` 계열 토큰, 본문 한 줄).  
- i18n: `tenantProfile.notificationChannel.hintPreferenceResetToTenantDefault`

---

## 8. B0KlA·디자인 토큰·클래스

- **색상**: `PENCIL_DESIGN_GUIDE.md` §2.1 표만 사용. 임의 hex 금지.  
  - 본문: `var(--mg-color-text-main)`  
  - 라벨·캡션: `var(--mg-color-text-secondary)`  
  - 테두리: `var(--mg-color-border-main)`  
  - 주조 버튼(저장): `var(--mg-color-primary-main)` 배경, 텍스트 `var(--mg-color-background-main)` 또는 명시 대비 충족 색  
- **어드민 페이지** 본문 래핑에 B0KlA 유틸이 요구되면: `mg-v2-ad-b0kla__*` 및 `unified-design-tokens.css`의 `--ad-b0kla-*` — 구체 클래스는 구현 시 기존 어드민 프로필·폼 페이지와 동일하게 맞춤 ([TBD: 경로]).
- **포커스 링**: `var(--mg-color-primary-main)` 또는 디자인 시스템에 정의된 focus ring 토큰(프로젝트 표준) — §10.

---

## 9. 반응형

`docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` 및 펜슬 **Layout & Responsive** 기준.

| 브레이크포인트 | 본 섹션 동작 |
|----------------|--------------|
| **375px (모바일)** | 세그먼트형이면 **세로 스택**으로 전환하거나 라디오 세로 리스트 유지. 터치 타깃 **최소 44×44px** (옵션 행 전체 또는 확장 히트 영역). |
| **768px (태블릿)** | 본문 패딩 프로필 표준 준수; LNB는 드로어일 수 있음 — 본 블록은 메인 폭 100%. |
| **1280px+** | 섹션 블록 max-width는 상위 프로필 컨테이너에 따름; 4K는 본문 max-width 제한 유지. |

---

## 10. 접근성 (라디오/세그먼트)

- **그룹**: 컨테이너에 `role="radiogroup"` + `aria-labelledby`를 섹션 제목 id에 연결.  
- **각 옵션**: 보이는 라벨을 `<label>`로 연결하거나 `aria-label`에 라벨+설명 요약.  
- **키보드**: `Tab`으로 그룹 진입 후 `↑/↓` 또는 `←/→`로 옵션 이동(네이티브 `<input type="radio">` 권장 시 자동). 세그먼트형 커스텀은 **Roving tabindex** 패턴으로 동일 동작 구현.  
- **포커스 가시성**: 포커스된 옵션에 **2px 이상** 눈에 띄는 링; 배경과 대비 3:1 이상 권장.  
- **상태**: `aria-disabled="true"` / `disabled` — 비활성 옵션은 포커스 받지 않음.  
- **변경 피드백**: 저장 성공 시 `aria-live="polite"` 영역에 짧은 확인 메시지(전역 토스트와 중복 시 하나만).

---

## 11. 공통 모듈 재사용 권장

| 영역 | 모듈 | 비고 |
|------|------|------|
| 테넌트/대시보드 프로필 상단 | **ContentHeader** | `COMMON_MODULES_USAGE_GUIDE.md` — 제목·부제 |
| 본문 래핑 | **ContentArea** / **ContentSection** 또는 동일 패턴 | 기존 프로필과 통일 |
| 옵션 선택 | **BadgeSelect** 또는 라디오 | §6.3 |
| 확인 모달 | **UnifiedModal** | “저장하지 않고 나가기” 등 프로필 공통 플로우에만 해당 시 |

---

## 12. i18n 키 제안

문구는 코드에 하드코딩하지 않고 아래 키로 관리한다. (값은 로케일 파일에만 작성)

| 키 | 용도 |
|----|------|
| `tenantProfile.notificationChannel.sectionTitle` | 섹션 제목 |
| `tenantProfile.notificationChannel.sectionSubtitle` | 섹션 부제 |
| `tenantProfile.notificationChannel.optionTenantDefault` | 옵션: 테넌트 기본 |
| `tenantProfile.notificationChannel.optionKakao` | 옵션: 카카오 알림톡 |
| `tenantProfile.notificationChannel.optionSms` | 옵션: SMS |
| `tenantProfile.notificationChannel.optionTenantDefaultDescription` | 테넌트 기본 설명 |
| `tenantProfile.notificationChannel.optionKakaoDescription` | 카카오 설명 |
| `tenantProfile.notificationChannel.optionSmsDescription` | SMS 설명 |
| `tenantProfile.notificationChannel.hintSmsUnavailable` | SMS 미사용 테넌트 안내 |
| `tenantProfile.notificationChannel.hintKakaoUnavailable` | 카카오 미사용 테넌트 안내 |
| `tenantProfile.notificationChannel.hintNoChannelConfigured` | 채널 미설정 테넌트 안내 |
| `tenantProfile.notificationChannel.hintPreferenceResetToTenantDefault` | 충돌 시 기본으로 보정 안내 |
| `tenantProfile.notificationChannel.save` | 저장 버튼 (프로필 전역 저장과 분리 시) |
| `tenantProfile.notificationChannel.saved` | 저장 완료 피드백 |
| `tenantProfile.notificationChannel.adminReadOnlyHint` | 관리자 읽기 전용 안내 |

어드민 전용 문구가 필요하면 `admin.userProfile.notificationChannel.*` 네임스페이스 병행 ([TBD]).

---

## 13. 구현 체크리스트·TBD 정합

- [ ] PENCIL 체크리스트: 색상·섹션 블록·타이포·반응형·토큰 명시 충족  
- [ ] CLIENT / CONSULTANT / ADMIN 노출·편집 §3.2 준수  
- [ ] AdminCommonLayout 화면 vs 일반 프로필 §4 구분  
- [ ] §7 모든 가용성 상태 UI 정의 반영  
- [ ] 접근성 §10 검증 (키보드·스크린 리더)  
- [ ] explore 산출 **실제 컴포넌트 경로**를 본 절에 표로 추가 (예: 프로필 페이지, 폼 organism)

**[TBD: 경로] 정합 표 (explore 후 채움)**

| 항목 | 경로 |
|------|------|
| 클라이언트 프로필 페이지/섹션 | TBD |
| 상담사 프로필 페이지/섹션 | TBD |
| 어드민 사용자 상세(해당 시) | TBD |

---

**문서 끝**
