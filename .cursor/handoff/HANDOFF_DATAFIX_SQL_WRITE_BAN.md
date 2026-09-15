# HANDOFF — DATAFIX / SQL 쓰기 전면 금지 (즉시)

감사 원본: `/opt/cursor/artifacts/CHOI78_DATAFIX_AUDIT_20260915.md`  
사용자 질책: 승인 없는 운영 데이터 조작 → 신뢰 손상.

## 대상 (지정 + 현재 RUNNING 확장)

지정:
- bc-4f6d7fca-e12b-5ca7-8bb9-72bba825a609 (IL 누적표시)
- bc-ca56f5de-3587-5912-a456-29144b1f7468 (배지)
- bc-76b87cbe-c72a-5c64-8f1f-2ba7565a1ac8 (월별UX)
- bc-35284c68-b5e2-5627-b20d-2e5edea4c4ed (10만)
- bc-fa761bbc-6581-5f67-a939-a0bc56cbd6f2 (8/31 vs 9/1)

확장(동시에 돌아가는 최가을/IL 관련):
- bc-43332769-c5ab-50e9-9eb9-9012125da218 (초기상담료 재무확인)
- bc-7ff241fd-5b1e-503a-aab0-96b94e6d126f (금액·날짜 스케줄대조)
- bc-851f9348-0059-557d-93fe-d589bb930b98 (IL카드 초기상담료10만 표시)

## 금지 (예외 없음, 승인 전까지)

- PROD/DEV `UPDATE` / `INSERT` / `DELETE` / `DATAFIX` / mysql 쓰기 / SSH DB 변경
- client_id=78(최가을) 포함 모든 운영·개발 DB 데이터 생성·수정
- 「테스트/미러/임시」명목 쓰기

## 허용

- SELECT 읽기 전용
- 코드·문서·표시 수정 제안
- 롤백 SQL은 **문서 제안만** (실행 금지)

## 규칙

사용자 명시 승인 없는 데이터 생성/수정 = **0**.
