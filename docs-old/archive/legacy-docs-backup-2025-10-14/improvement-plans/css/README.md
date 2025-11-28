# CSS 개선 계획서 🎨

## 📁 CSS 관련 개선사항

### 현재 문제점
- **전역 CSS 오염**: `index.css`에 모든 스타일이 몰려있음
- **클래스명 충돌**: 같은 클래스명이 여러 컴포넌트에서 사용
- **z-index 지옥**: 모달, 드롭다운의 z-index 충돌
- **!important 남용**: CSS 우선순위 문제로 !important 남발
- **반응형 부족**: 모바일, 태블릿 최적화 부족

### 개선 계획서
- **[CSS_ARCHITECTURE_IMPROVEMENT_PLAN.md](./CSS_ARCHITECTURE_IMPROVEMENT_PLAN.md)**: CSS 아키텍처 전면 개선

### 주요 개선사항
1. **CSS 변수 시스템** - 일관된 색상, 크기 관리
2. **CSS Modules** - 스타일 격리 및 충돌 방지
3. **BEM 방법론** - 명확한 클래스명 규칙
4. **ITCSS 구조** - 체계적인 CSS 아키텍처
5. **z-index 시스템** - 계층적 z-index 관리

### 예상 효과
- CSS 충돌 100% 제거
- 번들 크기 20-30% 감소
- 개발 생산성 40-50% 향상
