# 브랜치 코드 깔끔하게 제거 전략

**작성일**: 2025-12-04  
**목표**: Deprecated 없이 깔끔하게 브랜치 코드 완전 제거

---

## 📌 전략 원칙

### 1. 성능 고려사항
- ✅ `@Deprecated` 어노테이션 자체는 **성능에 전혀 영향 없음** (컴파일러 경고만)
- ✅ 하지만 코드베이스를 깔끔하게 유지하려면 **완전 제거가 최선**
- ✅ Deprecated 메서드를 남겨두면 코드 복잡도만 증가

### 2. 깔끔한 제거 전략

**원칙**: 사용되지 않는 Deprecated 메서드는 완전히 제거

1. **사용처 확인**: Deprecated 메서드를 어디서 사용하는지 확인
2. **교체 작업**: 사용하는 곳을 표준 메서드로 교체
3. **완전 제거**: 사용되지 않는 Deprecated 메서드 완전 삭제

---

## 📋 실행 계획

### Phase 1: 사용처 분석 (1일)
- [ ] Deprecated 브랜치 메서드 사용처 전체 조사
- [ ] 교체 가능 여부 확인
- [ ] 우선순위 정렬

### Phase 2: 사용처 교체 (2일)
- [ ] Service 레이어에서 Deprecated 메서드 호출 교체
- [ ] Controller 레이어에서 Deprecated 메서드 호출 교체
- [ ] 테스트 실행

### Phase 3: Deprecated 메서드 완전 제거 (1일)
- [ ] 사용되지 않는 Deprecated 메서드 제거
- [ ] Repository 쿼리 정리
- [ ] 최종 검증

---

## 🎯 제거 대상

### Repository 메서드 (제거 대상)
1. `findByBranchCodeAndIsDeletedFalse()` - Deprecated 표시된 메서드
2. `findActiveConsultantsByBranchCode()` - Deprecated 표시된 메서드
3. `findByBranchCodeAndIsActive()` - Deprecated 표시된 메서드
4. `findByBranchCode()` - Deprecated 표시된 메서드
5. 기타 브랜치 코드 기반 Deprecated 메서드들

### 제거 방식
- ✅ 완전히 삭제 (Deprecated 주석 포함)
- ✅ 사용처를 표준 메서드로 교체

---

## 📊 예상 결과

- **제거 전**: 2,399개 브랜치 코드 사용 + Deprecated 메서드들
- **제거 후**: 0개 브랜치 코드 사용
- **깔끔한 코드베이스**: Deprecated 없이 표준만 유지

---

**최종 업데이트**: 2025-12-04
