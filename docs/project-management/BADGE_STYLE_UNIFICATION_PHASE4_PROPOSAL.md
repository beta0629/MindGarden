# 배지 스타일 통일 Phase 4 — 등급·레벨 배지 정리 제안서

**상위 문서**: `BADGE_STYLE_UNIFICATION_PLAN.md` §2.2·§2.3·§3.1 4·5항  
**목적**: 등급 배지(mg-v2-grade-badge) 용도 분리 제안, 레벨 배지(mg-v2-consultant-level-badge) 토큰·단일 소스 검토 제안.  
**산출**: core-component-manager. **구현 위임**: core-coder.

---

> **Phase 4 core-coder 구현 시 참고**: 본 제안서의 "구현 체크리스트"와 "파일·변경 유형"을 따라 구현하시고, 완료 후 BADGE_STYLE_UNIFICATION_PLAN.md Phase 4 완료 기준을 충족했는지 확인해 주세요.

---

## 1. 등급 배지(mg-v2-grade-badge) 현황 정리

### 1.1 사용처와 의미 혼용

| 파일 | 사용 방식 | 의미(용도) | 비고 |
|------|-----------|------------|------|
| **ClientComprehensiveManagement/ClientOverviewTab.js** | `className="mg-v2-grade-badge"` (모디파이어 없음) | **등급 표시** (브론즈/실버/골드 등) — `gradeIcon` + `gradeKorean` | 등급 전용으로만 사용됨 |
| **ConsultationCompletionStatsView.js** | `mg-v2-grade-badge` + `mg-v2-grade-badge-active` / `mg-v2-grade-badge-inactive` | **등급 유무** — "등급 한글" vs "미설정" | active=설정됨, inactive=미설정 → "상태"처럼 쓰임 |
| **StaffManagement.js** | `mg-v2-profile-card__badges` 만 사용 | 역할명(ROLE_DISPLAY_NAMES) 표시 | grade-badge 클래스 미사용 (계획서의 "활성/비활성" 표기는 예전 스펙 또는 다른 뷰일 수 있음) |

**정리**:
- **등급(브론즈/실버/골드)** 와 **등급 유무(설정됨/미설정)** 가 같은 클래스 `mg-v2-grade-badge` 에서:
  - ClientOverviewTab: 순수 **등급** 표시 → `mg-v2-grade-badge` 단일 클래스.
  - ConsultationCompletionStatsView: **등급 있음/없음** 표시에 `-active`/`-inactive` 사용 → "상태" 의미에 가깝고, 현재 CSS에서 active/inactive 모두 `--color-bg-secondary` 로 동일해 시각적 구분이 없음.

### 1.2 스타일 정의 소스 (중복)

| 위치 | 내용 | 비고 |
|------|------|------|
| **unified-design-tokens.css** (약 11297라인) | `.mg-v2-grade-badge` (padding 6px 12px, font-size-xs, color-secondary) + `.mg-v2-grade-badge-active` / `.mg-v2-grade-badge-inactive` (둘 다 background: var(--color-bg-secondary)) | active/inactive 색상 동일 → 구분 없음 |
| **unified-design-tokens.css** (약 15314라인) | `.mg-v2-grade-badge` (display inline-block, spacing-xs/sm, border-radius-full, color-bg-secondary, font-size-xs, font-weight-medium, color-text-secondary) | 두 번째 정의 — **중복** |
| **unified-design-tokens.css** (약 10621라인) | `.mg-v2-client-grade-badge` | 클라이언트 전용 별도 클래스 (스크립트에서 mg-v2-client-grade-badge 로 치환 제안 있음) |

**레거시 참고**: `dashboard-common-v3.css` 에는 `mg-grade-badge`(v2 아님) + `--client-bronze`, `--client-silver`, `--consultant-junior` 등 **등급별 색상** 모디파이어가 있음. 프로젝트는 현재 `mg-v2-*` 체계를 쓰므로, 등급별 색상이 필요하면 v2 체계로 이관 검토 대상.

