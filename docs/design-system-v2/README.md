# 🎨 MindGarden 디자인 시스템 v2.0

**출시일**: 2025년 10월 14일  
**버전**: 2.0  
**상태**: ✅ 프로덕션 준비 완료

---

## 📚 이 폴더의 문서들

이 폴더에는 MindGarden 디자인 시스템 v2.0의 모든 핵심 문서가 포함되어 있습니다.

### 0. [실전 적용 플랜](IMPLEMENTATION_PLAN.md) 🚀

**누가 읽어야 하나요?**: 구현 담당 개발자 (필수)

**내용**:
- Phase 1-5 상세 실행 계획
- 공통 UI 컴포넌트 라이브러리 구축 가이드
- Admin Dashboard 리팩토링 전략
- 모든 페이지 마이그레이션 가이드
- 레거시 CSS 정리 방법
- 체크리스트 및 예상 일정 (3주)

**언제 참고하나요?**:
- ✅ 디자인 시스템 구현 시작 전 (필수)
- ✅ 각 Phase 시작 전
- ✅ 페이지 마이그레이션 시
- ✅ CSS 파일 정리 시

---

### 1. [디자인 시스템 가이드](MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) ⭐

**누가 읽어야 하나요?**: 모든 개발자 (특히 프론트엔드)

**내용**:
- 색상 시스템 (Primary, Background, Text, Status 등)
- 타이포그래피 (Heading, Body, 반응형)
- 레이아웃 시스템 (Spacing, Border Radius, Shadow)
- 18개 컴포넌트 사용법
  1. Buttons
  2. Cards (Basic, Glass, Stat Cards)
  3. Client Cards
  4. Consultant Cards
  5. Forms
  6. Modals
  7. Tables
  8. Loading
  9. Notifications
  10. Charts & Graphs
  11. Navigation
  12. Calendar
  13. Accordion
  14. Color Palette
  15-18. 기타 컴포넌트
- 대시보드 레이아웃 (통일된 구조)
- 반응형 디자인 (모바일, 태블릿, 데스크탑)
- 실제 코드 예시
- 체크리스트

**언제 참고하나요?**:
- ✅ 새 페이지 디자인 시
- ✅ 컴포넌트 사용 시
- ✅ CSS 클래스 참고 시
- ✅ 색상/간격 확인 시

---

### 2. [디자인 시스템 아키텍처](DESIGN_SYSTEM_ARCHITECTURE.md) ⭐

**누가 읽어야 하나요?**: 개발자, 아키텍트, 기술 리드

**내용**:
- 디렉토리 구조 (현재 및 권장)
- CSS 아키텍처
  - CSS Variables 계층 구조 (3단계)
  - BEM 명명 규칙
  - 파일 구조 패턴
- 컴포넌트 아키텍처
  - Presentational Component
  - Container Component
  - Compound Component Pattern
- 테마 시스템
  - Theme Provider (Context API)
  - 테마 구조
  - 동적 테마 전환
- 마이그레이션 가이드
  - Phase 1-3 계획
  - 체크리스트
- 개발 워크플로우
- 성능 최적화
- 문제 해결 (Troubleshooting)

**언제 참고하나요?**:
- ✅ 새 컴포넌트 개발 시
- ✅ 아키텍처 결정 시
- ✅ 테마 시스템 이해 시
- ✅ 마이그레이션 작업 시

---

### 3. [문서 구조 가이드](DOCUMENT_STRUCTURE_GUIDE.md)

**누가 읽어야 하나요?**: 모든 팀원

**내용**:
- 전체 문서 구조
- 카테고리별 폴더 목적
- 문서 작성 규칙
- 문서 검색 가이드 (주제별, 역할별)
- 백업 정책
- 문서 업데이트 가이드
- 2025-10-14 재구조화 내역

**언제 참고하나요?**:
- ✅ 문서를 찾을 때
- ✅ 새 문서를 작성할 때
- ✅ 문서 관리 정책 확인 시

---

### 4. [문서 재구조화 리포트](2025-10-14-DOCUMENTATION_RESTRUCTURE_REPORT.md)

**누가 읽어야 하나요?**: 팀 리드, PM, 신규 개발자

**내용**:
- 작업 완료 사항 요약
- 생성된 문서 목록
- 백업된 문서 목록 (53개)
- 테마 시스템 구현 내역
- 작업 통계
- 핵심 성과
- 다음 단계

