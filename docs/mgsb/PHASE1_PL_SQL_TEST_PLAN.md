# MindGarden Phase 1 PL/SQL Settlement Test Plan

## 1. 목표 및 범위

- **목표:** Phase 1 학원용 MVP 정산 배치(PL/SQL 패키지)의 기능/성능/재처리
  시나리오를 검증하기 위함
- **범위:** 수강 등록/결제 데이터 → 매출/수수료/정산금 계산 → 정산 결과
  테이블/PDF 리포트 생성 → 관리자 포털 검증
- **대상 시스템:** Oracle DB(운영 전 사전 검증 환경), Settlement 배치
  패키지(`PKG_SETTLEMENT`), ERP 연동 모듈

## 2. 테스트 환경 구성

| 항목 | 구성 |
| --- | --- |
| DB | Oracle 19c (Staging) |
| 스키마 | `MG_SETTLEMENT_STG` |
| 배치 스케줄러 | Spring Scheduler (cron) + 수동 실행 스크립트 |
| 로그 수집 | DB Trace + Application log (`logs/settlement/*.log`) |

- **수동 실행 명령:**
  `EXEC MG_SETTLEMENT_STG.PKG_SETTLEMENT.RUN_BATCH(p_settlement_date =>
  TO_DATE('2025-11-30','YYYY-MM-DD'));`
- **사전 준비:** 정산 대상 테넌트 목록, 환율/세금 정책 테이블 최신화

## 3. 샘플 데이터 세트

```yaml
테넌트 A (학원)
- 수강 등록: 30건 (정상 25, 취소 3, 환불 2)
- 결제 수단: 카드 20, 계좌이체 5, 간편결제 5
- 수수료율: 5%

테넌트 B (학원)
- 수강 등록: 15건 (정상 12, 할인 2, 미수금 1)
- 결제 수단: 카드 10, 계좌이체 3, 현장 결제 2
- 수수료율: 7%

테넌트 C (테스트)
- 비정상 데이터: 결제-수강 불일치 2건, 중복 결제 1건, 미확정 주문 1건
```

- **CSV 파일 경로:** `/qa/data/settlement/sample-set-2025-11.csv`
- **Insert 스크립트:** `/qa/scripts/settlement/sample_insert_2025_11.sql`
- **정의 테이블:** `ENROLLMENT`, `PAYMENT`, `SETTLEMENT_RESULT`, `SETTLEMENT_LOG`

## 4. 테스트 케이스 요약

| TC ID | 시나리오 | 입력/조건 | 기대 결과 |
| --- | --- | --- | --- |
| ST-001 | 정상 배치 실행 | 샘플 데이터 Set A | `SETTLEMENT_RESULT` 총 합계 일치 |
| ST-002 | 취소/환불 처리 | 취소/환불 건 포함 | 환불 금액 차감, 로그에 상태 기록 |
| ST-003 | 할인 적용 | 할인율 입력 | 할인 금액 반영된 순매출 계산 |
| ST-004 | 비정상 데이터 검출 | Set C | `SETTLEMENT_LOG`에 오류 기록, 실패 건 제외 |
| ST-005 | 재실행(재처리) | 실패 건 존재 | `RUN_BATCH` 재호출 시 누락분만 처리 |
| ST-006 | 부분 재처리 API | `POST /api/admin/settlements/{id}/retry` | 지정 테넌트만 재정산 |
| ST-007 | 성능 테스트 | 10만 건 Mock 데이터 | 10분 이내 처리, CPU/IO 모니터링 |

## 5. 테스트 절차

1. 스테이징 DB 초기화 (필요 시 `TRUNCATE` + `INSERT`)
2. 샘플 데이터 로드 (`sample_insert_2025_11.sql` 실행)
3. 배치 수동 실행 및 로그 확인
4. 결과 테이블(`SETTLEMENT_RESULT`) 검증: 금액, 건수, 수수료, 정산금
5. 관리자 포털 `GET /api/admin/settlements` 호출 → UI에서 리포트 다운로드 확인
6. 오류 로그(`SETTLEMENT_LOG`) 점검 → 비정상 케이스 재처리(`PKG_SETTLEMENT.RETRY_SINGLE`)
7. 성능/부하 테스트: Mock 데이터 10만 건 삽입 후 배치 실행 → AWR 리포트 분석
8. 정산 리포트(PDF/CSV) 샘플 검증 → 금액 합계, 테넌트 정보, 기간 표시 확인

## 6. 리포트 및 증적 관리

- **테스트 결과 기록:** `/qa/results/settlement/2025-Phase1/settlement_test_report.md`
- **AWR 리포트:** `/qa/results/settlement/2025-Phase1/awr_report_2025-11.html`
- **로그 보관:** `logs/settlement/2025-11-*.log`
- **이슈 트래킹:** Jira 프로젝트 `MG-PLSQL`, 티켓 예: `MG-PLSQL-12`
- **서명:** QA 리더, DBA, 백엔드 리드 확인 후 릴리즈 승인

## 7. 향후 개선 사항

- 배치 실행 전후 데이터 검증 자동화 스크립트 추가
- 이벤트 기반 실시간 정산(Streaming) PoC 준비
- 정산 결과 시각화 대시보드(Charts) 연동 계획 수립
- 배치 실패 자동 알림(슬랙/이메일) → 재처리 가이드
