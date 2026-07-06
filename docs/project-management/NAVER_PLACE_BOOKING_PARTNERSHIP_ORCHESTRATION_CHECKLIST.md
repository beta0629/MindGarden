# 네이버 플레이스(스마트플레이스) 예약 연동 — 제휴·운영 오케스트레이션 체크리스트 (SSOT)

**목적**: 네이버 스마트플레이스 **예약 연동**을 제휴 확보부터 테넌트 온보딩·동기화 운영·운영 반영 게이트까지 **누락 없이** 진행하기 위한 단일 체크리스트.  
**주관**: `core-planner` — 구현·패치는 `core-coder`, 검증 게이트는 `core-tester` ([`CORE_PLANNER_DELEGATION_ORDER.md`](./CORE_PLANNER_DELEGATION_ORDER.md)).  
**범위**: 코드 본문 없음. [ADR-0004](../adr/adr-0004-external-booking-channel-naver-place-adapter.md)·[연동 스펙](../standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md)과 쌍으로 유지.

**연계 문서**

| 문서 | 용도 |
|------|------|
| [ADR-0004](../adr/adr-0004-external-booking-channel-naver-place-adapter.md) | 아키텍처·SSOT·충돌 정책 |
| [EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md](../standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md) | API·스키마·멱등 |
| [NAVER_PLACE_BOOKING_INTEGRATION_ROADMAP.md](./NAVER_PLACE_BOOKING_INTEGRATION_ROADMAP.md) | Phase·위임·완료 기준 |
| [NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md](../planning/NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md) | 설정 화면 |
| [INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) | 선예약·회기 정합 |
| [RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md](./2026-04-23/RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md) | 오케스트레이션 체크리스트 **패턴 참조** |
| [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md) | 운영 반영 게이트 |

**기존 구현(코드 기준, explore 2026-07)**

- 네이버 **OAuth·네이버페이**만 존재 — **스마트플레이스 예약 API/웹훅 없음**
- 예약 SSOT: `Schedule` + `consultant_client_mappings` + `createConsultantSchedule` 검증
- [`Schedule.java`](../src/main/java/com/coresolution/consultation/entity/Schedule.java): `external_booking_id` 등 **미존재**

---

## 1. Phase 0 — 제휴·스펙 확보 (블로커, 미완 시 Phase 1 착수 지양)

### 1.1 사업·법무

- [ ] **네이버 사업자 제휴 문의** — 스마트플레이스 예약 **파트너/API** 담당 채널·담당자 기록
- [ ] **업종·서비스 적합성** — 상담·심리·코칭 등 MindGarden 테넌트 업종이 예약 연동 대상인지 확인
- [ ] **계약·NDA·개인정보** — 내담자 정보 웹훅 수신·보관·위탁 처리 방침(법무 1줄 승인)
- [ ] **공개 API 부재** 확인 — 제휴 없이 REST 스크래핑·비공식 연동 **금지** 명문화

### 1.2 기술 스펙 확보

- [ ] **인바운드 웹훅** 이벤트 목록(CREATED/UPDATED/CANCELLED 등)·페이로드 샘플·재시도 정책
- [ ] **아웃바운드 API**(Phase 2) — 슬롯 푸시·예약 취소·OAuth 스코프 문서
- [ ] **서명·인증** — HMAC 헤더명·시크릿 로테이션·IP allowlist 여부
- [ ] **샌드박스·검수** — 테스트 사업자 ID·검수 체크리스트·go-live 승인 절차
- [ ] **Rate limit·SLA** — 초당/분당 한도·장애 공지 채널

### 1.3 PO·아키텍처 고정

- [ ] [ADR-0004](../adr/adr-0004-external-booking-channel-naver-place-adapter.md) **Proposed → Accepted** (충돌 정책·Phase SSOT)
- [ ] 외부 예약 수신 시 **가예약 vs BOOKED** 기본값 — [INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md](./INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)와 합의
- [ ] Phase 1 **이중 예약** 운영 완화(수동 네이버 마감·안내 문구) 여부

**Phase 0 퇴장 조건**: 샌드박스 웹훅 1건 수신 가능 + 스펙 PDF/URL SSOT 저장 + ADR Accepted.

---

## 2. 인벤토리 (explore → 본 섹션 갱신)

- [ ] `ScheduleServiceImpl.createConsultantSchedule` — 어댑터 **유일** 일정 생성 진입점 확정
- [ ] 취소·변경: `cancelSchedule` / `updateSchedule` REST·서비스 경로
- [ ] `TenantContextHolder` — 웹훅 비동기·배치에서 `tenantId` 바인딩 패턴
- [ ] 기존 네이버 OAuth — **예약 연동 토큰과 분리** 여부(동일 네이버 앱 vs 별도)

**인벤토리 결과 요약** *(explore, 2026-07 — 초안)*

| 구분 | 경로 | 외부 예약 연동 |
|------|------|----------------|
| 일정 생성 | `ScheduleServiceImpl.createConsultantSchedule` | **어댑터 목표 진입점** |
| 엔티티 | `Schedule.java` | 외부 ID 필드 **없음** — Flyway 필요 |
| 네이버 | OAuth·Pay | 예약 **미연동** |

---

## 3. 테넌트별 설정 (온보딩)

### 3.1 연결

