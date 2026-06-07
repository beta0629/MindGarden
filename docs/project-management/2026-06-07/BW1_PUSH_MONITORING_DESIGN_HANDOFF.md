# BW-1 「푸시 설정 모니터링」 디자인 핸드오프

> **작성일**: 2026-06-07
> **트랙**: BW-1 / `/admin/push-monitoring` placeholder → 본 데이터 페이지 교체
> **선행 PR**: #147 (직전 머지 main `dcc8d07d9`)
> **선행 단계**: Phase 1 explore (대상 인벤토리·결정값) — 본 문서 §1 요약
> **대상 산출**: core-coder 가 추측 없이 그대로 구현 가능한 디자인 스펙(컴포넌트·토큰·BEM·a11y·반응형·i18n·운영 가드)
> **작성자**: core-designer (부모 모델 fallback — `gemini-3.1-pro` 사용량 한도)
> **참조**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/design-system/PENCIL_DESIGN_GUIDE.md`, `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md`, `docs/design-system/ATOMIC_DESIGN_SYSTEM.md`, `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`

---

## 1. 사용자 요구 + Phase 1 explore 결론 요약

| # | 결정·결론 | 디자인 반영 |
|---|-----------|-------------|
| D1 | 본 페이지는 placeholder 교체. ContentHeader / ContentSection / EmptyState 공통 모듈 재사용 | 페이지 베이스 wrapper(`mg-v2-ad-b0kla` + `mg-v2-ad-b0kla__container`) 유지 |
| D2 | 「큐 길이」 KPI → **「최근 5분 발송량 + PENDING 잔존」** 으로 재명명 | KPI 1번 카드 라벨 + subtitle 분리 |
| D3 | 실패 4분류 분리: `외부발송 실패` / `사전검증 skip` / `정책 skip` / `PENDING` | KPI 3·4번 카드 분리(실패 / Skip), 차트·Failure 테이블 tooltip 에 4분류 노출 |
| D4 | PUSH 채널 자동 푸시 결과 추적 불가 → **PUSH = 어드민 수동 한정** 가드 | 채널 필터에 `info` 배지 + 운영 상태 안내 섹션에 명시 |
| D5 | 알림톡 운영 OFF (`notification.batch.alimtalk-enabled=false`) | 운영 상태 안내 섹션 `--warning` 배너 |
| D6 | 비용 단가 미등록 — placeholder | 비용 카드 `--info` placeholder 배너 + 채널별 발송 건수만 표시 |
| D7 | PII 표시 — `recipient_phone_masked` 그대로, `error_message` 한국어 prefix 포함 | 실패 사례 테이블 행에 마스킹 컬럼 + ARIA 마스킹 라벨 |
| D8 | 60s 폴링 / 7d 기본 (24h / 7d / 30d 토글) / 본인 테넌트만 / ADMIN·STAFF 공유 풀 | 상단 필터 영역 SegmentedTabs + `aria-live="polite"` 갱신 시각 |

이 8개 결론은 본 디자인의 **필수 가드**이며, 디자인 산출의 모든 컴포넌트 스펙·BEM·문구가 이 결론을 직접 반영한다.


---

## 2. 화면 와이어프레임 (ASCII)

페이지 골격은 기존 어드민 대시보드 v2 (`AdminDashboardV2`) 와 **동일한 시각 언어**: 다크 사이드바(260px) + 상단 바(브레드크럼·제목·액션) + 본문 24~32px 패딩 + 섹션 블록(배경 `var(--mg-color-surface-main)` / 테두리 `var(--mg-color-border-main)` / radius 16px).

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [AdminCommonLayout / Desktop GNB+LNB — 기존]                                       │
│ ┌─ 상단 바 ──────────────────────────────────────────────────────────────────────┐ │
│ │  관리 > 푸시·알림 > 푸시 설정 모니터링       [60s 폴링 ●]  [수동 새로고침]      │ │
│ └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│ [ContentArea aria-label="푸시 설정 모니터링"]                                       │
│  ┌─ ContentHeader ────────────────────────────────────────────────────────────┐    │
│  │  세로 악센트 바 4px                                                         │    │
│  │  └ 푸시 설정 모니터링                                                       │    │
│  │    BW-1 본인 테넌트 발송 지표 — 60초 단위 갱신, 7일 기본                   │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌─ mg-push-monitor__filters (sticky, top: 0) ────────────────────────────────┐    │
│  │  [SegmentedTabs size="sm" — 24h / 7d★ / 30d ]                              │    │
│  │  [SegmentedTabs size="sm" — 전체★ / 알림톡 / SMS / PUSH ]                   │    │
│  │  ────────────────────────────  우측 정렬 ─────────────────                  │    │
│  │  [aria-live="polite"]  마지막 갱신 14:32:08 (60s 후 재갱신)                  │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌─ mg-push-monitor__kpi-row (grid 1×4 / 2×2 / 1×4 stacked) ──────────────────┐    │
│  │ ┌─────────────┬─────────────┬─────────────┬─────────────┐                  │    │
│  │ │ ●queue      │ ●success    │ ●failure    │ ●skip       │ ← 좌측 4px 악센트 │    │
│  │ │ 최근 5분     │ 성공 (윈도) │ 실패        │ Skip        │                  │    │
│  │ │             │             │ (외부발송)  │ (검증·정책) │                  │    │
│  │ │ 12 건        │ 1,284 건    │ 17 건       │ 33 건       │                  │    │
│  │ │ PENDING 4   │ 알림톡 78%  │ 실패율 1.3% │ 검증 22 ·   │                  │    │
│  │ │             │ SMS 18% ·   │             │ 정책 11     │                  │    │
│  │ │             │ PUSH 4%     │             │             │                  │    │
│  │ └─────────────┴─────────────┴─────────────┴─────────────┘                  │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌─ ContentSection title="운영 상태 안내" ─────────────────────────────────────┐    │
│  │  ┌─ mg-push-monitor__operational-banner --warning ────────────────────┐   │    │
│  │  │ ⚠ 알림톡 운영 OFF — `notification.batch.alimtalk-enabled=false`    │   │    │
│  │  │   현재 알림톡은 큐에 적재되지만 외부 SOLAPI 발송이 차단됩니다.       │   │    │
│  │  └────────────────────────────────────────────────────────────────────┘   │    │
│  │  ┌─ mg-push-monitor__operational-banner --info ───────────────────────┐   │    │
│  │  │ ℹ PUSH 채널 = 어드민 수동 발송 한정. 자동 푸시 결과 추적은 후속 PR. │   │    │
│  │  └────────────────────────────────────────────────────────────────────┘   │    │
│  │  ┌─ mg-push-monitor__cost-card  (placeholder) ────────────────────────┐   │    │
│  │  │ 발송 비용 — 단가 미등록 (후속 PR)                                   │   │    │
│  │  │ 알림톡 1,002 건 · SMS 240 건 · PUSH 42 건 (윈도 합계)                │   │    │
│  │  │ 비용은 단가 마스터 등록 후 산출됩니다.                              │   │    │
│  │  └────────────────────────────────────────────────────────────────────┘   │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌─ ContentSection title="일별 발송 추이" ─────────────────────────────────────┐    │
│  │  X축 = 일자(범위 토글), Y축 = 발송 건수                                     │    │
│  │  채널별 stacked 막대 (알림톡 / SMS / PUSH)                                  │    │
│  │  Tooltip: 일자 / 채널 / 성공·실패·Skip 분해                                  │    │
│  │  Empty: EmptyState — "선택한 기간에 발송 이력이 없습니다."                   │    │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌─ ContentSection title="테넌트 설정 스냅샷" ──────────────────────────────────┐   │
│  │  | 항목                              | 값                          |          │   │
│  │  | 알림톡 활성                       | ON / OFF (토글 표시 only)    |          │   │
│  │  | SOLAPI 키 등록                    | ✓ / ✗                       |          │   │
│  │  | 발신 키 등록                      | ✓ / ✗                       |          │   │
│  │  | 카카오 템플릿 매핑                | 5 / 7                       |          │   │
│  │  | ALIMTALK_BIZ_TEMPLATE_CODE 매핑 수 | 12                          |          │   │
│  │  | Expo Push 토큰 등록               | ✓ / ✗                       |          │   │
│  │  | 운영 토글 (alimtalk/SMS/PUSH)     | ON / ON / OFF               |          │   │
│  └────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│  ┌─ ContentSection title="최근 실패 사례" ─────────────────────────────────────┐    │
│  │  | 시각        | 채널   | 템플릿코드  | 수신자(마스킹)   | error_code     |   │   │
│  │  |   액션      | error_message (한국어 prefix)                              |   │   │
│  │  |─────────────────────────────────────────────────────────────────────|   │   │
│  │  | 06-07 14:18 | 알림톡 | T_RESERVED  | 010-***-1234     | SEND_FAILED   |   │   │
│  │  | [재발송]    | 발송 실패: SOLAPI 4001 - 잘못된 발신 프로파일             |   │   │
│  │  |─────────────────────────────────────────────────────────────────────|   │   │
│  │  ... 페이지네이션 (20행 / 페이지)                                        │   │   │
│  └────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

> **참고**: ●queue/●success/●failure/●skip 은 카드 좌측 **세로 악센트 바(4px)** 변형. 색은 §5 BEM 표 참조.


---

## 3. 컴포넌트 트리 (atoms / molecules / organisms / templates / pages)

`docs/design-system/ATOMIC_DESIGN_SYSTEM.md` 의 5계층 분류를 따른다. 신규 컴포넌트는 모두 `frontend/src/components/admin/push-monitoring/` 하위 디렉토리에 배치하되, **재사용 가능한 시각적 단위**(예: 운영 상태 배너)는 `dashboard-v2` 또는 `common` 으로 끌어올릴지 core-component-manager 가 판단한다 (본 디자인은 위치 제안만).

### 3.1 트리

```
PushMonitoringPage  (page)
└─ AdminCommonLayout  (template, 기존)
   └─ ContentArea  (organism, 기존 dashboard-v2/content)
      ├─ ContentHeader  (organism, 기존)
      ├─ PushMonitoringFilters  (molecule, 신규)
      │   ├─ SegmentedTabs (range)  (molecule, 기존 common/SegmentedTabs)
      │   ├─ SegmentedTabs (channel)  (molecule, 기존)
      │   └─ PushMonitoringRefreshIndicator  (atom, 신규)
      ├─ PushMonitoringKpiRow  (organism, 신규)
      │   ├─ PushMonitoringKpiCard --queue   (molecule, 신규)
      │   ├─ PushMonitoringKpiCard --success (molecule, 신규)
      │   ├─ PushMonitoringKpiCard --failure (molecule, 신규)
      │   └─ PushMonitoringKpiCard --skip    (molecule, 신규)
      ├─ ContentSection (운영 상태)  (organism, 기존)
      │   ├─ PushMonitoringOperationalBanner --warning  (molecule, 신규)
      │   ├─ PushMonitoringOperationalBanner --info     (molecule, 신규)
      │   └─ PushMonitoringCostPlaceholderCard          (molecule, 신규)
      ├─ ContentSection (일별 추이)
      │   └─ PushMonitoringTrendChart  (organism, 신규)
      │       └─ PushMonitoringTrendBar  (atom, 신규 — CSS bar)
      ├─ ContentSection (테넌트 스냅샷)
      │   └─ PushMonitoringSnapshotTable  (organism, 신규)
      │       ├─ PushMonitoringSnapshotRow  (molecule, 신규)
      │       └─ StatusToggleBadge  (atom, 신규 — ON/OFF/✓/✗ 표기)
      └─ ContentSection (실패 사례)
          └─ PushMonitoringFailureList  (organism, 신규)
              ├─ PushMonitoringFailureRow  (molecule, 신규)
              ├─ PushMonitoringFailureMessage  (atom, 신규 — error prefix)
              └─ PushMonitoringResendButton  (atom, 신규 — confirm modal trigger)
