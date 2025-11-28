# 브라우저 테스트 가이드 - 업종별 컴포넌트 분리 시스템

## 🎯 테스트 목적

업종별 컴포넌트 분리 시스템이 실제 브라우저에서 올바르게 작동하는지 검증합니다.

---

## 🚀 시작하기

### 1. 서버 확인

**백엔드**: http://localhost:8080 ✅ (실행 중)
**프론트엔드**: http://localhost:3000 ✅ (실행 중)

### 2. 브라우저 열기

```
1. Chrome 또는 Firefox 브라우저 열기
2. http://localhost:3000 접속
3. F12 키를 눌러 개발자 도구 열기
4. Console 탭 선택
```

---

## 📋 테스트 시나리오 1: 상담소 테넌트

### Step 1: 로그인

```
1. 로그인 페이지에서 상담소 테넌트 계정으로 로그인
   - 테넌트 ID: tenant-seoul-consultation-002 (또는 다른 상담소 테넌트)
   - 사용자명: (상담소 관리자 계정)
   - 비밀번호: (계정 비밀번호)

2. Console에서 확인할 로그:
   ✅ [SessionManager] 로그인 성공
   ✅ [SessionManager] businessType: CONSULTATION
   ✅ [TenantContext] 테넌트 컨텍스트 설정 완료
```

### Step 2: 대시보드 위젯 확인

```
1. 대시보드 페이지로 이동

2. Console에서 다음 명령어 실행:
   console.log('Business Type:', sessionStorage.getItem('businessType'));
   console.log('Tenant ID:', sessionStorage.getItem('tenantId'));

3. 예상 출력:
   Business Type: CONSULTATION
   Tenant ID: tenant-seoul-consultation-002

4. 위젯 확인:
   ✅ 표시되어야 할 위젯:
      - 상담 회기 관리
      - 내담자 관리
      - 상담 일정
      - 공통 대시보드
   
   ❌ 숨겨져야 할 위젯:
      - 강좌 관리
      - 반 관리
      - 수강 등록
```

### Step 3: 메뉴 확인

```
1. 네비게이션 메뉴 확인

2. 예상 결과:
   ✅ 표시되어야 할 메뉴:
      - 대시보드
      - 상담 관리
      - 내담자 목록
      - 상담사 목록
      - 일정
      - 마이페이지
      - 설정
   
   ❌ 숨겨져야 할 메뉴:
      - 강좌 관리
      - 반 관리
      - 수강 등록
      - 출결 관리
```

### Step 4: API 접근 제어 테스트

```
Console에서 다음 명령어 실행:

// 1. 허용되어야 하는 API (상담 관리)
fetch('http://localhost:8080/api/v1/consultations', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    'X-Tenant-ID': sessionStorage.getItem('tenantId'),
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ 상담 API 응답:', response.status);
  return response.json();
})
.then(data => console.log('상담 데이터:', data))
.catch(error => console.error('에러:', error));

// 2. 차단되어야 하는 API (학원 관리)
fetch('http://localhost:8080/api/v1/academy/courses', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    'X-Tenant-ID': sessionStorage.getItem('tenantId'),
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('❌ 학원 API 응답:', response.status); // 403 예상
  if (response.status === 403) {
    console.log('✅ 업종별 API 접근 제어 정상 작동!');
  }
  return response.json();
})
.then(data => console.log('응답 데이터:', data))
.catch(error => console.error('에러:', error));
```

### Step 5: Network 탭 확인

```
1. Network 탭으로 이동
2. 대시보드 새로고침 (F5)
3. 확인할 API 호출:
   ✅ GET /api/v1/tenant/dashboards - 200 OK
   ✅ GET /api/admin/business-type/CONSULTATION/widgets - 200 OK
   ✅ GET /api/v1/consultations - 200 OK
   ❌ GET /api/v1/academy/courses - 403 Forbidden (호출 시)
```

---

## 📋 테스트 시나리오 2: 학원 테넌트

### Step 1: 로그아웃 및 재로그인

```
1. 현재 세션 로그아웃
2. 학원 테넌트 계정으로 로그인
   - 테넌트 ID: (학원 테넌트 ID - 확인 필요)
   - 사용자명: (학원 관리자 계정)
   - 비밀번호: (계정 비밀번호)

3. Console 확인:
   ✅ [SessionManager] businessType: ACADEMY
```

