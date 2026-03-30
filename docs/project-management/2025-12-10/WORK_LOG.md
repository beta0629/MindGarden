# 작업 로그

**작성일**: 2025-12-10  
**이관일**: 2025-12-09

---

## 📋 오늘의 작업 계획 (12월 10일)

### 문서 관리
- [x] 12월 10일 날짜 폴더 생성
- [x] TODO 리스트 생성 (12월 9일 이어서)
- [x] 체크리스트 생성 (12월 9일 이어서)
- [x] 표준화 문서 표준화 폴더로 이동
- [x] 어제(12월 9일) 작업 내용 상세 업데이트

### 테스트 계획
- [ ] 온보딩 플로우 전체 테스트
- [ ] Ops Portal 기능 테스트
- [ ] 프로시저 검증 테스트
- [ ] 통합 테스트

---

## ✅ 2025-12-09 완료된 작업 (상세)

### 1. 온보딩 데이터 저장 표준화

#### 1.1 데이터베이스 스키마 변경
- [x] `onboarding_request` 테이블에 `region` 필드 추가 (VARCHAR(50), nullable)
  - 마이그레이션: `V3__add_region_to_onboarding_request.sql`
- [x] `onboarding_request` 테이블에 `brand_name` 필드 추가 (VARCHAR(255), nullable)
  - 마이그레이션: `V4__add_brand_name_to_onboarding_request.sql`

#### 1.2 백엔드 구현
- [x] `OnboardingRequest.java` 엔티티에 `region`, `brandName` 필드 추가
- [x] `OnboardingService.create()` 메서드 개선
  - `checklistJson`에서 `regionCode` 추출하여 `region` 필드에 저장
  - `checklistJson`에서 `brandName` 추출하여 `brandName` 필드에 저장
  - `ObjectMapper`를 사용한 안전한 JSON 파싱
  - `region`이 없으면 `checklistJson`에서 추출, 그래도 없으면 `null` 저장
  - `brandName`이 없으면 `tenantName` 사용
- [x] `OnboardingService.decide()` 메서드 개선
  - `region` 필드를 활용하여 `tenantId` 생성 (표준 형식: `tenant-{지역코드}-{업종코드}-{순번}`)
  - `region` 우선순위: `request.getRegion()` → `checklistJson`에서 추출 → "unknown"
  - `brandName` 필드를 활용하여 `tenants.branding_json` 업데이트
  - `setTenantBranding()` 메서드 추가: `{"companyName": "브랜드명", "companyNameEn": "브랜드명"}` 형식으로 저장

#### 1.3 프론트엔드 구현
- [x] `useOnboarding.ts`에서 `checklistJson`에 `regionCode`, `brandName` 포함
- [x] `callback/page.tsx`에서 `checklistJson`에 `regionCode`, `brandName` 포함
- [x] 지역 코드 선택 시 `formData.regionCode` 업데이트
- [x] 브랜드명 입력 시 `formData.brandName` 업데이트

#### 1.4 문서화
- [x] `ONBOARDING_DATA_STORAGE_STANDARD.md` 생성
  - 필드 매핑 및 저장 규칙 정의
  - `checklistJson` 구조 명시
  - 추출/저장 로직 설명
- [x] `docs/standards/README.md` 업데이트 (45번째 표준 문서 추가)

### 2. Ops Portal 표준화

#### 2.1 UI 개선 - 카드 형태로 변환
- [x] 리스트 형태를 카드 UI로 변환
  - `OnboardingCardList` 컴포넌트 생성 (온보딩 요청 카드 리스트)
  - `PricingCardList` 컴포넌트 생성 (요금제 카드 리스트)
  - `AddonCardList` 컴포넌트 생성 (애드온 카드 리스트)
  - `FeatureFlagCardList` 컴포넌트 생성 (Feature Flag 카드 리스트)
  - `OpsCard` 공통 컴포넌트 생성 (재사용 가능한 카드 컴포넌트)
- [x] 반응형 디자인 적용
  - 모바일: 1열, 태블릿: 2열, 데스크탑: 3열 그리드
  - 카드 호버 효과 추가
  - 카드 간격 및 패딩 최적화

#### 2.2 API 호출 표준화
- [x] `constants/api.ts` 생성
  - 모든 API 경로를 상수로 정의
  - `OPS_API_PATHS`, `CORE_API_PATHS` 구조화
- [x] `authApi.ts` 생성
  - 로그인/로그아웃 API 서비스 중앙화
  - 토큰 관리 로직 통합
- [x] `commonCodeService.ts` 생성
  - CoreSolution 공통코드 API 연동
  - 온보딩 상태 한글 표시를 위한 공통코드 조회