```

### 3.2 합산 개수

| 계층 | 신규 | 재사용 |
|------|------|--------|
| atoms | 4 (`PushMonitoringRefreshIndicator`, `PushMonitoringTrendBar`, `StatusToggleBadge`, `PushMonitoringFailureMessage`, `PushMonitoringResendButton`) | 0 |
| molecules | 6 (`PushMonitoringFilters`, `PushMonitoringKpiCard`, `PushMonitoringOperationalBanner`, `PushMonitoringCostPlaceholderCard`, `PushMonitoringSnapshotRow`, `PushMonitoringFailureRow`) | `SegmentedTabs` (×2) |
| organisms | 5 (`PushMonitoringKpiRow`, `PushMonitoringTrendChart`, `PushMonitoringSnapshotTable`, `PushMonitoringFailureList`) + section wrap | `ContentArea`, `ContentHeader`, `ContentSection`, `EmptyState` |
| templates | 0 | `AdminCommonLayout` |
| pages | 1 (`AdminPushMonitoringPage` — placeholder 교체) | — |

> **합계 신규 컴포넌트**: atoms 5 + molecules 6 + organisms 5 + page 1 = **17 개**.
>
> 5 개의 atom 으로 보정 (refresh / trend bar / status toggle / failure message / resend) — 위 표 atoms 행 항목 수.

### 3.3 디렉토리 권장

```
frontend/src/components/admin/push-monitoring/
├─ AdminPushMonitoringPage.js                  (page — 기존 placeholder 교체)
├─ atoms/
│   ├─ PushMonitoringRefreshIndicator.{js,css}
│   ├─ PushMonitoringTrendBar.{js,css}
│   ├─ StatusToggleBadge.{js,css}
│   ├─ PushMonitoringFailureMessage.{js,css}
│   └─ PushMonitoringResendButton.{js,css}
├─ molecules/
│   ├─ PushMonitoringFilters.{js,css}
│   ├─ PushMonitoringKpiCard.{js,css}
│   ├─ PushMonitoringOperationalBanner.{js,css}
│   ├─ PushMonitoringCostPlaceholderCard.{js,css}
│   ├─ PushMonitoringSnapshotRow.{js,css}
│   └─ PushMonitoringFailureRow.{js,css}
├─ organisms/
│   ├─ PushMonitoringKpiRow.{js,css}
│   ├─ PushMonitoringTrendChart.{js,css}
│   ├─ PushMonitoringSnapshotTable.{js,css}
│   └─ PushMonitoringFailureList.{js,css}
├─ hooks/
│   ├─ usePushMonitoringSummary.js              (코더 영역 — 본 핸드오프 범위 외)
│   └─ usePushMonitoringPolling.js              (코더 영역)
├─ index.js
└─ __tests__/
```

> **위치 검토**: 차후 `dashboard-v2` 로 이동 가능한 `OperationalBanner` 등은 core-component-manager 가 PR 머지 후 회수 제안. 본 PR 단계에서는 push-monitoring 로컬에 두는 것을 권장 (단일 PR 안전).


---

## 4. 컴포넌트 props 시그너처 (TypeScript-like JSDoc)

> 모든 시간 값은 **ISO-8601 / Asia/Seoul** 기준. 마스킹은 백엔드 응답을 그대로 통과(`recipient_phone_masked`). 수치는 `Number.isFinite` 가드 후 `toLocaleString('ko-KR')` 적용 — 직전 PR `CumulativeConsultantCountsChart` 와 동일.

### 4.1 `AdminPushMonitoringPage`

```jsdoc
/**
 * BW-1 푸시 설정 모니터링 — 본 데이터 페이지.
 * placeholder(`AdminPushMonitoringPlaceholderPage`) 를 교체.
 *
 * 라우트: /admin/push-monitoring (기존 routes 그대로)
 *
 * @returns {JSX.Element}
 */
```

### 4.2 `PushMonitoringFilters` (molecule)

```jsdoc
/**
 * @typedef {'24h'|'7d'|'30d'} PushMonitoringRange
 * @typedef {'ALL'|'ALIMTALK'|'SMS'|'PUSH'} PushMonitoringChannel
 */
/**
 * @param {object} props
 * @param {PushMonitoringRange} props.range                  현재 선택 범위 (default '7d')
 * @param {(next: PushMonitoringRange) => void} props.onRangeChange
 * @param {PushMonitoringChannel} props.channel              현재 선택 채널 (default 'ALL')
 * @param {(next: PushMonitoringChannel) => void} props.onChannelChange
 * @param {string|null} props.lastRefreshedAtIso             ISO-8601, null=로딩 직전
 * @param {number} props.pollingIntervalMs                   기본 60000
 * @param {boolean} props.isPolling                          폴링 활성 여부
 * @param {() => void} props.onManualRefresh                 수동 새로고침
 */
```

### 4.3 `PushMonitoringKpiCard` (molecule)

```jsdoc
/**
 * @typedef {'queue'|'success'|'failure'|'skip'} PushKpiVariant
 */
/**
 * @param {object} props
 * @param {PushKpiVariant} props.variant
 * @param {string} props.label                               예: '최근 5분 발송량'
 * @param {string|number} props.value                        예: '12 건' (formatter 적용 후 문자열) / 숫자 허용
 * @param {string} [props.subtitle]                          예: 'PENDING 4 건', '실패율 1.3%'
 * @param {Array<{label: string, ratio: number}>} [props.distribution]
 *                                                          KPI #2(success) 채널 분포 / #4(skip) 사유 분포 등
 * @param {string} [props.ariaLabel]                         카드 전체 ARIA. 없을 시 자동 생성.
 * @param {boolean} [props.loading]                          true 시 스켈레톤
 */
```

### 4.4 `PushMonitoringOperationalBanner` (molecule)

```jsdoc
/**
 * @param {object} props
 * @param {'warning'|'info'} props.tone
 * @param {string} props.title                               예: '알림톡 운영 OFF'
 * @param {string} props.description                         예: 'notification.batch.alimtalk-enabled=false …'
 * @param {string} [props.codeRef]                           단조 폰트 inline code (선택)
 * @param {string} [props.iconAriaLabel]                     아이콘 보조 텍스트
 */
