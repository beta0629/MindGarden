# Admin 컴포넌트 완료 체크리스트

## 현재 상태
- ✅ **완료된 컴포넌트**: AdminMessages.js, UserManagement.js, UnifiedLoading.js, MGButton.js, UnifiedModal.js, UnifiedNotification.js, MappingPaymentModal.js, PartialRefundModal.js, ConsultantTransferModal.js
- ❌ **미완료 컴포넌트**: 27개 파일에서 `mg-` 접두사 사용, 13개 파일에서 인라인 스타일 사용

## 작업 대상 파일들

### 1. CSS 클래스 접두사 수정 필요 (27개 파일)
- [ ] AdminMessages.js
- [ ] SectionHeader.js  
- [ ] MappingFilters.js
- [ ] PartialRefundModal.js
- [ ] ConsultantTransferModal.js
- [ ] ClientComprehensiveManagement.js
- [ ] AdminDashboard.js
- [ ] CommonCodeManagement.js
- [ ] MappingManagement.js
- [ ] ConsultantRatingStatistics.js
- [ ] ConsultantComprehensiveManagement.js
- [ ] system/SystemTools.js
- [ ] mapping/SessionExtensionModal.js
- [ ] mapping/MappingStats.js
- [ ] mapping/MappingDetailModal.js
- [ ] mapping/MappingDepositModal.js
- [ ] mapping/MappingCard.js
- [ ] VacationManagementModal.js
- [ ] UserManagement.js
- [ ] SystemNotificationManagement.js
- [ ] SystemConfigManagement.js
- [ ] SessionManagement.js
- [ ] PermissionManagement.js
- [ ] PaymentConfirmationModal.js
- [ ] DiscountPaymentConfirmationModal.js
- [ ] ConsultationCompletionStats.js
- [ ] ClientCard.js

### 2. 인라인 스타일 제거 필요 (13개 파일)
- [ ] AdminMessages.js
- [ ] PartialRefundModal.js
- [ ] ClientComprehensiveManagement.js
- [ ] AdminDashboard.js
- [ ] CommonCodeManagement.js
- [ ] MappingCard.js
- [ ] ConsultantComprehensiveManagement.js
- [ ] mapping/MappingCard.js
- [ ] SystemNotificationManagement.js
- [ ] SessionManagement.js
- [ ] SessionManagement.backup.js
- [ ] ConsultationCompletionStats.js
- [ ] ClientCard.js

### 3. Presentational 컴포넌트 적용 필요
- [ ] AdminDashboard.js
- [ ] SessionManagement.js
- [ ] MappingManagement.js
- [ ] ClientComprehensiveManagement.js
- [ ] ConsultantComprehensiveManagement.js
- [ ] SystemConfigManagement.js
- [ ] PermissionManagement.js
- [ ] ConsultantRatingStatistics.js
- [ ] VacationManagementModal.js
- [ ] PaymentConfirmationModal.js
- [ ] DiscountPaymentConfirmationModal.js
- [ ] ConsultationCompletionStats.js
- [ ] ClientCard.js
- [ ] system/SystemTools.js
- [ ] mapping/SessionExtensionModal.js
- [ ] mapping/MappingStats.js
- [ ] mapping/MappingDetailModal.js
- [ ] mapping/MappingDepositModal.js
- [ ] mapping/MappingCard.js

## 작업 순서
1. **CSS 클래스 접두사 일괄 수정** (스크립트 사용)
2. **인라인 스타일 제거** (개별 파일 수정)
3. **Presentational 컴포넌트 적용** (개별 파일 수정)
4. **빌드 테스트 및 검증**

## 완료 기준
- [ ] 모든 Admin 컴포넌트에서 `mg-v2-` 접두사 사용
- [ ] 모든 인라인 스타일 제거
- [ ] Presentational 컴포넌트 적용 완료
- [ ] 빌드 성공 확인
- [ ] ESLint 오류 없음
