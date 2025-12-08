# TODO 리스트

**작성일**: 2025-12-08  
**상태**: 대기 중  
**이관일**: 2025-12-07

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

### 2. 화면 테스트 (12월 7일 이관)
- [ ] 프론트엔드 UI 테스트
  - [ ] 온보딩 화면 테스트
  - [ ] 로그인 화면 테스트
  - [ ] 대시보드 화면 테스트
  - [ ] 사용자 관리 화면 테스트
  - [ ] 매칭 관리 화면 테스트
  - [ ] 스케줄 관리 화면 테스트
  - [ ] ERP 화면 테스트

- [ ] 사용자 플로우 테스트
  - [ ] 관리자 플로우 테스트
  - [ ] 상담사 플로우 테스트
  - [ ] 내담자 플로우 테스트
  - [ ] 사무원 플로우 테스트

- [ ] 통합 테스트
  - [ ] 전체 프로세스 통합 테스트
  - [ ] 크로스 브라우저 테스트
  - [ ] 반응형 디자인 테스트

---

## 🔧 개선 사항

### 3. 코드 품질 개선
- [ ] OnboardingService.java lombok 의존성 오류 확인 및 수정
- [ ] 사용하지 않는 import 정리 (추가 확인)
- [ ] Deprecated 메서드 완전 제거 (추가 확인)
- [ ] CSS 변수 적용 완료 확인

---

## 📝 문서화

### 4. 문서 업데이트
- [x] 표준화 검증 보고서 업데이트 (2025-12-08 작업 반영)
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 작성
- [ ] 개발자 가이드 업데이트
- [ ] 배포 가이드 작성

---

## 🧪 테스트

### 5. 표준화 검증 테스트
- [ ] tenantId 표준화 후 기능 테스트
  - [ ] 상담사 관리 페이지 접근 테스트
  - [ ] 내담자 관리 페이지 접근 테스트
  - [ ] 상담사/내담자 등록 기능 테스트
  - [ ] tenantId 누락 시 에러 메시지 확인
- [ ] 통합 테스트
  - [ ] 전체 프로세스 통합 테스트
  - [ ] 크로스 브라우저 테스트
  - [ ] 반응형 디자인 테스트

### 6. 엣지 케이스 테스트 (12월 7일 이관)
- [ ] 동시성 테스트
- [ ] 대용량 데이터 테스트
- [ ] 오류 처리 테스트
- [ ] 성능 테스트

---

## 🚀 배포 준비

### 7. 프로덕션 배포 준비
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 검증
- [ ] 보안 설정 검증
- [ ] 모니터링 설정

---

## ✅ 2025-12-08 완료된 작업

### 사용자 개인정보 복호화 캐싱 시스템 구현 (성능 최적화)
- [x] `UserPersonalDataCacheService` 인터페이스 생성
- [x] `UserPersonalDataCacheServiceImpl` 구현체 생성 (Spring Cache 사용)
- [x] 로그인 시 사용자 개인정보 복호화하여 캐시에 저장하는 로직 추가 (`AuthController`)
- [x] 상담사/내담자 등록 시 캐시에 복호화 데이터 저장 (`AdminServiceImpl`)
- [x] 사용자 정보 업데이트 시 캐시 무효화 로직 추가 (`updateConsultant`, `updateClient`)
- [x] 문서화 (`docs/architecture/USER_PERSONAL_DATA_CACHE.md`)
- [ ] 기존 서비스들이 캐시를 사용하도록 수정 (다음 단계)
  - [ ] `AdminServiceImpl.decryptUserPersonalData()` → 캐시 사용으로 전환
  - [ ] `ConsultantStatsServiceImpl` → 캐시 사용으로 전환
  - [ ] `ClientStatsServiceImpl` → 캐시 사용으로 전환
  - [ ] 기타 서비스들 캐시 사용 확인

### AdminController tenantId 표준화 완료 (1차)
- [x] `getAllConsultantsWithStats()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getAllClientsWithStats()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getConsultantsWithSpecialty()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `registerConsultant()`: `SessionUtils.getTenantId()` 사용, 에러 메시지 개선
- [x] `registerClient()`: `SessionUtils.getTenantId()` 사용, 에러 메시지 개선
- [x] `getAllConsultantsWithVacationInfo()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getAllClients()`: `SessionUtils.getTenantId()` 사용으로 전환
- [x] `getTransactions()` (2곳): `SessionUtils.getTenantId()` 사용으로 전환
- [x] 표준화 검증 보고서 업데이트
- [x] 문서를 오늘 날짜 폴더로 이동 및 업데이트

### 관리자 대시보드 tenantId 기반 조회 표준화 완료 (2차)
- [x] `getAllMappings()`: TenantContextHolder 설정 추가, tenantId 검증 추가
- [x] `getConsultantRatingStatistics()`: branchCode 제거, tenantId 기반으로 전환
- [x] `getAllConsultantsWithVacationInfo()`: TenantContextHolder 설정 추가
- [x] `getConsultantVacationStats()`: TenantContextHolder 설정 추가
- [x] `getAllClientsWithMappingInfo()`: TenantContextHolder 설정 추가
- [x] `getConsultationCompletionStatistics()`: branchCode 제거, tenantId 기반으로 전환

### 12월 7일 완료된 작업

### 로컬 개발 환경 실행 오류 수정
- [x] application-local.yml 중복된 spring 키 제거
- [x] pom.xml 잘못된 pluginGroups 태그 제거
- [x] ConsultationRecordAlertController 스케줄러 선택적 주입으로 변경
- [x] WellnessAdminController 스케줄러 선택적 주입으로 변경
- [x] 한글 인코딩 설정 개선 (logback-spring.xml, application-local.yml, .mvn/jvm.config)
- [x] Windows Git Bash 콘솔 인코딩 문제 문서화

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-08  
**이관 출처**: 2025-12-07 TODO.md  
**2025-12-08 업데이트**: AdminController tenantId 표준화 완료 반영

