# DEPRECATED — 기관 월계약 바우처 기획 (오전제)

> **DEPRECATED (2026-09-14)**  
> **바우처 ≠ 월결제.** 이 파일·이 브랜치(`cursor/monthly-institution-voucher-da06`)는 **정본이 아니다.**  
> 아래 잘못된 전제로 쓰였다: 「기관 바우처 = 월 단위 계약」.

## 정본 (세 갈래 — 섞지 말 것)

| 구분 | 무엇인가 | 최가을과의 관계 |
|------|----------|-----------------|
| **타기관 연계** | **월 단위 결제**, 초기 상담 **선납**, **월말 상담내역 문서 발송** | **최가을 = 타기관 연계.** 바우처 아님. **먼저** |
| **바우처** | **다른** 기관 연계. 할인, 개인별 금액. 실데이터 없음 | 월결제·최가을과 동일시 금지 |
| **회기권** | 기존 SSOT (`totalSessions` / `usedSessions` / `remainingSessions` / `sessionSequence` / `SESSIONS_EXHAUSTED`) | 타기관 연계와 **섞지 않음** |

목적: 기존 회기권과 타기관 연계를 섞지 않는 것. 사용자가 「최가을 타기관 연계가 먼저」라고 함.

정본 후속은 형제 브랜치 `cursor/institution-link-monthly-7f13` (이 브랜치에서 **덮지 않음**). 본 브랜치는 오전제 문서 정정만.

코드 구현 없음. `gh pr create` 금지. 운영 배포 금지. 회기 코드 패치 금지.

---

## 폐기하는 본문

「기관 바우처 = 월계약 SSOT」서술은 **폐기**. ADR-0005 Proposed의 그 결정도 철회(동일 날짜 정정).

---

## 깨지는 면 — **타기관 연계(월결제)** 기준 (회기권과 섞을 때)

최가을 경로(기획 입력): 월결제 예정 → 가예약(`SAME_DAY_CARD`) 시도 → 저장 실패 → 16:00 `CONFIRMED` 진행 → `remainingSessions=0` + `sessionSequence` null → 일지 실패.

회기권 가드에 타기관 월결제를 얹으면 아래가 깨진다. 원인 단정·패치는 하지 않는다(정본 브랜치·debugger).

| 면 | 회기권 전제 | 타기관 연계(월결제)에서 |
|----|-------------|-------------------------|
| 매핑 상태 | `ACTIVE` + rem>0, rem→0 `SESSIONS_EXHAUSTED` | 월결제·선납이지 회기 소진이 아님 |
| 결제 | 매핑 `confirm-payment` / `PENDING_PAYMENT` | **월 단위 결제** + **초기 상담 선납** |
| 가예약 | `SAME_DAY_CARD`로 결제 전 슬롯 | 월결제 의도를 가예약으로 우회하면 최가을 경로 |
| 스케줄 저장 | `validateRemainingSessions` 후 차감 | rem 가드가 월결제 일정을 막거나 우회 CONFIRMED를 남김 |
| 일지 회차 | `sessionNumber` = `sessionSequence` 필수 | sequence null이면 작성 실패 (응급 일지 픽스와 별 트랙) |
| 목록 「잔여」 | `remainingSessions > 0`만 노출 | 타기관 월결제 매칭이 목록에서 사라질 수 있음 |
| 완료처리 | 완료 = 회기 1 차감 | 월 실적. 월말 **상담내역 문서 발송**이 정본 산출 |
| ERP | 매핑 INCOME/RECEIVABLES | 월결제·선납과 패키지 1건 결제를 동일시 금지 |

바우처(할인·개인별 금액) 깨지는 면은 여기 적지 않는다. 실데이터 없음·다른 기관 연계.

---

## 형제 트랙

| 트랙 | 브랜치 | 관계 |
|------|--------|------|
| 타기관 연계 정본 (후속) | `cursor/institution-link-monthly-7f13` | **덮지 않음** |
| 본 파일 | `cursor/monthly-institution-voucher-da06` | 오전제 **DEPRECATED**. 정본 아님 |
| 가예약 rem=0 일지 응급 | `cursor/provisional-log-session-number-7f13` | 타기관 연계 SSOT 아님 |
| 잔여 회기 표시 | `cursor/remaining-session-display-ssot-7f13` | 회기권 표시 |

---

## 하드코딩 게이트 (이후 정본 슬라이스에만)

`ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` §17, `SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md` §1.3. 이 브랜치에서 코드 착수 없음.
