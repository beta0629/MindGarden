# 상담일지 모달 API 500/404 원인 분석 보고서

**대상**: mindgarden.dev.core-solution.co.kr  
**분석**: core-debugger  
**적용**: 프론트 경로·응답 처리 수정 완료

---

## 1. 증상

| 항목 | URL | 결과 |
|------|-----|------|
| 공통코드(우선순위) | GET `/api/v1/common-codes/PRIORITY` | **500** |
| 공통코드(완료상태) | GET `/api/v1/common-codes/COMPLETION_STATUS` | **500** |
| 상담일지 조회 | GET `/api/schedules/consultation-records?consultantId=...&consultationId=...` | **404** |

---

## 2. 원인

### 2.1 공통코드 500

- 프론트가 **GET /api/v1/common-codes/PRIORITY** 호출 → 백엔드에는 **GET /{id}**(Long)만 있어 "PRIORITY"가 Long으로 파싱되며 **NumberFormatException** → 500.
- 표준 API는 **GET /api/v1/common-codes?codeGroup=PRIORITY** 이며, 응답은 `{ codes, totalCount, ... }` 형태.

### 2.2 consultation-records 404

- 백엔드 `ScheduleController`는 **/api/v1/schedules** 에만 매핑됨.
- 프론트는 **/api/schedules/consultation-records** (v1 없음) 호출 → 404.

---

## 3. 적용한 수정

### ConsultationLogModal.js

- **공통코드**: `GET /api/v1/common-codes?codeGroup=PRIORITY` (및 COMPLETION_STATUS), 응답은 `response?.codes ?? []` 사용.
- **상담일지**: 모든 호출을 `/api/v1/schedules/consultation-records` 로 변경 (GET 1곳, PUT 2곳, POST 2곳).
- **기록 목록 파싱**: `recordResponse?.records ?? recordResponse?.data?.records ?? ...` 로 백엔드 `{ records, totalCount }` 형식 대응.

### EventModal.js

- **상담일지 상태 조회**: `GET /api/v1/schedules/consultation-records?consultationId=...` 로 변경.
- **기록 목록**: `response?.records ?? response?.data?.records ?? ...` 사용, `records[0].id` 로 recordId 설정.

---

## 4. 확인 체크리스트

- [ ] GET /api/v1/common-codes?codeGroup=PRIORITY → 200, body.data.codes 배열
- [ ] GET /api/v1/common-codes?codeGroup=COMPLETION_STATUS → 200
- [ ] GET /api/v1/schedules/consultation-records?consultantId=...&consultationId=... → 200
- [ ] 상담일지 모달에서 우선순위/완료상태 옵션 정상 표시
- [ ] 상담일지 모달에서 기존 일지 로드/저장/완료 정상 동작
