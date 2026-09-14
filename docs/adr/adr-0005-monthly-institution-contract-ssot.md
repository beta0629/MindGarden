# ADR-0005: 기관 바우처 SSOT는 월계약이다

**Status:** Proposed  
**Date:** 2026-09-14  
**Planner:** core-planner

## Context

통합 일정의 스케줄 가능·일지 회차는 현재 **회기권 SSOT**에 묶여 있다.

- 매핑 `totalSessions` / `usedSessions` / `remainingSessions`
- 일정 `sessionSequence`
- rem→0 이면 `SESSIONS_EXHAUSTED`, 일정·일지 차단
- 프론트 `canScheduleForMapping`: `ACTIVE` + `remainingSessions > 0` (ADR-0002)

현장 전제: 기관 바우처는 **월 단위 계약**인 경우가 많다. 월결제 예정 건을 `SAME_DAY_CARD` 가예약·회기 rem으로 처리하면, 가예약 저장 실패 후 일반 `CONFIRMED` 진행 → rem=0 + `sessionSequence` null → 일지 실패 같은 경로가 열린다.

관련: ADR-0001(일정 가능 vs 입금 게이트), ADR-0002(잔여·매핑 전이), 선예약·후결제 오케스트레이션. 본 ADR은 그것들을 **기관 월계약에 확장하지 않고**, 별 SSOT를 제안한다.

응급 일지 픽스(`cursor/provisional-log-session-number-7f13`)는 이 결정의 구현이 아니다.

## Decision

1. **기관 바우처의 권위는 월계약**(기간, 청구 주기, 선택적 월 한도, 기관 당사자, `tenantId`)이다.
2. **패키지 회기권 SSOT는 유지**한다. 매칭은 한 종류의 이용권만 가진다.
3. 월계약 이용 가능은 `remainingSessions > 0`으로 표현하지 않는다. 회기 카운터를 크게 넣어 바우처를 흉내 내지 않는다.
4. 월계약 일정의 일지 회차는 매핑 잔여 산식에 종속시키지 않는다. 구체 산식은 debugger·PO 후속.
5. ERP는 기관 **월 인보이스** 단위를 전제한다. 매핑 1건 `confirm-payment`와 기관 월결제를 동일시하지 않는다.
6. 상태·유형 문자열은 공통코드. 운영 반영 전 하드코딩 게이트: `ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17, `SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3.

## Consequences

- 스케줄 저장·사이드바 필터·일지 `sessionNumber`·완료 백필·환불·회기 승계는 월계약 매칭에서 **분기 또는 별 모듈**이 필요하다.
- 5단계 비즈니스 파이프라인 문서/스킬은 패키지 전제로 남고, 월계약은 스케치의 대체 파이프를 따른다.
- 구현 전 DB-first. 오늘 코드 변경 없음 (`MONTHLY_INSTITUTION_VOUCHER_ORCHESTRATION.md` §9).

## 가정 (PO)

- 월 한도: 없음 / 횟수 / 금액
- 정산일: 역월말 vs 계약 응당일
- 기관 마스터를 테넌트와 분리할지
- 한 내담자가 회기권+월계약을 동시에 가질 수 있는지 (기본안: 매칭당 하나)

## References

- [`docs/planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md`](../planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md)
- [`docs/project-management/MONTHLY_INSTITUTION_VOUCHER_ORCHESTRATION.md`](../project-management/MONTHLY_INSTITUTION_VOUCHER_ORCHESTRATION.md)
- [ADR-0002](./adr-0002-session-remaining-and-mapping-status-transitions.md)
