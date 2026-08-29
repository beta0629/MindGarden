# `/erp/salary` 급여 늦은 일지·추가 정산 UI/UX 스펙

**문서 버전**: 1.0.0  
**작성일**: 2026-08-29  
**담당**: core-designer (시각 스펙·레이아웃 설계만 · 코드 작성 없음)  
**라우트**: `/erp/salary` — `frontend/src/components/erp/SalaryManagement.js`  
**브랜드·비주얼 SSOT**: Core Solution Clinic-OS (`docs/design-system/CLINIC_OS_ADMIN_VISUAL_SSOT.md`)  
**참조 계획서**: `docs/project-management/SALARY_LATE_NOTES_ADJUSTMENT_PLAN.md`  
**적용 스킬**: `/core-solution-design-handoff`, `/core-solution-atomic-design`

---

## 1. 개요 및 배경

### 1.1 목적
급여 확정 이후 늦게 작성된 상담일지 또는 늦게 완료(`COMPLETED`)된 회기가 발생했을 때, 해당 회기를 다음 달로 이월하지 않고 **당월 급여 내에서 정확하게 정산**할 수 있는 UI/UX를 제공한다.
- **미지급 상태 (CALCULATED / APPROVED)**: 기존 `PRIMARY` 행 제자리 갱신(**다시 계산**)
- **지급완료 상태 (PAID)**: 신규 `ADJUSTMENT` 행 추가(**빠진 회기 추가 정산**)

### 1.2 사용자 및 권한
- **대상 사용자**: 센터장 및 운영 관리자 (`SALARY_MANAGE` 권한 보유자)
- **접근 경로**: 어드민 LNB → ERP 관리 → 급여 관리 (`/erp/salary`)
- **주요 과업**:
  1. 확정 전: 미완료 회기 및 일지 미작성 건수를 사전에 확인하여 누락 방지
  2. 확정 후: 늦게 완료된 회기 감지 시 상태(지급 전/후)에 맞는 적절한 액션 1클릭 실행
  3. 목록 조회: 기본 급여(`PRIMARY`)와 추가 정산(`ADJUSTMENT`) 내역을 명확히 구분하여 확인

---

## 2. 사용성 및 정보 노출 원칙

### 2.1 사용성 흐름 (Flow)
1. **기간·상담사 선택**: 상단 툴바에서 조회 기간(월) 및 상담사 선택
2. **확정 전 (Pre-confirm)**:
   - 계산 미리보기 영역에 기간 내 **미완료 회기** 및 **일지 미작성** 건수가 있을 경우 경고 배너 노출
   - 운영자가 인지 후 확정 진행 (하드 블록 없이 경고 정보 제공)
3. **확정 후 (Post-confirm - PRIMARY 행)**:
   - 시스템 저장 완료 건수 대비 현재 `COMPLETED` 회기가 증가한 경우(Delta > 0), "확정 후 추가 완료 회기 n건" 알림 표시
   - **미지급(CALCULATED/APPROVED)**: `[다시 계산]` 버튼 제공 → 제자리 UPDATE
   - **지급완료(PAID)**: `[빠진 회기 추가 정산]` 버튼 제공 → 신규 `ADJUSTMENT` INSERT
4. **추가 정산 행 (ADJUSTMENT 행)**:
   - 목록 내 독립 행으로 표시되며, `[추가 정산]` 배지와 정산 금액(`1,234원` 포맷) 노출
   - 개별 ID 단위로 승인/지급 처리 (기존 플로우와 동일)

### 2.2 정보 노출 규칙 (Information Disclosure)

| 구분 | 노출 항목 | 노출 조건 / 형식 | 비노출 (은닉) 항목 |
|------|-----------|-------------------|-------------------|
| **확정 전** | • 이 기간에 완료 아닌 회기 `n`건<br>• 일지 미작성 `n`건 | 건수 `n > 0`일 때만 경고 배너 노출 (`n = 0`이면 배너 숨김) | 기술적 에러 로그, 내부 쿼리 상태 |
| **확정 후 (PRIMARY)** | • 확정 후 추가 완료 회기 `n`건<br>• 상태별 CTA 버튼 | 현재 COMPLETED > 저장된(PRIMARY+ADJ) 회기 수일 때만 노출 | 다음 달 이월 옵션 (이월 정책 금지) |
| **추가 정산 (ADJUSTMENT)** | • 배지: `추가 정산`<br>• 금액: `formatCurrency(amount)` (예: `30,000원`)<br>• 회기: `+1건` 등 | `calculation_kind === 'ADJUSTMENT'`인 행 | `special_support` 재지급 UI (SS는 lifetime 1회), 회계 분개(FT) 내부 구조 |

