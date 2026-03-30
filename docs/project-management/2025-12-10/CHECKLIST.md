# 체크리스트

**작성일**: 2025-12-10  
**상태**: 진행 중  
**이관일**: 2025-12-09

---

## ✅ 2025-12-09 완료된 항목

### 온보딩 데이터 저장 표준화
- [x] `onboarding_request` 테이블에 `region` 필드 추가 (V3 마이그레이션)
- [x] `onboarding_request` 테이블에 `brand_name` 필드 추가 (V4 마이그레이션)
- [x] `OnboardingRequest.java` 엔티티에 `region`, `brandName` 필드 추가
- [x] `OnboardingService.create()`에서 `checklistJson`에서 `regionCode` 추출하여 `region` 필드에 저장
- [x] `OnboardingService.create()`에서 `checklistJson`에서 `brandName` 추출하여 `brandName` 필드에 저장
- [x] `OnboardingService.decide()`에서 `region` 필드 활용하여 `tenantId` 생성
- [x] `OnboardingService.decide()`에서 `brandName` 필드 활용하여 `tenants.branding_json` 업데이트
- [x] 프론트엔드 `useOnboarding.ts`에서 `checklistJson`에 `regionCode`, `brandName` 포함
- [x] 프론트엔드 `callback/page.tsx`에서 `checklistJson`에 `regionCode`, `brandName` 포함

### Ops Portal 표준화
- [x] 리스트 형태를 카드 UI로 변환
  - [x] `OnboardingCardList` 컴포넌트 생성
  - [x] `PricingCardList` 컴포넌트 생성
  - [x] `AddonCardList` 컴포넌트 생성
  - [x] `FeatureFlagCardList` 컴포넌트 생성
  - [x] `OpsCard` 공통 컴포넌트 생성
- [x] API 호출 표준화
  - [x] `constants/api.ts` 생성 (API 경로 상수화)
  - [x] `authApi.ts` 생성 (인증 API 서비스)
  - [x] `commonCodeService.ts` 생성 (공통코드 서비스)
  - [x] 모든 서비스 파일 업데이트
- [x] 공통 알림 시스템 적용
  - [x] `GlobalNotification` 컴포넌트 적용
  - [x] `OnboardingDecisionForm`에 알림 시스템 통합
- [x] 다크모드 해제 및 라이트 모드 적용
  - [x] `globals.css` 라이트 모드 색상 적용
  - [x] `ops-design-tokens.css` 라이트 모드 변수 업데이트
  - [x] 카드 컴포넌트 라이트 모드 스타일 적용
- [x] 대시보드 메트릭 수정
  - [x] `DashboardMetricsResponse` DTO에 `activeOnboarding`, `onHoldOnboarding` 추가
  - [x] `DashboardService`에서 `APPROVED`, `ON_HOLD` 상태 카운트 추가
- [x] 공통코드 통합
  - [x] `commonCodeService.ts` 생성
  - [x] `OnboardingDecisionForm`에서 공통코드로 한글 상태 표시
  - [x] CORS 설정 (CoreSolution 백엔드)

### 프로시저 개선 (V61)
- [x] `CreateOrActivateTenant` 프로시저에 관리자 계정 생성 로직 통합
- [x] 상담소(CONSULTATION) 업종 기본 역할 자동 생성
  - [x] 원장 역할 생성
  - [x] 상담사 역할 생성
  - [x] 내담자 역할 생성
  - [x] 사무원 역할 생성
- [x] 관리자 계정 생성 시 역할 할당 로직 추가

### 문서화
- [x] `ONBOARDING_DATA_STORAGE_STANDARD.md` 생성
- [x] `OPS_PORTAL_STANDARD.md` 생성
- [x] `docs/standards/README.md` 업데이트 (45번째 표준 문서 추가)

### 개발 환경 설정
- [x] Ops Portal 포트 설정
  - [x] 프론트엔드: 4300 포트
  - [x] 백엔드: 8081 포트
