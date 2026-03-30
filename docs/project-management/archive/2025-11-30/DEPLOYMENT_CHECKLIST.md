# 🚀 배포 전 체크리스트

**작성일:** 2025-11-30  
**배포 대상:** Phase 1 - TenantId 필터링 완료  
**배포 환경:** 개발 서버 (beta0629.cafe24.com)

---

## ✅ 코드 완성도 체크

### Repository Layer
- [x] ConsultantClientMappingRepository (12개 메서드)
- [x] ConsultationRecordRepository (7개 메서드)
- [x] FinancialTransactionRepository (12개 메서드)
- [x] ScheduleRepository (35개 메서드)
- [x] UserRepository (87개 메서드)
- [x] 총 153개 메서드 tenantId 필터링 완료

### Service Layer
- [x] AdminServiceImpl.java (32개 오류 해결)
- [x] BranchServiceImpl.java (34개 오류 해결)
- [x] ScheduleServiceImpl.java (28개 오류 해결)
- [x] FinancialTransactionServiceImpl.java (18개 오류 해결)
- [x] StatisticsServiceImpl.java (16개 오류 해결)
- [x] 기타 20개 Service 파일 수정
- [x] 총 196개 컴파일 오류 → 0개 해결

### Context & Filter
- [x] TenantContext.java (tenantId, branchId, businessType)
- [x] TenantContextHolder.java (유틸리티 메서드)
- [x] TenantContextFilter.java (3개 필드 추출)
- [x] BusinessTypePermissions.java (권한 관리)

---

## ✅ 빌드 & 컴파일 체크

### Maven 빌드
- [x] `mvn clean compile -DskipTests`: BUILD SUCCESS
- [x] 컴파일 오류: 0개
- [x] 컴파일 경고: 확인 완료
- [x] 빌드 시간: 1.666s (정상)

### 코드 품질
- [x] Deprecated 메서드 마킹 완료
- [x] Import 정리 완료
- [x] Null 체크 완료
- [x] 에러 로깅 완료

---

## ✅ 문서화 체크

### 기술 문서
- [x] TENANT_FILTERING_CHECKLIST.md
- [x] TENANT_FILTERING_AUDIT.md
- [x] BUSINESS_TYPE_SYSTEM.md
- [x] TENANT_FILTERING_PROGRESS_REPORT.md
- [x] PHASE1_COMPLETION_REPORT.md
- [x] FINAL_COMPLETION_REPORT.md
- [x] TENANT_BUSINESS_TYPE_VERIFICATION_REPORT.md
- [x] DEPRECATED_METHODS_REPLACEMENT_COMPLETION.md

### 관리 문서
- [x] TODO.md (업데이트 완료)
- [x] DEPLOYMENT_CHECKLIST.md (본 문서)

---

## ⏳ 배포 전 필수 작업

