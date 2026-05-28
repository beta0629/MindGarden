# [R4 트랙] 옵션 B 디러티 PENDING_PAYMENT 매칭 수동 정리 UI 합의서 v1.0

## §0 TL;DR — 메인 권장안 채택

| 항목 | 권장 채택 내용 |
|---|---|
| **노출 조건** | `MappingStatus == PENDING_PAYMENT` 매칭만 (ACTIVE/TERMINATED 등은 기존 종료 흐름) |
| **백엔드 API** | 기존 `POST /api/v1/admin/mappings/{id}/terminate` 재사용 |
| **request body** | `{"reason": "관리자 취소 — 디러티 PENDING_PAYMENT 정리"}` |
| **효과 1 — 매칭** | `status=TERMINATED` + audit log (`AdminServiceImpl.terminateMapping`) |
| **효과 2 — 일정** | 연결된 `TENTATIVE_PENDING_PAYMENT` 일정 자동 CANCELLED (기존 terminateMapping 로직 점검 필요) |
| **효과 3 — paymentStatus** | `PENDING` → `CANCELLED` (또는 REJECTED) |
| **회기수 처리** | remaining=0 이므로 무영향 (환불/회기 보호 트리거 X) |
| **UI 위치** | `MappingMatchActions` 하단 (Checkout Same Day Payment 버튼 아래) "취소" 보조 버튼 |
| **버튼 색상** | danger (B0KlA palette `--mg-v2-danger-*` 토큰) 또는 텍스트 링크 (secondary) — 디자이너 결정 |
| **확인 모달** | `UnifiedModal` — title="매칭 취소", body="결제 대기 중인 매칭을 취소합니다. 연결된 가예약 일정도 함께 취소됩니다." + confirm/cancel |
| **i18n** | `admin:mapping.card.actions.cancel`, `admin:mapping.cancel.modal.title/body/confirm/cancel` |

## §1 사용자 요청 및 페인포인트
사이드바 옵션 B 매칭 카드 (`MappingScheduleCard` + `CardActionGroup` + `MappingMatchActions`) 에 "결제 대기 / 0 회기 남음 / 일정 등록 / Checkout Same Day Payment" 버튼만 노출되어 있어, 비정상적이거나(결제 이탈) 취소해야 할 디러티 매칭을 어드민이 수동으로 정리할 UI가 부재했습니다.
특히 dev DB의 매칭 #91~97 등 옵션 A 미완 이탈 건들을 정리하기 위한 기능 추가가 필수적입니다.

## §2 노출 정책 및 회귀 영향
- **노출 조건**: `PENDING_PAYMENT` 상태의 매칭 사이드바 카드 하단에만 노출.
- **회귀 영향**: 
  - 옵션 A ADVANCE 매칭: 노출됨 (Q5에 따라 동일 정리 가능)
  - ACTIVE 매칭 / TERMINATED 매칭: 노출되지 않음 (영향 0)

## §3 백엔드 API 선택 근거
- **`terminateMapping` 재사용 (Q2 채택)**: 기존 매칭 종료 로직을 재사용함으로써 audit log 보장 및 관리자 취소 이력 단일화를 꾀합니다. 별도의 `cancelPendingMapping` API를 신설하는 것보다 유지보수에 유리합니다.

## §4 사용자 추가 결정 필요 항목 (R4-1 ~ R4-5) — 전원 default 채택
- **Q1 (노출 조건)**: (a) PENDING_PAYMENT 만 [권장]
- **Q2 (백엔드 API)**: (a) `terminateMapping` 재사용 [권장]
- **Q3 (가예약 동시 처리)**: (a) 자동 CANCELLED [권장]
- **Q4 (paymentStatus 전환)**: (a) PENDING → CANCELLED [권장]
- **Q5 (옵션 A 잔존 매칭 처리)**: (a) 본 UI로 정리 가능 [권장]

## §5 코더 위임 명세
- **충돌 회피**: 진행 중 핫픽스 PR (Agent `7b677255` — `MappingMatchActions` / `CardActionGroup` 수정) 머지 후 분기
- **브랜치명**: `feature/r4-pending-payment-cleanup-ui`
- **PR 베이스**: `develop`
- **PR 타이틀**: `feat(admin): R4 디러티 PENDING_PAYMENT 매칭 사이드바 취소 UI`
- **변경 범위**:
  - 프론트: `MappingMatchActions.js` 취소 버튼 추가, `CardActionGroup.js`, `MappingScheduleCard.js` (취소 액션 props 전파), 확인 모달 구현, i18n
  - 백엔드: `AdminServiceImpl.terminateMapping` 내 `PENDING_PAYMENT` 매칭 처리 로직 점검 (`TENTATIVE_PENDING_PAYMENT` 일정 동시 취소, paymentStatus 전환 처리)
  - 테스트: 백엔드 단위/통합 테스트 + 프론트 RTL 노출 매트릭스 추가
- **게이트**: `mvn test`, `npm run test`, `npm run check:i18n-seed`, D11 등 기존 정책 준수

## §6 디자이너 핸드오프 명세
디자이너 핸드오프 문서는 별도의 `R4_PENDING_PAYMENT_CLEANUP_DESIGNER_HANDOFF.md` 문서로 동시 발행됩니다.

## §7 회귀 영향
- 옵션 A ADVANCE 매칭: 해당 UI로 일괄 정리 지원됨
- ACTIVE 매칭 / TERMINATED 매칭: 영향 0 (상태 불일치)
