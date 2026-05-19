# MindGarden 내담자 쇼핑·리워드 UI 디자인 핸드오프 (웹/Expo)

| 항목 | 내용 |
|------|------|
| 문서 제목 | MindGarden 내담자 쇼핑·리워드 UI 디자인 핸드오프 |
| 상태 | **설계 완료** — `core-coder`, `core-publisher` 전달용 |
| 작성일 | 2026-05-19 |
| 대상 | 내담자(Client) 웹 및 Expo 앱 |
| SSOT 참조 | [SHOP_REWARD_PLATFORM_ORCHESTRATION.md](./SHOP_REWARD_PLATFORM_ORCHESTRATION.md), [MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md](./MULTI_TENANT_SHOP_MARKETPLACE_SPEC.md), [ONLINE_PAYMENT_CATALOG_CHECKOUT_SPEC.md](./ONLINE_PAYMENT_CATALOG_CHECKOUT_SPEC.md), [POINT_REWARD_EARN_AND_REDEEM_SPEC.md](./POINT_REWARD_EARN_AND_REDEEM_SPEC.md) |

---

## 1. 디자인 방향성 및 토큰 (Client Theme)

어드민 대시보드 샘플(https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample)의 **구조적 톤앤매너(섹션 블록, 악센트 바 등)**를 차용하되, 내담자(B2C) 환경에 맞게 **모바일 우선(Mobile-first)** 및 **Client Theme**으로 적용합니다.

