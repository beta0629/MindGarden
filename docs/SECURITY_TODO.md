# 보안 강화 TODO 목록

## 📋 보안 현황 개요

**프로젝트 특성**: 상담 관리 시스템 (금융 서비스 아님)  
**현재 보안 수준**: 기본적 (환경변수 사용)  
**목표 보안 수준**: 적절한 (개인정보보호법 준수)  

---

## 🚨 **최고 우선순위** (즉시 수정 필요)

### **1. OAuth2 클라이언트 시크릿 보안 강화**
- [ ] **문서에서 하드코딩된 시크릿 제거**
  - `docs/ENVIRONMENT_SETUP.md`에서 실제 시크릿 값 제거
  - 예시 값으로만 변경 (`your-kakao-client-secret`)
  - 파일: `docs/ENVIRONMENT_SETUP.md`

- [ ] **프론트엔드에서 클라이언트 시크릿 제거**
  - `frontend/src/constants/environment.js`에서 NAVER_CLIENT_SECRET 제거
  - 클라이언트 시크릿은 백엔드에서만 사용
  - 파일: `frontend/src/constants/environment.js`

- [ ] **시스템 환경변수 설정**
  - `.env` 파일 삭제
  - 시스템 환경변수로 시크릿 관리
  - 명령어: `export KAKAO_CLIENT_SECRET="실제_시크릿"`

### **2. API 키 보안 강화**
- [ ] **WeatherCard API 키 환경변수화**
  - 하드코딩된 API 키 제거
  - 환경변수로 관리
  - 파일: `frontend/src/components/dashboard/WeatherCard.js`

- [ ] **결제 시스템 API 키 환경변수화**
  - PaymentConstants의 하드코딩된 API 키 제거
  - 환경변수로 관리
  - 파일: `src/main/java/com/mindgarden/consultation/constant/PaymentConstants.java`

### **3. 관리자 계정 정보 보안 강화**
- [ ] **관리자 이메일 상수화**
  - 하드코딩된 관리자 이메일을 상수 클래스로 이동
  - 테스트 계정과 운영 계정 분리
  - 파일: `src/main/java/com/mindgarden/consultation/controller/TestDataController.java`

---

## ⚠️ **중간 우선순위** (1-2주 내 수정)

### **4. URL 하드코딩 제거**
- [ ] **프론트엔드 URL 상수화**
  - 모든 `http://localhost:8080` 하드코딩 제거
  - `API_BASE_URL` 상수 사용
  - 영향 파일들:
    - `frontend/src/components/admin/VacationManagementModal.js`
    - `frontend/src/components/admin/TodayStatistics.js`
    - `frontend/src/components/schedule/TimeSlotGrid.js`
    - `frontend/src/components/schedule/steps/ClientSelectionStep.js`

- [ ] **백엔드 URL 상수화**
  - OAuth2 리다이렉트 URI 상수화
  - 파일: `src/main/java/com/mindgarden/consultation/controller/OAuth2Controller.java`

### **5. 데이터베이스 연결 보안 강화**
- [ ] **데이터베이스 비밀번호 환경변수화**
  - `application.yml`에서 하드코딩된 DB 정보 제거
  - 환경변수로 관리
  - 파일: `src/main/resources/application.yml`

### **6. 로깅 보안 강화**
- [ ] **민감한 정보 로깅 제거**
  - 비밀번호, 시크릿 키 등이 로그에 노출되지 않도록 수정
  - 로그 레벨 조정
  - 파일: `src/main/resources/application.yml`

---

## 📝 **낮은 우선순위** (시간 있을 때 수정)

### **7. 개발 환경 보안 개선**
- [ ] **테스트 계정 정보 분리**
  - 개발용 테스트 계정을 별도 설정 파일로 분리
  - 운영 환경에서는 비활성화
  - 파일: `src/main/java/com/mindgarden/consultation/controller/TestDataController.java`

- [ ] **개발 도구 보안 설정**
  - 개발자 도구에서 민감한 정보 노출 방지
  - 파일: `frontend/src/App.js`

### **8. 문서 보안 강화**
- [ ] **문서에서 민감한 정보 제거**
  - API 문서에서 실제 시크릿 값 제거
  - 예시 값으로만 표시
  - 파일: `docs/API_DESIGN.md`, `docs/ENVIRONMENT_SETUP.md`

---

## 🔧 **보안 도구 및 설정**

### **9. 환경별 보안 설정**
- [ ] **개발 환경 보안 설정**
  - 로컬 개발용 환경변수 설정
  - 테스트용 시크릿 값 사용

- [ ] **운영 환경 보안 설정**
  - 시스템 환경변수 설정
  - 실제 시크릿 값 사용
  - 접근 권한 제한