---

## 2. 등급 배지 — 용도 분리 제안

### 2.1 제안 요약

1. **등급 전용**  
   - **의미**: 내담자/상담사 **등급 이름** 표시(브론즈/실버/골드 등).  
   - **클래스**: `mg-v2-grade-badge` (기본) + 필요 시 등급별 모디파이어(예: `mg-v2-grade-badge--bronze`, `--silver`, `--gold`)는 **선택** 사항(현재 ClientOverviewTab은 모디파이어 없이 텍스트만 표시).  
   - **스타일**: 한 곳에서만 정의(예: unified-design-tokens.css 한 블록 또는 공통 grade-badge 전용 CSS).  
   - **사용처**: ClientOverviewTab 등 "등급 이름"만 보여주는 곳.

2. **상태 전용(등급 유무 아님)**  
   - **의미**: "등급 설정됨" vs "등급 미설정" 같은 **설정 유무/상태** 표시.  
   - **제안**: **StatusBadge** 또는 상태용 배지 클래스로 분리.  
   - **이유**: "활성/비활성"과 같은 **상태** 표시는 이미 `StatusBadge` + `mg-v2-status-badge` + variant(success/neutral 등)로 통일 중이므로, "설정됨/미설정"도 **상태**로 취급해 StatusBadge(variant 또는 새 상태값) 또는 **상태 전용 모디파이어** 로 처리하는 것이 일관됨.  
   - **사용처**: ConsultationCompletionStatsView — "등급 있음/없음" → StatusBadge에 `status`(또는 variant)로 "설정됨"/"미설정" 표시하거나, `mg-v2-status-badge` + `mg-v2-badge--success`/`mg-v2-badge--neutral` 등으로 통일.

3. **클래스명 정리**  
   - `mg-v2-grade-badge-active` / `mg-v2-grade-badge-inactive` 는 **등급**이 아니라 **상태** 의미이므로, 등급 전용 스타일에서는 제거하고, 상태 표시는 StatusBadge/status-badge 체계로 이전하는 것을 권장.

### 2.2 core-coder 구현 시 구체 항목·파일 목록 (등급 배지)

