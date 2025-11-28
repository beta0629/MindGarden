# 업종별 컴포넌트 분리 시스템 테스트 계획 (2025-11-27)

## 📋 테스트 개요

**목적**: 2025-11-26에 구현한 업종별 컴포넌트 분리 시스템이 실제로 작동하는지 검증

**구현 완료 사항**:
- ✅ 위젯 가시성 제어 (`widgetVisibilityUtils.js`)
- ✅ 메뉴 접근 제어 (`MenuConstants.js`, `BusinessTypeGuard.js`)
- ✅ API 접근 제어 (`@RequireBusinessType`, `BusinessTypeAspect.java`)
- ✅ TenantService 구현체 (`TenantServiceImpl.java`)

---

## 🎯 테스트 시나리오

### 1. 상담소 테넌트 테스트

#### 1.1 로그인 및 기본 확인
```
테넌트: tenant-seoul-consultation-002 (또는 다른 상담소 테넌트)
Business Type: CONSULTATION
예상 결과:
  - 로그인 성공
  - 대시보드 정상 표시
  - 테넌트 컨텍스트 정상 설정
```

#### 1.2 위젯 필터링 확인
```
확인 사항:
  ✅ 상담소 위젯 표시:
    - consultation-session (상담 회기)
    - consultation-client (내담자 관리)
    - consultation-schedule (상담 일정)
  
  ❌ 학원 위젯 숨김:
    - academy-course (강좌 관리)
    - academy-class (반 관리)
    - academy-enrollment (수강 등록)
  
  ✅ 공통 위젯 표시:
    - common-dashboard (공통 대시보드)
    - common-statistics (통계)
```

#### 1.3 메뉴 필터링 확인
```
확인 사항:
  ✅ 상담소 메뉴 표시:
    - 상담 관리
    - 내담자 목록
    - 상담사 목록
    - 일정
  
  ❌ 학원 메뉴 숨김:
    - 강좌 관리
    - 반 관리
    - 수강 등록
    - 출결 관리
```

#### 1.4 API 접근 제어 확인
```
테스트 API:
  ✅ 허용: GET /api/v1/consultations
  ✅ 허용: GET /api/v1/consultants
  ❌ 차단: GET /api/v1/academy/courses (403 Forbidden)
  ❌ 차단: GET /api/v1/academy/classes (403 Forbidden)
```

---

### 2. 학원 테넌트 테스트

#### 2.1 로그인 및 기본 확인
```
테넌트: (학원 테넌트 ID - 확인 필요)
Business Type: ACADEMY
예상 결과:
  - 로그인 성공
  - 대시보드 정상 표시
  - 테넌트 컨텍스트 정상 설정
```

#### 2.2 위젯 필터링 확인
```
확인 사항:
  ✅ 학원 위젯 표시:
    - academy-course (강좌 관리)
    - academy-class (반 관리)
    - academy-enrollment (수강 등록)
  
  ❌ 상담소 위젯 숨김:
    - consultation-session (상담 회기)
    - consultation-client (내담자 관리)
    - consultation-schedule (상담 일정)
  
  ✅ 공통 위젯 표시:
    - common-dashboard (공통 대시보드)
    - common-statistics (통계)
```

#### 2.3 메뉴 필터링 확인
```
확인 사항:
  ✅ 학원 메뉴 표시:
    - 강좌 관리
    - 반 관리
    - 수강 등록
    - 출결 관리
  
  ❌ 상담소 메뉴 숨김:
    - 상담 관리
    - 내담자 목록
    - 상담사 목록
```

#### 2.4 API 접근 제어 확인
```
테스트 API:
  ✅ 허용: GET /api/v1/academy/courses
  ✅ 허용: GET /api/v1/academy/classes
  ❌ 차단: GET /api/v1/consultations (403 Forbidden)
  ❌ 차단: GET /api/v1/consultants (403 Forbidden)
```

---

## 🛠️ 테스트 방법

### A. 브라우저 수동 테스트

#### 1단계: 상담소 테넌트 로그인
```
1. 브라우저에서 http://localhost:3000 접속
2. 상담소 테넌트 계정으로 로그인
3. 개발자 도구 (F12) 열기
4. Console 탭에서 로그 확인:
   - [widgetVisibilityUtils] 로그
   - [BusinessTypeGuard] 로그
5. Network 탭에서 API 호출 확인
```

#### 2단계: 위젯 확인
```
1. 대시보드 페이지로 이동
2. 표시되는 위젯 목록 확인
3. Console에서 필터링 로그 확인:
   console.log('Filtered widgets:', visibleWidgets);
```

#### 3단계: 메뉴 확인
```
1. 네비게이션 메뉴 확인
2. 상담소 메뉴만 표시되는지 확인
3. 학원 메뉴가 숨겨졌는지 확인
```

