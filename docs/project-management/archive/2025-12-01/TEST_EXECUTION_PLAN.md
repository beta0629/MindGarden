# 🧪 멀티 테넌시 시스템 테스트 진행 방안

**작성일**: 2025-12-01  
**목표**: 멀티 테넌시 시스템 완전 검증  
**예상 소요 시간**: 2-3시간  
**현재 상태**: ✅ 컴파일 성공, 테스트 파일 확인 완료

---

## 📋 **테스트 진행 순서 (4단계)**

```
1단계: 환경 준비 ✅ (완료)
   ↓
2단계: 자동화 테스트 실행 (30분)
   ↓
3단계: 수동 브라우저 테스트 (1-2시간)
   ↓
4단계: 결과 정리 및 보고 (30분)
```

---

## 🎯 **2단계: 자동화 테스트 실행 (30분)**

### **2-1. AsyncContextPropagationTest (비동기 Context 전파 테스트)**

#### **실행 명령어**:
```bash
cd /Users/mind/mindGarden
mvn test -Dtest=AsyncContextPropagationTest
```

#### **테스트 항목 (4개)**:

| 테스트 메서드 | 검증 내용 | 예상 결과 |
|-------------|---------|---------|
| `testAsyncNotificationWithTenantId` | 알림톡 발송 시 tenantId 전파 | ✅ PASS |
| `testThreadIsolation` | 100번 동시 요청 시 Context 오염 방지 | ✅ PASS |
| `testSuperAdminBypassPropagation` | 슈퍼 어드민 플래그 전파 | ✅ PASS |
| `testContextCleanup` | Context 정리 (메모리 누수 방지) | ✅ PASS |

#### **성공 기준**:
```
Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
```

#### **실패 시 확인 사항**:
1. **tenantId가 null인 경우**:
   - `TenantContextTaskDecorator`가 제대로 설정되었는지 확인
   - `AsyncConfig`에서 TaskDecorator 등록 확인

2. **Context 오염 발생**:
   - `ThreadLocal` 정리가 제대로 되는지 확인
   - `finally` 블록에서 `TenantContext.clear()` 호출 확인

3. **메모리 누수**:
   - 비동기 작업 완료 후 Context가 정리되는지 확인

---

### **2-2. SuperAdminBypassTest (슈퍼 어드민 필터 우회 테스트)**

#### **실행 명령어**:
```bash
mvn test -Dtest=SuperAdminBypassTest
```

#### **테스트 항목 (5개)**:

| 테스트 메서드 | 검증 내용 | 예상 결과 |
|-------------|---------|---------|
| `testNormalAdminCanOnlySeeOwnTenant` | 일반 관리자는 자기 테넌트만 조회 | ✅ PASS |
| `testSuperAdminCanSeeAllTenants` | 슈퍼 어드민은 전체 테넌트 조회 | ✅ PASS |
| `testBypassFlagToggle` | Bypass 플래그 토글 테스트 | ✅ PASS |
| `testSuperAdminRoles` | HQ_MASTER, SUPER_HQ_ADMIN 역할 확인 | ✅ PASS |
| `testSqlLogVerification` | SQL 로그 수동 검증용 | ✅ PASS |

#### **성공 기준**:
```
Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
```

#### **실패 시 확인 사항**:
1. **슈퍼 어드민이 전체 테넌트 조회 못하는 경우**:
   - `TenantContext.setBypassTenantFilter(true)` 호출 확인
   - Repository에서 `shouldBypassTenantFilter()` 확인 로직 확인

2. **일반 관리자가 다른 테넌트 조회하는 경우**:
   - Repository에서 tenantId 필터링이 제대로 되는지 확인
   - SQL 로그에 `WHERE tenant_id = ?` 포함 확인

---

### **2-3. 전체 테스트 실행 (선택적)**

#### **실행 명령어**:
```bash
# 전체 테스트 실행 (시간 오래 걸림)
mvn test

# 또는 특정 패키지만 실행
mvn test -Dtest=com.coresolution.core.context.*Test
```

---

## 🌐 **3단계: 수동 브라우저 테스트 (1-2시간)**

### **3-1. 서버 시작**

#### **방법 1: 간편 실행 (추천)**
```bash
cd /Users/mind/mindGarden
./start-local.sh
```

#### **방법 2: 개별 실행**
```bash
# 백엔드 시작
cd /Users/mind/mindGarden
mvn spring-boot:run -Dspring.profiles.active=dev

# 프론트엔드 시작 (새 터미널)
cd /Users/mind/mindGarden/frontend
npm start
```

#### **서버 시작 확인**:
- 백엔드: `http://localhost:8080`
- 프론트엔드: `http://localhost:3000`

---

### **3-2. 로그인 테스트**

#### **테스트 계정 1: 일반 관리자**
- **이메일**: `test-consultation-1763988242@example.com`
- **비밀번호**: `Test1234!@#`
- **테넌트 ID**: `tenant-unknown-consultation-001`
- **역할**: `ADMIN`

#### **테스트 계정 2: 슈퍼 관리자**
- **이메일**: `superadmin@mindgarden.com`
- **비밀번호**: `admin123`
- **역할**: `SUPER_ADMIN` 또는 `HQ_MASTER`

