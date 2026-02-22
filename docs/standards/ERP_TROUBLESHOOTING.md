# ERP 연동 트러블슈팅 가이드

**버전**: 1.0.0  
**최종 업데이트**: 2025-02-22  
**관련 스킬**: `/core-solution-erp`

---

## 1. 로그 확인 방법

### 개발 서버

- 로그 파일: `logs/` 또는 애플리케이션 실행 콘솔
- Spring Boot 기본: `application.log`, `error.log` (logback 설정에 따름)
- 실시간 확인 예시:
  ```bash
  tail -f logs/application.log | grep -E "상담료|중복 거래|유효한 거래|AdminServiceImpl|AmountManagement"
  ```

### 운영 서버

- 서버 접속 후 `logs/` 디렉터리 또는 집계 시스템(CloudWatch, ELK 등) 사용
- 시간대·MappingID 기준으로 필터링 권장

---

## 2. AdminServiceImpl 관련 로그 키워드

| 로그 메시지 | 레벨 | 의미 |
|-------------|------|------|
| `매칭 입금 확인으로 인한 상담료 수입 거래 자동 생성 완료` | INFO | 입금 확인 후 INCOME 거래 생성 성공 |
| `상담료 수입 거래 자동 생성 실패` | ERROR | INCOME 거래 생성 중 예외 |
| `중복 거래 방지: MappingID=*에 대한 수입 거래가 이미 존재합니다` | WARN | 중복 INCOME 거래 스킵 (정상 동작) |
| `유효한 거래 금액을 결정할 수 없습니다` | ERROR | packagePrice, paymentAmount 둘 다 없거나 0 |
| `[중앙화] 상담료 수입 거래 생성 완료` | INFO | createConsultationIncomeTransaction 성공 |
| `[미수금] 매출채권 거래 생성 완료` | INFO | RECEIVABLES 거래 생성 성공 |
| `입금 확인 ERP 거래 스킵: MappingID=* (유효 금액 없음)` | WARN | packagePrice, paymentAmount 둘 다 유효하지 않음 |
| `금액 불일치 감지: MappingID=*` | WARN | paymentAmount와 packagePrice 불일치 |

---

## 3. API 경로 확인

| 용도 | 메서드 | 경로 |
|------|--------|------|
| 금액·관련 거래 조회 | GET | `/api/v1/admin/amount-management/mappings/{mappingId}/amount-info` |
| 결제·입금 확인 (INCOME/RECEIVABLES) | POST | `/api/v1/admin/mappings/{mappingId}/confirm-payment` |
| 입금 확인 (현금 수입) | POST | `/api/v1/admin/mappings/{mappingId}/confirm-deposit` |
| 금액 일관성 검사 | GET | `/api/v1/admin/amount-management/mappings/{mappingId}/consistency-check` |

프론트엔드 API 호출 시 `StandardizedApi` 사용 필수. `X-Tenant-Id` 자동 포함.

---

## 4. 점검 체크리스트

### tenantId

- [ ] 요청 헤더에 `X-Tenant-Id` 포함 여부 확인
- [ ] TenantContextHolder에 tenantId 설정 여부 (필터·인터셉터)
- [ ] DB 조회 시 tenantId 조건 포함 여부

### packagePrice / paymentAmount

- [ ] 매칭(ConsultantClientMapping)에 `packagePrice` 설정 여부
- [ ] 입금 확인 시 `paymentAmount` 또는 `packagePrice` 중 하나 이상 유효한지
- [ ] amount-info API의 `accurateAmount` 값 확인 (packagePrice 우선, 없으면 paymentAmount)

### 중복 거래

- [ ] 동일 MappingID에 대해 INCOME 거래가 이미 존재하는지
- [ ] `중복 거래 방지` 로그가 있으면 정상 동작(재생성 스킵)

### 금액 일관성

- [ ] packagePrice와 ERP 거래 총액 일치 여부
- [ ] consistency-check API로 `isConsistent`, `recommendation` 확인

---

## 5. 참조

- **스킬**: `/core-solution-erp`
- **구현**: `AdminServiceImpl`, `AmountManagementServiceImpl`, `AmountManagementController`
- **표준**: `docs/standards/API_CALL_STANDARD.md`, `docs/standards/LOGGING_STANDARD.md`