### 1. 데이터베이스 백업
- [ ] 개발 서버 MySQL 백업
  ```bash
  ssh root@beta0629.cafe24.com
  mysqldump -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] 백업 파일 확인
- [ ] 백업 파일 다운로드 (안전한 위치에 보관)

### 2. 테스트 실행
- [ ] **단위 테스트**: Repository 테스트
  ```bash
  mvn test -Dtest=*Repository*Test
  ```
- [ ] **통합 테스트**: Service 테스트
  ```bash
  mvn test -Dtest=*Service*Test
  ```
- [ ] **API 테스트**: Controller 테스트
  ```bash
  mvn test -Dtest=*Controller*Test
  ```
- [ ] 테스트 결과 확인 및 실패 케이스 수정

### 3. 수동 테스트 (로컬)
- [ ] 로컬 서버 실행
  ```bash
  mvn spring-boot:run
  ```
- [ ] 주요 API 테스트
  - [ ] 로그인 API
  - [ ] 사용자 조회 API (tenantId 필터링 확인)
  - [ ] 스케줄 조회 API (tenantId 필터링 확인)
  - [ ] 재무 거래 조회 API (tenantId 필터링 확인)
- [ ] 크로스 테넌트 접근 차단 확인
- [ ] 에러 로그 확인

### 4. 코드 리뷰
- [ ] Repository 변경사항 리뷰
- [ ] Service 변경사항 리뷰
- [ ] Context & Filter 변경사항 리뷰
- [ ] 보안 취약점 확인

---

## ⏳ 배포 작업

### 1. Git 커밋 & 푸시
- [ ] 변경사항 확인
  ```bash
  git status
  git diff
  ```
- [ ] 커밋 메시지 작성
  ```bash
  git add .
  git commit -m "feat: Phase 1 완료 - tenantId 필터링 및 @Deprecated 메서드 교체
  
  - Repository: 5개 (153개 메서드) tenantId 필터링 완료
  - Service: 25개 파일 @Deprecated 메서드 교체 (196개 오류 해결)
  - Context: tenantId, branchId, businessType 시스템 구현
  - 문서: 8개 기술 문서 작성 완료
  - 빌드: BUILD SUCCESS (컴파일 오류 0개)
  
  BREAKING CHANGE: Repository 메서드 시그니처 변경 (tenantId 파라미터 추가)"
  ```
- [ ] 푸시
  ```bash
  git push origin develop
  ```

### 2. 개발 서버 배포
- [ ] SSH 접속
  ```bash
  ssh root@beta0629.cafe24.com
  ```
- [ ] 애플리케이션 디렉토리 이동
  ```bash
  cd /path/to/mindgarden
  ```
- [ ] Git Pull
  ```bash
  git pull origin develop
  ```
- [ ] Maven 빌드
  ```bash
  mvn clean package -DskipTests
  ```
- [ ] 애플리케이션 재시작
  ```bash
  systemctl restart mindgarden
  # 또는
  ./restart.sh
  ```
- [ ] 헬스 체크
  ```bash
  curl http://localhost:8080/actuator/health
  ```

### 3. 배포 후 검증
- [ ] 애플리케이션 로그 확인
  ```bash
  tail -f /var/log/mindgarden/application.log
  ```
- [ ] 에러 로그 확인
  ```bash
  grep ERROR /var/log/mindgarden/application.log
  ```
- [ ] TenantContext 로그 확인
  ```bash
  grep "Tenant context" /var/log/mindgarden/application.log
  ```
- [ ] API 응답 테스트
  - [ ] 로그인 API
  - [ ] 사용자 조회 API
  - [ ] 스케줄 조회 API
  - [ ] 재무 거래 조회 API

---

## ⏳ 모니터링 (배포 후 24시간)

### 1. 실시간 모니터링
- [ ] CPU 사용률 확인
- [ ] 메모리 사용률 확인
- [ ] 디스크 사용률 확인
- [ ] 네트워크 트래픽 확인

### 2. 애플리케이션 모니터링
- [ ] 응답 시간 확인
- [ ] 에러율 확인
- [ ] TPS (Transactions Per Second) 확인
- [ ] 데이터베이스 커넥션 풀 확인

### 3. 보안 모니터링
- [ ] 크로스 테넌트 접근 시도 로그 확인
- [ ] 인증 실패 로그 확인
- [ ] SQL Injection 시도 확인
- [ ] 비정상 트래픽 확인

### 4. 데이터 검증
- [ ] tenantId 필터링 정상 작동 확인
- [ ] 데이터 격리 확인
- [ ] 통계 데이터 정확성 확인
- [ ] 사용자 피드백 수집

---

## 🚨 롤백 계획

### 롤백 조건
다음 중 하나라도 발생 시 즉시 롤백:
- [ ] 치명적인 버그 발견 (데이터 손실, 보안 취약점)
- [ ] 에러율 10% 이상
- [ ] 응답 시간 2배 이상 증가
- [ ] 크로스 테넌트 접근 발생

### 롤백 절차
1. [ ] 애플리케이션 중지
   ```bash
   systemctl stop mindgarden
   ```
2. [ ] 이전 버전으로 체크아웃
   ```bash
   git checkout <previous-commit-hash>
   ```
3. [ ] Maven 빌드
   ```bash
   mvn clean package -DskipTests
   ```
4. [ ] 애플리케이션 재시작
   ```bash
   systemctl start mindgarden
   ```
5. [ ] 데이터베이스 복구 (필요 시)
   ```bash
   mysql -u mindgarden_dev -p'MindGardenDev2025!@#' core_solution < backup_YYYYMMDD_HHMMSS.sql
   ```
6. [ ] 헬스 체크
7. [ ] 로그 확인
8. [ ] 사용자 공지

---

## 📝 배포 기록

### 배포 정보
- **배포일**: YYYY-MM-DD HH:MM
- **배포자**: [이름]
- **Git Commit Hash**: [해시]
- **배포 환경**: 개발 서버
- **배포 방식**: Git Pull + Maven Build

### 배포 결과
- [ ] 성공
- [ ] 실패 (사유: _____________)
- [ ] 롤백 (사유: _____________)

### 이슈 및 해결
| 이슈 | 발생 시간 | 해결 방법 | 해결 시간 |
|------|-----------|-----------|-----------|
|      |           |           |           |
|      |           |           |           |

### 특이사항
```
(배포 중 발견된 특이사항 기록)
```

---

## 📞 긴급 연락망

### 개발팀
- **백엔드 개발자**: [연락처]
- **프론트엔드 개발자**: [연락처]
- **DevOps**: [연락처]

### 운영팀
- **서버 관리자**: [연락처]
- **DB 관리자**: [연락처]

---

## ✅ 최종 확인

배포 전 다음 항목을 모두 확인했습니까?

- [ ] 코드 완성도 체크 완료
- [ ] 빌드 & 컴파일 체크 완료
- [ ] 문서화 체크 완료
- [ ] 데이터베이스 백업 완료
- [ ] 테스트 실행 완료
- [ ] 수동 테스트 완료
- [ ] 코드 리뷰 완료
- [ ] Git 커밋 & 푸시 완료
- [ ] 롤백 계획 수립 완료
- [ ] 긴급 연락망 확인 완료

**모든 항목이 체크되었다면 배포를 진행하세요!** 🚀

---

**작성자:** AI Assistant  
**최종 업데이트:** 2025-11-30 20:30  
**상태:** 배포 대기