#### **확인 사항**:
- [ ] 로그인 성공
- [ ] 세션 유지 확인
- [ ] 브라우저 개발자 도구에서 tenantId 확인 (Network 탭)
- [ ] 대시보드 정상 로딩

---

### **3-3. 위젯 테스트**

#### **테스트 항목**:

| 위젯 | 확인 사항 | 예상 결과 |
|-----|---------|---------|
| **TodayStatsWidget** | 오늘의 통계 데이터 표시 | ✅ 정상 로딩 |
| **SystemOverviewWidget** | 시스템 상태 표시 | ✅ 정상 로딩 |
| **QuickActionsWidget** | 빠른 작업 버튼 표시 | ✅ 정상 렌더링 |
| **ConsultationStatsWidget** | 상담 통계 표시 | ✅ API 연동 정상 |
| **ScheduleWidget** | 일정 표시 | ✅ 정상 로딩 |

#### **확인 방법**:
1. **브라우저 개발자 도구 열기** (F12)
2. **Network 탭** 확인
   - API 호출 확인
   - 응답 데이터 확인
   - tenantId 파라미터 확인
3. **Console 탭** 확인
   - 에러 로그 확인
   - 경고 메시지 확인

#### **무한 로딩 문제 확인**:
- [ ] 위젯이 계속 로딩 중인지 확인
- [ ] 3초 이내 데이터 로딩 완료
- [ ] 에러 메시지 없음

---

### **3-4. 데이터 연동 테스트**

#### **테스트 시나리오 1: 일반 관리자 (자기 테넌트만 조회)**

**단계**:
1. 일반 관리자 계정으로 로그인
2. 대시보드에서 통계 확인
3. 브라우저 개발자 도구 → Network 탭
4. API 호출 확인

**확인 사항**:
```
GET /api/schedules/today/statistics?userRole=ADMIN&tenantId=tenant-unknown-consultation-001
GET /api/v1/consultations/statistics/overall?tenantId=tenant-unknown-consultation-001
```

- [ ] API 호출 시 `tenantId` 파라미터 포함
- [ ] 응답 데이터가 해당 테넌트 데이터만 포함
- [ ] 다른 테넌트 데이터 없음

---

#### **테스트 시나리오 2: 슈퍼 관리자 (전체 테넌트 조회)**

**단계**:
1. 슈퍼 관리자 계정으로 로그인
2. 대시보드에서 전체 통계 확인
3. 브라우저 개발자 도구 → Network 탭
4. API 호출 확인

**확인 사항**:
```
GET /api/admin/tenants/all
GET /api/admin/statistics/all-tenants
```

- [ ] 전체 테넌트 데이터 조회 가능
- [ ] 테넌트별 통계 표시
- [ ] 필터링 없이 전체 데이터 표시

---

#### **테스트 시나리오 3: 크로스 테넌트 접근 차단**

**단계**:
1. 일반 관리자로 로그인 (테넌트 A)
2. 브라우저 개발자 도구 → Console 탭
3. 다음 코드 실행:
```javascript
// 다른 테넌트 데이터 조회 시도
fetch('/api/schedules/today/statistics?tenantId=other-tenant-id', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log(data));
```

**예상 결과**:
- [ ] 403 Forbidden 또는 빈 데이터
- [ ] 다른 테넌트 데이터 접근 불가
- [ ] 에러 메시지: "권한이 없습니다" 또는 "잘못된 테넌트 ID"

---

### **3-5. 성능 테스트**

#### **페이지 로딩 시간 측정**:

**방법**:
1. 브라우저 개발자 도구 → Network 탭
2. "Disable cache" 체크
3. 페이지 새로고침 (Ctrl+Shift+R)
4. "Load" 시간 확인

**기준**:
- [ ] 페이지 로딩: < 2초
- [ ] API 응답: < 500ms
- [ ] 위젯 렌더링: < 1초

#### **동시 요청 테스트**:

**방법**:
1. 브라우저 개발자 도구 → Console 탭
2. 다음 코드 실행:
```javascript
// 100번 동시 요청
Promise.all(
  Array(100).fill(0).map(() => 
    fetch('/api/schedules/today/statistics?userRole=ADMIN', {
      credentials: 'include'
    })
  )
).then(responses => {
  console.log('성공:', responses.filter(r => r.ok).length);
  console.log('실패:', responses.filter(r => !r.ok).length);
});
```

**기준**:
- [ ] 성공: 100개
- [ ] 실패: 0개
- [ ] Context 오염: 0건

---

## 📊 **4단계: 결과 정리 및 보고 (30분)**

### **4-1. 테스트 결과 정리**

#### **자동화 테스트 결과**:
```
AsyncContextPropagationTest:
  - testAsyncNotificationWithTenantId: [PASS/FAIL]
  - testThreadIsolation: [PASS/FAIL]
  - testSuperAdminBypassPropagation: [PASS/FAIL]
  - testContextCleanup: [PASS/FAIL]

SuperAdminBypassTest:
  - testNormalAdminCanOnlySeeOwnTenant: [PASS/FAIL]
  - testSuperAdminCanSeeAllTenants: [PASS/FAIL]
  - testBypassFlagToggle: [PASS/FAIL]
  - testSuperAdminRoles: [PASS/FAIL]
  - testSqlLogVerification: [PASS/FAIL]
```

