# 네이버 플레이스 예약 연동 — 어드민 설정 화면 요구사항

**목적**: 네이버 스마트플레이스 예약 연동의 **테넌트·OPS 설정 UI**를 `core-designer`·`core-coder`에 전달하기 위한 기획 요구사항. 코드·와이어픽셀 없음.  
**범위**: AdminCommonLayout 기반 어드민, 계정 연동 → 상품 매핑 → 동기화 상태/로그, 통합 일정 캘린더 뱃지.  
**연계**: [ADR-0004](../adr/adr-0004-external-booking-channel-naver-place-adapter.md), [연동 스펙](../standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md), [제휴 체크리스트](../project-management/NAVER_PLACE_BOOKING_PARTNERSHIP_ORCHESTRATION_CHECKLIST.md), [로드맵](../project-management/NAVER_PLACE_BOOKING_INTEGRATION_ROADMAP.md).

---

## 0. 배경·전제

- 저장소에 네이버 예약 UI **없음** — 신규 설정 메뉴·화면 필요.
- 멀티테넌트: 모든 API·표시는 **`tenantId` 스코프**; OPS는 테넌트 선택 후 설정.
- 공통 모듈 우선: **AdminCommonLayout**, **ContentHeader**, **ContentArea**, **UnifiedModal**, **BadgeSelect**, **MGCard** / `mg-v2-ad-b0kla__card`, 디자인 토큰 `var(--mg-*)` only.

---

## 0.4 core-designer 전달 — 사용성·정보·레이아웃

### 1. 사용성

| 역할 | 주요 흐름 |
|------|-----------|
| **OPS (플랫폼)** | 테넌트 선택 → 연동 **활성화/비활성** → 제휴 `connectionId`·웹훅 URL 복사 → 장애 시 kill switch |
| **테넌트 ADMIN** | 설정 → **네이버 플레이스 연동** 진입 → OAuth/사업자 연결 → 예약상품↔상담사 **매핑** → 동기화 로그 확인·재시도 |
| **STAFF** | 매핑 **조회만**(정책 on 시); 연결·시크릿·매핑 편집 **불가** |

**흐름 순서(필수)**: (1) 계정·사업자 연동 상태 카드 → (2) 상품 매핑 테이블 → (3) 동기화 로그·재시도. 미연동 시 (2)(3)는 empty state + “먼저 연동하세요”.

**자주 쓰는 동작 앞 배치**: 연결 상태·마지막 health check, **웹훅 URL 복사**, 매핑 추가, 실패 로그 **재시도**.

### 2. 정보 노출

| 데이터 | OPS | ADMIN | STAFF |
|--------|-----|-------|-------|
| 연결 상태·사업자 ID | ○ | ○ | △(마스킹) |
| OAuth/토큰·secret | **참조 ID만**; 값 노출 금지 | 연결/해지만 | ✕ |
| 웹훅 URL | ○ | ○ | ✕ |
| 상품↔상담사 매핑 | ○ | ○ CRUD | ○ read |
| sync log payload | 마스킹 JSON | 요약+에러코드 | 요약만 |
| `external_booking_id` | ○ | ○ | ○ |

민감: 내담자명·연락처는 로그 UI **기본 숨김**; 상세는 UnifiedModal + 권한.

### 3. 레이아웃

```
AdminCommonLayout
└── ContentHeader (제목: 네이버 플레이스 예약 · breadcrumb: 설정 > 연동)
└── ContentArea
    ├── [섹션 A] 연동 상태 카드 (MGCard)
    │     상태 뱃지 · 사업자 ID · connected_at · [연결][해제][URL 복사]
    ├── [섹션 B] 예약상품 매핑
    │     ContentHeader 소제목 + [매핑 추가] → UnifiedModal
    │     테이블: external_product_id | 상담사 | active | slot_duration | actions
    └── [섹션 C] 동기화 로그
          필터: 기간 · status · direction · BadgeSelect(channel=NAVER_PLACE)
          테이블: 시각 | event | external_booking_id | schedule_id | status | [재시도]
```

- **Empty state**: B0KlA 톤, 일러스트 없이 텍스트+CTA.
- **오류**: UnifiedModal — “매핑 없음”“토큰 만료” 등 다음 행동 링크(매핑 탭·재연결).

---

## 1. 메뉴·라우트 (제안)