| 번호 | 구분 | 파일 | 변경 유형 | 내용 |
|------|------|------|-----------|------|
| 1 | 스타일 | `frontend/src/styles/unified-design-tokens.css` | 정리·통합 | `.mg-v2-grade-badge` 정의 **한 곳**만 유지. 두 번째 블록(약 15314라인) 제거 또는 첫 번째 블록과 통합. |
| 2 | 스타일 | `frontend/src/styles/unified-design-tokens.css` | 정리 | `.mg-v2-grade-badge-active` / `.mg-v2-grade-badge-inactive` 는 **상태** 용도이므로: (A) 제거 후 ConsultationCompletionStatsView를 StatusBadge로 변경하거나, (B) 단기적으로라도 "설정됨/미설정"에 맞는 시각적 구분(예: success/neutral 배경)으로 수정. |
| 3 | 컴포넌트 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientOverviewTab.js` | 유지·확인 | `mg-v2-grade-badge` 는 등급 전용으로만 사용 중이므로 유지. 통일된 단일 스타일 소스 적용 후 시각만 확인. |
| 4 | 컴포넌트 | `frontend/src/components/ui/Statistics/ConsultationCompletionStatsView.js` | 변경 | "등급 있음/없음" 표시를 **StatusBadge** 사용으로 전환(예: status 또는 variant로 "설정됨"/"미설정" 매핑). 또는 상태 배지용 모디파이어만 사용하고 `mg-v2-grade-badge-active`/`-inactive` 제거. |
| 5 | 참고 | `frontend/src/styles/unified-design-tokens.css` (10621라인) | 검토 | `.mg-v2-client-grade-badge` 가 실제 사용되는지 검색. 미사용 시 제거 또는 ClientOverviewTab과 통합(클래스명 통일) 검토. |

---

## 3. 레벨 배지(mg-v2-consultant-level-badge) 현황·토큰 검토

### 3.1 사용처

| 파일 | 사용 방식 | 비고 |
|------|-----------|------|
| **ProfileCard.css** | `.mg-v2-consultant-level-badge` + `--junior`, `--manier`, `--senior`, `--expert`, `--master` 모디파이어 정의 | **단일 스타일 소스** |
| **ConsultantComprehensiveManagement.js** | `mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}` (level = getConsultantBadgeDisplay 반환값) | 일관된 모디파이어 사용 |

**단일 소스**: 레벨 배지 스타일은 **ProfileCard.css 한 곳**에만 정의되어 있음 → 유지 권장.

### 3.2 토큰 변수명 검토

**ProfileCard.css** 현재 사용 변수:

| 모디파이어 | 배경용 변수 | 글자용 변수 | fallback |
|------------|-------------|-------------|----------|
| `--junior` | `--ad-b0kla-blue-bg` | `--ad-b0kla-blue` | `--mg-info-100` / `--mg-info-600` |
| `--manier` | `--ad-b0kla-orange-bg` | `--ad-b0kla-orange` | `--mg-warning-100` / `--mg-warning-600` |
| `--senior` | `--ad-b0kla-green-bg` | `--ad-b0kla-green` | `--mg-success-100` / `--mg-success-600` |
| `--expert` | `--mg-primary-100` | `--mg-primary-600` | 인라인 fallback #e0e7ff / #4f46e5 |
| `--master` | `--mg-warning-100` | `--mg-warning-700` | 인라인 fallback #fef3c7 / #b45309 |

**프로젝트 표준** (DESIGN_CENTRALIZATION_STANDARD.md):  
- "모든 색상, 간격, 폰트는 반드시 **`var(--mg-...)`** 형태의 CSS 변수만 사용"  
- `--ad-b0kla-*` 는 어드민 대시보드 B0KlA 전용 변수로, 레벨 배지는 여러 화면(ConsultantComprehensiveManagement 등)에서도 쓰이므로 **공통 토큰**으로 두는 것이 일관됨.

**제안**:
- **옵션 A (권장)**: 레벨 배지 색상은 **`--mg-*` 만 사용**하도록 통일.  
  - junior → `--mg-info-100` / `--mg-info-600`  
  - manier → `--mg-warning-100` / `--mg-warning-600`  
  - senior → `--mg-success-100` / `--mg-success-600`  
  - expert → `--mg-primary-100` / `--mg-primary-600`  
  - master → `--mg-warning-100` / `--mg-warning-700`  
  - `--ad-b0kla-*` 제거 시 B0KlA 테마와의 연결은 상위 스코프(예: `.mg-v2-ad-b0kla`)에서 해당 `--mg-*` 변수를 오버라이드하는 방식으로 유지 가능.
- **옵션 B**: 레벨 전용 시맨틱 토큰 도입(예: `--mg-badge-level-junior-bg`, `--mg-badge-level-junior-fg`)하고, `unified-design-tokens.css` 에 한 번만 정의한 뒤 ProfileCard.css에서는 해당 토큰만 참조. B0KlA에서 필요 시 이 토큰만 재정의.

### 3.3 core-coder 구현 시 구체 항목·파일 목록 (레벨 배지)

| 번호 | 구분 | 파일 | 변경 유형 | 내용 |
|------|------|------|-----------|------|
| 6 | 스타일 | `frontend/src/components/admin/ProfileCard.css` | 토큰 통일 | 레벨 배지 모디파이어에서 `--ad-b0kla-*` 제거, **`--mg-*`** 만 사용하도록 수정(옵션 A). 또는 `--mg-badge-level-*-bg`/`-fg` 도입 시 unified-design-tokens.css에 정의 후 ProfileCard.css는 해당 토큰 참조(옵션 B). |
| 7 | 스타일 | `frontend/src/components/admin/ProfileCard.css` | 유지 | `.mg-v2-consultant-level-badge` 및 모디파이어 정의는 **단일 소스로 유지**. 다른 CSS 파일로 분리하지 않음. |
| 8 | 검토 | `frontend/src/styles/unified-design-tokens.css` | 선택 | 옵션 B 적용 시, `--mg-badge-level-junior-bg` 등 레벨 배지용 토큰을 한 블록에 정의. |

---

## 4. 구현 체크리스트 (Phase 4 core-coder용)

구현 시 아래를 순서대로 확인해 주세요.

### 4.1 등급 배지(mg-v2-grade-badge)

- [ ] **파일**: `unified-design-tokens.css`  
  - [ ] `.mg-v2-grade-badge` 정의가 **한 곳**만 존재하도록 중복 제거 또는 통합.
  - [ ] `.mg-v2-grade-badge-active` / `.mg-v2-grade-badge-inactive` 처리: ConsultationCompletionStatsView를 StatusBadge(또는 상태 배지)로 바꾸면 제거; 유지 시 "설정됨/미설정"에 맞게 색상 구분(success/neutral 등) 반영.
- [ ] **파일**: `ClientComprehensiveManagement/ClientOverviewTab.js`  
  - [ ] `mg-v2-grade-badge` 등급 전용 사용 유지, 스타일 통일 후 시각 확인.
- [ ] **파일**: `ConsultationCompletionStatsView.js`  
  - [ ] "등급 있음/없음"을 StatusBadge(또는 상태 배지) 사용으로 변경하거나, 상태 전용 모디파이어만 사용.
- [ ] **파일**: (선택) `unified-design-tokens.css`  
  - [ ] `.mg-v2-client-grade-badge` 사용처 검색 후 미사용이면 제거 또는 ClientOverviewTab과 통합 검토.

### 4.2 레벨 배지(mg-v2-consultant-level-badge)

- [ ] **파일**: `ProfileCard.css`  
  - [ ] 단일 소스 유지(다른 파일로 분리하지 않음).
  - [ ] 토큰: `--ad-b0kla-*` 제거 후 `--mg-*` 만 사용(옵션 A) 또는 `--mg-badge-level-*-*` 도입(옵션 B).
- [ ] **파일**: `ConsultantComprehensiveManagement.js`  
  - [ ] 기존 `mg-v2-consultant-level-badge mg-v2-consultant-level-badge--${level}` 사용 유지, 토큰 변경 후 시각만 확인.

### 4.3 문서·완료 기준

- [ ] Phase 4 완료 기준(BADGE_STYLE_UNIFICATION_PLAN.md §6.5):  
  - (1) grade-badge 용도 분리 또는 문서화 완료.  
  - (2) consultant-level-badge 토큰명이 프로젝트 표준(`--mg-*`)과 맞음.

---

## 5. 요약

| 항목 | 제안 요약 |
|------|-----------|
| **등급 배지** | "등급(브론즈/실버 등)" 전용은 `mg-v2-grade-badge` 유지·단일 스타일 소스로 정리. "등급 있음/없음" 등 **상태** 표시는 **StatusBadge** 또는 상태 배지 체계로 분리하고, `mg-v2-grade-badge-active`/`-inactive` 제거 또는 상태 전용으로 재정의. |
| **레벨 배지** | ProfileCard.css 단일 소스 유지. `--ad-b0kla-*` 제거 후 `--mg-*` 기반으로 통일하거나, `--mg-badge-level-*-*` 시맨틱 토큰 도입 후 한 곳에서만 정의. |

**코드 수정은 하지 않고 제안만 수행함. 구현은 core-coder가 위 체크리스트와 파일 목록을 따라 진행.**

---

*작성: core-component-manager. 구현: core-coder 위임.*