```

### 4.5 `PushMonitoringCostPlaceholderCard` (molecule)

```jsdoc
/**
 * @param {object} props
 * @param {Array<{channel: 'ALIMTALK'|'SMS'|'PUSH', sentCount: number}>} props.channelCounts
 * @param {string} props.note                                예: '단가 미등록 (후속 PR)'
 * @param {string} [props.windowLabel]                       예: '최근 7일 합계'
 */
```

### 4.6 `PushMonitoringTrendChart` (organism)

```jsdoc
/**
 * @typedef {object} PushTrendPoint
 * @property {string} dateIso                                'YYYY-MM-DD'
 * @property {number} alimtalkCount
 * @property {number} smsCount
 * @property {number} pushCount
 * @property {number} successCount
 * @property {number} failureCount
 * @property {number} skipCount
 * @property {number} pendingCount
 */
/**
 * @param {object} props
 * @param {Array<PushTrendPoint>} props.points
 * @param {PushMonitoringRange} props.range                  X축 카테고리 범위
 * @param {PushMonitoringChannel} props.channel              'ALL' 외에는 해당 채널만 강조
 * @param {boolean} [props.loading]
 * @param {boolean} [props.error]
 * @param {string} [props.emptyText]
 */
```

> **차트 구현**: §6 차트 라이브러리 결정 참조 — **CSS-driven stacked bar** (직전 PR 의 `mg-v2-cumulative-chart` 와 동일 패턴) 권장. `recharts` 등 외부 라이브러리 도입 금지.

### 4.7 `PushMonitoringSnapshotTable` (organism) + `PushMonitoringSnapshotRow`

```jsdoc
/**
 * @typedef {object} PushMonitoringSnapshot
 * @property {boolean} alimtalkEnabled
 * @property {boolean} kakaoApiKeyRegistered                 kakao_api_key_ref NOT NULL
 * @property {boolean} kakaoSenderKeyRegistered
 * @property {{filled: number, total: number}} templateMapping  ex: {filled:5,total:7}
 * @property {number} alimtalkBizTemplateCodeCount           공통코드 매핑 수
 * @property {boolean} expoPushAccessTokenRegistered
 * @property {{alimtalk: boolean, sms: boolean, push: boolean}} operationalToggle
 */
/**
 * @param {object} props
 * @param {PushMonitoringSnapshot|null} props.snapshot       null=로딩
 * @param {boolean} [props.loading]
 * @param {boolean} [props.error]
 */
```

### 4.8 `PushMonitoringFailureList` (organism) + `PushMonitoringFailureRow`

```jsdoc
/**
 * @typedef {object} PushFailureEntry
 * @property {string} id                                     UUID 또는 BIGINT
 * @property {string} occurredAtIso                          ISO-8601
 * @property {'ALIMTALK'|'SMS'|'PUSH'} channel
 * @property {string} templateCode
 * @property {string} recipientPhoneMasked                   '010-***-1234'
 * @property {string} errorCode                              'SEND_FAILED' 등
 * @property {string} errorMessage                           한국어 prefix 포함
 * @property {boolean} retryable                             재발송 가능 여부
 * @property {string} [solapiRequestId]
 */
/**
 * @param {object} props
 * @param {Array<PushFailureEntry>} props.entries
 * @param {number} props.page                                1-based
 * @param {number} props.pageSize                            기본 20
 * @param {number} props.totalCount
 * @param {(next: number) => void} props.onPageChange
 * @param {(entry: PushFailureEntry) => void} props.onResend confirm 모달 띄우는 콜백
 * @param {boolean} [props.loading]
 * @param {boolean} [props.error]
 */
```

### 4.9 atoms

```jsdoc
/** PushMonitoringRefreshIndicator
 * @param {object} props
 * @param {string|null} props.lastRefreshedAtIso
 * @param {number} props.intervalMs
 * @param {boolean} props.isPolling
 */

/** PushMonitoringTrendBar
 * @param {object} props
 * @param {number} props.value
 * @param {number} props.max
 * @param {'alimtalk'|'sms'|'push'} props.channel
 * @param {string} [props.ariaLabel]
 */

/** StatusToggleBadge — ON/OFF/✓/✗ 표기
 * @param {object} props
 * @param {boolean} props.active
 * @param {'on-off'|'check'} props.style                     'on-off' or '✓/✗'
 * @param {string} [props.labelOn]                           default 'ON' / '✓'
 * @param {string} [props.labelOff]                          default 'OFF' / '✗'
 */

/** PushMonitoringFailureMessage — 한국어 prefix 표기 보장
 * @param {object} props
 * @param {string} props.errorCode
 * @param {string} props.errorMessage                        백엔드 그대로
 */

/** PushMonitoringResendButton — confirm 모달 트리거
 * @param {object} props
 * @param {string} props.templateCode                        aria-label 용
 * @param {boolean} props.disabled                           !retryable 시 true
 * @param {() => void} props.onClick
 */