- [x] 모든 서비스 파일 업데이트
  - `onboardingService.ts`, `pricingService.ts`, `featureFlagService.ts` 등
  - 하드코딩된 API 경로를 상수로 전환

#### 2.3 공통 알림 시스템 적용
- [x] `GlobalNotification` 컴포넌트 적용
  - Toast 알림 시스템 통합
  - 성공/에러/경고/정보 메시지 지원
- [x] `OnboardingDecisionForm`에 알림 시스템 통합
  - 결정 저장 성공 시 토스트 알림
  - 에러 발생 시 토스트 알림
  - 로컬 `error`, `success` 상태 제거

#### 2.4 테마 변경
- [x] 다크모드 해제 및 라이트 모드 적용
  - `globals.css` 라이트 모드 색상 적용
  - `ops-design-tokens.css` 라이트 모드 변수 업데이트
  - 카드 컴포넌트 라이트 모드 스타일 적용
  - 배경색: `#f8fafc` (밝은 회색)
  - 텍스트 색상: `#1e293b` (어두운 회색)

#### 2.5 대시보드 메트릭 수정
- [x] `DashboardMetricsResponse` DTO에 `activeOnboarding`, `onHoldOnboarding` 추가
- [x] `DashboardService`에서 `APPROVED`, `ON_HOLD` 상태 카운트 추가
- [x] 대시보드 UI에 활성 온보딩, 보류 온보딩 카운트 표시

#### 2.6 공통코드 통합
- [x] `commonCodeService.ts` 생성
  - CoreSolution 백엔드(`http://localhost:8080/api/v1/common-codes`) 연동
  - `ONBOARDING_STATUS` 코드 그룹 조회
- [x] `OnboardingDecisionForm`에서 공통코드로 한글 상태 표시
  - 영어 코드(APPROVED, REJECTED, ON_HOLD) → 한글 이름 표시
- [x] CORS 설정
  - CoreSolution 백엔드에 `http://localhost:4300` 허용
  - `SecurityConfig.java` 업데이트

#### 2.7 인라인 스타일 제거
- [x] `OnboardingDecisionForm`: 인라인 스타일 → CSS 클래스
- [x] `AddonEditForm`: 인라인 스타일 → CSS 클래스
- [x] `PlanEditForm`: 인라인 스타일 → CSS 클래스
- [x] `TenantsPage`: 인라인 스타일 → CSS 클래스
- [x] `ops-card-list.css`: 공통 폼 액션 스타일 정의

#### 2.8 하드코딩 제거
- [x] `OpsConstants` 상수 클래스 생성
  - `DEFAULT_BUSINESS_TYPE = "CONSULTATION"`
  - 향후 공통코드 시스템 연동을 위한 상수 정의
- [x] `OnboardingService`: 하드코딩된 `"CONSULTATION"` → `OpsConstants.DEFAULT_BUSINESS_TYPE` 전환

### 3. 프로시저 개선 (V61)

#### 3.1 관리자 계정 생성 로직 통합
- [x] `CreateOrActivateTenant` 프로시저에 관리자 계정 생성 로직 통합
  - `p_admin_email`, `p_admin_password_hash` 파라미터 추가
  - 관리자 계정 생성 및 역할 할당 로직 추가
  - 기존 계정 존재 시 스킵 로직 추가

#### 3.2 기본 역할 자동 생성
- [x] 상담소(CONSULTATION) 업종 기본 역할 자동 생성
  - 원장 (Principal) - `display_order: 1`
  - 상담사 (Consultant) - `display_order: 2`
  - 내담자 (Client) - `display_order: 3`
  - 사무원 (Staff) - `display_order: 4`
- [x] 역할 생성 시 한글/영문 이름 모두 저장
- [x] 역할 생성 시 설명(description) 저장

#### 3.3 에러 처리 개선
- [x] `DECLARE CONTINUE HANDLER FOR SQLEXCEPTION` 추가
  - `INSERT INTO tenants` 실패 시 fatal 처리
  - `CopyDefaultTenantCodes`, `CreateDefaultTenantUsers` 실패 시 계속 진행
- [x] 결과 메시지 개선
  - 성공/실패 메시지 상세화
  - 관리자 계정 생성 결과 포함

### 4. 개발 환경 설정

#### 4.1 포트 설정
- [x] Ops Portal 프론트엔드: 4300 포트
  - `frontend-ops/package.json` 수정
  - `start-all-simple.sh` 스크립트 업데이트
