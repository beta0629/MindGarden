---
name: core-solution-atomic-design
description: 아토믹 디자인 패턴 준수. Atoms → Molecules → Organisms → Templates → Pages 계층으로 컴포넌트 구성
---

# 아토믹 디자인 가이드 (Atomic Design)

Core Solution(MindGarden)의 프론트엔드 컴포넌트는 **아토믹 디자인** 패턴을 따릅니다.

## 계층 구조 (하위 → 상위)

```
Pages (페이지)
    ↓
Templates (템플릿)
    ↓
Organisms (유기체)
    ↓
Molecules (분자)
    ↓
Atoms (원자)
```

## 1. Atoms (원자)

- 가장 작은 단위 UI. 더 이상 분해 불가.
- 예: Button, Input, Label, Icon, Badge, Text
- `atoms/` 폴더 또는 `common/` 내 기본 컴포넌트
- CSS 클래스: `cs-{component-name}` 또는 `mg-*`

## 2. Molecules (분자)

- Atoms를 조합한 단일 기능 블록
- 예: FormField (Label + Input), Card, SearchBar, Alert
- `molecules/` 폴더

## 3. Organisms (유기체)

- Molecules + Atoms 조합. 화면 내 독립 섹션
- 예: Header, Sidebar, Table, DashboardGrid, ManualMatchingQueue
- `organisms/` 폴더

## 4. Templates & Pages

- Templates: Organisms 배치 레이아웃
- Pages: 실제 데이터·라우트와 연결된 화면

## 디렉터리 구조 (권장)

```
frontend/src/components/
├── atoms/          (또는 common/ 내 Button, Input 등)
├── molecules/
├── organisms/
└── templates/
```

## 규칙

- **하향 조합만 허용**: Organism은 Molecule/Atom만 import. Atom은 다른 Atom/Molecule import 금지.
- **단일 책임**: 각 컴포넌트는 하나의 역할만 수행.
- **재사용**: 공통 UI는 atoms → molecules 순으로 추출 후 organisms에서 조합.
- **네이밍**: `cs-*` 또는 `mg-*` 디자인 토큰 사용. 하드코딩 색상·여백 금지.

## 참조 문서

- `docs/design-system/ATOMIC_DESIGN_SYSTEM.md` — 상세 컴포넌트 스펙 및 CSS 변수
- `core-solution-frontend` — API, 스타일, 상수화 규칙
