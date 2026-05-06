# ADR-0003: 통합 일정 멀티슬롯 오케스트레이션의 책임 경계

**Status:** Proposed

## Context

- TBD: PO — “멀티슬롯”이란 범위(동일 자원·복수 자원·연속/비연속 블록)
- TBD: PO — 오케스트레이션에 포함할 도메인(예약, 결제, 알림, ERP)과 제외할 도메인
- TBD: PO — 실패·부분 성공 시 보상 트랜잭션(롤백·재시도)의 소유 주체

## Decision

- TBD: PO — 경계: 어디까지가 통합 일정 서비스 책임이고, 어디부터 외부 시스템·별 모듈인지
- TBD: PO — 이벤트 순서(선예약·후결제 등)에 대한 불변 조건

## Consequences

- TBD: PO — API·배치·메시지 설계에 대한 제약
- TBD: PO — 결제·입금·환불과 슬롯 확정 타이밍이 어긋날 때의 정책(아래 입금·환불 분석과 정합)

## References

- [통합 일정: 선예약·후결제 오케스트레이션](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)
- [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)
