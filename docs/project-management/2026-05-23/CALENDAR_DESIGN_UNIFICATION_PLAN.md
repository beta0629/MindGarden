# 통합 스케줄 달력 디자인 통일 기획

> 2026-05-23 사용자 정정 의도 반영. 이전 기획서 `INTEGRATED_SCHEDULE_ROLE_EXPANSION_PLAN.md` 폐기.

## 1. 사용자 정정 의도

> "디자인만 어드민같이 적용 해 달라고 하는거야 달력만"

→ 달력 컴포넌트의 **시각 디자인만** 어드민 통합 스케줄과 동일하게.
→ 데이터 노출·권한·기능·LNB·매칭 사이드바·결제 정보 변경 없음.

## 2. 대상 화면 (사용자 확정)

| 역할 | 라우트 | 페이지 컴포넌트 |
|------|---------|-----------------|
| 어드민 (SSOT) | `/admin/integrated-schedule` | `IntegratedMatchingSchedule.js` |
| 상담사 | `/consultant/renewal/schedule` | `ConsultantScheduleRenewal.js` |
| 내담자 | `/client/schedule` | `ClientSchedule.js` |

레거시 `/consultant/schedule` (`ConsultantSchedule.js`) 는 **대상 외**.

## 3. 스코프 — 적용 / 미적용 매트릭스

| 항목 | 적용 | 미적용 |
|------|------|--------|
| 캘린더 컨테이너·헤더·셀·이벤트 바 시각 | ✅ | |
| 월/주/일 뷰 전환 UI | ✅ | |
| 디자인 토큰 (`--mg-calendar-*`) | ✅ | |
| 다크 모드 cascade | ✅ | |
| 데이터 노출 범위 변경 | | ❌ |
| 매칭 사이드바·매칭 카드 추가 | | ❌ |
| 결제 정보 노출 | | ❌ |
| 권한 확장·API 신설 | | ❌ |
| LNB 변경 | | ❌ |
| 라우트 변경 | | ❌ |

## 4. 통일 옵션 (explore 인벤토리 후 확정)

explore 가 식별할 3 옵션:
- 옵션 A — 어드민 캘린더 컴포넌트 직접 재사용 (props 분기)
- 옵션 B — CSS·토큰만 추출하여 atoms/molecules 통일
- 옵션 C — 글로벌 CSS·토큰 단일화 (`mg-calendar-*` SSOT)

P1 완료 후 사용자 컨펌으로 선택.

## 5. 분배실행 단계

1. **P0** — explore (캘린더 인벤토리 + 옵션 A/B/C 권고) 진행 중
2. **P1** — core-designer (gemini-3.1-pro): 어드민 캘린더 시각 명세 추출 + 상담사 renewal / 내담자 시각 회귀 가이드
3. **P2** — core-coder: 옵션 채택 후 CSS·컴포넌트 통일 (디자인 토큰 도입 + atom/molecule 추출 + 페이지 적용)
4. **P3** — core-tester (gemini-3.1-pro): 어드민·상담사 renewal·내담자 3 화면 시각 회귀 PASS
5. **P4** — core-deployer: 사용자 운영 반영 지시 시 진행

## 6. 사용자 컨펌

| ID | 질문 | 디폴트 |
|----|------|--------|
| K1 | 어드민 캘린더 라이브러리(FullCalendar 등)에서 사용하는 클래스/토큰을 그대로 따르고, 상담사·내담자 페이지를 동일하게 갈아끼우기 | 디폴트 |
| K2 | 색상 매핑은 사용자 role 별로 차별화 (예: 상담사=상담 일정 색, 내담자=본인 예약 색) 또는 어드민과 동일 색상 | 사용자 의향 받기 |
| K3 | 라이브 / DEV 배포 시점 — explore + designer + coder 일괄 한 번에 vs 단계별 | 일괄 권장 |

## 7. 변경 이력

- 2026-05-23 신설 — 이전 `INTEGRATED_SCHEDULE_ROLE_EXPANSION_PLAN.md` 폐기 사유: 사용자 정정 의도(달력 디자인만 통일)에 비해 과도한 스코프.