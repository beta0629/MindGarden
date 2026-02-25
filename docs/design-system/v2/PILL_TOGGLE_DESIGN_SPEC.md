# Pill Toggle 공통 디자인 스펙 (B0KlA)

**버전**: 1.0.0  
**최종 업데이트**: 2026-02-25  
**기준**: MindGarden 어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample), B0KlA 디자인 토큰  
**대상**: `.mg-v2-ad-b0kla__pill-toggle` 사용 구간 전역 — 사용자 관리 탭(상담사/내담자), 대시보드 월간/주간, 매칭 상세 탭 등

---

## 1. 개요

### 1.1 목적

- **탭 크기**: 터치·가독성 개선을 위해 기존(8px 16px, 13px)보다 조금 크게 조정.
- **선택 탭 구분**: 활성 탭이 비활성과 명확히 구분되도록 색상(배경/글자/테두리) 강화.
- **비활성 탭**: 배경·글자색으로 비활성임이 드러나도록 정의.
- **일관성**: 사용자 관리, 대시보드, 매칭 상세 등 모든 pill 토글에 동일 스펙 적용.

### 1.2 적용 페이지·위치

| 페이지/위치 | 용도 | 클래스 |
|-------------|------|--------|
| 통합 사용자 관리 `/admin/user-management` | 상담사 / 내담자 전환 | `mg-v2-ad-b0kla__pill-toggle` |
| 대시보드 | 월간 / 주간 등 뷰 전환 | 동일 |
| 매칭 목록·매칭 상세 | 탭 전환 | 동일 |
| 기타 B0KlA 스코프 내 pill 토글 | 2~N개 옵션 선택 | 동일 |

---

## 2. 수치 스펙

### 2.1 컨테이너 (`.mg-v2-ad-b0kla__pill-toggle`)

| 속성 | 값 | 비고 |
|------|-----|------|
| **display** | flex | 기존 유지 |
| **gap** | 6px | pill 간 간격 (기존 4px → 6px) |
| **padding** | 6px | 컨테이너 내부 여백 (기존 4px → 6px) |
| **border-radius** | 9999px | 풀 라운드 유지 |
| **border** | 1px solid | 테두리 색상은 §3 색상 스펙 참조 |
| **background** | 토큰 사용 | §3 참조 |

### 2.2 개별 Pill (`.mg-v2-ad-b0kla__pill`)

| 속성 | 값 | 비고 |
|------|-----|------|
| **padding** | 12px 20px | 세로 12px, 가로 20px (기존 8px 16px에서 확대) |
| **min-height** | 44px | 터치 타겟·세로 정렬 일관 (선택 시 44px 권장) |
| **font-size** | 14px | 기존 13px → 14px (가독성) |
| **font-weight** | 600 | 기존 유지 |
| **border-radius** | 9999px | 풀 라운드 |
| **border** | none (기본) / 활성 시 선택적 테두리 | §3 참조 |
| **transition** | all 0.2s ease | 기존 유지 |

### 2.3 요약 비교

| 항목 | 현재(참고) | 제안 |
|------|------------|------|
| 컨테이너 padding | 4px | 6px |
| 컨테이너 gap | 4px (일부) | 6px |
| pill padding | 8px 16px | 12px 20px |
| pill font-size | 13px | 14px |
| pill min-height | 미지정 | 44px |

---

## 3. 색상 스펙

### 3.1 토큰·Hex 기준

B0KlA·어드민 샘플 팔레트와 기존 토큰을 유지하며, **대비만 강화**합니다.

| 용도 | CSS 변수(권장) | Hex (참고) | 비고 |
|------|----------------|------------|------|
| **컨테이너 배경** | `var(--ad-b0kla-bg)` | #F9FAFB 계열 | 그레이 배경 |
| **컨테이너 테두리** | `var(--ad-b0kla-border)` | #E2E8F0 계열 | 1px |
| **활성 pill 배경** | `var(--ad-b0kla-green)` | #059669 (mg-success-600) | 주조 그린 유지 |
| **활성 pill 글자** | `#ffffff` | #ffffff | 흰색 고정 |
| **활성 pill 테두리** | 없음 또는 `var(--ad-b0kla-green)` 1px | 선택 사항: 대비 강화 시 |
| **비활성 pill 배경** | transparent | transparent | 컨테이너 배경이 비침 |
| **비활성 pill 글자** | `var(--ad-b0kla-text-secondary)` | #4B5563 계열 | 비활성임이 드러나도록 |

### 3.2 활성 탭 (`.mg-v2-ad-b0kla__pill--active`)

| 속성 | 값 |
|------|-----|
| **background** | `var(--ad-b0kla-green)` |
| **color** | `#ffffff` |
| **border** | `none` (기본). 대비 강화 시 `1px solid var(--ad-b0kla-green)` 또는 darker 톤 |
| **box-shadow** | `var(--ad-b0kla-shadow)` (선택, 기존 유지 가능) |

- 비활성 대비가 충분히 나도록 **배경을 주조 그린**, **글자를 흰색**으로 유지합니다.

### 3.3 비활성 탭 (`.mg-v2-ad-b0kla__pill`)

| 속성 | 값 |
|------|-----|
| **background** | `transparent` |
| **color** | `var(--ad-b0kla-text-secondary)` |
| **border** | `none` |

- 비활성은 **배경 없음 + 보조 텍스트색**으로 “선택되지 않음”이 명확히 보이도록 합니다.

### 3.4 선택 사항: 호버

| 대상 | 속성 | 값 |
|------|------|-----|
| **비활성 pill 호버** | color | `var(--ad-b0kla-title-color)` (더 진한 본문색) |
| | background | `transparent` 또는 `var(--ad-b0kla-bg)` (은은한 강조) |
| **활성 pill 호버** | background | `var(--ad-b0kla-green)` 유지 |
| | filter / brightness | `brightness(1.05)` 또는 미적용 |
| | color | `#ffffff` 유지 |

- transition: `all 0.2s ease` 로 부드럽게 적용합니다.

---

## 4. 공통 스펙 요약 (구현 체크리스트)

구현 시 아래를 한 세트로 적용하면, 사용자 관리·대시보드·매칭 상세 등 **모든** `.mg-v2-ad-b0kla__pill-toggle` 구간에 동일한 비주얼이 적용됩니다.

1. **컨테이너**: padding 6px, gap 6px, border-radius 9999px, border 1px, background `--ad-b0kla-bg`, border-color `--ad-b0kla-border`.
2. **Pill 공통**: padding 12px 20px, min-height 44px, font-size 14px, font-weight 600, border-radius 9999px, transition 0.2s.
3. **비활성 pill**: background transparent, color `--ad-b0kla-text-secondary`; 호버 시 color `--ad-b0kla-title-color` (선택).
4. **활성 pill**: background `--ad-b0kla-green`, color #fff, box-shadow 선택; 호버 시 brightness(1.05) 또는 유지.

---

## 5. 참조

- **디자인 시스템**: `mindgarden-design-system.pen`, `pencil-new.pen`
- **프론트 토큰**: `frontend/src/styles/dashboard-tokens-extension.css` (--ad-b0kla-*)
- **기존 pill 정의**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css` (`.mg-v2-ad-b0kla__pill-toggle`, `.mg-v2-ad-b0kla__pill`, `.mg-v2-ad-b0kla__pill--active`)
- **페이지 스펙**: `docs/design-system/UNIFIED_USER_MANAGEMENT_PAGE_SPEC.md` (§2.2 상단 타입 전환)
- **표준**: `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`, 어드민 대시보드 샘플 톤·구조
