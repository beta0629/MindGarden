# 빌드 오류: LayoutGrid2 import (lucide-react)

## 1. 원인 정리

- **왜 오류가 났는지**: `LayoutGrid2`는 **lucide-react 패키지에서 export되지 않는 이름**이라, 해당 이름으로 import하면 빌드 시 "Attempted import error: 'LayoutGrid2' is not exported from 'lucide-react'"가 발생한다.
- **lucide-react 그리드 계열 아이콘**: 이 패키지에서는 그리드/레이아웃 계열로 **LayoutGrid**, **Grid2X2**, **Grid3X3**, LayoutTemplate, LayoutList, LayoutDashboard 등이 제공된다. `LayoutGrid2`라는 식별자는 없다.

## 2. 적용된 수정

- **ViewModeToggle**(또는 lucide-react를 쓰는 해당 컴포넌트)에서 `LayoutGrid2` import를 제거하고, 실제로 존재하는 아이콘(**Grid2X2** 등)으로 교체해 빌드가 통과하도록 수정한 상태이다.

## 3. 재발 방지

- **신규 아이콘 사용 시**: [lucide.dev/icons](https://lucide.dev/icons) 또는 `node_modules/lucide-react` export 목록을 확인한 뒤, **실제로 export되는 이름만** import하도록 한다.

## 4. 기획 위임용 요약

- **컴파일 오류 원인·수정·재발 방지**: `LayoutGrid2`는 lucide-react에 없어 import 오류가 났고, `Grid2X2` 등 존재하는 아이콘으로 교체해 해결했다. 재발 방지를 위해 신규 아이콘 사용 시 lucide-react export 여부를 확인한다.
- **구현 계획·위임**: 해당 수정은 이미 **core-coder에 의해 반영된 상태**이며, 기획(core-planner)이 참고·위임 시 "구현 완료"로 두고 진행하면 된다.
