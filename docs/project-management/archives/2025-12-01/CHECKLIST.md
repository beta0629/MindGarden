# 2025-12-01 작업 체크리스트

## 📋 개요

**작성일**: 2025-11-30  
**대상일**: 2025-12-01  
**목표**: 멀티 테넌시 시스템 완성도 향상

---

## ✅ 작업 전 체크리스트

### 환경 확인
- [ ] 개발 서버 정상 동작 확인
- [ ] 데이터베이스 연결 확인
- [ ] Git 상태 확인 (`git status`)
- [ ] 최신 코드 pull (`git pull origin develop`)

### 백업
- [ ] 데이터베이스 백업 완료
- [ ] 코드 커밋 완료 (작업 전 상태)

---

## 🎯 주요 작업 체크리스트

### 1️⃣ findById() 보안 강화 (4-6시간)

#### 1.1 Repository 메서드 추가
- [ ] UserRepository에 `findByTenantIdAndId()` 추가
- [ ] ScheduleRepository에 `findByTenantIdAndId()` 추가
- [ ] ConsultantClientMappingRepository에 `findByTenantIdAndId()` 추가
- [ ] PaymentRepository에 `findByTenantIdAndId()` 추가
- [ ] ConsultationRecordRepository에 `findByTenantIdAndId()` 추가

**예시**:
```java
@Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.id = :id AND u.isDeleted = false")
Optional<User> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") Long id);
```

#### 1.2 Service Layer 수정
- [ ] AdminServiceImpl 수정
- [ ] UserServiceImpl 수정
- [ ] ScheduleServiceImpl 수정
- [ ] PaymentServiceImpl 수정
- [ ] ConsultationServiceImpl 수정

#### 1.3 테스트
- [ ] 컴파일 확인: `mvn clean compile -DskipTests`
- [ ] 단위 테스트 실행
- [ ] 통합 테스트 실행

---

### 2️⃣ 멀티 테넌시 통합 테스트 (2-3시간)

#### 2.1 비동기 Context 전파 테스트
- [ ] `AsyncContextPropagationTest` 실행
  ```bash
  mvn test -Dtest=AsyncContextPropagationTest
  ```
- [ ] 4개 테스트 모두 PASS 확인
- [ ] 로그에서 tenantId 전파 확인

#### 2.2 슈퍼 어드민 Bypass 테스트
- [ ] `SuperAdminBypassTest` 실행
  ```bash
  mvn test -Dtest=SuperAdminBypassTest
  ```
- [ ] 5개 테스트 모두 PASS 확인
- [ ] SQL 로그에서 필터링 확인

#### 2.3 스트레스 테스트
- [ ] 100번 동시 요청 테스트
- [ ] Context 오염 0건 확인
- [ ] 메모리 누수 확인

---

### 3️⃣ 슈퍼 어드민 플래그 설정 (1-2시간)

#### 3.1 필터 수정
- [ ] `SessionBasedAuthenticationFilter.java` 열기
- [ ] 사용자 인증 후 역할 확인 로직 추가
- [ ] `TenantContext.setBypassTenantFilter(true)` 호출 추가

**구현 위치**: 
```java
// SessionBasedAuthenticationFilter.java
// 사용자 인증 성공 후
if (user.getRole() == UserRole.HQ_MASTER || 
    user.getRole() == UserRole.SUPER_HQ_ADMIN) {
    TenantContext.setBypassTenantFilter(true);
    log.info("👑 슈퍼 어드민 필터 우회 활성화: {}", user.getUsername());
}
```

#### 3.2 테스트
- [ ] HQ_MASTER 계정으로 로그인
- [ ] 전체 테넌트 데이터 조회 확인
- [ ] SQL 로그에서 `WHERE tenant_id = ?` 제거 확인

---

### 4️⃣ 성능 모니터링 (1-2시간)

#### 4.1 Slow Query Log 설정
- [ ] MySQL 설정 파일 수정
  ```sql
  SET GLOBAL slow_query_log = 'ON';
  SET GLOBAL long_query_time = 1;
  ```
- [ ] Slow Query Log 파일 확인

#### 4.2 인덱스 사용률 확인
- [ ] 주요 쿼리 `EXPLAIN` 분석
  ```sql
  EXPLAIN SELECT * FROM users WHERE tenant_id = 'xxx' AND created_at > '2024-01-01';
  ```
- [ ] 복합 인덱스 사용 확인
- [ ] 성능 측정 (10만 건 데이터)

#### 4.3 결과 기록
- [ ] 쿼리 실행 시간 기록
- [ ] 인덱스 사용률 기록
- [ ] 개선 사항 문서화

