# Phase 6: 중복 클래스 통합 마이그레이션 가이드

**작성일**: 2025-01-XX
**버전**: 1.0
**상태**: 계획 수립

## 🎯 목표

중복된 CSS 클래스를 통합하여 코드 일관성을 높이고 유지보수성을 개선합니다.

## 📋 통합 대상 클래스

### 1. 버튼 클래스 통합 (우선순위: 높음)

#### 현재 상태
- `.mg-button` (레거시, 578줄)
- `.mg-v2-btn` (약식 버전, 8690줄)
- `.mg-v2-button` (표준, 9679줄)

#### 통합 방향
- **표준**: `.mg-v2-button` 사용
- **MGButton 컴포넌트**: 이미 `mg-button` 클래스 사용 중 (MGButton.css 참조)
- **호환성**: 단계적 마이그레이션

#### 마이그레이션 계획

**Step 1: `.mg-v2-btn` → `.mg-v2-button` 마이그레이션**
- 검색 및 치환: `mg-v2-btn` → `mg-v2-button`
- Variant 클래스: `mg-v2-btn--primary` → `mg-v2-button--primary`
- 영향 범위: 약 5-10개 파일 예상

**Step 2: `.mg-button` 호환성 유지**
- MGButton 컴포넌트는 현재 `mg-button` 클래스 사용
- `mg-button` → `mg-v2-button` 매핑 KW CSS 추가 (호환성 레이어)
- 점진적 마이그레이션 진행

**Step 3: 검증 및 테스트**
- 모든 버튼 스타일 확인
- MGButton 컴포넌트 동작 확인
- 반응형 디자인 확인

### 2. 통계 카드 클래스 통합 (우선순위: 중간)

#### 현재 상태
- `.mg-stat-card`
- `.mg-dashboard-stat-card`
- `.mg-v2-dashboard-stat-card` (표준)

#### 통합 방향
- **표준**: `.mg-v2-dashboard-stat-card` 사용
- **StatCard 컴포넌트**: 이미 표준 클래스 사용 중
- **레거시 클래스**: 점진적 제거 예정

## 🔧 실행 계획

### Phase 1: 버튼 클래스 통합 (현재 진행)

1. ✅ `.mg-v2-btn` 사용처 검색
2. ⏳ `.mg-v2-btn` → `.mg-v2-button` 일괄 치환
3. ⏳ CSS 파일에서 `.mg-v2-btn` 정의 확인
4. ⏳ 호환성 레이어 추가 (레거시 지원)
5.Brp 테스트 및 검증

---

**다음 단계**: `.mg-v2-btn` 사용처 검색 및 마이그레이션 시작