**언제 참고하나요?**:
- ✅ 프로젝트 현황 파악 시
- ✅ 온보딩 시
- ✅ 작업 이력 확인 시

---

## 🚀 빠른 시작 가이드

### 디자인 작업을 시작하려면?

1. **쇼케이스 확인**
   ```
   http://localhost:3000/design-system
   ```

2. **가이드 읽기**
   - [디자인 시스템 가이드](MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) 읽기
   - 필요한 컴포넌트 섹션 확인

3. **CSS 클래스 사용**
   ```jsx
   <div className="mg-dashboard-layout">
     <div className="mg-card">
       <h3 className="mg-h3">제목</h3>
     </div>
   </div>
   ```

4. **반응형 확인**
   - 모바일 (< 768px)
   - 태블릿 (769px - 1024px)
   - 데스크탑 (> 1024px)

---

## 📁 관련 파일 위치

### CSS
```
frontend/src/styles/mindgarden-design-system.css
```

### 테마
```
frontend/src/themes/defaultTheme.js
```

### 컴포넌트 (참고용 쇼케이스)
```
frontend/src/components/mindgarden/
├── HeroSection.js
├── StatsDashboard.js
├── ButtonShowcase.js
├── CardShowcase.js
├── ClientCardShowcase.js
├── ConsultantCardShowcase.js
├── DashboardLayoutShowcase.js
└── ... (18개 파일)
```

### 쇼케이스 페이지
```
frontend/src/pages/MindGardenDesignSystemShowcase.js
```

---

## 🎯 핵심 원칙

### 1. 일관성 (Consistency)
모든 페이지에서 동일한 디자인 패턴 사용

### 2. 반응형 (Responsive)
모바일, 태블릿, 데스크탑 완벽 지원

### 3. 재사용성 (Reusability)
컴포넌트 기반 설계

### 4. 접근성 (Accessibility)
명확한 계층 구조와 가독성

### 5. 성능 (Performance)
순수 CSS, 최소한의 JavaScript

---

## ✅ 체크리스트

### 새 페이지 작성 시

- [ ] [디자인 시스템 쇼케이스](http://localhost:3000/design-system) 확인
- [ ] `mg-dashboard-layout` 사용
- [ ] `mg-` 접두사 CSS 클래스 사용
- [ ] CSS Variables 사용 (색상, 간격)
- [ ] 인라인 스타일 금지
- [ ] 테이블에 `data-label` 추가
- [ ] 모달은 `ReactDOM.createPortal` 사용
- [ ] 모바일 테스트 완료
- [ ] 태블릿 테스트 완료
- [ ] 데스크탑 테스트 완료

---

## 🔗 외부 참조

### 마스터 플랜
```
/v0-pure-css-prompt.plan.md
```

### 기존 문서 아카이브
```
/docs/archive/
├── design-backup-2025-10-14/
└── legacy-docs-backup-2025-10-14/
```

---

## 📈 주요 성과

### 디자인 시스템 v2.0

- ✅ **18개 컴포넌트 완성**
- ✅ **통일된 대시보드 레이아웃**
- ✅ **완벽한 모바일 반응형**
- ✅ **테마 시스템 기반 마련**
- ✅ **체계적인 문서화**

### 문서 재구조화

- ✅ **53개 레거시 문서 아카이브**
- ✅ **13개 카테고리 폴더 생성**
- ✅ **역할별 필수 문서 정의**
- ✅ **명확한 인덱스 및 검색 가이드**

---

## 🎉 다음 단계

### 즉시 실행 가능

1. Theme Provider 구현
2. 공통 UI 컴포넌트 생성
3. Admin Dashboard 마이그레이션

### 단기 목표 (1-2주)

- Admin Dashboard 완성
- Consultant Dashboard 시작
- 공통 컴포넌트 라이브러리

### 장기 목표 (3개월)

- 다크 테마
- 고대비 테마 (접근성)
- Storybook 도입

---

## 📞 문의

- **디자인 시스템**: design@mindgarden.com
- **기술 지원**: development@mindgarden.com
- **문서**: docs@mindgarden.com

---

**폴더 생성일**: 2025년 10월 14일  
**버전**: 2.0  
**상태**: ✅ 프로덕션 준비 완료

