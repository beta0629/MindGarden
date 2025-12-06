# TODO 리스트

**작성일**: 2025-12-06  
**상태**: 진행 중

---

## 🎯 우선순위 높음

### 1. 화면 테스트
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

### 2. ItemRepository 테넌트 필터링
- [ ] `ItemRepository`에 테넌트 필터링 메서드 추가
- [ ] `ErpServiceImpl.getAllActiveItems()`에서 테넌트 필터링 적용
- [ ] 기존 데이터의 `tenantId` null 처리 방안 검토

### 3. 코드 품질 개선
- [ ] 사용하지 않는 import 정리
- [ ] Deprecated 메서드 완전 제거
- [ ] CSS 변수 적용 완료
- [ ] 테스트 코드 패키지 경로 오류 수정

---

## 📝 문서화

### 4. 문서 업데이트
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 작성
- [ ] 개발자 가이드 업데이트
- [ ] 배포 가이드 작성

---

## 🧪 추가 테스트

### 5. 엣지 케이스 테스트
- [ ] 동시성 테스트
- [ ] 대용량 데이터 테스트
- [ ] 오류 처리 테스트
- [ ] 성능 테스트

---

## 🚀 배포 준비

### 6. 프로덕션 배포 준비
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 검증
- [ ] 보안 설정 검증
- [ ] 모니터링 설정

---

---

## ✅ 완료된 작업 (2025-12-06)

### 1. CORS 및 로그인 오류 해결 ✅
- [x] SecurityConfig CORS 설정 수정
- [x] SecurityFilter OPTIONS 요청 허용
- [x] DevelopmentConfig 중복 CORS 설정 제거
- [x] 공개 API 경로 명시적 허용

### 2. 대시보드 통계 표시 오류 수정 ✅
- [x] AdminDashboard.js ApiResponse 파싱 수정
- [x] 하드코딩된 증가율 제거
- [x] AdminController 실제 증가율 계산 추가

### 3. API 경로 표준화 (404 오류 해결) ✅
- [x] 프론트엔드 API 경로 `/api/v1/` 접두사로 수정 (7개 파일)
- [x] consultantHelper.js API 경로 수정
- [x] ConsultantComprehensiveManagement.js API 경로 수정

### 4. tenantId 필수값 검증 및 전달 강화 ✅
- [x] TenantContextFilter tenantId 필수 검증 추가
- [x] AdminController tenantId 필수 검증 추가
- [x] 프론트엔드 API 헤더에 X-Tenant-Id 자동 포함
- [x] sessionManager 세션 갱신 시 tenantId 포함

### 5. UserResponse, UserDto에 tenantId 추가 ✅
- [x] UserResponse.java tenantId 필드 추가
- [x] UserDto.java tenantId 필드 추가
- [x] AuthServiceImpl tenantId 설정 추가
- [x] sessionManager tenantId 복사 로직 추가

### 6. 스케줄러 무한루프 방지 ✅
- [x] application-local.yml 모든 스케줄러 비활성화
- [x] Spring 스케줄링 자체 비활성화

### 7. 프론트엔드 API 호출 표준화 ✅
- [x] standardizedApi.js 생성
- [x] API_CALL_STANDARD.md 문서 작성
- [x] check-api-standardization.js 스크립트 생성

### 8. 기타 수정 사항 ✅
- [x] pom.xml 컴파일 오류 수정
- [x] application.yml 중복 키 병합
- [x] SchedulerExecutionLog 엔티티 수정

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-06  
**완료된 작업**: 8개 항목