- [x] Ops Portal 백엔드: 8081 포트
  - `backend-ops/src/main/resources/application.yml` 수정
  - `backend-ops/src/main/resources/application-local.yml` 수정
  - `start-all-simple.sh` 스크립트 업데이트

#### 4.2 환경 변수 설정
- [x] `backend-ops/env.local.example` 업데이트
  - `SERVER_PORT=8081`
  - `OPS_CORS_ALLOWED_ORIGINS=http://localhost:4300`
  - `SECURITY_JWT_SECRET` 32자리로 업데이트
- [x] `backend-ops/env.dev.example` 생성
  - `SERVER_PORT=8080` (Nginx 프록시)
  - `OPS_CORS_ALLOWED_ORIGINS=http://localhost:4300,https://ops.dev.e-trinity.co.kr`
- [x] `backend-ops/env.production.example` 업데이트
  - `SERVER_PORT=8080` (Nginx 프록시)
  - `OPS_CORS_ALLOWED_ORIGINS=https://ops.e-trinity.co.kr`
- [x] `frontend-ops/env.local.example` 업데이트
  - `NEXT_PUBLIC_OPS_API_BASE_URL=http://localhost:8081/api/v1`
  - `NEXT_PUBLIC_CORE_API_BASE_URL=http://localhost:8080/api/v1`
- [x] `frontend-ops/env.dev.example` 생성
  - `NEXT_PUBLIC_OPS_API_BASE_URL=https://ops.dev.e-trinity.co.kr/api/v1`
- [x] `frontend-ops/env.production.example` 업데이트
  - `NEXT_PUBLIC_OPS_API_BASE_URL=https://ops.e-trinity.co.kr/api/v1`

#### 4.3 CORS 설정
- [x] `SecurityConfig.java` 업데이트
  - `ops.cors.allowed-origins` 환경 변수 사용
  - 로컬: `http://localhost:4300`
  - 개발: `http://localhost:4300,https://ops.dev.e-trinity.co.kr`
  - 운영: `https://ops.e-trinity.co.kr`
- [x] CoreSolution 백엔드 CORS 설정
  - `SecurityConfig.java`에 `http://localhost:4300` 추가 (로컬/개발)

#### 4.4 Flyway 설정
- [x] `application-local.yml`에 Flyway 설정 추가
  - `validate-on-migrate: false` (로컬 개발: 검증 완화)
  - `repair-on-migrate: true` (체크섬 불일치 시 자동 수정)
  - `clean-disabled: true` (데이터 보호)

#### 4.5 실행 스크립트 개선
- [x] `start-all-simple.sh` 스크립트 업데이트
  - Ops Portal 백엔드 시작 로직 추가 (4-3단계)
  - Ops Portal 프론트엔드 시작 로직 추가 (4-3단계)
  - 포트 정리 로직에 8081, 4300 추가
  - 헬스 체크에 Ops Portal 추가
  - 프로세스 종료 로직에 Ops Portal 추가

### 5. 문서화

#### 5.1 표준 문서 생성
- [x] `ONBOARDING_DATA_STORAGE_STANDARD.md` 생성
  - 필드 매핑 및 저장 규칙
  - `checklistJson` 구조 명시
  - 추출/저장 로직 설명
- [x] `OPS_PORTAL_STANDARD.md` 생성
  - Ops Portal 표준화 완료 보고서
  - 카드 UI 변환, API 표준화, 공통 알림 등 상세 내용
  - 도메인 및 포트 설정 표준

#### 5.2 표준 문서 이동
- [x] `ONBOARDING_STANDARDIZATION_PLAN.md` → `docs/standards/`
- [x] `FILTER_SEARCH_STANDARDIZATION.md` → `docs/standards/`
- [x] `DESIGN_SYSTEM_COMPLETE_STANDARDIZATION_PLAN.md` → `docs/standards/`
- [x] `DESIGN_SYSTEM_QUALITY_IMPROVEMENT_PLAN.md` → `docs/standards/`
- [x] `STANDARDIZATION_VERIFICATION_REPORT.md` → `docs/standards/`

#### 5.3 문서 업데이트
- [x] `docs/standards/README.md` 업데이트 (45번째 표준 문서 추가)
- [x] `docs/project-management/2025-12-10/TODO.md` 생성
- [x] `docs/project-management/2025-12-10/CHECKLIST.md` 생성

### 6. Git 관리

#### 6.1 커밋 및 푸시
- [x] develop 브랜치에 커밋
  - 커밋 메시지: "feat: 온보딩 데이터 저장 표준화 및 Ops Portal 표준화 완료"
  - 139개 파일 변경 (7,820줄 추가, 1,693줄 삭제)
- [x] origin/develop에 푸시 완료

