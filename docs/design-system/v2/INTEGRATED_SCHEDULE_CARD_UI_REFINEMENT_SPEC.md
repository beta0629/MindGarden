# 통합 스케줄 사이드바 카드 UI 개선 스펙

**작성일**: 2025-03-14  
**목적**: MappingScheduleCard 내 MappingPartiesRow·RemainingSessionsBadge·StatusBadge 세부 UI 개선  
**참조**: `INTEGRATED_SCHEDULE_CARD_FINAL_SPEC.md`, `PENCIL_DESIGN_GUIDE.md`, `unified-design-tokens.css`, `dashboard-tokens-extension.css`, B0KlA·어드민 대시보드 샘플

---

## 1. MappingPartiesRow (integrated-schedule__card-parties) — 호칭 추가

### 1.1 변경 내용

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 상담사 표기 | `김선희` | `김선희 선생님` |
| 내담자 표기 | `이재학` | `이재학 내담자` |
| 전체 예시 | `김선희→이재학` | `김선희 선생님→이재학 내담자` |

### 1.2 호칭("선생님", "내담자") 스타일 스펙

| 속성 | 값 | 토큰 |
|------|-----|------|
| **font-size** | 12px (0.75rem) | `var(--mg-font-xs)` 또는 `var(--mg-font-size-xs)` |
| **color** | #5C6B61 (보조 텍스트) | `var(--mg-color-text-secondary)` |
| **font-weight** | 400 (normal) | `var(--mg-font-normal)` 또는 `normal` |

- **B0KlA 기준**: 라벨/캡션 12px, `var(--mg-color-text-secondary)` (PENCIL_DESIGN_GUIDE 2.4 참조)
- 이름(14px, fontWeight 600)과 시각적 계층을 두기 위해 호칭은 12px, 일반 굵기 사용

### 1.3 BEM 클래스명

| 요소 | 클래스명 | 용도 |
|------|----------|------|
| 상담사 이름 | `.integrated-schedule__card-consultant` | 기존 유지 |
| 상담사 호칭 | `.integrated-schedule__card-consultant-honorific` | "선생님" |
| 화살표 | `.integrated-schedule__card-arrow` | 기존 유지 |
| 내담자 이름 | `.integrated-schedule__card-client` | 기존 유지 |
| 내담자 호칭 | `.integrated-schedule__card-client-honorific` | "내담자" |

### 1.4 마크업 구조 예시

```html
<div class="integrated-schedule__card-parties">
  <span class="integrated-schedule__card-consultant">{consultantName}</span>
  <span class="integrated-schedule__card-consultant-honorific">선생님</span>
  <span class="integrated-schedule__card-arrow" aria-hidden="true">→</span>
  <span class="integrated-schedule__card-client">{clientName}</span>
  <span class="integrated-schedule__card-client-honorific">내담자</span>
</div>
```

### 1.5 호칭 전용 CSS 스펙

| 셀렉터 | 속성 | 값 |
|--------|------|-----|
| `.integrated-schedule__card-consultant-honorific` | font-size | `var(--mg-font-xs)` |
| `.integrated-schedule__card-consultant-honorific` | color | `var(--mg-color-text-secondary)` |
| `.integrated-schedule__card-consultant-honorific` | font-weight | `normal` |
| `.integrated-schedule__card-client-honorific` | font-size | `var(--mg-font-xs)` |
| `.integrated-schedule__card-client-honorific` | color | `var(--mg-color-text-secondary)` |
| `.integrated-schedule__card-client-honorific` | font-weight | `normal` |

- 이름과 호칭 사이 간격: `margin-left: 0.25em` (또는 `var(--mg-spacing-xs)`) 권장

---

## 2. RemainingSessionsBadge (mg-v2-count-badge) — 텍스트 포맷 변경

### 2.1 변경 내용

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 포맷 | `{N}회 남음` | `{N} 회기 남음` |
| 예시 | `1회 남음`, `0회 남음` | `1 회기 남음`, `0 회기 남음` |

### 2.2 최종 텍스트 포맷

- **포맷**: `{remainingSessions} 회기 남음`
- **띄어쓰기**: 숫자와 "회기" 사이에 공백 1칸
- **용어**: "회" → "회기" (상담 회기 개념 명확화)
- **변수**: `remainingSessions`는 숫자(0 이상)

### 2.3 예시

| remainingSessions | 표시 텍스트 |
|-------------------|-------------|
| 0 | `0 회기 남음` |
| 1 | `1 회기 남음` |
| 5 | `5 회기 남음` |
| 10 | `10 회기 남음` |

- 배지 시각 스타일(font-size, padding, background, color)은 기존 `mg-v2-count-badge` 유지. **텍스트 포맷만 변경**

---

## 3. StatusBadge — 변경 없음

### 3.1 검토 결과

- **변경 불필요**: 회기 소진(SESSIONS_EXHAUSTED) 등 기존 상태 라벨·variant·스타일 유지
- **검토 완료**: 현재 `StatusBadge` (`mg-v2-status-badge`, `mg-v2-badge--*`) 스펙을 그대로 사용

---

## 4. 체크리스트

### MappingPartiesRow
- [ ] 상담사 이름 뒤 "선생님" 추가
- [ ] 내담자 이름 뒤 "내담자" 추가
- [ ] 호칭용 BEM 클래스 `integrated-schedule__card-consultant-honorific`, `integrated-schedule__card-client-honorific` 적용
- [ ] 호칭 font-size: `var(--mg-font-xs)`, color: `var(--mg-color-text-secondary)`, font-weight: `normal`

### RemainingSessionsBadge
- [ ] 텍스트 포맷 `{N} 회기 남음`으로 변경 (띄어쓰기 포함)
- [ ] 시각 스타일(mg-v2-count-badge) 유지

### StatusBadge
- [ ] 변경 없음 (검토 완료)

---

**문서 버전**: 1.0  
**다음 담당**: core-coder (JSX·CSS 구현)