---

## 3. Visual SSOT — Clinic-OS 시각 언어 규격

본 화면은 `CLINIC_OS_ADMIN_VISUAL_SSOT.md`를 100% 준수하며, 레거시 Pencil/B0KlA의 좌측 4px 악센트 바를 엄격히 금지합니다.

### 3.1 비주얼 규격 계약

```
+-----------------------------------------------------------------------------+
| Clinic-OS Visual Contract                                                   |
| 1. Accent Bar 금지: 섹션 좌측 4px 세로 바(녹색/갈색) 완전 제거               |
| 2. Text Slate: 기본 텍스트 #0F172A, 보조 텍스트 #475569                     |
| 3. Dusty Teal MGButton: Solid Primary #0E5F5A (Hover #0A4F4B)                |
| 4. 4 Type Steps: h1(28px), h2(22px), body-md(14px), caption(12px)          |
| 5. Page-Custom Hex 금지: 정의된 디자인 토큰 var(--mg-v2-*)만 사용            |
| 6. 한국어 짧은 명사구: 직관적이고 간결한 레이블 유지                         |
| 7. 반응형: 768px 미만 모바일에서 경고 텍스트 및 액션 버튼 세로 스택          |
+-----------------------------------------------------------------------------+
```

### 3.2 타이포그래피 (4-step SSOT)

| 단계 | 토큰 | 크기 / Line-height | Weight | 적용 대상 |
|------|------|-------------------|--------|-----------|
| **h1** | `--mg-v2-font-size-h1` | 1.75rem (28px) / 1.3 | 700 bold | 페이지 제목 (`급여 관리`) |
| **h2** | `--mg-v2-font-size-h2` | 1.375rem (22px) / 1.4 | 600 semibold / 700 bold | 섹션 제목, 주요 금액 표시 |
| **body-md** | `--mg-v2-font-size-body-md` | 0.875rem (14px) / 1.5 | 400 regular / 500 medium | 카드 본문, 버튼 텍스트, 테이블 셀, 경고 문구 |
| **caption** | `--mg-v2-font-size-caption` | 0.75rem (12px) / 1.4 | 500 medium / 600 semibold | 상태 배지, 보조 설명, 항목 레이블 |

---

## 4. 레이아웃 구조 및 와이어프레임

### 4.1 전체 레이아웃 구조 (Desktop)
`AdminCommonLayout` 내부의 `ContentArea`를 사용하며, 본문 내 계산 블록의 기하를 정돈합니다.

```
+-----------------------------------------------------------------------------------------------+
| AdminCommonLayout (Sidebar 260px 고정 + GNB Header)                                           |
+-----------------------------------------------------------------------------------------------+
| ContentHeader: "급여 관리" + [프로필 관리] [세무 통계] [인쇄]                                  |
+-----------------------------------------------------------------------------------------------+
| [필터 툴바] 기간 선택 (YYYY-MM) | 상담사 선택                                                 |
+-----------------------------------------------------------------------------------------------+
| [Section 1: 급여 계산 미리보기 / 확정 영역]                                                  |
|  +-----------------------------------------------------------------------------------------+  |
|  | [경고 배너] ⚠️ 이 기간에 완료 아닌 회기 2건 | 일지 미작성 1건                             |  |
|  +-----------------------------------------------------------------------------------------+  |
|  | 미리보기 요약 (상담료 + 제수당 - 세금 = 실지급액)                                       |  |
|  |                                                                 [ 급여 계산 확정 ] (Teal)|  |
|  +-----------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------------+
| [Section 2: 급여 계산 내역 (월별 목록)]                                                       |
|  +-----------------------------------------------------------------------------------------+  |
|  | [PRIMARY 카드] 2026-08 정기 급여 | [승인완료]                                           |  |
|  | 상담 10건 · 지급총액 600,000원 · 세금 19,800원 · 실지급액 580,200원                     |  |
|  | --------------------------------------------------------------------------------------- |  |
|  | ℹ️ 확정 후 추가 완료 회기 1건 감지됨                                                     |  |
|  | Actions: [다시 계산 (Secondary)]  [지급 처리 (Primary Teal)]  [명세서] [인쇄]          |  |
|  +-----------------------------------------------------------------------------------------+  |
|  | [ADJUSTMENT 카드] 2026-08 [추가 정산] | [계산완료]                                       |  |
|  | 추가 완료 1건 · 정산총액 60,000원 · 세금 1,980원 · 추가 실지급액 58,020원               |  |
|  | Actions: [승인 (Primary Teal)]  [명세서] [인쇄]                                         |  |
|  +-----------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------------+
```

