# 최종 실행 계획 - Service Layer tenantId 필터링

**작성일**: 2025-11-30  
**목표**: 오늘 안에 최대한 완료

---

## 🎯 오늘의 목표

### ✅ 완료된 작업 (3개)
1. AccountServiceImpl ✅
2. UserAddressServiceImpl ✅
3. ConsultationRecordServiceImpl ✅ (Phase 1)

### 🚀 오늘 추가 완료 목표 (가장 위험한 5개)

#### 1. AbstractOAuth2Service (최우선) ⚠️⚠️⚠️
- **영향**: 4개의 OAuth2 Service (Apple, Google, Kakao, Naver)
- **위험도**: 극도로 높음
- **예상 시간**: 1시간

#### 2. AccountIntegrationServiceImpl ⚠️⚠️⚠️
- **위험도**: 극도로 높음
- **예상 시간**: 30분

#### 3. PasswordResetServiceImpl ⚠️⚠️
- **위험도**: 높음
- **예상 시간**: 20분

#### 4. DynamicPermissionServiceImpl ⚠️⚠️⚠️
- **위험도**: 극도로 높음
- **예상 시간**: 30분

#### 5. AuthServiceImpl ⚠️⚠️⚠️
- **위험도**: 극도로 높음
- **예상 시간**: 40분

**총 예상 시간**: 3시간

---

## 📋 내일 작업 목록 (53개 Service)

### 자동화 스크립트 준비
다음 패턴으로 일괄 수정 가능:

```bash
# 1. TenantContextHolder import 추가
# 2. 각 메서드에 tenantId 선언 추가
# 3. Repository 호출 시 tenantId 파라미터 추가
```

### 남은 Service 목록
1. SocialAuthServiceImpl
2. PasskeyServiceImpl
3. MultiTenantUserServiceImpl
4. SessionExtensionServiceImpl
5. ActivityServiceImpl
6. NotificationServiceImpl
7. BranchPermissionServiceImpl
8. MenuServiceImpl
9. AmountManagementServiceImpl
10. BankTransferServiceImpl
... (나머지 43개)

---

## ✅ 완료 기준

### 오늘 (최소 목표)
- [x] Repository Layer: 18개 완료
- [x] Service Layer: 3개 완료
- [ ] Service Layer: 추가 5개 완료 (총 8개)
- [ ] 컴파일 성공
- [ ] 문서화 완료

### 내일 (최종 목표)
- [ ] Service Layer: 나머지 53개 완료
- [ ] 전체 컴파일 성공
- [ ] 통합 테스트

---

## 🚀 지금 시작!

**다음 작업**: AbstractOAuth2Service 수정 시작