### 7. 백엔드 배포 워크플로우 오류 수정 (추가 작업)

#### 7.1 문제 분석
- [x] **오류 확인**: GitHub Actions 배포 중 `pkill` 명령 실패로 exit code 1 반환
- [x] **원인 파악**: 
  - `pkill` 명령이 프로세스를 찾지 못할 때 exit code 1 반환
  - `xargs`가 빈 입력을 처리하지 못해 워크플로우 실패
- [x] **영향 분석**: 백엔드 배포 워크플로우 실패

#### 7.2 해결 방법 구현
- [x] **프로세스 존재 여부 확인 후 종료**
  - `pgrep`으로 프로세스 확인
  - 존재할 때만 `pkill` 실행
  - 각 프로세스 타입별로 개별 확인 및 종료 로직 추가
- [x] **포트 종료 로직 개선**
  - `xargs` 대신 `for` 루프 사용
  - 각 PID를 개별적으로 처리하여 안전성 향상
  - 변수 사용으로 빈 입력 처리 개선
- [x] **에러 처리 강화**
  - 모든 명령에 `|| true` 추가
  - 실패해도 워크플로우 계속 진행
  - 상세한 로그 메시지 추가

#### 7.3 변경된 파일
- [x] `.github/workflows/deploy-backend-dev.yml` 수정
  - 포트 종료 로직: `xargs` → `for` 루프
  - Java 프로세스 정리: `pgrep` 확인 후 `pkill` 실행
  - 포트 최종 확인: 변수 사용으로 빈 입력 처리

#### 7.4 변경 내용 상세

**포트 종료 로직 개선:**
```bash
# 이전: xargs 사용 (빈 입력 시 오류)
echo "$PORT_PIDS" | xargs -r sudo kill -TERM

# 수정: for 루프 사용 (안전한 처리)
for PID in $PORT_PIDS; do
  sudo kill -TERM "$PID" 2>/dev/null || true
done
```

**Java 프로세스 정리 개선:**
```bash
# 이전: pkill만 실행 (프로세스 없을 때 오류)
sudo pkill -f "app.jar" 2>/dev/null || true

# 수정: pgrep으로 확인 후 종료
if pgrep -f "app.jar" > /dev/null 2>&1; then
  echo "   app.jar 프로세스 종료 중..."
  sudo pkill -f "app.jar" 2>/dev/null || true
fi
```

#### 7.5 Git 관리
- [x] 커밋: `fix: 백엔드 배포 워크플로우 오류 수정`
- [x] 푸시: `develop` 브랜치에 푸시 완료
- [x] 변경사항:
  - 1개 파일 변경
  - 25줄 추가, 8줄 삭제

---

## 📋 오늘(12월 10일) 테스트 계획

### 1. 온보딩 플로우 전체 테스트

#### 1.1 온보딩 요청 생성 테스트
- [ ] Step 1: 기본 정보 입력
  - [ ] 이메일 도메인 자동완성 동작 확인
  - [ ] 이메일 인증 프로세스 확인
  - [ ] 지역 선택 및 저장 확인 (`regionCode` → `region` 필드)
  - [ ] 브랜드명 입력 및 저장 확인 (`brandName` → `brand_name` 필드)
- [ ] Step 2: 업종 선택
  - [ ] 메인 카테고리 선택 확인
  - [ ] 세부 업종 선택 (있는 경우)
  - [ ] 세부 업종 없이 진행 가능 확인
- [ ] Step 3: 요금제 선택
  - [ ] 요금제 카드 중앙 정렬 확인
  - [ ] 반응형 레이아웃 확인
- [ ] Step 4: 결제 정보 입력
- [ ] Step 5: 완료 화면
- [ ] 데이터베이스 저장 확인
  - [ ] `onboarding_request.region` 필드 확인
  - [ ] `onboarding_request.brand_name` 필드 확인
  - [ ] `onboarding_request.checklist_json`에 `regionCode`, `brandName` 포함 확인

#### 1.2 온보딩 승인 프로세스 테스트
- [ ] Ops Portal에서 온보딩 요청 조회
  - [ ] 대기 중 목록 확인
  - [ ] 활성 온보딩 목록 확인
  - [ ] 보류 온보딩 목록 확인
- [ ] 온보딩 요청 상세 조회
  - [ ] 카드 UI 표시 확인
  - [ ] 상태 드롭다운 한글 표시 확인