### 4.2 모바일 레이아웃 (<768px)
- 경고 배너: 텍스트와 보조 링크가 1열 세로 스택
- 카드 액션 영역: 버튼들이 가로 나열 대신 full-width 세로 스택으로 전환 (`--mg-v2-touch-target-min: 44px`)
- 상태 배지와 기간이 상하로 정렬

---

## 5. 아토믹 컴포넌트 계층 목록 (Atoms ~ Organisms)

### 5.1 Atoms (원자)

| 컴포넌트명 | 용도 | 사용 토큰 / 스타일 | 재사용 여부 |
|------------|------|-------------------|-------------|
| `MGButton` (Primary) | "빠진 회기 추가 정산", "급여 확정", "승인" 등 메인 CTA | fill: `var(--mg-v2-color-primary-solid)` (`#0E5F5A`), label: `#FAF9F7`, radius: `var(--mg-v2-radius-md)` (10px), height: 40px (desktop) / 44px (mobile) | 공통 컴포넌트 (`MGButton`) |
| `MGButton` (Secondary / Outline) | "다시 계산", "세금 상세", "명세서" 등 보조 액션 | bg: transparent, border: `1px solid var(--mg-v2-color-neutral-300)`, text: `var(--mg-v2-color-text-primary)` (`#0F172A`) | 공통 컴포넌트 (`MGButton`) |
| `StatusBadge` | 급여 상태 표기 (`계산완료`, `승인완료`, `지급완료`) | `CALCULATED`: neutral-200/slate<br>`APPROVED`: info-light/info-blue<br>`PAID`: success-light/success-green | 공통 컴포넌트 (`StatusBadge`) |
| `AdjustmentBadge` | 추가 정산 구분 배지 (`추가 정산`) | bg: `var(--mg-v2-color-semantic-info-light)`, text: `var(--mg-v2-color-semantic-info-dark)`, border: `1px solid var(--mg-v2-color-semantic-info)` | `StatusBadge` variant |
| `SafeText` | 문자열 안전 렌더링 | XSS 방지 및 fallback 텍스트 처리 | 공통 모듈 (`SafeText`) |
| `WarningIcon` | 경고 표시 아이콘 | color: `var(--mg-v2-color-semantic-warning)` (`#D97706`), size: 16px | 인라인 SVG / Icon |

### 5.2 Molecules (분자)

| 컴포넌트명 | 구성 및 역할 | 시각 스타일 / 토큰 |
|------------|--------------|-------------------|
| `SalaryPreConfirmWarningBanner` | 확정 전 미완료 회기 및 미작성 일지 경고 배너.<br>• Warning Icon<br>• 문구: `"이 기간에 완료 아닌 회기 n건"` / `"일지 미작성 n건"` | bg: `var(--mg-v2-color-semantic-warning-light)` (`#FFFBEB`)<br>border: `1px solid var(--mg-v2-color-semantic-warning)` (`#D97706`)<br>text: `var(--mg-v2-color-neutral-900)` (`#0F172A`)<br>padding: `var(--mg-v2-space-3)` `var(--mg-v2-space-4)` (12px 16px)<br>radius: `var(--mg-v2-radius-md)` (10px) |
| `SalaryLateSessionNoticeBar` | 확정 후 PRIMARY 카드 내 추가 완료 회기 알림 바.<br>• Info Icon<br>• 문구: `"확정 후 추가 완료 회기 n건"` | bg: `var(--mg-v2-color-semantic-info-light)` (`#F0F9FF`)<br>border: `1px solid var(--mg-v2-color-semantic-info-dark)`<br>text: `var(--mg-v2-color-text-primary)` (`#0F172A`)<br>padding: `8px 12px`<br>radius: `var(--mg-v2-radius-sm)` (6px) |
| `SalaryDetailRow` | 항목별 명칭과 금액 표기 (예: `상담료`, `세금 공제`, `실지급액`).<br>• 금액 포맷: `formatCurrency()` + `tabular-nums` | text: `var(--mg-v2-color-text-secondary)`, value: `var(--mg-v2-color-text-primary)` (총액/실지급액은 font-weight 700) |
| `SalaryCardActionGroup` | 카드 하단 액션 버튼 그룹.<br>• PRIMARY/ADJUSTMENT 상태에 따른 동적 버튼 배치 | display: flex, gap: `var(--mg-v2-space-2)` (8px), align-items: center |

