# AdminDashboardV2 — §D 회기 소진율 (Session Burn Rate) B0KlA 스펙

**출처**: core-designer · 2026-07-29  
**핸드오프**: `docs/project-management/ADMIN_DASHBOARD_CONSULTANT_CARD_BOTTOM_CONTENT_HANDOFF.md`  
**대상**: growth-row 우측 「상담사 별 통합데이터」카드, §C(상담일지 누락) 아래

## 1. 섹션 구조 (Organism: SessionBurnRateSection)

기존 §A~§C(`cumulative-section`, `missing-logs-section`)와 동일 계층. 카드 하단 stretch 여백을 내용으로 채움. **뷰 탭 추가 금지**. 기본 읽기 전용 progress.

마크업 골격:
- section.mg-v2-ad-b0kla__session-burn-section
  - .mg-v2-ad-b0kla__session-burn-header
    - h4.mg-v2-ad-b0kla__session-burn-title 「회기 소진율」
    - span.mg-v2-ad-b0kla__session-burn-hint 「현재 활성 매칭」
  - .mg-v2-ad-b0kla__integrated-progress-list
    - .mg-v2-ad-b0kla__integrated-progress-row
      - rank / name / track+fill / value%
      - (선택) .mg-v2-ad-b0kla__session-burn-remaining 「잔여 N회」

(선택 §E `.mg-v2-ad-b0kla__deposit-pending-chip` — 본 배치 P0는 §D만 필수)

## 2. 클래스·토큰 (Hex 하드코딩 금지)

### session-burn-section
- border-top: 1px solid var(--mg-v2-color-border-default)
- padding-top / margin-top: var(--mg-v2-spacing-lg)
- flex column, gap var(--mg-v2-spacing-md)

### header / title / hint
- header: flex, space-between, align center
- title: var(--ad-b0kla-title-color) 또는 var(--mg-v2-color-text-primary); font-size sm; weight semibold
- title::before 좌측 악센트 4×14 radius 2, background var(--mg-color-primary-main) — §A~§C와 동일하면 기존 title 패턴 정렬
- hint: var(--mg-v2-color-text-secondary), font-size xs

### rows
- 기존 integrated-progress-* 재사용
- remaining: text-tertiary, xs, margin-left sm

### empty .mg-v2-ad-b0kla__session-burn-empty
- color secondary, sm, center, padding xl 0
- background var(--mg-v2-color-surface-raised); radius md

## 3. 상태
Loading=카드와 동기 / Filled=DESC max 10 / Empty=ACTIVE 집계 0

## 4. 반응형
growth-row 1열 시 width 100%; progress row padding-block ≥12px

## 5. 코더 체크리스트
뷰탭 없음, maskEncryptedDisplay, PII 비노출, 토큰만, integrated-progress 재사용, empty, 기간 pill 독립 ACTIVE 스냅샷, safeDisplay/#130
