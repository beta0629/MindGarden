# 타기관 연계 vs 바우처 vs 회기권

최가을 운영 케이스는 **타기관 연계(월 단위 결제)** 이다. 바우처가 아니다.

| 구분 | 의미 | 이 슬라이스 |
|------|------|-------------|
| **타기관 연계** | 월 단위 결제, 초기 상담 선납, 월말 상담내역 문서 | `paymentTiming=INSTITUTION_LINK`. PENDING이면 rem=0 가예약 허용 |
| **바우처** | 다른 기관 연계. 할인·개인별 금액. 실데이터 없음 | **구현하지 않음.** `VOUCHER` 상수 금지 |
| **회기권** | `totalSessions` / `usedSessions` / `remainingSessions` | ADVANCE. rem=0이면 일정 차단 유지 |

## 오늘 슬라이스 (가예약 일정 저장)

- 매칭 생성 3번째 카드: 「타기관 연계 (월결제)」
- `PENDING_PAYMENT` + `INSTITUTION_LINK` + rem=0 → `TENTATIVE_PENDING_PAYMENT` 저장
- 캘린더 prefix `[타기관]` (당일결제 모달·`[당일결제]` 라벨 아님)
- CheckoutSameDayModal CTA는 `SAME_DAY_CARD` 전용 유지

## 섞지 말 것

- `cursor/provisional-log-session-number-7f13` — 가예약 rem=0 **일지** `sessionNumber` / 회차 SSOT
- 일지 전용 테이블·`ScheduleController` 라우팅 분기
- 월계약 엔티티·월말 문서 발송 ERP

## 「todo 리스트에 있는 바우쳐」

GitHub issue 목록 API는 이 환경에서 접근 불가. 코드에 살아있는 `VOUCHER` paymentTiming 은 없다. 문서 벤치마크(`INTEGRATED_SCHEDULE_UX_BENCHMARK.md` 마인듀케어 「바우처·미수금·EAP」)와 운영 TODO 구어를 가리키며, **최가을 월결제를 바우처로 구현하면 안 된다.**
