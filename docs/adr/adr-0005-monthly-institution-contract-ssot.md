# ADR-0005: 기관 바우처 SSOT는 월계약이다 — **철회**

**Status:** Superseded / **DEPRECATED**  
**Date:** 2026-09-14 (Proposed) · **철회:** 2026-09-14  
**Planner:** core-planner

> **DEPRECATED** — **바우처 ≠ 월결제.** 이 ADR·이 브랜치(`cursor/monthly-institution-voucher-da06`)는 **정본이 아니다.**

## 철회 이유

Proposed 결정은 「기관 바우처의 권위는 월계약」이었다. 사용자 정본과 반대다.

| 정본 | 내용 |
|------|------|
| **타기관 연계** | 월 단위 결제, 초기 상담 선납, 월말 상담내역 문서 발송. **최가을 = 타기관 연계.** 바우처 아님. 회기권과 섞지 않음. **먼저** |
| **바우처** | 다른 기관 연계. 할인, 개인별 금액. 실데이터 없음 |
| **회기권** | 기존 매핑 잔여 SSOT |

후속 정본 브랜치: `cursor/institution-link-monthly-7f13` (본 브랜치에서 덮지 않음).

## 구 Decision (참고만 — 따르지 말 것)

1. ~~기관 바우처의 권위는 월계약~~ → **철회**
2. 패키지 회기권 유지는 유효하나, 타기관 연계와 **별개**로만 유지한다.
3. ~~월계약을 remainingSessions로 표현하지 않는다~~ → 대상이 바우처가 아니라 **타기관 연계(월결제)** 다.

## References

- 오전제 오케스트레이션(폐기 안내): [`../project-management/MONTHLY_INSTITUTION_VOUCHER_ORCHESTRATION.md`](../project-management/MONTHLY_INSTITUTION_VOUCHER_ORCHESTRATION.md)
- 오전제 스케치(폐기): [`../planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md`](../planning/MONTHLY_INSTITUTION_VOUCHER_DOMAIN_SKETCH.md)
