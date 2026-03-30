# 브랜치 코드 제거 전략

**작성일**: 2025-12-04  
**상태**: 진행 중

---

## 📌 전략 개요

브랜치 코드를 완전히 제거하되, 레거시 호환성을 고려하여 점진적으로 제거합니다.

---

## 🎯 제거 원칙

### 1. 새로운 코드 작성 시
- ❌ 브랜치 코드 사용 금지
- ✅ 테넌트 ID만 사용
- ✅ 브랜치 필터링 제거

### 2. 기존 코드 처리 (변경됨: 깔끔하게 완전 제거)
- ❌ Deprecated 메서드 유지하지 않음 - 완전히 제거
- ✅ 사용처를 표준 메서드로 교체 후 제거
- ✅ 깔끔한 코드베이스 유지

### 3. Repository 쿼리 전략 (깔끔하게 완전 제거)
- ❌ Deprecated 메서드 유지하지 않음 - 완전히 제거
- ✅ 브랜치 코드를 사용하는 메서드/쿼리 완전 제거
- ✅ 새로운 쿼리에는 브랜치 필터링 추가하지 않음
- ✅ 깔끔한 코드베이스 유지

---

## 📋 작업 단계

### Phase 1: 필터 및 컨텍스트 제거 (진행 중)
- [x] TenantContextFilter에서 브랜치 추출 로직 제거
- [x] JwtAuthenticationFilter에서 브랜치 ID 설정 제거
- [ ] TenantContext에서 브랜치 관련 메서드 주석 처리 (레거시 호환)

### Phase 2: Repository 쿼리 정리
- [ ] 새로운 쿼리 작성 시 브랜치 필터링 사용 금지
- [ ] Deprecated 메서드에 주석 추가
- [ ] Service 레이어에서 Deprecated 메서드 사용 최소화

### Phase 3: Service 레이어 정리
- [ ] 브랜치 필터링 로직 제거
- [ ] 테넌트 ID만 사용하도록 변경
- [ ] Deprecated 메서드 호출 제거

### Phase 4: Frontend 정리
- [ ] 브랜치 코드 참조 제거
- [ ] 세션에서 브랜치 정보 제거

### Phase 5: Entity 필드 정리
- [ ] 브랜치 필드 검토 (레거시 호환 유지)
- [ ] 새로운 코드에서 사용 금지 주석 추가

---

## 🔍 발견된 브랜치 코드 사용 현황

### Repository (20개 파일)
1. UserRepository - 많은 브랜치 필터링 쿼리 (대부분 Deprecated)
2. ConsultantRepository - 브랜치 코드 사용
3. BranchRepository - 브랜치 자체이므로 예외
4. 기타 Repository들

### Service (20개 파일)
- AdminServiceImpl
- BranchServiceImpl
- UserServiceImpl
- 기타 Service들

### Frontend (10개 파일)
- SessionContext.js
- HQDashboard.js
- 기타 컴포넌트들

---

## ⚠️ 주의사항

1. **레거시 호환성**: Deprecated 메서드는 유지
2. **점진적 제거**: 한 번에 모두 제거하지 않고 단계적으로
3. **테스트 필수**: 각 단계마다 테스트 실행
4. **데이터 마이그레이션**: 기존 데이터는 유지

---

**최종 업데이트**: 2025-12-04

