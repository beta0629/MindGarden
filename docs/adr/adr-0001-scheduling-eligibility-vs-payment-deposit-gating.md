# ADR-0001: 예약 가능·자격 판단과 결제·입금 게이팅의 경계

**Status:** Proposed

## Context

- TBD: PO — 통합 일정에서 “예약(또는 슬롯) 자격”을 어떤 이벤트·데이터로 정의할지
- TBD: PO — 결제 확정 전/후, 입금 확인 전/후 각각에서 허용되는 행위(표시, 확정, 취소 등)
- TBD: PO — ERP·입금 흐름과 앱 내 상태의 단일 진실 공급원(SSOT) 후보

## Decision

- TBD: PO — 자격 판단과 입금·결제 게이팅을 한 규칙으로 묶을지, 레이어로 분리할지
- TBD: PO — 예외·수동 처리(오입금, 부분환불 등) 시 최소 보장 동작

## Consequences

- TBD: PO — 구현·운영·CS에 미치는 영향
- TBD: PO — 모니터링·감사에 필요한 이벤트·로그

## References

- [통합 일정: 선예약·후결제 오케스트레이션](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)
- [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)