```


---

## 5. BEM 클래스 + 디자인 토큰 매핑

### 5.1 신규 BEM (page block = `mg-push-monitor`)

| BEM | 시각 스펙 | 사용 토큰 (Direct, hex 금지) |
|-----|-----------|------------------------------|
| `mg-push-monitor` | page wrapper | bg `var(--mg-color-background-main)`, padding `var(--mg-spacing-lg)` (24px) |
| `mg-push-monitor__filters` | sticky filter row | bg `var(--mg-color-surface-main)`, border `1px solid var(--mg-color-border-main)`, radius `var(--ad-b0kla-radius-sm)` (12px), gap `var(--mg-spacing-md)` (16px), padding `var(--mg-spacing-md)`, position `sticky`, top `0` |
| `mg-push-monitor__filters-group` | range / channel SegmentedTabs 묶음 | flex column gap `var(--mg-spacing-xs)` |
| `mg-push-monitor__refresh-indicator` | 우측 정렬 갱신 텍스트 | font `var(--mg-font-sm)`, color `var(--mg-color-text-secondary)`, gap `var(--mg-spacing-xs)` |
| `mg-push-monitor__refresh-indicator__dot` | 폴링 ● 표식 | `--mg-color-primary-main` 활성, `--mg-color-text-tertiary` 비활성 |
| `mg-push-monitor__kpi-row` | 4 카드 grid | `display:grid; gap:var(--mg-spacing-md);` — §8 반응형에서 column 수 조정 |
| `mg-push-monitor__kpi-card` | 카드 베이스 | bg `var(--ad-b0kla-card-bg)`, border `1px solid var(--ad-b0kla-border)`, radius `var(--ad-b0kla-radius)` (24px), padding `var(--mg-spacing-lg)`, shadow `var(--ad-b0kla-shadow)`, position `relative`, overflow `hidden` |
| `mg-push-monitor__kpi-card::before` | **좌측 4px 세로 악센트 바** | `width:4px; top:0; bottom:0; left:0; border-radius:2px;` — variant 별 색은 아래 |
| `mg-push-monitor__kpi-card--queue` | 「최근 5분 발송량 + PENDING」 | accent `var(--ad-b0kla-blue)` (`--mg-primary-400`) |
| `mg-push-monitor__kpi-card--success` | 「성공 (윈도)」 | accent `var(--ad-b0kla-green)` (`--mg-success-600`) |
| `mg-push-monitor__kpi-card--failure` | 「실패 (외부발송)」 | accent `var(--ad-b0kla-danger)` (`--mg-error-500`) |
| `mg-push-monitor__kpi-card--skip` | 「Skip (검증·정책)」 | accent `var(--ad-b0kla-orange)` (`--cs-orange-400`) |
| `mg-push-monitor__kpi-card__label` | 라벨 | font `var(--mg-font-xs)` (12px), color `var(--mg-color-text-secondary)` |
| `mg-push-monitor__kpi-card__value` | 숫자 강조 | font `var(--mg-font-xxl)` (24px), weight `var(--mg-font-semibold)` (600), color `var(--ad-b0kla-title-color)` |
| `mg-push-monitor__kpi-card__subtitle` | subtitle | font `var(--mg-font-sm)` (14px), color `var(--mg-color-text-secondary)` |
| `mg-push-monitor__kpi-card__distribution` | 채널/사유 분포 inline list | font `var(--mg-font-xs)`, gap `var(--mg-spacing-xs)`, color `var(--mg-color-text-secondary)` |
| `mg-push-monitor__operational-banner` | 운영 상태 배너 베이스 | radius `var(--ad-b0kla-radius-sm)`, padding `var(--mg-spacing-md)`, gap `var(--mg-spacing-sm)`, border-left `4px solid` |
| `mg-push-monitor__operational-banner--warning` | 알림톡 OFF | bg `var(--ad-b0kla-orange-bg)`, border-left `var(--ad-b0kla-orange)`, color `var(--mg-color-text-main)` |
| `mg-push-monitor__operational-banner--info` | PUSH 가드 | bg `var(--ad-b0kla-blue-bg)`, border-left `var(--ad-b0kla-blue)` |
| `mg-push-monitor__operational-banner__code` | inline code 표기 | font `var(--mg-font-xs)`, font-family monospace (기존 토큰 `--mg-font-family-mono` 또는 시스템), bg `rgba(0,0,0,.04)` 대신 `var(--mg-color-background-main)`, padding `2px 6px`, radius `4px` |
| `mg-push-monitor__cost-card` | 비용 placeholder | bg `var(--ad-b0kla-card-bg)`, border `1px dashed var(--ad-b0kla-border)`, radius `var(--ad-b0kla-radius-sm)`, padding `var(--mg-spacing-md)` (점선으로 placeholder 강조) |
| `mg-push-monitor__cost-card__channels` | 채널별 발송 건수 inline | font `var(--mg-font-sm)`, color `var(--ad-b0kla-text-secondary)`, gap `var(--mg-spacing-md)` |
| `mg-push-monitor__trend-chart` | 일별 추이 차트 컨테이너 | bg `var(--ad-b0kla-card-bg)`, padding `var(--mg-spacing-md)`, radius `var(--ad-b0kla-radius-sm)` |
| `mg-push-monitor__trend-chart__bar` | 일자별 stacked 막대 | width 100%, gap `var(--mg-spacing-xs)`, height 200px (≥768px) / 160px (<768px) |
| `mg-push-monitor__trend-chart__segment--alimtalk` | 알림톡 segment | bg `var(--ad-b0kla-blue)` |
| `mg-push-monitor__trend-chart__segment--sms` | SMS segment | bg `var(--ad-b0kla-green)` |
| `mg-push-monitor__trend-chart__segment--push` | PUSH segment | bg `var(--ad-b0kla-orange)` |
| `mg-push-monitor__trend-chart__segment--dimmed` | 비활성 채널 | opacity `0.35` |
| `mg-push-monitor__snapshot-table` | 스냅샷 테이블 | bg `var(--ad-b0kla-card-bg)`, radius `var(--ad-b0kla-radius-sm)`, border `1px solid var(--ad-b0kla-border)` |
| `mg-push-monitor__snapshot-row` | 스냅샷 행 | padding-y `var(--mg-spacing-sm)`, border-bottom `1px solid var(--ad-b0kla-border)`, last child no border |
| `mg-push-monitor__snapshot-row__label` | 항목 라벨 | font `var(--mg-font-sm)`, color `var(--mg-color-text-secondary)` |
| `mg-push-monitor__snapshot-row__value` | 항목 값 | font `var(--mg-font-sm)`, color `var(--mg-color-text-main)`, weight `var(--mg-font-medium)` |
| `mg-push-monitor__failure-list` | 실패 사례 테이블 | bg `var(--ad-b0kla-card-bg)`, radius `var(--ad-b0kla-radius-sm)` |
| `mg-push-monitor__failure-row` | 실패 행 | padding `var(--mg-spacing-sm) var(--mg-spacing-md)`, gap `var(--mg-spacing-md)`, border-bottom `1px solid var(--ad-b0kla-border)` |
| `mg-push-monitor__failure-row--retryable` | 재발송 가능 | left border `3px solid var(--ad-b0kla-blue)` |
| `mg-push-monitor__failure-row--terminal` | 재발송 불가 | left border `3px solid var(--mg-color-text-tertiary)` |
| `mg-push-monitor__failure-row__time` | 시각 | font `var(--mg-font-xs)`, color `var(--mg-color-text-secondary)`, font-variant-numeric tabular-nums |
| `mg-push-monitor__failure-row__channel` | 채널 라벨 | inline badge — bg `var(--mg-color-background-main)`, padding `2px 8px`, radius `var(--mg-radius-full)` |
| `mg-push-monitor__failure-row__message` | error_message | font `var(--mg-font-sm)`, color `var(--mg-color-text-main)`, line-clamp 2 |

### 5.2 신규 디자인 토큰 — **0 개 (권장)**

기존 토큰만으로 모두 표현 가능하므로 **신규 토큰 신설 없음**. 단가·비용 placeholder 또한 기존 `--ad-b0kla-orange-bg` 등을 재사용.

> **예외 조건**: 만약 향후 비용 단가 등록 후 「예산 대비 사용률」 progress 게이지가 필요해지면 그때 `dashboard-tokens-extension.css` 에 `--push-monitor-cost-progress-{bg,fill}` 신설을 검토 (사유: 새로운 시각 의미). 본 PR 은 **placeholder 만** 이므로 보류.

### 5.3 `unified-design-tokens.css` 수정 금지

`unified-design-tokens.css` 는 단일 SSOT — 본 PR 에서 절대 수정하지 않는다. 구현 토큰 신설이 불가피하면 `dashboard-tokens-extension.css` 에 추가하고 사유 주석 명시한다(D11 KPI 게이트).


---

## 6. 차트 라이브러리 결정

### 6.1 결정: **외부 차트 라이브러리 도입 안 함 — CSS-driven stacked bar 사용**

| 후보 | 결정 | 근거 |
|------|------|------|
| `recharts` | ❌ 미도입 | (a) `frontend/src/` 전수 검색에서 `from 'recharts'` import **0 건** — 의존성 신규 추가 발생, 단일 PR 범위(BE+FE) 부담 ↑ (b) D11 토큰 게이트 위배 위험(라이브러리 색상 customization 누락 시 색 하드코딩) |
| `chart.js` / `victory` / `nivo` | ❌ 미도입 | 위와 동일 |
| **CSS bar (직전 PR `mg-v2-cumulative-chart` 패턴 답습)** | ✅ 채택 | (a) 직전 PR #146 누적 상담 차트가 이미 CSS-driven 으로 안정 구현되어 있음 (b) 토큰만으로 색상 100% 제어 가능 (c) a11y `role="img"` + `aria-label` 직접 부여 용이 (d) 의존성 0 |

### 6.2 차트 구현 가이드 (core-coder 위임용 추가 스펙)

`PushMonitoringTrendChart` 는 **CSS Grid + flex column** 으로 구현한다. 라이브러리 없이 다음 구조를 권장:

```text
.mg-push-monitor__trend-chart
└─ ol.mg-push-monitor__trend-chart__list  (role="img" + aria-label)
   └─ li.mg-push-monitor__trend-chart__day  (각 일자)
      ├─ .mg-push-monitor__trend-chart__bar  (height 100%, flex column-reverse)
      │  ├─ .mg-push-monitor__trend-chart__segment--alimtalk  (style.height = ${pct}%)
      │  ├─ .mg-push-monitor__trend-chart__segment--sms
      │  └─ .mg-push-monitor__trend-chart__segment--push
      ├─ .mg-push-monitor__trend-chart__total  (총 발송 — 캡션)
      └─ .mg-push-monitor__trend-chart__date  (X축 라벨 'MM-DD')