#### **브라우저 테스트 결과**:
```
로그인 테스트:
  - 일반 관리자 로그인: [PASS/FAIL]
  - 슈퍼 관리자 로그인: [PASS/FAIL]
  - 세션 유지: [PASS/FAIL]

위젯 테스트:
  - TodayStatsWidget: [PASS/FAIL]
  - SystemOverviewWidget: [PASS/FAIL]
  - QuickActionsWidget: [PASS/FAIL]
  - ConsultationStatsWidget: [PASS/FAIL]
  - ScheduleWidget: [PASS/FAIL]

데이터 연동 테스트:
  - 테넌트별 데이터 필터링: [PASS/FAIL]
  - 크로스 테넌트 접근 차단: [PASS/FAIL]
  - API 응답 시간: [PASS/FAIL]

성능 테스트:
  - 페이지 로딩 시간: [PASS/FAIL]
  - API 응답 시간: [PASS/FAIL]
  - 동시 요청 처리: [PASS/FAIL]
```

---

### **4-2. 이슈 및 개선 사항**

#### **발견된 이슈**:
```
1. [이슈 제목]
   - 증상: 
   - 재현 방법:
   - 예상 원인:
   - 해결 방안:

2. [이슈 제목]
   ...
```

#### **개선 사항**:
```
1. [개선 항목]
   - 현재 상태:
   - 개선 방안:
   - 예상 효과:

2. [개선 항목]
   ...
```

---

### **4-3. 최종 보고서 작성**

#### **보고서 템플릿**:
```markdown
# 멀티 테넌시 시스템 테스트 결과 보고서

**테스트 일자**: 2025-12-01
**테스트 담당자**: [이름]
**테스트 환경**: 로컬 개발 환경

## 📊 전체 결과

- 자동화 테스트: [PASS/FAIL] (9/9)
- 브라우저 테스트: [PASS/FAIL] (15/15)
- 성능 테스트: [PASS/FAIL] (3/3)
- **총 합격률**: [100%]

## ✅ 성공한 테스트

- AsyncContextPropagationTest: 4/4
- SuperAdminBypassTest: 5/5
- 위젯 로딩: 5/5
- 데이터 연동: 3/3
- 성능: 3/3

## ❌ 실패한 테스트

- 없음

## 📝 발견된 이슈

- 없음

## 🎯 다음 단계

- [ ] 운영 환경 배포 준비
- [ ] 모니터링 설정
- [ ] 사용자 교육

## 🎉 결론

멀티 테넌시 시스템이 완벽하게 작동합니다. 운영 배포 준비 완료!
```

---

## 🚨 **트러블슈팅 가이드**

### **문제 1: 테스트 실행 시 컴파일 에러**

**증상**:
```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin
```

**해결 방법**:
```bash
mvn clean compile -DskipTests
```

---

### **문제 2: 테스트 실패 - tenantId가 null**

**증상**:
```
java.lang.IllegalStateException: 테넌트 컨텍스트가 설정되지 않았습니다.
```

**해결 방법**:
1. `TenantContextTaskDecorator` 확인
2. `AsyncConfig`에서 TaskDecorator 등록 확인
3. 테스트 코드에서 `TenantContext.setTenantId()` 호출 확인

---

### **문제 3: 브라우저에서 무한 로딩**

**증상**:
- 위젯이 계속 로딩 중
- 데이터가 표시되지 않음

**해결 방법**:
1. 브라우저 개발자 도구 → Console 탭 확인
2. Network 탭에서 API 호출 확인
3. 백엔드 로그 확인: `tail -f logs/application.log`
4. `setLoading(false)` 호출 확인

---

### **문제 4: 크로스 테넌트 접근 가능**

**증상**:
- 다른 테넌트 데이터가 조회됨
- tenantId 필터링이 작동하지 않음

**해결 방법**:
1. Repository에서 tenantId 필터링 확인
2. Service에서 `TenantContextHolder.getTenantId()` 호출 확인
3. SQL 로그 확인: `WHERE tenant_id = ?` 포함 여부

---

## 📞 **긴급 연락처**

**문제 발생 시**:
1. 로그 확인: `tail -f logs/application.log`
2. 컴파일 확인: `mvn clean compile -DskipTests`
3. 롤백: `git reset --hard HEAD~1`

**관련 문서**:
- `docs/TENANT_ID_FINAL_INSPECTION_REPORT.md` - 점검 보고서
- `docs/project-management/archive/2025-11-30/MULTI_TENANCY_TEST_GUIDE.md` - 테스트 가이드
- `docs/project-management/archive/2025-11-30/MULTI_TENANCY_EDGE_CASES.md` - 엣지 케이스 가이드

---

**작성일**: 2025-12-01  
**작성자**: AI Assistant  
**상태**: ✅ 준비 완료  
**다음 단계**: 테스트 실행

**화이팅! 🚀**

