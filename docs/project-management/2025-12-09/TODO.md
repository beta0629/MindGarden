# TODO 리스트

**작성일**: 2025-12-09  
**상태**: 진행 중  
**이관일**: 2025-12-08

---

## ✅ 2025-12-09 완료된 작업

### AdminController tenantId 표준화 완료
- [x] `getAllConsultantsWithStats()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getAllClientsWithStats()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getConsultantsWithSpecialty()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `registerConsultant()`: `SessionUtils.getTenantId()` 사용, 에러 메시지 개선
- [x] `registerClient()`: `SessionUtils.getTenantId()` 사용, 에러 메시지 개선
- [x] `getAllConsultantsWithVacationInfo()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getAllClients()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getTransactions()` (2곳): `SessionUtils.getTenantId()` 사용으로 전환
- [x] 표준화 검증 보고서 업데이트
- [x] 문서를 오늘 날짜 폴더로 이동

---

## 🎯 우선순위 높음

### 1. 표준화 작업 계속 진행
- [ ] 기타 Controller에서 tenantId 조회 표준화 확인
  - [ ] `UserController` 확인
  - [ ] `CommonCodeController` 확인
  - [ ] `SystemNotificationController` 확인
  - [ ] 기타 컨트롤러들 확인
- [ ] Service 레이어에서 tenantId 사용 패턴 확인 및 표준화
- [ ] 프론트엔드에서 tenantId 관련 코드 표준화 확인

---

## 🔧 개선 사항

### 2. 코드 품질 개선
- [ ] 남은 인라인 스타일 제거
  - [ ] `BranchManagement.js`의 나머지 인라인 스타일 (9개)
  - [ ] `FormShowcase.js`의 인라인 스타일
  - [ ] `MGForm.js`의 하드코딩된 색상값
- [ ] 버튼 표준화 계속 진행
  - [ ] 나머지 파일들의 네이티브 버튼 → 표준 `Button` 컴포넌트로 전환
  - [ ] API 연동 버튼에 `preventDoubleClick={true}` 추가 확인
- [ ] 페이징 표준화 계속 진행
  - [ ] 나머지 컨트롤러에 `PaginationUtils` 적용
  - [ ] Frontend에서 연속 스크롤 구현 확인 및 개선

---

## 📝 문서화

### 3. 문서 업데이트
- [x] 표준화 검증 보고서 업데이트 (2025-12-09 작업 반영)
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 작성
- [ ] 개발자 가이드 업데이트
- [ ] 배포 가이드 작성

---

## 🧪 테스트

### 4. 표준화 검증 테스트
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

## 🚀 배포 준비

### 5. 프로덕션 배포 준비
- [ ] 표준화 작업 완료 후 배포 준비
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 검증
- [ ] 보안 설정 검증
- [ ] 모니터링 설정

---

## ⏳ 대기 중인 항목 (12월 8일 이관)

### 화면 테스트
- [ ] 프론트엔드 UI 테스트
- [ ] 사용자 플로우 테스트
- [ ] 통합 테스트

### 추가 개선 사항
- [ ] OnboardingService.java lombok 의존성 오류 확인 및 수정
- [ ] 사용하지 않는 import 정리
- [ ] Deprecated 메서드 완전 제거
- [ ] CSS 변수 적용 완료 확인

---

## 📊 진행률

- **완료**: 10개 항목 (2025-12-09 작업 포함)
- **진행 중**: 15개 항목
- **대기 중**: 12개 항목
- **전체 진행률**: 약 45%

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-09  
**이관 출처**: 2025-12-08 TODO.md