| 항목 | 값 |
|------|-----|
| 경로 | `/admin/settings/integrations/naver-place` (또는 기존 설정 트리 하위) |
| LNB | **설정 > 외부 연동 > 네이버 플레이스** |
| feature flag | `booking.naver-place.enabled` off 시 메뉴 숨김 또는 “준비 중” |

---

## 2. 화면 상세

### 2.1 계정 연동 (섹션 A)

- **연결 전**: “네이버 스마트플레이스와 연동하면 네이버 예약이 통합 일정에 반영됩니다.” + [네이버로 연결] (OAuth — 스펙 확정 후)
- **연결 후**: `ACTIVE` / `ERROR` / `REVOKED` 뱃지, `external_business_id`, `last_health_check_at`
- **웹훅 URL**: 읽기 전용 + 복사 버튼; OPS용 `connectionId` 표시
- **해제**: UnifiedModal 확인 — “기존 매핑·로그는 유지, 신규 수신 중단”

### 2.2 상담사↔예약상품 매핑 (섹션 B)

- **추가/편집 Modal**: `external_product_id`(텍스트), 상담사 `BadgeSelect`, `slot_duration_minutes`, `is_active`
- **검증**: 중복 `external_product_id` — 인라인 에러
- **목록**: 정렬·페이지네이션; inactive 행 시각 구분(토큰 `--mg-text-muted`)

### 2.3 동기화 로그 (섹션 C)

- **필터**: `dateRange`, `status`(SUCCESS/FAILED/CONFLICT/SKIPPED), `direction`(INBOUND/OUTBOUND)
- **행 클릭**: UnifiedModal — `error_code`, `error_message`, `schedule_id` 링크(통합 일정 상세)
- **재시도**: `FAILED`·`CONFLICT`만; ADMIN+ ; 확인 Modal → API `POST .../sync-logs/{id}/retry`
- **Phase 2+**: OUTBOUND 실패 필터 기본 pin

---

## 3. 통합 일정 UI — 채널 뱃지

| 위치 | 표시 |
|------|------|
| 캘린더 이벤트 | `booking_source=NAVER_PLACE` → 뱃지 **「네이버」** (채널 색 토큰 — designer 지정, hex 하드코딩 금지) |
| 일정 목록·사이드바 | 동일 뱃지 + tooltip `external_booking_id` (ADMIN/STAFF) |
| 상세 Modal | 출처·동기화 상태·`last_synced_at`; CONFLICT 시 경고 문구 |

`INTERNAL` 또는 null — 뱃지 없음.

---

## 4. API·데이터 (FE 계약 초안)

| UI | API (제안) |
|----|------------|
| 연결 상태 | `GET/POST/DELETE /api/v1/admin/booking-channels/naver-place/connection` |
| 매핑 CRUD | `/api/v1/admin/booking-channels/naver-place/product-mappings` |
| 로그 | `GET /api/v1/admin/booking-channels/naver-place/sync-logs` |
| 재시도 | `POST .../sync-logs/{id}/retry` |

- **StandardizedApi** 필수; `tenantId` 헤더·세션 정합 ([`/core-solution-api`](/.cursor/skills/core-solution-api/SKILL.md)).

---

## 5. core-designer 산출물·core-coder 완료 조건

### core-designer

- [ ] `docs/design-system/SCREEN_SPEC_NAVER_PLACE_BOOKING_SETTINGS.md` (또는 동의 경로)
- [ ] §0.4 반영·B0KlA·AdminCommonLayout·UnifiedModal 명시
- [ ] NAVER 뱃지 색·크기 토큰

### core-coder

- [ ] AdminCommonLayout + ContentHeader + 공통 카드/모달만 사용
- [ ] 역할별 노출 §0.4 표 준수
- [ ] 하드코딩 색·문자열 상수 파일(`constants/`) 분리
- [ ] `core-tester`: ADMIN 매핑 CRUD, STAFF read-only, OPS kill switch(해당 시)

---

## 6. References

- [ADMIN_COMMON_LAYOUT.md](../layout/ADMIN_COMMON_LAYOUT.md)
- [카카오 알림톡 설정 패턴](../project-management/2026-04-23/RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md) §3.3·§1 설정 UI
- [COMMON_DISPLAY_BOUNDARY](../project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md) — `safeDisplay`
