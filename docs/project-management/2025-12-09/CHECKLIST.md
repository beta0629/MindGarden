# 체크리스트

**작성일**: 2025-12-09  
**상태**: 진행 중  
**이관일**: 2025-12-08

---

## ✅ 2025-12-09 완료된 항목

### AdminController tenantId 표준화
- [x] `getAllConsultantsWithStats()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getAllClientsWithStats()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getConsultantsWithSpecialty()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `registerConsultant()`: `SessionUtils.getTenantId()` 사용, 에러 메시지 개선
- [x] `registerClient()`: `SessionUtils.getTenantId()` 사용, 에러 메시지 개선
- [x] `getAllConsultantsWithVacationInfo()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getAllClients()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getTransactions()` (라인 574): `SessionUtils.getTenantId()` 우선 사용
- [x] `getTransactions()` (라인 2267): `SessionUtils.getTenantId()` 사용으로 전환
- [x] 표준화 검증 보고서 업데이트
- [x] 문서를 오늘 날짜 폴더로 이동

### 문서 관리
- [x] 오늘 날짜 폴더 생성 (2025-12-09)
- [x] 표준화 검증 보고서 이동 및 업데이트
- [x] TODO 리스트 생성 및 업데이트
- [x] 체크리스트 생성 및 업데이트

---

## 🔄 진행 중인 항목

### 표준화 작업
- [ ] 기타 Controller에서 tenantId 조회 표준화 확인
- [ ] Service 레이어에서 tenantId 사용 패턴 확인
- [ ] 프론트엔드에서 tenantId 관련 코드 표준화 확인

### 코드 품질 개선
- [ ] 남은 인라인 스타일 제거
- [ ] 버튼 표준화 계속 진행
- [ ] 페이징 표준화 계속 진행

---

## ⏳ 대기 중인 항목

### 화면 테스트
- [ ] 프론트엔드 UI 테스트
- [ ] 사용자 플로우 테스트
- [ ] 통합 테스트

### 개선 사항
- [ ] OnboardingService.java lombok 의존성 오류 확인 및 수정
- [ ] 사용하지 않는 import 정리
- [ ] Deprecated 메서드 완전 제거
- [ ] CSS 변수 적용 완료 확인

### 문서화
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 작성
- [ ] 개발자 가이드 업데이트
- [ ] 배포 가이드 작성

---

## 🧪 테스트 항목

### 표준화 검증 테스트
- [ ] tenantId 표준화 후 기능 테스트
  - [ ] 상담사 관리 페이지 접근 테스트
  - [ ] 내담자 관리 페이지 접근 테스트
  - [ ] 상담사/내담자 등록 기능 테스트
  - [ ] tenantId 누락 시 에러 메시지 확인
- [ ] 통합 테스트
  - [ ] 전체 프로세스 통합 테스트
  - [ ] 크로스 브라우저 테스트
  - [ ] 반응형 디자인 테스트

---

## 📊 진행률

### 표준화 작업
- **완료**: 10개 항목 (2025-12-09)
- **진행 중**: 3개 항목
- **대기 중**: 12개 항목
- **전체 진행률**: 약 45%

### 표준화 준수율
- **전체 준수율**: 약 87% (이전 85% → 향상)
- **공통 처리 표준화**: 85% (향상)

---

## 📝 다음 작업 우선순위

1. **즉시**: 기타 Controller에서 tenantId 조회 표준화 확인
2. **단기**: 남은 인라인 스타일 제거, 버튼 표준화 계속
3. **중기**: 표준화 검증 테스트, 문서화 완료
4. **장기**: 전체 표준화 완료 및 배포 준비

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-09  
**이관 출처**: 2025-12-08 CHECKLIST.md