### 5.3 Organisms (유기체)

| 컴포넌트명 | 역할 및 포함 요소 |
|------------|-------------------|
| `SalaryPreviewSection` | 계산 대상 미리보기 영역.<br>• 기간 정보, 상담사명, 요약 금액 그리드<br>• `SalaryPreConfirmWarningBanner` (n>0 시 조건부 렌더링)<br>• 메인 CTA `[급여 계산 확정]` |
| `SalaryCalculationCard` (`PRIMARY`) | 당월 기본 급여 계산 카드.<br>• 헤더: 대상 월 + 상태 배지 (`승인완료`, `지급완료` 등)<br>• 상세 행: 상담 건수, 기본급, 수당, 세액, 실지급액<br>• 늦은 회기 발생 시 `SalaryLateSessionNoticeBar` 노출<br>• 액션: 미지급 시 `[다시 계산]` 버튼 노출, 지급완료 시 `[빠진 회기 추가 정산]` 버튼 노출 |
| `SalaryCalculationCard` (`ADJUSTMENT`) | 추가 정산 전용 카드.<br>• 헤더: 대상 월 + `[추가 정산]` 배지 + 상태 배지<br>• 상세 행: 추가 상담 건수(Delta), 정산 금액, 세액, 추가 실지급액<br>• 액션: 표준 승인/지급 버튼 (id 단위 독립 실행) |
| `SalaryCalculationsList` | 급여 계산 목록 컨테이너.<br>• PRIMARY 카드를 상단에 배치하고, 해당 부모에 종속된 ADJUSTMENT 카드들을 바로 하단에 시각적 계층 구조로 나열 |

---

## 6. 상태별 UI 매트릭스 (State UI Matrix)

| 화면 상태 / 시점 | 데이터 조건 | 표시 배지 및 알림 문구 | 노출 액션 버튼 (우선순위 순) | 버튼 스타일 / Variant |
|-----------------|------------|------------------------|------------------------------|-----------------------|
| **1. 확정 전 미리보기** (경고 없음) | 미완료 = 0<br>일지미작성 = 0 | 경고 배너 없음 | `[급여 계산 확정]` | Solid Primary (`#0E5F5A`) |
| **2. 확정 전 미리보기** (경고 발생) | 미완료 > 0 또는<br>일지미작성 > 0 | ⚠️ `"이 기간에 완료 아닌 회기 n건"`<br>⚠️ `"일지 미작성 n건"` | `[급여 계산 확정]` (비활성화 안 함, 경고 동반) | Solid Primary (`#0E5F5A`) |
| **3. CALCULATED** (PRIMARY, 추가회기 없음) | Delta = 0 | `[계산완료]` 배지 | 1. `[승인]`<br>2. `[세금 상세]`<br>3. `[명세서]` | 1. Solid Primary<br>2. Secondary<br>3. Secondary |
| **4. CALCULATED** (PRIMARY, 추가회기 발생) | Delta > 0 | `[계산완료]` 배지<br>ℹ️ `"확정 후 추가 완료 회기 n건"` | 1. `[다시 계산]`<br>2. `[승인]`<br>3. `[세금 상세]` | 1. **Secondary (Outline)**<br>2. Solid Primary<br>3. Secondary |
| **5. APPROVED** (PRIMARY, 추가회기 없음) | Delta = 0 | `[승인완료]` 배지 | 1. `[지급 처리]`<br>2. `[세금 상세]`<br>3. `[명세서]` | 1. Solid Primary<br>2. Secondary<br>3. Secondary |
| **6. APPROVED** (PRIMARY, 추가회기 발생) | Delta > 0 | `[승인완료]` 배지<br>ℹ️ `"확정 후 추가 완료 회기 n건"` | 1. `[다시 계산]` (클릭 시 CALCULATED로 전환 안내)<br>2. `[지급 처리]`<br>3. `[세금 상세]` | 1. **Secondary (Outline)**<br>2. Solid Primary<br>3. Secondary |
| **7. PAID** (PRIMARY, 추가회기 없음) | Delta = 0 | `[지급완료]` 배지 | 1. `[세금 상세]`<br>2. `[명세서]`<br>3. `[인쇄]` | 전부 Secondary |
| **8. PAID** (PRIMARY, 추가회기 발생) | Delta > 0 | `[지급완료]` 배지<br>ℹ️ `"확정 후 추가 완료 회기 n건"` | 1. **`[빠진 회기 추가 정산]`**<br>2. `[세금 상세]`<br>3. `[명세서]` | 1. **Solid Primary (`#0E5F5A`)**<br>2. Secondary<br>3. Secondary |
| **9. ADJUSTMENT 행** (CALCULATED) | kind = ADJUSTMENT | `[추가 정산]` 배지<br>`[계산완료]` 배지 | 1. `[승인]`<br>2. `[세금 상세]`<br>3. `[명세서]` | 1. Solid Primary<br>2. Secondary<br>3. Secondary |
| **10. ADJUSTMENT 행** (APPROVED) | kind = ADJUSTMENT | `[추가 정산]` 배지<br>`[승인완료]` 배지 | 1. `[지급 처리]`<br>2. `[세금 상세]`<br>3. `[명세서]` | 1. Solid Primary<br>2. Secondary<br>3. Secondary |
| **11. ADJUSTMENT 행** (PAID) | kind = ADJUSTMENT | `[추가 정산]` 배지<br>`[지급완료]` 배지 | 1. `[세금 상세]`<br>2. `[명세서]`<br>3. `[인쇄]` | 전부 Secondary |

