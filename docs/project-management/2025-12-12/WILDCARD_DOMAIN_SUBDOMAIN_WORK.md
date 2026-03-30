# 와일드카드 도메인 서브도메인 작업 계획

**작업일**: 2025-12-12  
**이전 작업**: 2025-12-11 - 서브도메인 필드 추가 완료

---

## 📋 작업 현황

### ✅ 완료된 작업 (2025-12-11)
1. Tenant 테이블에 subdomain 필드 추가 (마이그레이션 V65)
2. OnboardingRequest 테이블에 subdomain 필드 추가 (마이그레이션 V66)
3. Tenant 엔티티에 subdomain 필드 추가
4. OnboardingRequest 엔티티에 subdomain 필드 추가
5. OnboardingCreateRequest DTO에 subdomain 필드 추가
6. 온보딩 요청 생성 시 subdomain 저장 로직 추가
7. 테넌트 생성 후 subdomain 업데이트 로직 추가
8. OnboardingController에서 subdomain을 checklistJson에 포함하도록 수정

### ✅ 완료된 작업 (2025-12-12)
1. 서브도메인 중복 체크 API 추가
2. 프론트엔드 온보딩 폼에 서브도메인 입력 필드 추가
3. 실시간 중복 체크 및 도메인 미리보기 기능 추가

### 🔄 남은 작업 (선택사항)
1. 서브도메인 수정 기능 추가 (온보딩 요청 수정 API, 테넌트 서브도메인 수정 API)

---

## 🎯 오늘 작업 목표

### 1. 서브도메인 중복 체크 API
- **엔드포인트**: `GET /api/v1/onboarding/subdomain-check?subdomain={subdomain}`
- **기능**: 
  - 서브도메인 중복 여부 확인
  - 유효성 검증 (영문, 숫자, 하이픈만 허용, 최대 63자)
  - 사용 가능 여부 반환

### 2. 프론트엔드 온보딩 폼
- **위치**: `frontend-trinity/app/onboarding/`
- **작업**:
  - 서브도메인 입력 필드 추가
  - 실시간 중복 체크
  - 유효성 검증
  - 도메인 미리보기 (예: `{subdomain}.dev.core-solution.co.kr`)

### 3. 서브도메인 수정 기능 (선택사항)
- 온보딩 요청 수정 API (PENDING 상태일 때만)
- 테넌트 서브도메인 수정 API (Ops Portal)

---

## 📝 작업 체크리스트

- [x] 서브도메인 중복 체크 API 구현
- [x] 서브도메인 유효성 검증 로직 추가
- [x] 프론트엔드 서브도메인 입력 필드 추가
- [x] 프론트엔드 실시간 중복 체크 구현
- [x] 도메인 미리보기 기능 추가
- [ ] 테스트 및 검증
- [ ] 서브도메인 수정 기능 (선택사항)

---

## 🔗 관련 파일

### 백엔드
- `src/main/java/com/coresolution/core/controller/OnboardingController.java`
- `src/main/java/com/coresolution/core/service/OnboardingService.java`
- `src/main/java/com/coresolution/core/service/impl/OnboardingServiceImpl.java`
- `src/main/java/com/coresolution/core/repository/TenantRepository.java`

### 프론트엔드
- `frontend-trinity/app/onboarding/page.tsx`
- `frontend-trinity/hooks/useOnboarding.ts`
- `frontend-trinity/utils/api.ts`
- `frontend-trinity/components/onboarding/`

---

## 📌 참고사항

- 서브도메인은 소문자로 정규화하여 저장
- DNS 제약: 최대 63자, 영문/숫자/하이픈만 허용
- 중복 체크는 삭제되지 않은 테넌트만 확인
- 온보딩 요청의 subdomain은 승인 전에만 수정 가능