- [ ] `external_channel_connections` — `tenant_id` + `NAVER_PLACE` 유니크
- [ ] 스마트플레이스 **사업자 ID**·지점 ID(다지점 시) 입력·검증 API
- [ ] OAuth/장기 토큰 — **`oauth_token_ref`만 DB**, 평문 금지 ([카카오 체크리스트 §1](./2026-04-23/RESERVATION_KAKAO_ALIMTALK_ORCHESTRATION_CHECKLIST.md) 시크릿 규칙 동일)
- [ ] 웹훅 URL 발급 — `https://{host}/api/v1/webhooks/booking/naver-place?connectionId={id}` (최종 형식은 스펙 확정 후)

### 3.2 상품 매핑

- [ ] `external_product_mappings` — 네이버 **예약상품 ID ↔ consultant_id**
- [ ] 1상품 : 1상담사 기본; 1:N 시 PO 규칙
- [ ] 매핑 없는 웹훅 → **422 + sync log + CS** (자동 일정 생성 금지)

### 3.3 UI·권한

- [ ] 설정 화면 — [`NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md`](../planning/NAVER_PLACE_BOOKING_SETTINGS_UI_REQUIREMENTS.md)
- [ ] **OPS** vs **테넌트 ADMIN** — 연결 생성/해지 vs 매핑 편집 권한 표
- [ ] `core-designer` 와이어 → `core-coder` 구현 → `core-tester` 역할별 E2E

---

## 4. 구현 게이트 (core-coder + core-tester)

- [ ] [EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md](../standards/EXTERNAL_BOOKING_CHANNEL_ADAPTER_SPEC.md) §7 체크리스트 전항
- [ ] 멱등: 동일 `eventId` 2회 → 일정 1건
- [ ] `tenantId` A/B 격리 — 테넌트 B 웹훅이 A 일정 생성 **불가**
- [ ] 매핑·잔여 0 — `validateRemainingSessions` 거절 + sync log
- [ ] 하드코딩 스캔·`check-hardcode` Green
- [ ] 통합 일정 캘린더 **NAVER_PLACE** 뱃지(Phase 1+ FE)

---

## 5. 운영

### 5.1 동기화 실패

- [ ] `booking_sync_logs.status=FAILED|CONFLICT` — OPS·테넌트 ADMIN 알림(이메일/슬랙/인앱 정책)
- [ ] **수동 재동기화** — sync log ID 기준 재처리 API(ADMIN); 멱등 유지
- [ ] **CS 에스컬레이션** — “네이버有·앱無” 플레이북 1페이지

### 5.2 모니터링

- [ ] 대시보드: 시간당 웹훅 성공/실패·CONFLICT 건수·테넌트별 TOP
- [ ] 아웃바운드(Phase 2) 큐 적체·dead-letter 알림

### 5.3 장애·롤백

- [ ] feature flag `booking.naver-place.enabled` — 테넌트·전역 kill switch
- [ ] 웹훅 only 수신 중단 시 네이버 예약은 유지·앱 수동 등록 안내

---

## 6. 하드코딩·멀티테넌트·운영 반영

| 게이트 | 문서 |
|--------|------|
| 하드코딩·토큰 | [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md), `/core-solution-standardization` |
| tenantId | [멀티테넌트 스킬](/.cursor/skills/core-solution-multi-tenant/SKILL.md), `TENANT_CONTEXT_USAGE` 등 standards |
| 어드민 LNB·설정 | [ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md](./ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md) §17 |
| 배포 | `core-deployer` — Flyway·웹훅 URL 공개 경로·Secrets |

- [ ] 운영 반영 전 **§6 전表** 서명(PO·OPS)

---

## 7. 서브에이전트 분배 표 (core-planner 주관)

| Phase | 순서 | 서브에이전트 | 산출 | 선행 |
|-------|------|--------------|------|------|
| **0** | 1 | **explore** | 제휴·코드 갭 인벤토리(본 §2) | — |
| **0** | 2 | **core-planner** | ADR-0004·로드맵·본 체크리스트 | explore |
| **0** | 3 | PO/법무 | 제휴·NDA | — |
| **1** | 4 | **core-coder** | 웹훅·스키마·어댑터·`createConsultantSchedule` | Phase 0 퇴장 |
| **1** | 5 | **core-tester** | 멱등·tenant·422/CONFLICT 테스트 | coder |
| **1** | 6 | **core-designer** | 설정 UI §0.4 | planner |
| **1** | 7 | **core-coder** | Admin 설정 FE | designer |
| **2** | 8 | **core-coder** | OutboundSlotSync·아웃박스 | Phase 1 Green |
| **2** | 9 | **core-tester** | 양방향·충돌 E2E | coder |
| **3** | 10 | **core-deployer** | 운영 반영·웹훅 URL·Secrets | go-live 체크 |
| **3** | 11 | **core-planner** | 테넌트 온보딩 가이드(tenant-guides) | Phase 3 |

---

## 8. 진행도 연계

- [ ] [ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md](./ONGOING_WORK_MASTER_PROGRESS_CHECKLIST.md) — “네이버 플레이스 예약” 행 추가(문서관리)
- [ ] Phase 0 블로커 상태를 마스터 체크리스트에 **Blocked** 표기

---

*최종 갱신: 2026-07-06 — 초안(explore·ADR-0004 기반)*
