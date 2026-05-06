# ADR-0002: 세션 잔여(시간·횟수)와 매핑·상태 전이

**Status:** Proposed

## Context

- TBD: PO — “잔여”의 정의(시간 기준, 횟수 기준, 혼합)와 산출 주기
- TBD: PO — 일정·상담·결제·입금 등 엔티티 간 매핑이 바뀔 때의 상태 전이 표(또는 규칙 집합)
- TBD: PO — 통합 일정 UI·API에서 노출해야 하는 상태와 숨겨야 하는 내부 상태

## Decision

- TBD: PO — 잔여 소진·연장·취소 시 상태 전이의 단일 규칙
- TBD: PO — 동시성(중복 예약, 중복 결제) 시 우선순위

## Consequences

- TBD: PO — 클라이언트 표시와 서버 권한 검사의 일치 요구사항
- TBD: PO — 환불·입금 확인과 상태 전이가 겹칠 때의 조정 원칙(아래 입금·환불 문서와 정합)

## References

- [통합 일정: 선예약·후결제 오케스트레이션](../project-management/INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md)
- 입금·환불 경로와 세션/매핑 상태가 교차할 때: [입금·ERP·환불 흐름 분석](../debug/DEPOSIT_ERP_REFUND_FLOW_ANALYSIS.md)
