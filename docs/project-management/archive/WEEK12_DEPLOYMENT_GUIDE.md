# Week 12: 배포 가이드

## 배포 전 체크리스트

### 1. 테스트 완료 확인
- ✅ 전체 시스템 통합 테스트: 4개 통과
- ✅ 사용자 시나리오 테스트: 4개 통과
- ✅ 보안 테스트: 6개 통과
- ✅ 성능 테스트: 3개 통과
- **총 17개 테스트 모두 통과**

### 2. 코드 품질 확인
- ✅ Linter 경고 수정 완료
- ✅ Null pointer access 경고 수정
- ✅ Raw type 경고 수정

### 3. 데이터베이스 마이그레이션
- ✅ Flyway 마이그레이션 파일 확인
- ✅ 데이터베이스 스키마 최신 상태 확인

### 4. 환경 변수 설정
- ✅ `application-prod.yml` 설정 확인
- ✅ 암호화 키 설정 확인
- ✅ PG 설정 관련 환경 변수 확인

## 배포 절차

### 1. 코드 커밋 및 푸시
```bash
# 변경사항 확인
git status

# 변경사항 커밋
git add .
git commit -m "Week 12: 결제 시스템 통합 및 최종 테스트 완료"

# 원격 저장소에 푸시
git push origin main
```

### 2. GitHub Actions 자동 배포
- GitHub Actions가 자동으로 트리거됨
- 백엔드: Maven 빌드 → JAR 파일 생성 → 서버 업로드 → systemd 서비스 재시작
- 프론트엔드: React 빌드 → 정적 파일 서버 업로드

### 3. 배포 후 검증
```bash
# 서비스 상태 확인
sudo systemctl status mindgarden.service

# 로그 확인
sudo journalctl -u mindgarden.service -f

# 헬스 체크
curl http://beta74.cafe24.com/api/health
```

## 주요 변경사항

### Week 11: 결제 시스템 통합
1. **PaymentGatewayService 인터페이스 수정**
   - 모든 메서드에 `TenantPgConfigurationDetailResponse` 파라미터 추가
   - 테넌트별 PG 설정 동적 사용 지원

2. **TossPaymentServiceImpl 수정**
   - 테넌트별 PG 설정 사용
   - `TenantPgConfigurationDecryptionService` 주입
   - 키 복호화 로직 구현
   - Base URL 동적 조회

3. **PaymentService 수정**
   - 테넌트 컨텍스트에서 tenantId 추출
   - `TenantPgConfigurationService`로 활성화된 PG 설정 조회
   - `PaymentGatewayService` 동적 조회 및 사용

### Week 12: 최종 테스트 및 배포
1. **전체 시스템 통합 테스트**
   - PG 설정 → ERD 생성 → 결제 생성 플로우
   - 온보딩 승인 → ERD 자동 생성 → PG 설정 → 결제 플로우
   - 여러 테넌트 동시 처리
   - ERD 생성 및 조회

2. **사용자 시나리오 테스트**
   - 신규 테넌트 온보딩 플로우
   - 기존 테넌트 사용 플로우
   - PG 설정 변경 및 승인 플로우
   - ERD 조회 및 결제 플로우

3. **보안 테스트**
   - 테넌트 간 데이터 격리
   - 크로스 테넌트 접근 거부
   - 암호화된 키 복호화 권한 확인
   - 암호화된 데이터 저장 확인

4. **성능 테스트**
   - 단일 결제 생성: 2초 이내
   - 연속 10개 결제 생성: 평균 85.70ms
   - PG 설정 조회 포함 결제 생성: 108ms

5. **버그 수정 및 개선**
   - Null pointer access 경고 수정
   - Raw type 경고 수정
   - 코드 최적화

## 배포 후 모니터링

### 1. 로그 모니터링
- 결제 생성 로그 확인
- PG 설정 조회 로그 확인
- 에러 로그 확인

### 2. 성능 모니터링
- 결제 생성 응답 시간 모니터링
- PG 설정 조회 응답 시간 모니터링
- 데이터베이스 쿼리 성능 모니터링

### 3. 기능 검증
- 테넌트별 PG 설정 조회 기능 확인
- 결제 생성 기능 확인
- ERD 생성 및 조회 기능 확인

## 롤백 계획

### 롤백 조건
- 배포 후 심각한 오류 발생
- 성능 저하 발생
- 데이터 무결성 문제 발생

### 롤백 절차
1. 이전 버전으로 Git 롤백
2. GitHub Actions를 통한 자동 배포
3. 서비스 재시작
4. 기능 검증

## 알려진 제한사항

1. **다른 PG 구현체**
   - 현재 TossPaymentServiceImpl만 완전히 구현됨
   - Iamport, Kakao, Naver, Paypal, Stripe 구현체는 필요 시 동일한 방식으로 수정 필요

2. **동시성 테스트**
   - 동시 요청 테스트는 트랜잭션 및 테넌트 컨텍스트 관리의 복잡성으로 인해 제외
   - 실제 운영 환경에서는 각 요청이 별도의 HTTP 요청으로 처리되므로 별도 테스트 권장

## 다음 단계

### Week 13: 코드 품질 모니터링 및 동적 시스템 감시
- 코드 품질 모니터링 대시보드 구축
- 하드코딩 감지 시스템 구축
- 동적 시스템 감시 구축

## 문의사항

배포 관련 문의사항이 있으면 개발팀에 연락하세요.