---

## 7. 디자인 토큰 및 CSS 변수 매핑표

개발 시 임의의 Hex 값이나 인라인 CSS를 사용하지 않고, 반드시 아래 명시된 변수만을 사용합니다.

| UI 요소 / 영역 | CSS 변수명 (`unified-design-tokens.css`) | Hex Fallback (참고용) | 설명 / 용도 |
|----------------|------------------------------------------|-----------------------|-------------|
| **기본 텍스트** | `var(--mg-v2-color-text-primary)` | `#0F172A` | 모든 카드 본문, 라벨, 금액 텍스트 |
| **보조 텍스트** | `var(--mg-v2-color-text-secondary)` | `#475569` | 보조 설명, 항목 헤더 라벨 |
| **Primary Solid CTA** | `var(--mg-v2-color-primary-solid)` | `#0E5F5A` | "빠진 회기 추가 정산", "급여 확정", "승인" |
| **Primary CTA Hover** | `var(--mg-v2-color-primary-hover)` | `#0A4F4B` | Primary 버튼 마우스 오버 / 활성 상태 |
| **Primary CTA Text** | `var(--mg-v2-color-neutral-50)` | `#FAF9F7` | Primary 버튼 내부 텍스트 색상 |
| **Secondary Button Border**| `var(--mg-v2-color-neutral-300)` | `#D4CFC8` | "다시 계산", "세금 상세" 외곽선 |
| **카드 배경 (Surface)** | `var(--mg-v2-color-neutral-100)` | `#F5F3EF` | 계산 카드 및 미리보기 카드 배경 |
| **카드 테두리 (Hairline)** | `var(--mg-v2-color-border-default)` | `#D4CFC8` | 1px 외곽 테두리 (accent bar 대체) |
| **경고 배너 배경** | `var(--mg-v2-color-semantic-warning-light)` | `#FFFBEB` | 확정 전 경고 배너 배경 |
| **경고 배너 테두리/아이콘**| `var(--mg-v2-color-semantic-warning)` | `#D97706` | 확정 전 경고 배너 테두리 및 아이콘 |
| **알림 바 배경 (Delta)** | `var(--mg-v2-color-semantic-info-light)` | `#F0F9FF` | "확정 후 추가 완료 회기" 알림 배경 |
| **알림 바 테두리 (Delta)**| `var(--mg-v2-color-semantic-info)` | `#0284C7` | "확정 후 추가 완료 회기" 알림 테두리 |
| **추가 정산 배지 텍스트** | `var(--mg-v2-color-semantic-info-dark)` | `#0369A1` | `[추가 정산]` 배지 글자색 |
| **에러 / 위험 표시** | `var(--mg-v2-color-semantic-error)` | `#A84848` | 삭제 및 실패 안내 (Muted brick red) |
| **카드 라운딩** | `var(--mg-v2-radius-lg)` | `16px` | 섹션 및 메인 카드 테두리 곡률 |
| **버튼 라운딩** | `var(--mg-v2-radius-md)` | `10px` | 모든 MGButton 외곽 곡률 |
| **알림 바 라운딩** | `var(--mg-v2-radius-sm)` | `6px` | 내부 인라인 알림 바 외곽 곡률 |
| **기본 간격 (Padding)** | `var(--mg-v2-space-6)` / `var(--mg-v2-space-4)` | `24px` / `16px` | 카드 패딩 및 섹션 간 gap |