### 1.1 색상 토큰 (`unified-design-tokens.css` 참조)
- **배경**: `var(--mg-color-background-main)` (#FAF9F7)
- **표면/카드**: `var(--mg-color-surface-main)` (#F5F3EF)
- **주조색(Primary)**: `var(--mg-color-primary-main)` (#3D5246) — 주요 CTA 버튼, 활성 탭
- **포인트(Accent)**: `var(--mg-color-accent-main)` (#8B7355) — 포인트 잔액 강조, 배너
- **텍스트(기본)**: `var(--mg-color-text-main)` (#2C2C2C)
- **텍스트(보조)**: `var(--mg-color-text-secondary)` (#5C6B61)
- **테두리**: `var(--mg-color-border-main)` (#D4CFC8)

### 1.2 타이포그래피 및 레이아웃
- **폰트**: Noto Sans KR
- **모바일 기본 패딩**: 좌우 16px ~ 20px
- **데스크톱 기본 패딩**: 좌우 24px ~ 32px (최대 너비 1200px 중앙 정렬, 사이드바 없음)
- **섹션 블록**: `border-radius: 16px`, `border: 1px solid var(--mg-color-border-main)`, `background: var(--mg-color-surface-main)`

---

## 2. 화면 와이어프레임 및 스펙

### 2.1 PLP (상품 목록 페이지 - Product List Page)
테넌트의 카탈로그를 탐색하는 진입점입니다. (모델 A: 단일 테넌트 몰 기준)

- **테넌트 배너 영역 (Organism)**
  - 상단 풀 와이드 배너. 테넌트 로고 및 환영 카피 노출.
  - 배경: `var(--mg-color-primary-light)` 또는 그라데이션.
  - 텍스트: 20px, Bold, 흰색 계열.
- **카테고리 탭 (Molecule)**
  - 탭 항목: [상담 패키지] / [심리 검사]
  - 활성 상태: 하단 테두리 2px `var(--mg-color-primary-main)`, 텍스트 16px Bold.
- **상품 카드 리스트 (Organism > Molecule)**
  - 1열(모바일) 또는 2~3열(데스크톱) 그리드 레이아웃.
  - **SKU 카드**:
    - `border-radius: 12px`, `background: var(--mg-color-surface-main)`.
    - 좌측 악센트 바: 4px 너비, `var(--mg-color-primary-main)`.
    - 상품명: 16px, `var(--mg-color-text-main)`, Bold.
    - 뱃지(선택): "인기", "신규" (`var(--mg-color-accent-main)` 배경).
    - 가격: 18px, Bold. (포인트 결제 가능 여부 아이콘 표시).

### 2.2 체크아웃 (결제 및 포인트 사용)
장바구니 또는 바로 구매에서 진입하는 결제 전 단계입니다.

- **주문 상품 요약 (Molecule)**
  - 선택한 SKU 목록 및 단가 표시.
- **포인트 사용 섹션 (Organism)**
  - 섹션 블록 스타일 적용.
  - **가용 잔액 표시**: "보유 포인트: **15,000 P**" (`var(--mg-color-accent-main)`로 숫자 강조).
  - **입력 폼**: 숫자 입력 필드 + [전액 사용] 토글/버튼.
  - *유효성 검사*: 가용 잔액 초과 입력 불가, 정책(`min_order_for_redeem`) 위반 시 에러 메시지(`var(--mg-color-error)` 등) 노출.
- **최종 결제 금액 요약 (Molecule)**
  - 상품 총액: 100,000 원
  - 포인트 할인: - 15,000 원 (색상: `var(--mg-color-accent-main)`)
  - **최종 PG 결제액**: 85,000 원 (크기: 24px, Bold, `var(--mg-color-primary-main)`)
- **약관 및 결제 버튼 (Organism)**
  - 체크박스: "디지털 상품 환불 규정 및 결제 진행에 동의합니다."
  - CTA 버튼: `width: 100%`, `height: 48px`, `border-radius: 10px`, `background: var(--mg-color-primary-main)`. 텍스트: "85,000원 결제하기".

### 2.3 내 포인트 (잔액 및 내역)
내담자가 본인의 포인트 적립/사용 내역을 확인하는 화면입니다.

- **잔액 헤더 (Organism)**
  - 큰 카드 형태. 배경: `var(--mg-color-primary-main)`, 텍스트: 흰색.
  - "사용 가능한 포인트" 라벨 (14px) + 잔액 "15,000 P" (32px, Bold).
- **최근 원장 리스트 (Organism)**
  - 리스트 아이템 (Molecule):
    - 좌측: 트랜잭션 타입 (적립 / 사용 / 만료), 날짜 (12px, `var(--mg-color-text-secondary)`).
    - 우측: 금액 (+1,000 P / -500 P). 적립은 주조색, 사용은 텍스트 기본색.
    - 하단 링크: "주문 번호 #12345 상세보기" (클릭 시 내 구매 상세로 이동).

---

## 3. Expo (모바일 앱) 특화 가이드

웹과 **동일한 IA(Information Architecture) 및 API**를 사용하며, 모바일 네이티브 UX에 맞게 최적화합니다.

- **라우트 구조**: `(client)/(shop)/` 하위에 `catalog`, `checkout`, `points` 화면 배치.
- **네비게이션**: 
  - PLP: 하단 탭 또는 더보기 메뉴에서 진입.
  - 체크아웃: 모달(Sheet) 형태 또는 Stack Push로 화면 전환. 상단 뒤로가기 버튼 제공.
- **터치 영역**: 모든 버튼, 탭, 체크박스의 최소 터치 영역은 **44x44px** 이상 확보.
- **키보드 대응**: 포인트 입력 시 숫자 키패드(`keyboardType="numeric"`) 활성화 및 키보드 회피(KeyboardAvoidingView) 적용.

---

## 4. 아토믹 컴포넌트 계층 (Component Hierarchy)

구현 시 다음 계층 구조를 참고하여 컴포넌트를 분리 및 재사용합니다.

| 계층 | 컴포넌트명 (예시) | 설명 및 토큰 |
|------|-------------------|--------------|
| **Atoms** | `PriceText` | 통화 기호 및 금액 포맷팅. `var(--mg-color-text-main)`, Bold |
| **Atoms** | `AccentBar` | 섹션/카드 좌측 4px 포인트 바. `var(--mg-color-primary-main)` |
| **Atoms** | `Badge` | 카테고리/상태 뱃지. `border-radius: 4px` |
| **Molecules** | `SkuCard` | 상품 정보 + 가격 + 뱃지 조합. |
| **Molecules** | `PointInput` | 숫자 입력 필드 + 전액 사용 버튼 조합. |
| **Molecules** | `LedgerListItem` | 포인트 내역 1줄 (날짜, 타입, 금액, 주문 링크). |
| **Organisms** | `CheckoutSummary` | 상품 총액, 할인액, 최종 결제액 집계 블록. |
| **Organisms** | `PointBalanceHeader` | 내 포인트 상단 잔액 표시 카드. |
| **Templates** | `ShopClientLayout` | 상단 네비게이션(웹) + 본문 컨테이너(max-width 1200px) + 푸터. |

*(참고: 기존 공통 모듈 `UnifiedModal`, `ContentHeader` 등이 존재할 경우 우선 적용합니다.)*

---

## 5. core-coder 전달용 완료 조건 (Handoff Checklist)

`core-coder`는 본 설계 문서를 바탕으로 다음 조건을 만족하도록 구현해야 합니다.

1. **라우트 및 진입점**:
   - 웹: `/client/shop-catalog`, `/client/shop-checkout`, `/client/shop-points` 라우트 신설 및 연결.
   - Expo: `(client)/(shop)/` 라우트 트리 신설.
2. **디자인 토큰 적용**:
   - `unified-design-tokens.css`의 `var(--mg-*)` 변수만 사용하여 스타일링. 하드코딩된 색상값(hex) 사용 금지.
   - 섹션 블록 및 카드 UI에 지정된 `border-radius` 및 패딩 적용.
3. **하드코딩 금지**:
   - SKU 이름, 가격, 카테고리 명칭은 모두 API(`GET /api/v1/clients/me/shop/catalog`) 응답 데이터를 기반으로 렌더링. 프론트엔드 코드 내 하드코딩 금지.
4. **포인트 체크아웃 로직**:
   - 가용 잔액 초과 입력 방지 로직 구현.
   - 포인트 할인액이 반영된 최종 PG 결제 금액 계산 로직 프론트엔드 반영 (서버 검증과 일치).
5. **반응형 및 모바일 우선**:
   - 웹 화면은 모바일 뷰포트(375px)에서 깨짐 없이 렌더링되어야 하며, 데스크톱(1200px)에서는 중앙 정렬된 컨테이너로 표시.

---
**디자인 설계자**: `core-designer` (gemini-3.1-pro)