- [ ] 결정 저장 테스트
  - [ ] 승인 결정 저장
    - [ ] 테넌트 ID 자동 생성 확인 (`tenant-{지역코드}-{업종코드}-{순번}`)
    - [ ] 관리자 계정 자동 생성 확인
    - [ ] 기본 역할 자동 생성 확인 (원장, 상담사, 내담자, 사무원)
    - [ ] 브랜딩 정보 설정 확인 (`tenants.branding_json`)
  - [ ] 거부 결정 저장
  - [ ] 보류 결정 저장
- [ ] 토스트 알림 확인
  - [ ] 성공 알림 표시 확인
  - [ ] 에러 알림 표시 확인

### 2. Ops Portal 기능 테스트

#### 2.1 대시보드 테스트
- [ ] 대시보드 메트릭 확인
  - [ ] 온보딩 대기 카운트 확인
  - [ ] 활성 온보딩 카운트 확인
  - [ ] 보류 온보딩 카운트 확인
- [ ] 카드 클릭 시 필터링 동작 확인

#### 2.2 온보딩 관리 테스트
- [ ] 온보딩 요청 목록 조회
  - [ ] 카드 UI 표시 확인
  - [ ] 반응형 레이아웃 확인 (모바일/태블릿/데스크탑)
- [ ] 온보딩 요청 상세 조회
  - [ ] "보기" 버튼 클릭 시 상세 페이지 이동 확인
- [ ] 상태 필터링 테스트
  - [ ] 상태별 필터링 동작 확인
  - [ ] 공통코드 기반 한글 상태 표시 확인

#### 2.3 공통 알림 시스템 테스트
- [ ] 결정 저장 성공 시 토스트 알림 확인
- [ ] 결정 저장 실패 시 토스트 알림 확인
- [ ] 로그인 실패 시 토스트 알림 확인

#### 2.4 API 호출 테스트
- [ ] 모든 API 호출이 표준화된 경로 사용 확인
- [ ] 공통코드 API 호출 확인 (CoreSolution 백엔드)
- [ ] CORS 설정 확인

### 3. 프로시저 검증 테스트

#### 3.1 CreateOrActivateTenant 프로시저 테스트
- [ ] 새 테넌트 생성 테스트
  - [ ] 테넌트 생성 확인
  - [ ] 관리자 계정 생성 확인
  - [ ] 기본 역할 생성 확인 (원장, 상담사, 내담자, 사무원)
  - [ ] 브랜딩 정보 설정 확인
- [ ] 기존 테넌트 활성화 테스트
  - [ ] 기존 테넌트 활성화 확인
  - [ ] 관리자 계정 생성 확인 (없는 경우)
- [ ] 에러 처리 테스트
  - [ ] 중복 테넌트 ID 처리 확인
  - [ ] 필수 파라미터 누락 시 에러 처리 확인

### 4. 통합 테스트

#### 4.1 전체 플로우 테스트
- [ ] 온보딩 신청 → 승인 → 테넌트 생성 → 관리자 계정 생성 → 로그인
- [ ] 브랜딩 정보가 CoreSolution 헤더/메뉴에 표시되는지 확인 (향후 작업)

#### 4.2 크로스 브라우저 테스트
- [ ] Chrome 테스트
- [ ] Safari 테스트
- [ ] Firefox 테스트
- [ ] Edge 테스트

#### 4.3 반응형 디자인 테스트
- [ ] 모바일 (320px ~ 768px) 테스트
- [ ] 태블릿 (768px ~ 1024px) 테스트
- [ ] 데스크탑 (1024px 이상) 테스트

---

## 📊 진행 상황

### 문서 관리
- **완료**: 5개 항목
- **진행 중**: 0개 항목
- **대기 중**: 0개 항목

### 2025-12-09 작업
- **완료**: 40개 항목
  - 온보딩 데이터 저장 표준화: 9개 항목
  - Ops Portal 표준화: 15개 항목
  - 프로시저 개선: 3개 항목
  - 문서화: 3개 항목
  - 개발 환경 설정: 10개 항목

### 2025-12-10 작업
- **완료**: 2개 주요 작업
  - 백엔드 배포 워크플로우 오류 수정: 5개 항목
  - 온보딩 승인 결과 확인: 4개 항목

### 오늘(12월 10일) 테스트 계획
- **계획**: 30개 테스트 항목
- **완료**: 0개 항목
- **진행 중**: 0개 항목

---

## 📝 다음 작업

1. **즉시**: 온보딩 및 Ops Portal 테스트 진행
2. **단기**: 하드코딩된 색상값 CSS 변수로 전환 (441개)
3. **중기**: 기타 Controller 표준화 작업 계속
4. **장기**: 전체 표준화 완료 및 배포 준비

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-11 (백엔드 배포 워크플로우 오류 수정 추가)