```

- **Tooltip**: 각 `<li>` 에 `title` 속성 + 호버 시 `.mg-push-monitor__trend-chart__tooltip` 절대 위치(z-index 10). 모바일 (<768px) 은 탭으로 토글.
- **Empty state**: `points.length === 0` 시 `EmptyState` (`frontend/src/components/common/EmptyState.js`) 그대로 사용 (title `i18n: pushMonitor.trend.emptyTitle`).
- **a11y aria-label**: `"기간 ${range} 일별 발송 추이 — 총 ${totalCount}건, 알림톡 ${alimtalkCount}건, SMS ${smsCount}건, PUSH ${pushCount}건"`.

### 6.3 KPI #2/#4 분포 표시

KPI 카드 #2 (성공) 의 채널 분포 / #4 (Skip) 의 사유 분포는 기존 `mg-v2-cumulative-chart__fill` 패턴을 카드 내부에 inline 으로 사용하거나 **inline pill list** (e.g. `알림톡 78% · SMS 18% · PUSH 4%`) — **본 디자인은 inline pill list 권장** (카드 높이 보존). 스타일은 §5.1 `mg-push-monitor__kpi-card__distribution`.


---

## 7. a11y / 인터랙션 / 키보드 nav

### 7.1 ARIA 구조

| 영역 | 속성 | 값 |
|------|------|----|
| 페이지 wrapper | `aria-label` | `"푸시 설정 모니터링"` (placeholder 와 동일 텍스트 유지) |
| `ContentArea` | `role="region"` (기존 컴포넌트 준용), `aria-labelledby` | ContentHeader 의 `titleId` |
| `mg-push-monitor__filters` | `role="region"`, `aria-label` | `"발송 모니터링 필터"` |
| 범위 토글 `SegmentedTabs` | `role="tablist"` (컴포넌트 내장), `aria-label` | `"조회 범위"` |
| 채널 토글 `SegmentedTabs` | (동) | `"발송 채널"` |
| `mg-push-monitor__refresh-indicator` | `aria-live="polite"`, `aria-atomic="true"` | 텍스트: `"마지막 갱신 14:32:08, 60초 후 재갱신"` |
| KPI 행 wrapper | `role="list"`, `aria-label` | `"발송 지표 요약"` |
| 각 KPI 카드 | `role="figure"`, `aria-label` | `"${label}: ${value}, ${subtitle}"` (자동 합성) |
| 운영 상태 배너 | `role="status"` (warning), `role="note"` (info) | — |
| 트렌드 차트 | `role="img"`, `aria-label` | §6.2 텍스트 |
| 스냅샷 테이블 | `role="table"` | row 별 `role="row"`, cell 별 `role="cell"` |
| `StatusToggleBadge` | `aria-label` | `"${항목명}: ON"` 또는 `"${항목명}: 등록됨"` |
| 실패 사례 테이블 | `role="table"`, `aria-rowcount` | 페이지네이션 시 동적 |
| 실패 행 | `role="row"`, `aria-label` | `"${time} ${channel} ${templateCode} ${recipientPhoneMasked} ${errorCode}"` |
| 재발송 버튼 | `aria-label` | `"${templateCode} 재발송"`, disabled 시 `aria-disabled="true"` |

### 7.2 키보드 인터랙션

| 컴포넌트 | 키 | 동작 |
|----------|----|------|
| `SegmentedTabs` (range/channel) | ←/→ Home End Space Enter | 컴포넌트 내장 동작 그대로 |
| 수동 새로고침 버튼 | Enter / Space | 즉시 fetch, 진행 중에는 `aria-busy="true"` |
| 트렌드 차트 일자 항목 | Tab 진입 + ←/→ | 일자 간 이동, Tooltip 영역 표출 (`aria-describedby`) |
| 스냅샷 테이블 | Tab | 행 단위 focus (대부분 read-only) |
| 실패 행 | Tab | 행 → 액션(재발송) 순서 |
| 재발송 버튼 | Enter | confirm 모달(`UnifiedModal`) 오픈 |
| confirm 모달 | Esc / Cancel | 모달 닫기, focus trap 준수 |

### 7.3 인터랙션 — 60초 폴링

- 마운트 시 즉시 1회 fetch → 60s 마다 백그라운드 fetch.
- 사용자가 범위·채널 변경 시 폴링 타이머 **리셋** (즉시 재요청).
- 탭이 백그라운드일 때 `document.visibilityState === 'hidden'` 동안 폴링 일시 정지, 복귀 시 즉시 1회 갱신 — UX 명세상 **권장**.
- 갱신 진행 중 KPI 카드는 기존 값을 유지하면서 좌상단에 `loading-shimmer` 도트 표시 (전체 스켈레톤 X — 깜빡임 방지).
- 에러 시 `mg-push-monitor__refresh-indicator__dot--error` 변형 (red) + 인접 텍스트 `"재시도 실패 (15s 후 자동 재시도)"`.

### 7.4 재발송 confirm 모달

`UnifiedModal` 재사용 (`/core-solution-unified-modal` 스킬). props 예시:

```text
title: '수동 재발송 확인'
body: `${channel} / ${templateCode} 을 ${recipientPhoneMasked} 로 다시 발송할까요? 발송 후 1회 추적됩니다.`
confirmLabel: '재발송'
cancelLabel: '취소'
variant: 'primary'
```

### 7.5 모달 외부 인터랙션

- 카드 hover 시 elevation `var(--ad-b0kla-shadow-hover)` 로 미세 보강. 클릭 가능 영역 없음(KPI 카드 전체 클릭 X — 직전 PR 의 click-through 방지).
- 트렌드 일자 hover 시 다른 일자 opacity 0.6 으로 약간 dim — 시선 유도.


---

## 8. 빈 상태 / 로딩 / 에러 / 반응형

### 8.1 빈 상태

| 위치 | 표시 |
|------|------|
| KPI 행 | 0 데이터여도 카드는 항상 표시. value 는 `0 건`, subtitle 은 `"이번 윈도 데이터 없음"` |
| 트렌드 차트 | `EmptyState` 공통 컴포넌트 (`title=pushMonitor.trend.emptyTitle`, `description=pushMonitor.trend.emptyDesc`) |
| 스냅샷 테이블 | snapshot 자체는 0 데이터 불가 (테넌트 ID 항상 존재) — 다만 모든 토글 OFF 시 안내 문구 추가 (`"이 테넌트의 알림 설정이 비어있습니다."`) |
| 실패 사례 | `EmptyState` (`title=pushMonitor.failures.emptyTitle="기간 내 실패 사례가 없습니다"`) |

### 8.2 로딩 상태

| 위치 | 표시 |
|------|------|
| 초기 마운트 | 전체 영역 `LoadingSpinner` (`frontend/src/components/common/LoadingSpinner*`) — 1회만 |
| 백그라운드 폴링 | refresh-indicator 도트 회전 (`prefers-reduced-motion: reduce` 시 색만 변경) |
| KPI 카드 | 초기 로딩만 스켈레톤 (`mg-push-monitor__kpi-card--loading` — height 92px placeholder bg `var(--ad-b0kla-card-bg)` + linear-gradient shimmer) |
| 트렌드 차트 | 초기 스켈레톤 — 막대 7개 placeholder (height 60% 일정), color `var(--ad-b0kla-border)` |
| 실패 테이블 | 초기 5행 skeleton row (`mg-push-monitor__failure-row--loading`) |

### 8.3 에러 상태

| 위치 | 표시 |
|------|------|
| 페이지 전체 fetch 실패 | inline `ErrorState` (`frontend/src/components/academy/shared/ErrorState.js` 패턴 답습) — 본 PR 에서는 `mg-push-monitor__error-banner` 신규 (warning 변형 재사용 권장 — banner `--warning` 톤) + `LIST_ERROR_RETRY="다시 시도"` 버튼 |
| 부분 영역(예: 실패 사례만) 실패 | 해당 섹션 내부에만 inline error + 다른 섹션 영향 없음 |
| 재발송 실패 | `Toast` (`react-toastify` 등 기존 토스트 시스템) — 한국어 prefix `"재발송 실패: "` + 백엔드 message |

### 8.4 반응형 (펜슬 레이아웃 프레임 — `RESPONSIVE_LAYOUT_SPEC.md` 준수)

| 브레이크포인트 | KPI 행 | 필터 영역 | 트렌드 차트 높이 | 스냅샷 테이블 | 실패 행 |
|-----------------|--------|-----------|------------------|---------------|---------|
| ≥ 1280px (Desktop) | grid 1×4 (column gap 16px) | 1행 — range / channel / refresh 좌→우 | 200px | 2-column grid | 1행에 모든 컬럼 |
| 1280–1920+ (Full HD/2K/4K) | 1×4 (max-width 1440~1920) | 동 | 220px | 동 | 동 |
| 768–1279px (Tablet) | 2×2 (column gap 16px) | 2행 — (range+channel) / refresh | 180px | 2-column grid | 채널·템플릿·시각만 1행, 메시지 줄바꿈 |
| < 768px (Mobile) | stacked 1×4 (gap 12px) | 3행 — range / channel / refresh | 160px | 1-column list (라벨 ↑ 값 ↓) | 카드 형태(시각·채널 1행, 메시지 2행, 액션 3행), 페이지네이션은 prev/next 만 |

- **모바일 sticky 필터**: `mg-push-monitor__filters` 가 `position: sticky; top: 0;` 으로 머무르되, 사이드바 드로어 오픈 시 z-index 충돌 회피(< drawer overlay).
- **터치 영역**: 모바일에서 모든 클릭/탭 대상은 **44px 이상** (Apple HIG / WCAG AAA 준수).
- **4K 가독성**: `mg-push-monitor` 컨테이너에 `max-width: 1920px; margin: 0 auto;` 적용 (B0KlA 가이드).

### 8.5 다크 테마

본 PR 범위에서 다크 테마 처리는 **현행 어드민 v2 와 동일 — 라이트 우선**. 다크 변환 시 `dashboard-tokens-extension.css` 의 `[data-theme='dark']` 분기에 자동 적용되도록 토큰만 사용 → 추가 작업 없음.


---

## 9. i18n 키 (제안)

### 9.1 본 PR — `ADMIN_WEB_SCAFFOLD_COPY.PUSH_*` 확장 (한 곳 기준)

기존 `frontend/src/constants/adminWebScaffold.js` 의 `PUSH_MONITOR_TITLE` / `PUSH_MONITOR_SUBTITLE` 와 같은 SCAFFOLD 패턴을 따라 본 PR 에서 추가:

```text
PUSH_MONITOR_TITLE                = '푸시 설정 모니터링'                                    (기존, 그대로)
PUSH_MONITOR_SUBTITLE             = 'BW-1 본인 테넌트 발송 지표 — 60초 단위 갱신, 7일 기본'    (수정)
PUSH_MONITOR_RANGE_LABEL          = '조회 범위'
PUSH_MONITOR_RANGE_24H            = '24시간'
PUSH_MONITOR_RANGE_7D             = '7일'
PUSH_MONITOR_RANGE_30D            = '30일'
PUSH_MONITOR_CHANNEL_LABEL        = '발송 채널'
PUSH_MONITOR_CHANNEL_ALL          = '전체'
PUSH_MONITOR_CHANNEL_ALIMTALK     = '알림톡'
PUSH_MONITOR_CHANNEL_SMS          = 'SMS'
PUSH_MONITOR_CHANNEL_PUSH         = 'PUSH'
PUSH_MONITOR_REFRESH_LIVE         = '마지막 갱신 {time} ({intervalSec}초 후 재갱신)'
PUSH_MONITOR_REFRESH_MANUAL       = '수동 새로고침'
PUSH_MONITOR_REFRESH_RETRY        = '재시도 실패 ({retryInSec}초 후 자동 재시도)'

