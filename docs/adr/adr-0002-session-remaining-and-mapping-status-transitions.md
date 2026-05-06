# ADR-0002: 세션 잔여(시간·횟수)와 매핑·상태 전이

**Status:** Proposed

## Context

통합 일정에서 **잔여 회기**와 **매핑 상태**는 스케줄 가능 여부를 좌우한다. 오케스트레이션 SSOT 문서의 **구현 스냅샷** 절에 맞추면, **현 시점에서 단정할 수 있는 범위**는 다음과 같다.

- **`remainingSessions`**: 잔여 회기 수로 쓰이며, **0**일 때 필터·캐시·이전 응답과 결합하면 “잔여가 있는 것처럼” 보이는 착시 위험이 SSOT에서 명시된다.
- **프론트 `canScheduleForMapping`**: 매핑이 **ACTIVE**이고 **`remainingSessions > 0`**일 때 스케줄 가능으로 본다.
- **백엔드 `validateRemainingSessions`**: 위 프론트 전제와 **동일한 잔여·매핑 유효성 전제**를 쓰도록 정합한다는 것이 SSOT 목표다.
- **`createConsultantSchedule`(10인자 경로)**: 저장 전 **`validateMappingForSchedule`**·**`validateRemainingSessions`** 를 호출하고, 실패 시 예외·**트랜잭션 롤백**으로 처리한다.

매핑·결제·입금·환불이 겹치는 **전체 상태 전이표**는 엔티티·API가 여러 개라 본 ADR만으로 전부 단정하지 않는다. 입금·결제·환불 API와 매핑 상태 코드의 관계는 [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)의 사실 정리를 **인용 수준**으로 참고한다.

## Decision

- **스케줄 가능 판정(알려진 구현 범위)**: 프론트는 **ACTIVE + `remainingSessions > 0`** 을 스케줄 가능으로 본다. 백엔드는 동일 축에서 **`validateRemainingSessions`**(및 `validateMappingForSchedule`)로 저장을 거절할 수 있다.
- **전이 규칙의 단정 범위**: 본 ADR은 **통합 일정 일정 생성 경로**에서 요구되는 **잔여·매핑 검증**과 위 표현에 한정해 기록한다. `PAYMENT_CONFIRMED`에서의 UI 예약 허용 등 다른 화면의 규칙은 해당 문서·코드와 병렬로 두고, 여기서 **전역 단일 전이표**로 확장하지 않는다.

## Consequences

- 잔여·상태를 **한 소스**에서 읽지 않으면 SSOT가 경고하는 대로 UI와 서버 판정이 어긋난다. 필터·훅·API 응답의 이중 해석은 회귀 테스트(오케스트레이션 SSOT에 수록된 **테스트 게이트** Phase 0~N 블록)에서 다룬다.
- 환불·입금 확인·강제 종료 등이 `remainingSessions`·ACTIVE와 동시에 움직일 때의 **조정 원칙**은 [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)의 흐름·갭과 정합 검토가 필요하다(본 ADR은 새 정책을 추가하지 않음).

### 가정(PO 검토)

- “잔여”의 **제품 정의**(시간 단위·횟수·혼합)와 **산출 주기**를 PO·운영이 확정할지.
- 매핑·상담·결제·입금 간 **완전한 상태 전이표**와, 통합 일정에 **노출·비노출할 내부 상태** 목록.
- 동시성(중복 예약·중복 결제) 시 **우선순위**와 사용자 메시지.

## References

- [통합 일정: 선예약·후결제 오케스트레이션](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)
- 입금·환불 경로와 세션·매핑 상태가 교차할 때: [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)