---

## 📚 문서화 체크리스트

### 5️⃣ 문서 업데이트

#### 5.1 API 문서
- [ ] Swagger UI에 tenantId 헤더 설명 추가
- [ ] 에러 코드 정리
- [ ] 예제 요청/응답 추가

#### 5.2 운영 가이드
- [ ] 배포 체크리스트 작성
- [ ] 롤백 절차 문서화
- [ ] 모니터링 알림 설정 가이드

#### 5.3 개발 가이드
- [ ] 멀티 테넌시 개발 가이드 작성
- [ ] 코드 리뷰 체크리스트 작성
- [ ] 트러블슈팅 가이드 업데이트

---

## 🚀 배포 체크리스트 (선택적)

### 6️⃣ 운영 환경 배포 준비

#### 6.1 배포 전 확인
- [ ] 모든 테스트 PASS
- [ ] 컴파일 성공: `BUILD SUCCESS`
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트 완료

#### 6.2 데이터베이스
- [ ] 운영 DB 백업 완료
- [ ] 마이그레이션 스크립트 확인 (V60)
- [ ] 인덱스 생성 시간 예측

#### 6.3 배포 실행
- [ ] 배포 시간 공지 (점검 시간)
- [ ] 애플리케이션 중지
- [ ] JAR 파일 업로드
- [ ] 데이터베이스 마이그레이션 실행
- [ ] 애플리케이션 시작
- [ ] 헬스 체크 확인

#### 6.4 배포 후 확인
- [ ] 로그 확인 (30분)
- [ ] 주요 API 테스트
- [ ] 성능 모니터링 (1시간)
- [ ] 사용자 피드백 수집 (24시간)

---

## 🔍 검증 체크리스트

### 보안 검증
- [ ] findAll() without tenantId: 0개 ✅
- [ ] findById() tenantId 검증 추가
- [ ] URL 파라미터 조작 방지
- [ ] SQL Injection 방지 확인

### 성능 검증
- [ ] 쿼리 실행 시간 < 0.1초
- [ ] 복합 인덱스 사용률 > 90%
- [ ] 메모리 사용량 정상
- [ ] CPU 사용률 정상

### 기능 검증
- [ ] 로그인/로그아웃 정상
- [ ] 데이터 조회 정상
- [ ] 데이터 생성/수정/삭제 정상
- [ ] 실시간 알림 정상

---

## 📊 진행 상황 추적

### 시간대별 체크
- [ ] 09:00 - 작업 시작, 환경 확인
- [ ] 10:00 - findById() 보안 강화 시작
- [ ] 12:00 - 점심 식사
- [ ] 13:00 - 통합 테스트 실행
- [ ] 15:00 - 슈퍼 어드민 플래그 설정
- [ ] 16:00 - 성능 모니터링
- [ ] 17:00 - 문서 업데이트
- [ ] 18:00 - 최종 확인 및 커밋

---

## ⚠️ 주의 사항

### 작업 중 주의
1. **백업 필수**: 모든 변경 전 백업
2. **단계별 커밋**: 작은 단위로 자주 커밋
3. **테스트 필수**: 모든 변경 후 테스트
4. **로그 확인**: 에러 로그 즉시 확인

### 문제 발생 시
1. **즉시 롤백**: 심각한 문제 발생 시
2. **로그 수집**: 에러 로그 전체 수집
3. **이슈 등록**: GitHub Issues에 등록
4. **팀 공유**: 문제 상황 공유

---

## 📝 작업 완료 후

### 최종 확인
- [ ] 모든 체크리스트 항목 완료
- [ ] Git 커밋 및 푸시 완료
- [ ] 문서 업데이트 완료
- [ ] 내일 TODO 작성 완료

### 보고서 작성
- [ ] 작업 완료 보고서 작성
- [ ] 이슈 및 해결 방법 기록
- [ ] 다음 단계 계획 수립

---

## 📞 긴급 연락처

**문제 발생 시**:
1. 로그 확인: `tail -f logs/application.log`
2. 컴파일 확인: `mvn clean compile -DskipTests`
3. 롤백: `git reset --hard HEAD~1`

**관련 문서**:
- [TODO 리스트](./TODO.md)
- [멀티 테넌시 가이드](../2025-11-30/MULTI_TENANCY_EDGE_CASES.md)
- [테스트 가이드](../2025-11-30/MULTI_TENANCY_TEST_GUIDE.md)

---

**작성일**: 2025-11-30  
**작성자**: CoreSolution Development Team  
**상태**: 준비 완료 ✅

**화이팅! 🚀**