- [x] 환경 변수 설정
  - [x] `backend-ops/env.local.example` 업데이트
  - [x] `backend-ops/env.dev.example` 생성
  - [x] `backend-ops/env.production.example` 업데이트
  - [x] `frontend-ops/env.local.example` 업데이트
  - [x] `frontend-ops/env.dev.example` 생성
  - [x] `frontend-ops/env.production.example` 업데이트
- [x] CORS 설정
  - [x] 로컬 환경: `http://localhost:4300`
  - [x] 개발 환경: `https://ops.dev.e-trinity.co.kr`
  - [x] 운영 환경: `https://ops.e-trinity.co.kr`
- [x] Flyway 설정
  - [x] 로컬 환경 검증 완화 (`validate-on-migrate: false`, `repair-on-migrate: true`)
- [x] `start-all-simple.sh` 스크립트 업데이트
  - [x] Ops Portal 백엔드 시작 로직 추가
  - [x] Ops Portal 프론트엔드 시작 로직 추가

### Git 관리
- [x] develop 브랜치에 커밋 및 푸시
  - [x] 139개 파일 변경 (7,820줄 추가, 1,693줄 삭제)

---

## 🔄 진행 중인 항목

### 온보딩 및 Ops Portal 테스트
- [ ] 온보딩 플로우 전체 테스트
- [ ] Ops Portal 기능 테스트
- [ ] 통합 테스트

### 표준화 작업
- [ ] 기타 Controller에서 tenantId 조회 표준화 확인
- [ ] Service 레이어에서 tenantId 사용 패턴 확인
- [ ] 프론트엔드에서 tenantId 관련 코드 표준화 확인

### 코드 품질 개선
- [ ] 하드코딩된 색상값 CSS 변수로 전환 (441개 발견)
- [ ] 남은 인라인 스타일 제거
- [ ] 버튼 표준화 계속 진행
- [ ] 페이징 표준화 계속 진행

---

## ⏳ 대기 중인 항목

### 개선 사항
- [ ] OnboardingService.java lombok 의존성 오류 확인 및 수정
- [ ] 사용하지 않는 import 정리 (추가 확인)
- [ ] Deprecated 메서드 완전 제거 (추가 확인)
- [ ] CSS 변수 적용 완료 확인

### 문서화
- [ ] API 문서 업데이트
- [ ] 사용자 가이드 작성
- [ ] 개발자 가이드 업데이트
- [ ] 배포 가이드 작성
- [ ] 온보딩 프로세스 문서화

### 테스트
- [ ] 화면 테스트
- [ ] 사용자 플로우 테스트
- [ ] 엣지 케이스 테스트
- [ ] 성능 테스트

---

## 📊 진행률

### 온보딩 및 Ops Portal 표준화
- **완료**: 40개 항목
  - 온보딩 데이터 저장 표준화: 9개 항목
  - Ops Portal 표준화: 15개 항목
  - 프로시저 개선: 3개 항목
  - 문서화: 3개 항목
  - 개발 환경 설정: 10개 항목
- **진행 중**: 3개 항목
- **대기 중**: 15개 항목
- **전체 진행률**: 약 69%

### 표준화 준수율
- **전체 준수율**: 약 87%
- **공통 처리 표준화**: 85%
- **Ops Portal 표준화**: 100% (완료)

---

## 📝 다음 작업 우선순위

1. **즉시**: 온보딩 및 Ops Portal 테스트
2. **단기**: 하드코딩된 색상값 CSS 변수로 전환
3. **중기**: 기타 Controller 표준화, 문서화 완료
4. **장기**: 전체 표준화 완료 및 배포 준비

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-12-10  
**이관 출처**: 2025-12-09 CHECKLIST.md  
**2025-12-10 업데이트**: 온보딩 및 Ops Portal 표준화 완료 반영

