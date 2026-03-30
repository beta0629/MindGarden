# TODO 리스트

**작성일**: 2025-12-10  
**상태**: 진행 중  
**이관일**: 2025-12-09

---

## 🎯 우선순위 높음

### 1. 온보딩 및 Ops Portal 테스트
- [ ] 온보딩 플로우 전체 테스트
  - [ ] 온보딩 요청 생성 테스트 (region, brandName 포함)
  - [ ] 온보딩 승인 프로세스 테스트
  - [ ] 테넌트 ID 자동 생성 확인 (tenant-{지역코드}-{업종코드}-{순번})
  - [ ] 관리자 계정 자동 생성 확인
  - [ ] 기본 역할 자동 생성 확인 (원장, 상담사, 내담자, 사무원)
  - [ ] 브랜딩 정보 설정 확인 (tenants.branding_json)
- [ ] Ops Portal 기능 테스트
  - [ ] 온보딩 요청 목록 조회 테스트
  - [ ] 온보딩 결정 저장 테스트 (승인/거부/보류)
  - [ ] 대시보드 메트릭 확인 (활성 온보딩, 보류 온보딩)
  - [ ] 공통 알림 시스템 테스트
  - [ ] 카드 UI 반응형 테스트

### 2. 표준화 작업 계속 진행
- [ ] 기타 Controller에서 tenantId 조회 표준화 확인
  - [ ] `UserController` 확인
  - [ ] `CommonCodeController` 확인
  - [ ] `SystemNotificationController` 확인
  - [ ] 기타 컨트롤러들 확인
- [ ] Service 레이어에서 tenantId 사용 패턴 확인 및 표준화
- [ ] 프론트엔드에서 tenantId 관련 코드 표준화 확인

### 3. 화면 테스트
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

### 4. 코드 품질 개선
- [ ] OnboardingService.java lombok 의존성 오류 확인 및 수정
- [ ] 사용하지 않는 import 정리 (추가 확인)
- [ ] Deprecated 메서드 완전 제거 (추가 확인)
- [ ] CSS 변수 적용 완료 확인
- [ ] 하드코딩된 색상값 CSS 변수로 전환 (441개 발견)

### 5. 데이터베이스 검증
- [ ] 온보딩 요청 테이블 스키마 확인 (region, brand_name 필드)
- [ ] 테넌트 테이블 branding_json 필드 확인
- [ ] 기본 역할 생성 프로시저 검증
- [ ] 마이그레이션 파일 검증 (V3, V4, V61)

---

## 📝 문서화

### 6. 문서 업데이트
- [x] 표준화 문서 표준화 폴더로 이동 (2025-12-10)
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 작성
- [ ] 개발자 가이드 업데이트
- [ ] 배포 가이드 작성
- [ ] 온보딩 프로세스 문서화

---

## 🧪 테스트

### 7. 표준화 검증 테스트
- [ ] tenantId 표준화 후 기능 테스트
  - [ ] 상담사 관리 페이지 접근 테스트
  - [ ] 내담자 관리 페이지 접근 테스트
  - [ ] 상담사/내담자 등록 기능 테스트
  - [ ] tenantId 누락 시 에러 메시지 확인
- [ ] 통합 테스트
  - [ ] 전체 프로세스 통합 테스트
  - [ ] 크로스 브라우저 테스트
  - [ ] 반응형 디자인 테스트

### 8. 엣지 케이스 테스트
- [ ] 동시성 테스트
- [ ] 대용량 데이터 테스트
- [ ] 오류 처리 테스트
- [ ] 성능 테스트
- [ ] 온보딩 동시 승인 테스트

---

## 🚀 배포 준비

### 9. 프로덕션 배포 준비
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 검증
- [ ] 보안 설정 검증
- [ ] 모니터링 설정
- [ ] Ops Portal 운영 환경 설정 확인

---

## ✅ 2025-12-09 완료된 작업

### 온보딩 데이터 저장 표준화
- [x] `onboarding_request` 테이블에 `region`, `brand_name` 필드 추가 (V3, V4 마이그레이션)
- [x] `OnboardingService.create()`에서 `checklistJson`에서 `regionCode`, `brandName` 추출하여 필드에 저장
- [x] `OnboardingService.decide()`에서 `region` 필드 활용하여 `tenantId` 생성 (표준 형식: `tenant-{지역코드}-{업종코드}-{순번}`)
- [x] `OnboardingService.decide()`에서 `brandName` 필드 활용하여 `tenants.branding_json` 업데이트
- [x] 프론트엔드에서 `checklistJson`에 `regionCode`, `brandName` 포함하여 전송

### Ops Portal 표준화
- [x] 리스트 형태를 카드 UI로 변환 (Onboarding, Pricing, Feature Flags, Tenants)
- [x] API 호출 표준화 (`constants/api.ts`, `authApi.ts`, `commonCodeService.ts`)
- [x] 공통 알림 시스템 적용 (`GlobalNotification`)
- [x] 다크모드 해제 및 라이트 모드 적용
- [x] 대시보드 메트릭 수정 (`activeOnboarding`, `onHoldOnboarding` 추가)
- [x] 공통코드 통합 (온보딩 상태 한글 표시)

### 프로시저 개선 (V61)
- [x] `CreateOrActivateTenant` 프로시저에 관리자 계정 생성 로직 통합
- [x] 상담소(CONSULTATION) 업종 기본 역할 자동 생성 (원장, 상담사, 내담자, 사무원 4개)

### 문서화
- [x] `ONBOARDING_DATA_STORAGE_STANDARD.md` 추가
- [x] `OPS_PORTAL_STANDARD.md` 추가
- [x] `docs/standards/README.md` 업데이트

### 개발 환경 설정
- [x] Ops Portal 포트 설정 (프론트엔드: 4300, 백엔드: 8081)
- [x] 환경 변수 설정 (`env.local.example`, `env.dev.example`, `env.production.example`)
- [x] CORS 설정 (로컬, 개발, 운영)
- [x] Flyway 설정 (로컬 환경 검증 완화)

---

## 📊 진행률

### 온보딩 및 Ops Portal 표준화
- **완료**: 20개 항목
  - 온보딩 데이터 저장 표준화: 5개 항목
  - Ops Portal 표준화: 6개 항목
  - 프로시저 개선: 2개 항목
  - 문서화: 3개 항목
  - 개발 환경 설정: 4개 항목
- **진행 중**: 0개 항목
- **대기 중**: 30개 항목
- **전체 진행률**: 약 40%

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10  
**이관 출처**: 2025-12-09 TODO.md  
**2025-12-10 업데이트**: 온보딩 및 Ops Portal 표준화 완료 반영

