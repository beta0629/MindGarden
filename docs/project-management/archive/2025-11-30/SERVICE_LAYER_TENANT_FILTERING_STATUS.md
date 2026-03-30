# Service Layer tenantId 필터링 현황 보고서

**작성일**: 2025-11-30  
**작성자**: AI Assistant  
**상태**: 🚧 진행 중 (3/60 완료, 5%)

---

## 📊 전체 현황

### 통계
- **전체 Service**: 90개
- **tenantId 사용 중**: 32개 (36%)
- **tenantId 미사용**: 58개 (64%) ⚠️

### 완료된 Service (3개)
1. ✅ **AccountServiceImpl** - 계좌 관리
2. ✅ **UserAddressServiceImpl** - 사용자 주소
3. ✅ **ConsultationRecordServiceImpl** - 상담 기록 (Phase 1에서 완료)

---

## 🚨 긴급 수정 필요 (보안 Critical - 13개)

### 인증/계정 관련 (7개)
1. **AbstractOAuth2Service** ⚠️ 최우선
   - 영향: AppleOAuth2ServiceImpl, GoogleOAuth2ServiceImpl, KakaoOAuth2ServiceImpl, NaverOAuth2ServiceImpl
   - 문제: `userRepository.findByEmail()`, `userSocialAccountRepository.findByProviderAndProviderUserIdAndIsDeletedFalse()` 등
   - 위험도: ⭐⭐⭐⭐⭐ (극도로 위험 - 다른 테넌트 계정 접근 가능)

2. **AccountIntegrationServiceImpl** ⚠️
   - 문제: `userRepository.findByEmail()`, `userSocialAccountRepository.findByUserAndIsDeletedFalse()`
   - 위험도: ⭐⭐⭐⭐⭐

3. **SocialAuthServiceImpl** ⚠️
   - 문제: 소셜 인증 관련 tenantId 미필터링
   - 위험도: ⭐⭐⭐⭐⭐

4. **AuthServiceImpl** ⚠️
   - 문제: 인증 로직에 tenantId 미적용
   - 위험도: ⭐⭐⭐⭐⭐

5. **PasswordResetServiceImpl** ⚠️
   - 문제: `passwordResetTokenRepository` 호출 시 tenantId 미전달
   - 위험도: ⭐⭐⭐⭐

6. **PasskeyServiceImpl** ⚠️
   - 문제: `userPasskeyRepository` 호출 시 tenantId 미전달
   - 위험도: ⭐⭐⭐⭐

7. **MultiTenantUserServiceImpl** ⚠️
   - 문제: 이름과 달리 tenantId 필터링 미적용
   - 위험도: ⭐⭐⭐⭐⭐

### 세션/활동 관련 (3개)
8. **SessionExtensionServiceImpl** ⚠️
   - 문제: `sessionExtensionRequestRepository` 호출 시 tenantId 미전달
   - 위험도: ⭐⭐⭐⭐

9. **ActivityServiceImpl** ⚠️
   - 문제: `userActivityRepository` 호출 시 tenantId 미전달
   - 위험도: ⭐⭐⭐

10. **NotificationServiceImpl** ⚠️
    - 문제: 알림 발송 시 tenantId 미필터링
    - 위험도: ⭐⭐⭐⭐

### 권한/메뉴 관련 (3개)
11. **DynamicPermissionServiceImpl** ⚠️
    - 문제: `permissionRepository` 호출 시 tenantId 미전달
    - 위험도: ⭐⭐⭐⭐⭐

12. **BranchPermissionServiceImpl** ⚠️
    - 문제: 지점 권한 관리 시 tenantId 미필터링
    - 위험도: ⭐⭐⭐⭐

13. **MenuServiceImpl** ⚠️
    - 문제: 메뉴 조회 시 tenantId 미필터링
    - 위험도: ⭐⭐⭐

---

## ⚠️ 일반 수정 필요 (45개)

### 비즈니스 로직 (15개)
- AmountManagementServiceImpl
- BankTransferServiceImpl
- BusinessTimeServiceImpl
- ConsultantMotivationServiceImpl
- DiscountAccountingServiceImpl
- ErpServiceImpl
- ErpDiscountIntegrationServiceImpl
- ExchangeRateServiceImpl
- HealingContentServiceImpl
- KakaoAlimTalkServiceImpl
- PackageDiscountServiceImpl
- PaymentServiceImpl
- PurchaseOrderServiceImpl
- SalaryTaxCalculationServiceImpl
- SessionSyncServiceImpl

### 초기화/설정 (10개)
- BranchInitializationService
- CodeGroupMetadataServiceImpl
- CodeInitializationServiceImpl
- FinancialCommonCodeInitializer
- PasswordCommonCodeInitializer
- RoleInitializationServiceImpl
- SystemConfigServiceImpl
- TenantInitializationServiceImpl
- WellnessInitializationServiceImpl
- WellnessTemplateServiceImpl

### 기타 (20개)
- BaseServiceImpl
- BranchCommonCodeServiceImpl
- BranchDataFilterServiceImpl
- EmailServiceImpl
- MockEmailServiceImpl
- ... (나머지 15개)

---

## 🔧 수정 패턴

### 1. Import 추가
```java
import com.coresolution.core.context.TenantContextHolder;
```

### 2. tenantId 선언
```java
String tenantId = TenantContextHolder.getRequiredTenantId();
```

### 3. Repository 호출 수정
```java
// Before (Deprecated)
userRepository.findByEmail(email)

// After (tenantId 필터링)
userRepository.findByTenantIdAndEmail(tenantId, email)
```

---

## 📝 작업 계획

### Phase 1: 보안 Critical (13개) - 최우선
- [ ] AbstractOAuth2Service 수정
- [ ] AccountIntegrationServiceImpl 수정
- [ ] SocialAuthServiceImpl 수정
- [ ] AuthServiceImpl 수정
- [ ] PasswordResetServiceImpl 수정
- [ ] PasskeyServiceImpl 수정
- [ ] MultiTenantUserServiceImpl 수정
- [ ] SessionExtensionServiceImpl 수정
- [ ] ActivityServiceImpl 수정
- [ ] NotificationServiceImpl 수정
- [ ] DynamicPermissionServiceImpl 수정
- [ ] BranchPermissionServiceImpl 수정
- [ ] MenuServiceImpl 수정

### Phase 2: 일반 Service (45개)
- 비즈니스 로직 Service (15개)
- 초기화/설정 Service (10개)
- 기타 Service (20개)

---

## ⚠️ 주의사항

### 1. @Deprecated 메서드 사용 금지
현재 Repository에 tenantId 필터링이 추가되었지만, Service Layer에서 여전히 @Deprecated 메서드를 호출하고 있어 **실제로는 tenantId 필터링이 작동하지 않습니다**.

### 2. 보안 위험
- 다른 테넌트의 사용자 정보 접근 가능
- 다른 테넌트의 소셜 계정 연동 가능
- 다른 테넌트의 권한 정보 노출 가능

### 3. 긴급성
**보안 Critical Service 13개는 즉시 수정이 필요합니다!**

---

## 📊 예상 작업량

- **보안 Critical (13개)**: 3-4시간
- **일반 Service (45개)**: 4-5시간
- **총 예상 시간**: 7-9시간

---

**다음 작업**: 보안 Critical Service 13개 우선 수정 진행