### Step 2: 대시보드 위젯 확인

```
1. 위젯 확인:
   ✅ 표시되어야 할 위젯:
      - 강좌 관리
      - 반 관리
      - 수강 등록
      - 공통 대시보드
   
   ❌ 숨겨져야 할 위젯:
      - 상담 회기 관리
      - 내담자 관리
      - 상담 일정
```

### Step 3: API 접근 제어 테스트

```
Console에서 다음 명령어 실행:

// 1. 허용되어야 하는 API (학원 관리)
fetch('http://localhost:8080/api/v1/academy/courses', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    'X-Tenant-ID': sessionStorage.getItem('tenantId'),
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ 학원 API 응답:', response.status);
  return response.json();
})
.then(data => console.log('학원 데이터:', data));

// 2. 차단되어야 하는 API (상담 관리)
fetch('http://localhost:8080/api/v1/consultations', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
    'X-Tenant-ID': sessionStorage.getItem('tenantId'),
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('❌ 상담 API 응답:', response.status); // 403 예상
  if (response.status === 403) {
    console.log('✅ 업종별 API 접근 제어 정상 작동!');
  }
});
```

---

## 🔍 디버깅 팁

### 문제: 위젯이 필터링되지 않음

```javascript
// Console에서 실행
console.log('=== 디버깅 정보 ===');
console.log('Business Type:', sessionStorage.getItem('businessType'));
console.log('Tenant ID:', sessionStorage.getItem('tenantId'));

// widgetVisibilityUtils 확인
import { fetchAllowedWidgets } from './utils/widgetVisibilityUtils';
fetchAllowedWidgets('CONSULTATION').then(widgets => {
  console.log('Allowed Widgets:', widgets);
});
```

### 문제: API 403 에러가 발생하지 않음

```
1. 백엔드 로그 확인 (터미널 11)
2. @RequireBusinessType 어노테이션 적용 확인
3. BusinessTypeAspect 빈 등록 확인
```

### 문제: 메뉴가 필터링되지 않음

```javascript
// Console에서 실행
import { getMenusForBusinessType } from './constants/MenuConstants';
const menus = getMenusForBusinessType('CONSULTATION');
console.log('Filtered Menus:', menus);
```

---

## ✅ 체크리스트

### 상담소 테넌트 테스트
- [ ] 로그인 성공
- [ ] businessType = CONSULTATION 확인
- [ ] 상담소 위젯 표시
- [ ] 학원 위젯 숨김
- [ ] 상담소 메뉴 표시
- [ ] 학원 메뉴 숨김
- [ ] 상담 API 200 OK
- [ ] 학원 API 403 Forbidden

### 학원 테넌트 테스트
- [ ] 로그인 성공
- [ ] businessType = ACADEMY 확인
- [ ] 학원 위젯 표시
- [ ] 상담소 위젯 숨김
- [ ] 학원 메뉴 표시
- [ ] 상담소 메뉴 숨김
- [ ] 학원 API 200 OK
- [ ] 상담 API 403 Forbidden

---

## 📸 스크린샷 가이드

테스트 결과를 문서화하기 위해 다음 스크린샷을 캡처하세요:

1. **상담소 대시보드**: 위젯 목록
2. **학원 대시보드**: 위젯 목록
3. **Console 로그**: API 응답 상태
4. **Network 탭**: API 호출 목록
5. **백엔드 로그**: BusinessTypeAspect 로그

---

## 🎯 성공 기준

### 필수
- ✅ 상담소에서 학원 기능 완전 차단
- ✅ 학원에서 상담소 기능 완전 차단
- ✅ 공통 기능은 모든 업종에서 작동
- ✅ 성능 저하 없음

### 선택
- ✅ 사용자 친화적 에러 메시지
- ✅ 로딩 상태 표시
- ✅ 캐시 시스템 작동

---

## 📝 테스트 결과 기록

### 발견된 이슈
(테스트 중 발견된 문제 기록)

### 해결 방법
(문제 해결 방법 기록)

### 추가 개선 사항
(향후 개선이 필요한 사항 기록)