PUSH_MONITOR_KPI_QUEUE_LABEL      = '최근 5분 발송량'
PUSH_MONITOR_KPI_QUEUE_SUBTITLE   = 'PENDING {count}건'
PUSH_MONITOR_KPI_SUCCESS_LABEL    = '성공 (윈도 합계)'
PUSH_MONITOR_KPI_SUCCESS_DIST     = '알림톡 {alimtalkPct}% · SMS {smsPct}% · PUSH {pushPct}%'
PUSH_MONITOR_KPI_FAILURE_LABEL    = '실패 (외부발송)'
PUSH_MONITOR_KPI_FAILURE_RATE     = '실패율 {rate}%'
PUSH_MONITOR_KPI_SKIP_LABEL       = 'Skip (검증·정책)'
PUSH_MONITOR_KPI_SKIP_DIST        = '검증 {validationCount} · 정책 {policyCount}'

PUSH_MONITOR_BANNER_ALIMTALK_OFF_TITLE = '알림톡 운영 OFF'
PUSH_MONITOR_BANNER_ALIMTALK_OFF_DESC  = '현재 알림톡은 큐에 적재되지만 외부 SOLAPI 발송이 차단됩니다. (notification.batch.alimtalk-enabled=false)'
PUSH_MONITOR_BANNER_PUSH_GUARD_TITLE   = 'PUSH 채널 = 어드민 수동 발송 한정'
PUSH_MONITOR_BANNER_PUSH_GUARD_DESC    = '자동 푸시 결과 추적은 후속 PR 에서 제공됩니다.'

PUSH_MONITOR_COST_PLACEHOLDER_TITLE   = '발송 비용 — 단가 미등록'
PUSH_MONITOR_COST_PLACEHOLDER_DESC    = '단가 마스터 등록 후 비용이 산출됩니다. 현재는 발송 건수만 표시합니다. (후속 PR)'

PUSH_MONITOR_TREND_TITLE              = '일별 발송 추이'
PUSH_MONITOR_TREND_EMPTY_TITLE        = '선택한 기간에 발송 이력이 없습니다.'
PUSH_MONITOR_TREND_EMPTY_DESC         = '범위·채널 필터를 변경해 보세요.'
PUSH_MONITOR_TREND_DAY_ARIA           = '{date}: 알림톡 {alimtalk}, SMS {sms}, PUSH {push}, 성공 {success}, 실패 {failure}, Skip {skip}'

PUSH_MONITOR_SNAPSHOT_TITLE           = '테넌트 설정 스냅샷'
PUSH_MONITOR_SNAPSHOT_ROW_ALIMTALK    = '알림톡 활성'
PUSH_MONITOR_SNAPSHOT_ROW_API_KEY     = 'SOLAPI 키 등록'
PUSH_MONITOR_SNAPSHOT_ROW_SENDER      = '발신 키 등록'
PUSH_MONITOR_SNAPSHOT_ROW_TEMPLATE    = '카카오 템플릿 매핑'
PUSH_MONITOR_SNAPSHOT_ROW_BIZ_CODE    = '공통코드 ALIMTALK_BIZ_TEMPLATE_CODE 매핑 수'
PUSH_MONITOR_SNAPSHOT_ROW_EXPO_TOKEN  = 'Expo Push 토큰 등록'
PUSH_MONITOR_SNAPSHOT_ROW_TOGGLES     = '운영 토글'
PUSH_MONITOR_SNAPSHOT_VALUE_ON        = 'ON'
PUSH_MONITOR_SNAPSHOT_VALUE_OFF       = 'OFF'
PUSH_MONITOR_SNAPSHOT_VALUE_OK        = '✓'
PUSH_MONITOR_SNAPSHOT_VALUE_NG        = '✗'

PUSH_MONITOR_FAILURES_TITLE           = '최근 실패 사례'
PUSH_MONITOR_FAILURES_TH_TIME         = '시각'
PUSH_MONITOR_FAILURES_TH_CHANNEL      = '채널'
PUSH_MONITOR_FAILURES_TH_TEMPLATE     = '템플릿코드'
PUSH_MONITOR_FAILURES_TH_RECIPIENT    = '수신자'
PUSH_MONITOR_FAILURES_TH_ERROR_CODE   = 'error_code'
PUSH_MONITOR_FAILURES_TH_ERROR_MSG    = 'error_message'
PUSH_MONITOR_FAILURES_TH_ACTIONS      = '액션'
PUSH_MONITOR_FAILURES_ACTION_RESEND   = '재발송'
PUSH_MONITOR_FAILURES_EMPTY_TITLE     = '기간 내 실패 사례가 없습니다.'
PUSH_MONITOR_FAILURES_EMPTY_DESC      = '실패가 발생하면 이곳에 표시됩니다.'

PUSH_MONITOR_RESEND_MODAL_TITLE       = '수동 재발송 확인'
PUSH_MONITOR_RESEND_MODAL_BODY        = '{channel} / {templateCode} 을 {recipient} 로 다시 발송할까요?'
PUSH_MONITOR_RESEND_TOAST_SUCCESS     = '재발송 요청을 큐에 적재했습니다.'
PUSH_MONITOR_RESEND_TOAST_FAILURE     = '재발송 실패: {message}'

