# ERP 리뉴얼 — 분개 입력 폼·재무제표 시각화 디자인 스펙

**문서 버전**: 1.0.0  
**작성일**: 2025-03-14  
**담당**: core-designer (디자인 스펙만, 코드 작성 없음)  
**참조**: `docs/project-management/ERP_RENEWAL_PLANNING.md`, 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample, `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `mindgarden-design-system.pen`, `unified-design-tokens.css`, `dashboard-tokens-extension.css`

---

## 1. 개요 및 산출 범위

본 스펙은 ERP 리뉴얼 중 다음 두 영역의 **레이아웃·UI 스펙**을 정의한다.

| 산출물 | 대상 | 용도 |
|--------|------|------|
| **분개 입력 폼** | 차변/대변 라인별 수동 입력 화면 | 코더·퍼블리셔가 구현 가능한 상세 스펙 |
| **재무제표 시각화** | 대차대조표·손익계산서·현금흐름표 화면 | 블록 구성·데이터 표시 방식 방향 |

- **레이아웃 기준**: AdminCommonLayout  
- **비주얼 기준**: B0KlA·mindgarden-design-system.pen·unified-design-tokens  
- **접근성**: 입금확인·결제확인은 기존처럼 최소 클릭 유지; 분개 목록·재무제표 접근 경로 명확

### 아토믹 계층 (참고)

| 영역 | 계층 | 재사용 컴포넌트 |
|------|------|-----------------|
| 분개 폼 전체 | Template (AdminCommonLayout 내) | ContentHeader, ContentArea |
| 기본정보·차변·대변 섹션 | Organisms | `mg-v2-ad-b0kla__card` 등 섹션 블록 |
| 테이블·입력·버튼 | Molecules / Atoms | `mg-v2-form-label`, `mg-v2-select`, `mg-v2-input`, `mg-v2-button-primary` 등 |
| 재무제표 탭·카드·테이블 | Organisms / Molecules | `mg-v2-ad-b0kla__pill-toggle`, `mg-v2-ad-b0kla__card` |

---

## 2. LNB 메뉴 구조 (접근 경로)

자주 쓰는 동작의 접근 경로를 명확히 한다.

| 메뉴 항목 | 경로 예시 | 설명 |
|-----------|-----------|------|
| 분개 목록 | ERP > 분개 관리 > 분개 목록 | 기존 분개 조회·필터·상세 |
| 분개 입력 | ERP > 분개 관리 > 분개 입력 | 신규 수동 분개 입력 (본 스펙 대상) |
| 재무제표 | ERP > 재무제표 | 대차대조표·손익계산서·현금흐름표 조회 |
| 입금/결제 확인 | (기존 매칭·거래 화면 유지) | 별도 최소 클릭 플로우 유지 |

- LNB 아이콘: 분개 `FileText`, 재무제표 `PieChart` 또는 `BarChart3`, 입금확인 `CheckCircle` (Lucide 기준)
- 클래스: 기존 LNB 구조 `mg-v2-ad-b0kla__nav-item` 등 유지

---

## 3. 분개 입력 폼 (Journal Entry Form)

### 3.1 전체 레이아웃

**기준**: AdminCommonLayout + ContentHeader + ContentArea

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ContentHeader: 브레드크럼 | ERP > 분개 관리 > 분개 입력 | [분개 목록] 버튼 │
├─────────────────────────────────────────────────────────────────────────┤
│ ContentArea                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 섹션 1: 기본 정보 (상단)                                              │ │
│ │   [일자] [적요]                                                       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 섹션 2: 차변 라인                                                     │ │
│ │   테이블: No | 계정과목 | 금액 | [삭제] | [+ 행 추가]                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 섹션 3: 대변 라인                                                     │ │
│ │   테이블: No | 계정과목 | 금액 | [삭제] | [+ 행 추가]                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 섹션 4: 합계·균형                                                     │ │
│ │   차변 합계: ￦1,000,000 | 대변 합계: ￦1,000,000 | 균형: ✓ 또는 ✗   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 섹션 5: 액션 버튼                                                     │ │
│ │   [저장(DRAFT)] [승인] [전기]                                         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 영역별 상세 스펙

#### 3.2.1 ContentHeader

| 항목 | 클래스/토큰 | 값 |
|------|-------------|-----|
| 배경 | `var(--mg-color-background-main)` | #FAF9F7 |
| 하단 구분선 | `1px solid var(--mg-color-border-main)` | #D4CFC8 |
| 높이 | — | 56~64px |
| 브레드크럼 | `mg-v2-content-header__breadcrumb` | ERP > 분개 관리 > 분개 입력 |
| 제목 | `mg-v2-content-header__title` | 분개 입력 |
| 우측 버튼 | `mg-v2-button-secondary` | "분개 목록" (Lucide `List`) — 목록 화면으로 이동 |

#### 3.2.2 섹션 1: 기본 정보 (상단)

| 요소 | 형태 | 클래스/토큰 | 비고 |
|------|------|-------------|------|
| 컨테이너 | 섹션 블록 | 배경 `var(--mg-color-surface-main)`, 테두리 `1px solid var(--mg-color-border-main)`, border-radius 16px, 패딩 24px |
| 섹션 제목 | 좌측 악센트 + 텍스트 | 악센트 바 4px `var(--mg-color-primary-main)`, radius 2px; 텍스트 16px fontWeight 600 `var(--mg-color-text-main)` |
| 일자 | 날짜 picker 1개 | `mg-v2-form-label`, B0KlA input. 라벨 "일자", 필수 |
| 적요 | 텍스트 input 1개 | `mg-v2-form-label`, B0KlA input. 라벨 "적요", placeholder "분개 적요를 입력하세요" |
| 레이아웃 | 1~2행 | 데스크톱: 일자·적요 가로 배치; 모바일: 세로 스택 |

#### 3.2.3 섹션 2: 차변 라인 테이블

| 항목 | 클래스/토큰 | 스펙 |
|------|-------------|------|
| 컨테이너 | 섹션 블록 동일 | 배경, 테두리, radius, 패딩 24px |
| 섹션 제목 | 좌측 악센트 | 악센트 바 4px `var(--mg-success-500)` 또는 `var(--mg-color-primary-main)`, 텍스트 "차변" 16px fontWeight 600 |
| 테이블 | `mg-erp-journal-debit-table` | `thead` + `tbody`, `border-collapse` 또는 `border-spacing` |
| thead | — | No | 계정과목 | 금액 | (액션) |
| tbody 행 | `mg-erp-journal-line` | 각 행: No(자동), 계정과목(select/autocomplete), 금액(number input), 삭제 버튼 |
| 계정과목 | select 또는 autocomplete | `mg-v2-select` / `mg-v2-input`. ERP_ACCOUNT_TYPE 기반 계정 목록 |
| 금액 | number input | 오른쪽 정렬, 천 단위 콤마, `var(--mg-color-text-main)` |
| 삭제 | 버튼 | Lucide `Trash2`, `mg-v2-icon-button` 또는 텍스트 "삭제" |
| 행 추가 | 버튼 | tbody 하단 또는 테이블 아래. "+ 행 추가" (Lucide `Plus`), `mg-v2-button-secondary` |
| 빈 상태 | — | 행이 0개일 때 "행 추가" 버튼만 표시 또는 1행 빈 행 제공 |

#### 3.2.4 섹션 3: 대변 라인 테이블

- **차변 테이블과 동일 구조**. 클래스 `mg-erp-journal-credit-table`, 섹션 제목 "대변".
- 악센트 바: `var(--mg-error-500)` 또는 `var(--mg-color-secondary-main)` 로 차변과 시각적 구분 가능 (선택).

#### 3.2.5 섹션 4: 합계·균형 표시

| 항목 | 클래스/토큰 | 스펙 |
|------|-------------|------|
| 컨테이너 | `mg-erp-journal-balance-bar` | 배경 `var(--mg-color-surface-main)`, 테두리 1px, border-radius 12px, 패딩 16px 24px |
| 레이아웃 | flex 또는 grid | 차변 합계 | 대변 합계 | 균형 상태 |
| 차변 합계 | `mg-erp-journal-debit-total` | 라벨 "차변 합계" 12px `var(--mg-color-text-secondary)`, 숫자 18px fontWeight 600 `var(--mg-color-text-main)`, 오른쪽 정렬 |
| 대변 합계 | `mg-erp-journal-credit-total` | 동일 스타일 |
| 균형 상태 | `mg-erp-journal-balance-status` | 차변 합계 = 대변 합계일 때: "균형" + Lucide `Check` (색상 `var(--mg-success-500)`); 불균형일 때: "불균형" + Lucide `AlertCircle` (색상 `var(--mg-error-500)`) |
| 숫자 포맷 | — | ￦1,234,567 (천 단위 콤마) |

#### 3.2.6 섹션 5: 액션 버튼

| 버튼 | 클래스 | 용도 |
|------|--------|------|
| 저장 | `mg-v2-button-secondary` | DRAFT 상태로 저장. Lucide `Save` |
| 승인 | `mg-v2-button-secondary` | 저장된 분개 승인. Lucide `CheckCircle` |
| 전기 | `mg-v2-button-primary` | 원장 반영. Lucide `Send`. 배경 `var(--mg-color-primary-main)` |
| 레이아웃 | flex, gap 12px | 우측 정렬 또는 가로 나열. ContentArea 하단 고정 또는 스티키 |

### 3.3 토큰·클래스 요약 (분개 폼)

| 용도 | 토큰/클래스 |
|------|-------------|
| 배경 | `var(--mg-color-surface-main)`, `var(--mg-color-background-main)` |
| 테두리 | `var(--mg-color-border-main)` |
| 텍스트 | `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)` |
| 주조/성공/에러 | `var(--mg-color-primary-main)`, `var(--mg-success-500)`, `var(--mg-error-500)` |
| 섹션 블록 | 패딩 24px, radius 16px, 좌측 악센트 4px |
| 버튼 | `mg-v2-button-primary`, `mg-v2-button-secondary` |
| 폼 | `mg-v2-form-label`, `mg-v2-select`, `mg-v2-input` |

### 3.5 상태·예외 (분개 폼)

| 상태 | 표시 방식 |
|------|-----------|
| **균형** | 차변 합계 = 대변 합계일 때 "균형" + Lucide `Check`, 색상 `var(--mg-success-500)` |
| **불균형** | 차변 ≠ 대변일 때 "불균형" + Lucide `AlertCircle`, 색상 `var(--mg-error-500)`. 저장/전기 버튼 비활성화 권장 |
| **빈 행** | 차변/대변에 행이 0개일 때 "+ 행 추가" 버튼만 표시. 최소 1행 이상 입력 유도 |
| **로딩** | 저장/승인/전기 요청 중 스피너 또는 버튼 disabled |
| **에러** | API 에러 시 상단 또는 모달로 에러 메시지. Lucide `AlertTriangle` |

### 3.6 반응형

| 브레이크포인트 | 대응 |
|----------------|------|
| 데스크톱 | 3섹션(기본정보, 차변, 대변) 세로 스택; 차변/대변 테이블 가로 스크롤 가능 |
| 태블릿 | 동일; 테이블 최소 너비 유지, 가로 스크롤 |
| 모바일 | 차변/대변을 카드형(테이블 대신) 전환 고려. 또는 테이블 가로 스크블. 터치 영역 44px 이상 |

---

## 4. 재무제표 시각화 (Financial Statements)

### 4.1 전체 레이아웃

**구조**: AdminCommonLayout + ContentHeader + ContentArea

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ContentHeader: ERP > 재무제표 | 재무제표                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ ContentArea                                                              │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 상단: 기간 선택                                                       │ │
│ │   [시작일] ~ [종료일] [조회] [엑셀 다운로드]                          │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 탭: 대차대조표 | 손익계산서 | 현금흐름표                              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ 선택 탭에 따른 본문                                                   │ │
│ │   - 카드 블록 (KPI/요약)                                              │ │
│ │   - 테이블 블록 (계정별 상세)                                         │ │
│ │   - 차트 블록 (추세·비율 시각화)                                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 기간 선택 영역

| 요소 | 클래스/토큰 | 스펙 |
|------|-------------|------|
| 컨테이너 | 섹션 블록 또는 툴바 | 배경 `var(--mg-color-surface-main)`, 패딩 16~24px |
| 기간 | 날짜 2개 (시작~종료) | B0KlA date input. quick select: "이번 달" | "이번 분기" | "이번 연도" (태그 또는 드롭다운) |
| 조회 | `mg-v2-button-primary` | Lucide `Search` |
| 엑셀 | `mg-v2-button-secondary` | Lucide `Download` |
| 클래스 | `mg-erp-statement-period-bar` | |

### 4.3 탭 영역

| 항목 | 클래스/토큰 | 스펙 |
|------|-------------|------|
| 래퍼 | `mg-v2-ad-b0kla__pill-toggle` | 기존 Pill 토글 재사용 |
| 탭 | `mg-v2-ad-b0kla__pill` | 대차대조표 / 손익계산서 / 현금흐름표 |
| 활성 | `mg-v2-ad-b0kla__pill--active` | 배경 `var(--mg-color-primary-main)` |
| 아이콘 | Lucide | 대차대조표 `Scale`, 손익계산서 `TrendingUp`, 현금흐름표 `Wallet` (선택) |

### 4.4 블록 구성·데이터 표시 방식

각 탭별로 **카드 → 테이블 → 차트** 순서로 블록을 배치한다.

#### 4.4.1 대차대조표 (Balance Sheet)

| 블록 | 용도 | 데이터 표시 방식 |
|------|------|------------------|
| **카드 블록** | 자산·부채·자본 합계 요약 | 카드 3개: 총자산 / 총부채 / 순자본. 각 카드: 라벨 12px, 숫자 24px fontWeight 600. 좌측 악센트: 자산 `var(--mg-color-primary-main)`, 부채 `var(--mg-error-500)`, 자본 `var(--mg-success-500)` |
| **테이블 블록** | 계정별 상세 | 계층 구조: 자산 > 유동자산/비유동자산 > 개별 계정. 부채·자본 동일. 계정명 | 금액 | 비율(%). 클래스 `mg-erp-statement-table` |
| **차트 블록** | 구조 비율 | 도넛 또는 막대 차트. 자산/부채/자본 비율. 또는 자산 내 비유동/유동 비율 |

- 테이블: `thead` (계정과목 | 금액 | 비율), `tbody` 들여쓰기로 계층 표현 (padding-left 0 / 16px / 32px)

#### 4.4.2 손익계산서 (Income Statement)

| 블록 | 용도 | 데이터 표시 방식 |
|------|------|------------------|
| **카드 블록** | 수익·비용·순이익 요약 | 카드 3개: 총수익 / 총비용 / 순이익. 악센트: 수익 `var(--mg-success-500)`, 비용 `var(--mg-error-500)`, 순이익 `var(--mg-color-primary-main)` |
| **테이블 블록** | 계정별 상세 | 수익 > 매출/기타수익 등, 비용 > 매출원가/판관비 등. 계정명 | 금액 | 비율 |
| **차트 블록** | 수익/비용/순이익 추세 | 라인 차트(기간별) 또는 막대 차트. 수익 vs 비용 비교 |

#### 4.4.3 현금흐름표 (Cash Flow Statement)

| 블록 | 용도 | 데이터 표시 방식 |
|------|------|------------------|
| **카드 블록** | 영업/투자/재무 흐름 합계 | 카드 3개: 영업활동 / 투자활동 / 재무활동. 각 카드에 +/- 표시. 악센트: 영업 `var(--mg-color-primary-main)`, 투자 `var(--mg-color-secondary-main)`, 재무 `var(--mg-color-accent-main)` |
| **테이블 블록** | 활동별 상세 | 영업활동 현금흐름 > 항목별 금액. 투자·재무 동일 |
| **차트 블록** | 활동별 비교 | 막대 차트 (영업/투자/재무) 또는 워터폴 차트 |

### 4.5 블록 공통 스펙

| 항목 | 클래스/토큰 | 스펙 |
|------|-------------|------|
| 섹션 블록 | — | 배경 `var(--mg-color-surface-main)`, 테두리 1px `var(--mg-color-border-main)`, border-radius 16px, 패딩 24px |
| 섹션 제목 | 좌측 악센트 4px | `var(--mg-color-primary-main)`, 텍스트 16px fontWeight 600 |
| 카드 | `mg-v2-ad-b0kla__card` | 기존 B0KlA 카드 재사용 |
| 테이블 | `mg-erp-statement-table` | thead/tbody, 숫자 오른쪽 정렬, 음수는 괄호 또는 `-` prefix |
| 차트 | — | Chart.js 또는 프로젝트 공통 차트 라이브러리. 색상 `var(--mg-*)` 토큰 사용, hex 금지 |

### 4.6 빈 상태·로딩

- **데이터 없음**: Lucide `BarChart3` + "해당 기간에 데이터가 없습니다". 색상 `var(--mg-color-text-secondary)`  
- **로딩**: 스켈레톤 또는 스피너. B0KlA 공통 로딩 컴포넌트

### 4.7 반응형

- 카드: 모바일 1~2열, 데스크톱 3열  
- 테이블: 가로 스크롤 허용, 최소 컬럼 너비 유지  
- 차트: 컨테이너 100% width, aspect ratio 유지

---

## 5. 코더·퍼블리셔 구현 체크리스트

### 분개 입력 폼

- [ ] AdminCommonLayout + ContentHeader + ContentArea 구조
- [ ] 5개 섹션(기본정보, 차변, 대변, 합계·균형, 액션) 순서·레이아웃
- [ ] 차변/대변 테이블: thead(No|계정과목|금액|액션), tbody 행 추가/삭제
- [ ] 합계·균형 바: 차변 합계 = 대변 합계일 때 "균형" 표시, 불균형 시 "불균형" + 에러 색상
- [ ] 저장/승인/전기 버튼, `mg-v2-button-*` + Lucide
- [ ] 색상·간격 `var(--mg-*)` 토큰만 사용

### 재무제표

- [ ] 기간 선택 + 탭(대차대조표/손익계산서/현금흐름표)
- [ ] 각 탭: 카드 블록 → 테이블 블록 → 차트 블록
- [ ] 카드·테이블·차트 블록 공통 섹션 스타일(배경·테두리·radius·악센트)
- [ ] 테이블 계층 구조(들여쓰기), 숫자 오른쪽 정렬
- [ ] 차트 색상 `var(--mg-*)` 사용

---

## 6. 참조 문서

| 문서/파일 | 용도 |
|-----------|------|
| `docs/project-management/ERP_RENEWAL_PLANNING.md` | 기획·시나리오·자동화 vs 수동 경계 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | B0KlA 팔레트·레이아웃·디자이너 체크리스트 |
| `docs/design-system/SCREEN_SPEC_ERP_FINANCIAL_RENEWAL.md` | 기존 재무 관리 화면 구조·토큰 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·컨테이너·패딩 |
| `frontend/src/styles/unified-design-tokens.css` | mg-* 토큰 |
| `frontend/src/styles/dashboard-tokens-extension.css` | ad-b0kla-* 토큰 |

---

**요약**: 분개 입력 폼은 상단(일자·적요) + 차변 테이블 + 대변 테이블 + 합계·균형 바 + 저장/승인/전기 버튼 순으로 5개 섹션 블록을 배치한다. 재무제표는 기간 선택 + 탭(대차대조표/손익계산서/현금흐름표) + 탭별 카드·테이블·차트 블록으로 구성한다. 모든 색상·간격은 `var(--mg-*)` 토큰을 사용하며, 코더·퍼블리셔가 본 스펙만으로 구현 가능하도록 토큰명·클래스명을 명시하였다.
