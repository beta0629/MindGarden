---
name: core-solution-code-style
description: Core Solution(MindGarden) 코드 스타일 일괄 적용. Java 4칸/JS 2칸 들여쓰기, 네이밍, import 순서, 주석, K&R 중괄호.
---

# Core Solution 코드 스타일 룰

코드 포맷·스타일을 맞출 때 이 스킬을 적용하세요.

## When to Use

- 새 코드 작성 시 스타일 통일
- 리팩터 시 포맷 정리
- 코드 리뷰 전 스타일 점검
- "스타일 맞춰줘", "포맷 정리" 요청 시

## Java 스타일

- **들여쓰기**: 4칸 스페이스 (탭 금지)
- **중괄호**: K&R 스타일. 여는 중괄호는 같은 줄
- **한 줄 길이**: 최대 120자
- **네이밍**: 클래스 PascalCase, 메서드/변수 camelCase, 상수 UPPER_SNAKE_CASE
- **import**: wildcard 금지. 순서 — Java 표준 → 서드파티 → com.coresolution.*
- **주석**: JavaDoc (클래스·public 메서드). 인라인 주석은 복잡한 로직만. 당연한 내용 주석 금지

## JavaScript/React 스타일

- **들여쓰기**: 2칸 스페이스 (탭 금지)
- **네이밍**: 컴포넌트 PascalCase, 함수/변수 camelCase, 상수 UPPER_SNAKE_CASE
- **세미콜론**: 사용
- **따옴표**: 작은따옴표 우선. 템플릿 리터럴은 백틱
- **JSX**: 인라인 스타일 금지. className + CSS 클래스 사용

## 공통

- 매직 넘버·문자열 금지. 상수 또는 설정 사용
- TODO/FIXME는 구체적으로 (예: `// TODO: 2025-12-10 키 로테이션 완료`)

## Reference

전체: `docs/standards/CODE_STYLE_STANDARD.md`
