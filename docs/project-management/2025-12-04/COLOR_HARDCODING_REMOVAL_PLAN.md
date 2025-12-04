# 색상 하드코딩 제거 계획

**작성일**: 2025-12-04  
**버전**: 1.0.0  
**상태**: 시작

---

## 📌 개요

모든 하드코딩된 색상값을 CSS 변수로 전환하여 디자인 시스템 일관성을 확보합니다.

---

## 🎯 목표

1. 모든 하드코딩된 색상값 제거
2. CSS 변수 시스템으로 통일
3. 디자인 토큰 기반 색상 관리

---

## 📊 현재 상황

### 기존 CSS 변수 시스템
- ✅ `frontend/src/styles/unified-design-tokens.css` - 통합 디자인 토큰
- ✅ `frontend/src/constants/css-variables.js` - CSS 변수 상수
- ✅ `frontend/src/constants/designTokens.js` - 디자인 토큰
- ✅ `frontend/src/constants/cssConstants.js` - CSS 상수

### 발견된 하드코딩
- JavaScript 인라인 스타일: `CommonCodeManagement.js` 등
- CSS 파일: 하드코딩된 hex 색상값

---

## 📅 작업 계획

### Day 1-2: CSS 파일 색상 정리

**목표**: CSS 파일에서 하드코딩된 색상값을 CSS 변수로 전환

**작업 항목**:
1. CSS 파일에서 하드코딩된 색상값 검색
2. CSS 변수 매핑 테이블 작성
3. CSS 파일 수정 (hex → CSS 변수)

**체크리스트**:
- [ ] CSS 파일 색상 하드코딩 현황 분석
- [ ] CSS 변수 매핑 테이블 작성
- [ ] CSS 파일 수정 (우선순위 높은 파일부터)
- [ ] 시각적 회귀 테스트

---

### Day 3-4: JavaScript 파일 인라인 스타일 제거

**목표**: JavaScript 파일의 인라인 스타일을 완전히 제거하고 CSS 클래스로 전환

**표준화 원칙 준수**:
- ✅ 인라인 스타일 금지 (FRONTEND_DEVELOPMENT_STANDARD.md)
- ✅ 비즈니스 로직과 CSS 분리
- ✅ CSS 클래스 사용 필수

**작업 항목**:
1. JavaScript 파일에서 인라인 스타일 검색
2. **인라인 스타일을 CSS 클래스로 전환** (CSS 변수 사용 아님)
3. 동적 스타일링은 조건부 CSS 클래스 적용으로 처리
4. CSS 파일에 상태별 클래스 정의
5. 인라인 스타일 완전 제거

**체크리스트**:
- [ ] JavaScript 인라인 스타일 현황 분석
- [ ] CSS 클래스로 전환 (인라인 스타일 제거)
- [ ] CSS 파일에 상태별 클래스 정의
- [ ] 동적 스타일링을 조건부 클래스로 처리
- [ ] 기능 테스트

---

### Day 5: CSS 변수 시스템 적용 및 검증

**목표**: CSS 변수 시스템 통합 및 최종 검증

**작업 항목**:
1. CSS 변수 시스템 통합 검증
2. 누락된 CSS 변수 추가
3. 전체 시스템 테스트

**체크리스트**:
- [ ] CSS 변수 시스템 통합 검증
- [ ] 누락된 CSS 변수 추가
- [ ] 전체 페이지 시각적 테스트
- [ ] 문서화 업데이트

---

## 🔍 분석 도구

### 색상 하드코딩 검색 패턴
```bash
# Hex 색상
#[0-9a-fA-F]{3,6}

# RGB/RGBA
rgb\(|rgba\(

# 인라인 스타일
color:\s*['"]#|backgroundColor:\s*['"]#
```

---

## 📝 참조 문서

- [CSS 변수 표준](../standards/BUTTON_DESIGN_STANDARD.md)
- [디자인 시스템 가이드](../standards/FRONTEND_DEVELOPMENT_STANDARD.md)
- [컴포넌트 템플릿 표준](../standards/COMPONENT_TEMPLATE_STANDARD.md)

---

**최종 업데이트**: 2025-12-04