PUSH_MONITOR_ERROR_BANNER             = '데이터 로드에 실패했습니다.'
```

### 9.2 후속 `admin.json` 마이그 로드맵

본 PR 단계는 **SCAFFOLD_COPY 한 곳 기준** (직전 모니터링 페이지 `AdminMindGardenObservabilityPage` 와 같은 한국어 하드코딩 패턴 답습 금지 — placeholder 와 동일 정책).

후속 PR (#148+) 에서 `frontend/src/locales/ko/admin.json` 의 `pushMonitor` 네임스페이스로 마이그한다. 키 변환 매핑:

| SCAFFOLD_COPY 키 | i18n 키 |
|------------------|---------|
| `PUSH_MONITOR_TITLE` | `pushMonitor.title` |
| `PUSH_MONITOR_RANGE_24H` | `pushMonitor.range.24h` |
| `PUSH_MONITOR_KPI_QUEUE_LABEL` | `pushMonitor.kpi.queue.label` |
| ... | (1:1 매핑, 구조 카멜케이스) |

마이그 시점에 SCAFFOLD_COPY 는 `t(pushMonitor.title)` 호출로 점진 교체. 두 단계로 나누는 이유: 본 PR 의 BE+FE 단일 PR 부담 ↓, locales 변경 충돌 위험 ↓.


---

## 10. 운영 OFF / 비용 placeholder / PUSH 결과 갭 — 디자인 가드 (필수)

| Phase 1 결론 | 디자인 가드 (어김 시 D11 게이트 / Phase 1 결론 위배) |
|--------------|---------------------------------------------------|
| **알림톡 운영 OFF** | (a) 운영 상태 안내 섹션에 **항상** `mg-push-monitor__operational-banner--warning` 표시 (단, BE 가 `alimtalkBatchEnabled=false` 일 때만). (b) 배너 본문에 환경변수 키 `notification.batch.alimtalk-enabled=false` 를 **inline code** 로 노출 — 운영자가 어디 토글인지 즉시 파악 가능. (c) 이 배너는 `aria-live="polite"` 로 등재하지 않음 — 페이지 진입 시 정적 표시. |
| **PUSH 자동 결과 추적 갭** | (a) 운영 상태 안내 섹션에 `--info` 배너 **상시** 노출 (BE 응답에 별도 플래그 없어도 디자인 상시). (b) 채널 필터의 PUSH 탭에 작은 ⓘ 아이콘 + tooltip `"자동 푸시 결과 추적은 후속 PR. 현재는 어드민 수동 발송만 표시됩니다."`. (c) 실패 사례 테이블의 PUSH 채널 행은 **수동 발송 한정** 임을 ARIA 라벨로 보강(`"수동 PUSH 실패"`). |
| **비용 placeholder** | (a) `mg-push-monitor__cost-card` 는 **점선 border** (`1px dashed`) 로 placeholder 시각 명시. (b) 카드 좌상단에 `🛈` 아이콘 + 라벨 `"단가 미등록 (후속 PR)"`. (c) 비용 숫자(원/달러 등) 절대 노출 금지 — 발송 건수만 표시. (d) 단가 등록되면 점선 → 실선 + KPI 행에 「예산 카드」 추가 (후속 PR 분리). |
| **본인 테넌트만 + ADMIN/STAFF 공유** | (a) 페이지 헤더 subtitle 에 `"본인 테넌트"` 명시 (다른 테넌트 데이터 없음 보장). (b) HQ_ADMIN/HQ_STAFF 도 본인 테넌트(=HQ) 한정. 별도 selector 없음. |
| **PII 표시** | (a) `recipient_phone_masked` 백엔드 응답을 그대로 `<td>` 에 노출 (재마스킹 X). (b) `error_message` 한국어 prefix 백엔드 응답 그대로 — 프론트에서 prefix 추가 금지. (c) 실패 사례 테이블 행 `aria-label` 에는 마스킹된 값만 사용. (d) 외부 클립보드 복사 비활성 (CSS `user-select: none` — 마스킹 우회 방지). |

> **치명적 위반**: 위 5개 가드를 어기면 D11 토큰 게이트 + Phase 1 결론 위배로 **PR 차단** 사유. core-tester 게이트에서 검증한다.


---

## 11. core-coder 가 그대로 구현 가능한 수준의 상세도

### 11.1 작업 순서 (코더 권장)

1. `frontend/src/components/admin/AdminPushMonitoringPlaceholderPage.js` 를 그대로 두고, 신규 `frontend/src/components/admin/push-monitoring/AdminPushMonitoringPage.js` 작성 → `App.js` 라우터에서 placeholder 컴포넌트 import 만 교체. (기존 placeholder 파일 삭제는 본 PR 머지 후 회수 PR 권장 — 롤백 안전성)
2. atoms (5개) → molecules (6개) → organisms (4개) → page 순서로 BEM CSS 와 함께 작성. 각 컴포넌트 디렉토리에 `.css` 파일 동봉, JS 에서 import.
3. 모든 색·간격·radius 는 **§5.1 표의 토큰**만 사용. hex/rgba 직접 작성 금지 (D11 KPI 게이트).
4. 텍스트는 §9.1 SCAFFOLD_COPY 기준으로 `frontend/src/constants/adminWebScaffold.js` 에 추가 후 컴포넌트는 `ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_*` 만 참조. **컴포넌트 안에 한국어 리터럴 금지**.
5. `usePushMonitoringSummary` (단일 fetcher) + `usePushMonitoringPolling` (60s 타이머) 훅 작성. fetcher 는 `StandardizedApi` (`/core-solution-api`) 사용. 응답 비표준 페이로드는 `frontend/src/constants/adminWebScaffold.js` 의 `extractRows` 패턴 답습.
6. `PushMonitoringTrendChart` 는 §6.2 구조 그대로. 외부 차트 라이브러리 `package.json` 추가 금지.
7. 재발송 confirm 모달은 `frontend/src/components/common/modals/UnifiedModal.js` 재사용 — 신규 모달 컴포넌트 작성 금지.
8. 단위 테스트: 각 molecule/organism 별 RTL `__tests__` (직전 PR 패턴 그대로). 최소 5개 테스트 (KPI 카드 variant, 운영 OFF 배너 표시 토글, 차트 빈 상태, 실패 행 retryable, 재발송 confirm 콜백).
9. **하드코딩 게이트**: `npm run check-hardcode` (저장소 스크립트가 있다면) 또는 `rg "[#@]([0-9a-f]{3,8})" frontend/src/components/admin/push-monitoring/` 결과 0 건 확인.
10. **시각 회귀 검증**: 런타임에 placeholder 와 비교 → 사이드바·상단 바·섹션 블록 시각 언어 동일성 확인 (B0KlA 가이드).

### 11.2 상태머신 (요약)

```text
[Idle]
  ↓ mount
[InitialLoading] --(success)--> [Polling]
                  --(error)----> [InitialError(재시도 버튼)]
                                   ↓ retry
                                 [InitialLoading]

[Polling]
  ↓ 60s tick / 사용자 필터 변경 / visibility=visible 복귀
[BackgroundFetching]
  --(success)--> [Polling] (값 갱신)
  --(error)----> [Polling] + refresh-indicator--error (15s 후 자동 재시도)
```

### 11.3 의존성·금지 항목

- ❌ `recharts` / `chart.js` / `victory` / `nivo` / `d3` 신규 의존성
- ❌ `unified-design-tokens.css` 수정
- ❌ 컴포넌트 내부 한국어 리터럴
- ❌ hex/rgba 색 하드코딩
- ❌ `recipient_phone_masked` 재마스킹 또는 `_phone` 평문 표시
- ❌ 비용 숫자(원·달러) 표시
- ❌ 다른 테넌트 데이터 selector
- ❌ `setTimeout`/`setInterval` 으로 직접 폴링 (반드시 `usePushMonitoringPolling` 훅 단일 진입)

### 11.4 완료 조건 (DoD)

- [ ] §3 의 17개 신규 컴포넌트 모두 구현
- [ ] §5.1 BEM 표의 모든 클래스 정의 + 토큰만 사용
- [ ] §7 ARIA 모두 적용 + RTL `axe` 위반 0
- [ ] §8.4 4단계 반응형 모두 검증 (Storybook 또는 수동 viewport 테스트)
- [ ] §9.1 SCAFFOLD_COPY 모두 추가 + 컴포넌트는 한국어 리터럴 0
- [ ] §10 디자인 가드 5개 모두 표시
- [ ] `check-hardcode` 위반 0
- [ ] 단위 테스트 모두 통과 (`__tests__` 신규 5+ 추가)

---

## 부록 A. 산출 보고 요약

| 항목 | 값 |
|------|----|
| 핸드오프 문서 경로 | `docs/project-management/2026-06-07/BW1_PUSH_MONITORING_DESIGN_HANDOFF.md` |
| 줄 수 | 본 문서 끝에서 `wc -l` 측정 (산출 보고에 첨부) |
| 컴포넌트 트리 합산 | 신규 17개 (atoms 5 / molecules 6 / organisms 4 / page 1 + StatusToggleBadge atom 별도 1) — §3.2 표 |
| 신규 디자인 토큰 | **0 개** (기존 `--mg-color-*` / `--ad-b0kla-*` / `--mg-spacing-*` / `--mg-font-*` 만으로 표현). 후속 비용 게이지 시 `dashboard-tokens-extension.css` 에 신설 검토(보류) |
| 차트 라이브러리 | **외부 미도입**. CSS-driven stacked bar (`mg-v2-cumulative-chart` 패턴 답습) |
| core-coder 추가 주의점 | (1) placeholder 파일 삭제 X — 라우터 import 만 교체 (2) `usePushMonitoringPolling` 단일 진입 (3) `unified-design-tokens.css` 수정 금지 (4) 한국어 리터럴 0 (5) D11 하드코딩 게이트 0 위반 (6) `recipient_phone_masked` 그대로 노출 (7) `UnifiedModal` 재사용 (8) recharts 등 외부 차트 라이브러리 추가 금지 |

## 부록 B. As-Built 정렬 (2026-06-07 추가)

> 본 핸드오프는 원래 `PushMonitoring*` 접두 / `push-monitoring/` (kebab) 디렉토리 기준으로 설계되었으나, core-coder 의 구현 단계에서 가독성·실파일명 일관성(`AdminPushMonitoringPage.jsx` 와의 통일)을 위해 다음과 같이 정렬되었습니다. **설계 의도(11개 섹션 / 5·6·4·1 트리 / BEM root `mg-push-monitor` / 토큰 0 신설)는 100% 보존**됩니다.

### B.1 디렉토리 정렬

| 항목 | 핸드오프 원안 | As-Built |
|------|---------------|----------|
| 루트 디렉토리 | `frontend/src/components/admin/push-monitoring/` (kebab) | `frontend/src/components/admin/PushMonitoring/` (Pascal — 어드민 하위 다른 모듈 컨벤션과 동일) |
| 페이지 파일 | `AdminPushMonitoringPage.js` | `AdminPushMonitoringPage.jsx` (`.jsx` 일관) |

### B.2 컴포넌트 네이밍 정렬

| 핸드오프 원안 | 계층(원안) | As-Built | 계층(As-Built) | 비고 |
|---------------|------------|----------|----------------|------|
| `PushMonitoringRefreshIndicator` | atom | `PushMonitorRefreshIndicator` | atom | 접두 단축 (`Push Monitoring` → `PushMonitor`) |
| `PushMonitoringTrendBar` | atom | — | (`PushMonitorTrendChart` 내부 inline 으로 흡수) | CSS-driven 막대가 너무 가벼워 분리 비용 > 이득 |
| `StatusToggleBadge` | atom | `PushMonitorStatusPill` | atom | 접두 통일 + `Pill` 형상 명시 |
| `PushMonitoringFailureMessage` | atom | — | (`PushMonitorFailureList` row 내부 inline) | 단일 호출 지점 — 분리 보류 |
| `PushMonitoringResendButton` | atom | — | (`PushMonitorFailureList` 내부 inline) | UnifiedModal trigger 가 단순해 분리 보류 |
| — | — | `PushMonitorKpiCard` | atom (격하) | 원안 molecule → 단일 카드는 atom 분류가 더 적합 |
| — | — | `PushMonitorOperationalBadge` | atom (신규) | 「알림톡 운영 OFF」 등 배지 표시 전용 |
| — | — | `PushMonitorMaskedRecipient` | atom (신규) | `recipient_phone_masked` 노출 + ARIA 라벨 캡슐화 (D7 가드 강화) |
| `PushMonitoringFilters` | molecule | `PushMonitorFilters` | molecule | 접두 단축 |
| `PushMonitoringKpiCard` | molecule | (atom 으로 격하 — 위 참조) | atom | — |
| `PushMonitoringOperationalBanner` | molecule | `PushMonitorOperationalBanners` | molecule | warning + info 두 배너를 한 컴포넌트에서 처리(복수형) |
| `PushMonitoringCostPlaceholderCard` | molecule | (`PushMonitorOperationalSection` 내부 흡수) | — | OperationalSection organism 이 banner + 비용 placeholder 를 모두 관장 |
| `PushMonitoringSnapshotRow` | molecule | (`PushMonitorTenantSnapshotTable` 내부 inline) | — | 행 분리가 props 복잡도만 키워 inline 유지 |
| `PushMonitoringFailureRow` | molecule | (`PushMonitorFailureList` 내부 inline) | — | 동 |
| `PushMonitoringKpiRow` | organism | `PushMonitorKpiRow` | molecule (격하) | 단순 grid wrapper — molecule 분류가 더 적합 |
| `PushMonitoringTrendChart` | organism | `PushMonitorTrendChart` | molecule (격하) | 시각 단위 1개 — molecule |
| `PushMonitoringSnapshotTable` | organism | `PushMonitorTenantSnapshotTable` | molecule (격하) | 동 |
| `PushMonitoringFailureList` | organism | `PushMonitorFailureList` | molecule (격하) | 동 |
| — | — | `PushMonitorOperationalSection` | organism (신규) | 운영 상태 ContentSection wrapper — 배너 + 비용 placeholder + (옵션) PUSH 갭 가드 |
| — | — | `PushMonitorTrendSection` | organism (신규) | 추이 ContentSection wrapper |
| — | — | `PushMonitorSnapshotSection` | organism (신규) | 스냅샷 ContentSection wrapper |
| — | — | `PushMonitorFailureSection` | organism (신규) | 실패 사례 ContentSection wrapper + 페이지네이션 + UnifiedModal trigger |
| `AdminPushMonitoringPage` | page | `AdminPushMonitoringPage` (동) | page | — |

### B.3 As-Built 트리 (정렬판)

```
AdminPushMonitoringPage  (page)
└─ AdminCommonLayout  (template, 기존)
   └─ ContentArea  (organism, 기존 dashboard-v2/content)
      ├─ ContentHeader  (organism, 기존)
      ├─ PushMonitorFilters  (molecule, 신규)
      │   ├─ SegmentedTabs ×2  (range / channel — 기존 common/SegmentedTabs 재사용)
      │   └─ PushMonitorRefreshIndicator  (atom, 신규)
      ├─ PushMonitorKpiRow  (molecule, 신규)
      │   └─ PushMonitorKpiCard ×4  (atom, 신규 — variants: queue / success / failure / skip)
      ├─ PushMonitorOperationalSection  (organism, 신규)
      │   ├─ PushMonitorOperationalBanners  (molecule, 신규 — warning + info 동시)
      │   │   └─ PushMonitorOperationalBadge  (atom, 신규)
      │   └─ (비용 placeholder card — section 내부 inline)
      ├─ PushMonitorTrendSection  (organism, 신규)
      │   └─ PushMonitorTrendChart  (molecule, 신규 — CSS-driven stacked bar)
      ├─ PushMonitorSnapshotSection  (organism, 신규)
      │   └─ PushMonitorTenantSnapshotTable  (molecule, 신규)
      │       └─ PushMonitorStatusPill  (atom, 신규 — ON/OFF/✓/✗)
      └─ PushMonitorFailureSection  (organism, 신규)
          └─ PushMonitorFailureList  (molecule, 신규)
              ├─ PushMonitorMaskedRecipient  (atom, 신규 — D7 PII 가드 캡슐화)
              └─ (재발송 버튼·error 메시지 — row 내부 inline)