---

## 8. 세부 UI 인터랙션 및 예외 처리

### 8.1 "다시 계산" 버튼 클릭 시
- **미지급 상태(CALCULATED/APPROVED)** 에서 운영자가 `[다시 계산]`을 클릭하면:
  1. `APPROVED` 상태였던 경우: `"급여를 다시 계산하면 승인 상태가 '계산완료'로 변경되어 재승인이 필요합니다. 계속하시겠습니까?"` 모달/확인창 안내
  2. 확인 시 `POST /api/v1/admin/salary/recalculate` 호출
  3. 성공 시 동일 calculation ID로 화면 데이터 즉시 갱신 (제자리 UPDATE), 알림 토스트 표시

### 8.2 "빠진 회기 추가 정산" 버튼 클릭 시
- **지급완료(PAID)** 상태에서 운영자가 `[빠진 회기 추가 정산]`을 클릭하면:
  1. 안내 팝업: `"지급 완료된 급여 외에 추가로 완료된 n건에 대해 추가 정산 내역을 생성합니다."`
  2. 확인 시 `POST /api/v1/admin/salary/adjustment` 호출
  3. 성공 시 목록 하단에 신규 `ADJUSTMENT` 카드가 `CALCULATED` 상태로 즉시 추가 렌더링

### 8.3 빈 데이터 및 예외 상황
- 조회 기간에 등록된 상담사가 없거나 급여 내역이 없는 경우:
  - `EmptyState` 컴포넌트 활용: 이모지 없이 `"해당 기간의 급여 계산 내역이 없습니다."` 짧은 명사구 노출
  - 레거시 B0KlA 빈 화면 스타일 사용 금지

---

## 9. 코더 전달 체크리스트 (Coder Handoff Checklist)

Phase 2에서 **core-coder**가 `SalaryManagement.js` 및 프론트엔드를 구현할 때 반드시 준수해야 하는 검증 항목입니다.

- [ ] **1. ESLint no-unneeded-ternary 준수 (CRA build:ci 필수)**
  - ❌ 금지: `const isWarning = count > 0 ? true : false;`
  - ❌ 금지: `disabled={loading ? true : false}`
  - ✅ 권장: `const isWarning = count > 0;` 또는 `Boolean(count)`
  - ✅ 권장: `disabled={Boolean(loading || confirmLoading)}`
- [ ] **2. Clinic-OS SSOT 규격 준수 (Pencil/B0KlA accent bar 완전 제거)**
  - 섹션/카드 제목 좌측에 `<span className="accent-bar" />` 또는 4px 세로 악센트 바 렌더링 코드 절대 추가 금지
  - 제목은 Slate `#0F172A` (`var(--mg-v2-color-text-primary)`), 4-step 타이포(h1, h2, body-md, caption)만 적용
- [ ] **3. 하드코딩 색상 (Hex) 금지**
  - 인라인 스타일 `style={{ color: '#0E5F5A' }}` 또는 신규 CSS 클래스에 raw hex 작성 금지
  - 반드시 `var(--mg-v2-*)` 또는 `buildErpMgButtonClassName` 공통 헬퍼 사용
- [ ] **4. 공통 컴포넌트 재사용**
  - `MGButton`, `AdminCommonLayout`, `ContentHeader`, `ContentArea`, `SafeText`, `StatusBadge` 재사용
  - 버튼 변형은 `variant="primary"` (dusty teal), `variant="secondary"` (outline) 사용
- [ ] **5. 비즈니스 로직 및 은닉 규칙 준수**
  - `special_support_monthly_payouts` 재지급/재계산 UI 노출 금지 (SS는 1회성 지급 유지)
  - `financial_transactions`(FT) 내부 거래 데이터 UI 노출 금지
  - 확정 전 경고(미완료/미작성)는 건수가 `> 0`일 때만 조건부 노출
  - 확정 후 Delta 알림은 `current COMPLETED > stored(PRIMARY+ADJ)`일 때만 노출
- [ ] **6. 모바일 반응형 처리**
  - 768px 미만 뷰포트에서 경고 배너 및 카드 하단 액션 버튼 그룹이 가로 스크롤 없이 세로로 깔끔하게 스택되는지 검증
