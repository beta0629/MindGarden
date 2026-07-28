# 내담자별 패키지 결제 내역 (Package Payment History) UI/UX 스펙

**작성자**: core-designer  
**작성일**: 2026-07-28  
**관련 기획**: `docs/project-management/CLIENT_PACKAGE_PAYMENT_HISTORY_PLAN.md`

---

## 1. 개요 및 배경

추가 패키지(TERMINATED 매핑 병합) 및 회기 추가 내역이 합산 회기로만 표시되고 건별 결제 이력이 노출되지 않는 문제를 해결하기 위한 UI입니다. 관리자(ADMIN/STAFF)가 추가 패키지나 회기 추가 요청, 입금 확인, 승인 직후 같은 맥락에서 내담자의 결제 이력을 건별로 검토할 수 있도록 타임라인 형태의 뷰를 제공합니다.

---

## 2. 레이아웃 구조 및 선정 이유

사용자가 접근하는 맥락에 따라 두 가지 컨테이너를 활용하여 일관된 리스트(Organism)를 렌더링합니다.

1. **통합스케줄 (Integrated Schedule)**
   - **진입점**: ACTIVE 카드 내 `[회기추가]` 버튼 옆 `[패키지내역]` 액션 버튼
   - **컨테이너**: **UnifiedModal** (권장) 또는 Side Peek
   - **선정 이유**: 카드 뷰 위에서 즉각적인 문맥 단절 없이 이력을 확인하고 닫을 수 있도록 모달 형태가 적합합니다.
2. **내담자 종합관리 (Client Management)**
   - **진입점**: 내담자 상세 Side Peek 내 매칭 탭 하위 「결제 내역」
   - **컨테이너**: **Side Peek** 내부 ContentSection
   - **선정 이유**: 내담자 단위의 전체 이력을 탐색하는 맥락이므로, 기존 Side Peek 레이아웃에 자연스럽게 통합합니다.

---

## 3. 세부 UI/UX 스펙

### 3.1. 헤더 영역 (합산 요약)
- **배경**: `var(--mg-color-background-main)` (#FAF9F7)
- **제목**: `내담자명 · 상담사명` (16px, fontWeight 600, `var(--mg-color-text-main)`)
- **합산 요약**: `총 N회 / 잔여 M회` (14px, `var(--mg-color-primary-main)` 강조)
- **구분선**: 하단 1px solid `var(--mg-color-border-main)`

### 3.2. 본문 영역 (타임라인 리스트)
- **레이아웃**: 상하 스크롤 가능한 리스트 뷰, 각 항목 간 gap `var(--mg-spacing-16)`
- **타임라인 카드 (ContentCard 재사용)**:
  - **배경**: `var(--mg-color-surface-main)` (#F5F3EF)
  - **테두리**: 1px solid `var(--mg-color-border-main)`, `border-radius: var(--mg-radius-16)`
  - **패딩**: `var(--mg-spacing-24)`
  - **좌측 악센트 바**: 폭 4px, 반경 2px. 유형에 따라 색상 분기 (예: 추가패키지 `var(--mg-color-primary-main)`, 최초매칭 `var(--mg-color-secondary-main)`)
- **카드 내부 정보 (관리자 기준)**:
  - **상단**: 결제일 (14px, `var(--mg-color-text-secondary)`) + **유형 뱃지** (최초매칭 / 추가패키지 / 회기추가) + **상태 뱃지** (승인 / 대기 등)
  - **중단**: 패키지명 (16px, fontWeight 600) + 회기 수 (예: `10회`) + 금액 (예: `500,000원`)
  - **하단**: 결제수단, 참조 번호, 상담사명, 매핑 ID (12px, `var(--mg-color-text-secondary)`)

### 3.3. 와이어프레임 (Text 기준)

```text
[통합스케줄 카드] … [회기추가] [패키지내역]
                         ↓
              UnifiedModal (또는 Side Peek)
              ┌──────────────────────────────────────────┐
              │ 김내담 · 박상담                          │
              │ 합산 요약: 총 20회 / 잔여 12회           │
              ├──────────────────────────────────────────┤
              │ ▌ 2026-07-28   [추가패키지] [승인]       │
              │   프리미엄 10회권                        │
              │   10회 · 500,000원                       │
              │   계좌이체 · 참조: REF123 · 박상담       │
              │                                          │
              │ ▌ 2026-06-01   [최초매칭] [완료]         │
              │   프리미엄 10회권                        │
              │   10회 · 500,000원                       │
              │   카드결제 · 참조: REF001 · 박상담       │
              └──────────────────────────────────────────┘
```

### 3.4. 사용 토큰 (CSS 변수)
하드코딩을 금지하며, 아래의 `unified-design-tokens.css` 토큰을 사용합니다.
- **배경**: `var(--mg-color-background-main)`, `var(--mg-color-surface-main)`
- **테두리**: `var(--mg-color-border-main)`
- **텍스트**: `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`
- **주조색 (강조/뱃지/악센트)**: `var(--mg-color-primary-main)`, `var(--mg-color-secondary-main)`
- **간격 및 반경**: `var(--mg-spacing-16)`, `var(--mg-spacing-24)`, `var(--mg-radius-16)`

---

## 4. 아토믹 계층 및 공통 모듈 활용

새 컴포넌트 생성 전 `COMMON_MODULES_USAGE_GUIDE.md`를 준수하여 기존 모듈을 최대한 재사용합니다.

- **Atoms**: 
  - `Badge` (유형 표시용: 최초매칭/추가패키지/회기추가)
  - `StatusBadge` (상태 표시용: 승인/대기 등)
- **Molecules**: 
  - `ContentCard` (타임라인 개별 항목 래퍼)
- **Organisms**: 
  - `PackagePaymentHistoryList` (타임라인 카드들의 목록 및 합산 헤더를 포함하는 재사용 가능한 리스트 컴포넌트)
- **Templates**: 
  - `UnifiedModal` (통합스케줄 진입 시 쉘)

---

## 5. 상호작용 및 상태 (States & Exceptions)

- **로딩 상태**: 데이터를 불러오는 동안 공통 `UnifiedLoading` 컴포넌트를 표시합니다.
- **빈 상태 (Empty State)**: 결제 내역이 없는 경우 공통 `EmptyState` 컴포넌트를 사용하여 "결제 내역이 없습니다." 메시지와 아이콘을 중앙에 표시합니다.
- **에러 상태**: API 호출 실패 시 공통 알림(`UnifiedNotification` 또는 `NotificationContext`)을 통해 에러 메시지를 노출하고, 모달 내부에 재시도 버튼을 제공합니다.
- **권한 게이트 (CONSULTANT)**: 상담사 계정으로 접근 시 본인 담당 건만 노출되도록 API 및 UI에서 필터링 처리합니다.

---

## 6. 후속 과제 (P1 - Client)

- **내담자 화면 (`/client/payment-history`)**: 본 스펙에서 정의한 Organism(`PackagePaymentHistoryList`)을 재사용하되, 내부 notes, 매핑 ID 등 관리자용 상세 정보를 숨기고 결제일, 패키지명, 회기, 금액, 유형, 상태만 노출하도록 변형(Variant)하여 적용합니다.

---

## 7. 참조 문서

- `docs/design-system/PENCIL_DESIGN_GUIDE.md` (B0KlA 비주얼 스펙)
- `docs/standards/COMMON_MODULES_USAGE_GUIDE.md` (공통 모듈 우선 검토)
- `docs/design-system/SCREEN_SPEC_SESSION_EXTENSION_MODAL.md` (톤 정합성)
- `frontend/src/styles/unified-design-tokens.css`