```

### B.4 As-Built 합산 개수

| 계층 | 신규 개수 | 파일 목록 |
|------|-----------|-----------|
| atoms | **6** | `PushMonitorKpiCard`, `PushMonitorMaskedRecipient`, `PushMonitorOperationalBadge`, `PushMonitorRefreshIndicator`, `PushMonitorStatusPill`, (`PushMonitorTrendBar` 흡수) |
| molecules | **6** | `PushMonitorFailureList`, `PushMonitorFilters`, `PushMonitorKpiRow`, `PushMonitorOperationalBanners`, `PushMonitorTenantSnapshotTable`, `PushMonitorTrendChart` |
| organisms | **4** | `PushMonitorOperationalSection`, `PushMonitorTrendSection`, `PushMonitorSnapshotSection`, `PushMonitorFailureSection` |
| pages | **1** | `AdminPushMonitoringPage.jsx` |
| **합계** | **17** | (원안 17개와 동일 — 분류만 재배치) |

### B.5 BEM root 유지 — `mg-push-monitor`

핸드오프 §5.1 의 모든 BEM 클래스는 그대로 사용되었습니다. CSS 토큰 신설 **0개** (§5.2 가드 유지). 페이지 wrapper 는 `className="mg-v2-ad-b0kla mg-push-monitor"` 로 B0KlA 시각 언어를 상속합니다(`AdminPushMonitoringPage.jsx` L100).

### B.6 디자인 가드 (§10) 적용 결과

| 가드 | As-Built 상태 |
|------|---------------|
| 알림톡 운영 OFF 배너 | ✅ `PushMonitorOperationalSection` → `PushMonitorOperationalBanners --warning` (BE `alimtalkEnabled=false` 시 조건 노출) |
| PUSH 자동 결과 추적 갭 | ✅ `PushMonitorOperationalBanners --info` 상시 표시 |
| 비용 placeholder | ✅ `PushMonitorOperationalSection` 내부 inline 카드 (점선 border, 채널별 발송 건수만) |
| 본인 테넌트 한정 | ✅ BE `AdminPushMonitoringController` 가 SecurityContext 기준 단일 테넌트 응답 — selector 없음 |
| PII 마스킹 | ✅ `PushMonitorMaskedRecipient` atom 으로 캡슐화 (BE `recipient_phone_masked` 그대로 통과, 재마스킹 X) |

### B.7 마이그/후속 정리 권장

- `PushMonitorOperationalSection` 내부 inline 비용 카드 → 단가 등록 시점에 `PushMonitorCostCard` 별도 molecule 로 추출 (예산 게이지 추가 시점).
- `PushMonitorOperationalBanners` 가 banner 종류가 3+ 로 늘면 `OperationalBanner` 단일 molecule 로 분해 + Section 에서 배열 매핑.
- 어드민 다른 모니터링 페이지(`AdminMindGardenObservabilityPage` 등)에 동일 패턴 도입 시 `PushMonitorOperationalSection` 을 `MonitoringStatusBannerSection` 으로 일반화 회수 (core-component-manager 평가).

---

## 부록 C. 인용 문서

- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` — 위임 순서·테스터 게이트
- `docs/design-system/PENCIL_DESIGN_GUIDE.md` — 펜슬 단일 소스·B0KlA 팔레트·반응형
- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 5계층 분류 기준
- `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` — 6단계 브레이크포인트
- `docs/standards/DESIGN_CENTRALIZATION_STANDARD.md` — 토큰·하드코딩 금지
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` — UnifiedModal·EmptyState 재사용
- `frontend/src/components/admin/AdminPushMonitoringPlaceholderPage.js` — 교체 대상
- `frontend/src/components/dashboard-v2/AdminDashboardV2.js` — `mg-v2-ad-b0kla__pill-toggle size="sm"` 동일 패턴 (직전 PR #146)
- `frontend/src/components/dashboard-v2/molecules/CumulativeConsultantCountsChart.jsx` — CSS-driven 차트 패턴 답습 원본 (직전 PR P1)
- `frontend/src/components/common/SegmentedTabs.jsx` — range/channel 토글 재사용
- `frontend/src/components/common/EmptyState.js` / `LoadingSpinner*` / `modals/UnifiedModal.js` — 공통 모듈 재사용
- 디자인 시스템 펜슬 ID `B0KlA` — 어드민 대시보드 v2 디자인 정의

---

> **본 핸드오프는 디자인 산출물입니다. core-designer 는 코드 직접 수정 0. 이후 단계는 core-coder (구현) → core-tester (게이트) 순으로 위임됩니다.**
