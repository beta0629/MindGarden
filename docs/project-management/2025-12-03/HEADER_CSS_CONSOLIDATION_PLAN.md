# 헤더 CSS 통합 및 중앙화 계획

## 📋 문제점

현재 헤더 관련 CSS가 3개 파일에 분산되어 있어 디자인 수정이 어려움:

1. `frontend/src/styles/06-components/_header.css` (메인, 108개 클래스)
2. `frontend/src/components/common/MGHeader.css` (89개 클래스)
3. `frontend/src/styles/06-components/_base/_header.css` (레거시, 76개 클래스)

## 🎯 목표

표준화 문서(`DESIGN_CENTRALIZATION_STANDARD.md`)에 따라:
- 모든 헤더 스타일을 `_header.css` 하나로 통합
- CSS 변수만 사용 (하드코딩 제거)
- 네이밍 규칙 통일: `mg-header-{element}--{modifier}`

## 📝 실행 계획

### Phase 1: 통합 및 정리
1. `MGHeader.css`의 고유 스타일을 `_header.css`로 병합
2. 중복 스타일 제거 및 통합
3. CSS 변수로 하드코딩 값 교체

### Phase 2: 컴포넌트 업데이트
1. `MGHeader.js`가 `_header.css`를 사용하도록 변경
2. import 경로 수정

### Phase 3: 검증
1. 모든 헤더 컴포넌트 동작 확인
2. 반응형 레이아웃 검증
3. 중복 파일 제거

## ✅ 완료 체크리스트

- [x] `MGHeader.css` 내용을 `_header.css`로 통합
- [x] 하드코딩 값 → CSS 변수 교체
- [x] `MGHeader.js` import 경로 수정 (중앙화된 스타일 사용)
- [x] `MGHeader.css` 파일 삭제
- [ ] 모든 헤더 컴포넌트 테스트 (수동 확인 필요)
- [ ] 레거시 파일 정리 (`_base/_header.css` 백업 확인)