#### 4단계: API 접근 테스트
```
1. Console에서 직접 API 호출:

// 허용되어야 하는 API
fetch('http://localhost:8080/api/v1/consultations', {
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    'X-Tenant-ID': sessionStorage.getItem('tenantId')
  }
}).then(r => console.log('상담 API:', r.status));

// 차단되어야 하는 API
fetch('http://localhost:8080/api/v1/academy/courses', {
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    'X-Tenant-ID': sessionStorage.getItem('tenantId')
  }
}).then(r => console.log('학원 API:', r.status)); // 403 예상
```

### B. 백엔드 로그 확인

터미널 11번에서 백엔드 로그 확인:
```
2025-11-27 XX:XX:XX [http-nio-8080-exec-X] INFO  c.c.c.a.BusinessTypeAspect - 업종 검증 성공: 테넌트=XXX, 업종=CONSULTATION, 메서드=getConsultations
2025-11-27 XX:XX:XX [http-nio-8080-exec-X] WARN  c.c.c.a.BusinessTypeAspect - 업종 접근 거부: 필요=[ACADEMY], 실제=CONSULTATION, 메서드=getCourses
```

---

## 📊 테스트 체크리스트

### 상담소 테넌트 (CONSULTATION)
- [ ] 로그인 성공
- [ ] 상담소 위젯 표시 확인
- [ ] 학원 위젯 숨김 확인
- [ ] 공통 위젯 표시 확인
- [ ] 상담소 메뉴 표시 확인
- [ ] 학원 메뉴 숨김 확인
- [ ] 상담 API 접근 허용 (200 OK)
- [ ] 학원 API 접근 차단 (403 Forbidden)

### 학원 테넌트 (ACADEMY)
- [ ] 로그인 성공
- [ ] 학원 위젯 표시 확인
- [ ] 상담소 위젯 숨김 확인
- [ ] 공통 위젯 표시 확인
- [ ] 학원 메뉴 표시 확인
- [ ] 상담소 메뉴 숨김 확인
- [ ] 학원 API 접근 허용 (200 OK)
- [ ] 상담 API 접근 차단 (403 Forbidden)

### 시스템 안정성
- [ ] 페이지 로딩 속도 정상
- [ ] 캐시 시스템 작동 확인
- [ ] 에러 로그 없음
- [ ] 메모리 누수 없음

---

## 🔍 디버깅 가이드

### 문제: 위젯이 필터링되지 않음
```
확인 사항:
1. sessionStorage에 businessType 저장되었는지 확인
   console.log(sessionStorage.getItem('businessType'));

2. widgetVisibilityUtils.js의 fetchAllowedWidgets 호출 확인
   console.log('Allowed widgets:', allowedWidgets);

3. 백엔드 API 응답 확인
   GET /api/admin/business-type/{businessType}/widgets
```

### 문제: API 접근 제어가 작동하지 않음
```
확인 사항:
1. @RequireBusinessType 어노테이션 적용 확인
2. BusinessTypeAspect 빈 등록 확인
3. TenantContextHolder에 테넌트 ID 설정 확인
4. 백엔드 로그에서 AOP 실행 확인
```

### 문제: 메뉴가 필터링되지 않음
```
확인 사항:
1. MenuConstants.js의 getMenusForBusinessType 호출 확인
2. BusinessTypeGuard 컴포넌트 적용 확인
3. React Router 설정 확인
```

---

## 🎯 성공 기준

### 필수 기준
1. ✅ 상담소 테넌트에서 학원 기능 완전 차단
2. ✅ 학원 테넌트에서 상담소 기능 완전 차단
3. ✅ 공통 기능은 모든 업종에서 정상 작동
4. ✅ 성능 저하 없음 (API 응답 < 100ms)

### 품질 기준
1. ✅ 사용자 친화적 에러 메시지
2. ✅ 로딩 상태 표시
3. ✅ 캐시 시스템 작동
4. ✅ 로그 및 모니터링 정상

---

## 📝 테스트 결과 기록

### 테스트 일시
- 시작: 2025-11-27 XX:XX
- 종료: 2025-11-27 XX:XX

### 테스트 환경
- 백엔드: http://localhost:8080
- 프론트엔드: http://localhost:3000
- 데이터베이스: PostgreSQL (개발 환경)

### 발견된 이슈
(테스트 중 발견된 이슈 기록)

### 해결 방안
(이슈 해결 방법 기록)

---

## 🚀 다음 단계

테스트 완료 후:
1. [ ] 테스트 결과 문서화
2. [ ] 발견된 이슈 수정
3. [ ] 성능 최적화
4. [ ] 사용자 가이드 작성
5. [ ] 운영 배포 준비