### **10. 토스 결제 연계 보안 강화** (토스 연계 시 함께 진행)
- [ ] **토스 결제 시크릿 키 보안 강화**
  - 토스 시크릿 키 환경변수화
  - 결제 검증 로직 보안 강화
  - 웹훅 보안 검증 구현

- [ ] **결제 데이터 암호화**
  - 결제 정보 저장 시 암호화
  - 개인정보 마스킹 처리
  - 결제 로그 보안 강화

- [ ] **결제 API 보안 설정**
  - IP 화이트리스트 설정
  - Rate Limiting 적용
  - 결제 요청 검증 강화

### **11. 카카오 알림톡 보안 강화** (카카오 알림톡 연계 시 함께 진행)
- [ ] **카카오 알림톡 API 키 보안 강화**
  - 카카오 알림톡 API 키 환경변수화
  - 알림톡 발송 로그 보안 강화
  - 개인정보 마스킹 처리

- [ ] **알림톡 데이터 보안**
  - 알림톡 발송 이력 암호화 저장
  - 개인정보 노출 방지
  - 알림톡 템플릿 보안 관리

- [ ] **알림톡 발송 보안 설정**
  - 발송 권한 검증 강화
  - 스팸 방지 로직 구현
  - 발송 실패 시 보안 로그 관리

### **12. 보안 모니터링**
- [ ] **보안 체크리스트 작성**
  - 코드 리뷰 시 보안 체크리스트 적용
  - 정기적인 보안 검토 일정 수립

- [ ] **보안 문서화**
  - 보안 가이드라인 작성
  - 개발자 보안 교육 자료 준비

---

## 📊 **보안 수준 평가**

### **현재 상태**
- ✅ **기본 환경변수 사용**: OAuth2, JWT, DB 설정
- ❌ **하드코딩된 시크릿**: 문서, 프론트엔드, 상수 파일
- ❌ **URL 하드코딩**: 프론트엔드 여러 파일
- ❌ **관리자 정보 하드코딩**: 테스트 컨트롤러

### **목표 상태**
- ✅ **모든 시크릿 환경변수화**
- ✅ **URL 상수화 완료**
- ✅ **관리자 정보 상수화**
- ✅ **문서 보안 강화**

---

## 🎯 **실행 계획**

### **1주차 (현재)**
- [ ] OAuth2 클라이언트 시크릿 보안 강화
- [ ] API 키 환경변수화
- [ ] 관리자 계정 정보 상수화

### **2주차**
- [ ] URL 하드코딩 제거
- [ ] 데이터베이스 연결 보안 강화
- [ ] 로깅 보안 강화

### **3주차**
- [ ] 개발 환경 보안 개선
- [ ] 문서 보안 강화
- [ ] 보안 모니터링 설정

## 📱 **카카오 알림톡 보안 (NEW!)**

### **완료된 보안 조치**
- [x] **API 키 환경 변수 관리**
  - `${KAKAO_ALIMTALK_API_KEY}`, `${KAKAO_ALIMTALK_SENDER_KEY}` 환경 변수 사용
  - 설정 파일에 평문 저장 금지

- [x] **전화번호 개인정보 보호**
  - 로그에서 전화번호 마스킹 (`010****5678`)
  - 기존 암호화 시스템 연동 (`PersonalDataEncryptionUtil`)
  - 복호화된 데이터 메모리 최소 보관

- [x] **시뮬레이션 모드 보안**
  - 개발 환경: `simulation-mode: true` (실제 발송 방지)
  - 운영 환경: `simulation-mode: false` (실제 발송)
  - 환경별 자동 분리

### **추가 고려사항**
- [ ] **알림 발송 제한**
  - 동일 사용자에게 과도한 알림 발송 방지
  - 일일/시간당 발송 제한 설정

- [ ] **템플릿 승인 관리**
  - 카카오에서 승인된 템플릿만 사용
  - 미승인 템플릿 사용 시 오류 처리

### **토스 결제 연계 시 (추후)**
- [ ] 토스 결제 시크릿 키 보안 강화
- [ ] 결제 데이터 암호화
- [ ] 결제 API 보안 설정
- [ ] 웹훅 보안 검증 구현

### **카카오 알림톡 연계 시 (추후)**
- [ ] 카카오 알림톡 API 키 보안 강화
- [ ] 알림톡 데이터 보안
- [ ] 알림톡 발송 보안 설정
- [ ] 개인정보 마스킹 처리

---

## 📚 **참고 자료**

- [Spring Boot 보안 가이드](https://spring.io/guides/gs/securing-web/)
- [OAuth2 보안 모범 사례](https://tools.ietf.org/html/rfc6749)
- [개인정보보호법 가이드](https://www.privacy.go.kr/)
- [환경변수 보안 관리](https://12factor.net/config)

---

**마지막 업데이트**: 2025-09-14  
**담당자**: 개발팀  
**검토 주기**: 주 1회  
