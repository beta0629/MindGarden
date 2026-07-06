# IntegratedMatchingSchedule Sidebar Compact Row Design Spec

**문서 목적**: IntegratedMatchingSchedule 사이드바의 Compact Row(밀도 조절) UI/UX 및 비주얼 스펙 정의 (Designer Handoff)  
**관련 정책**: V0 Seq 8 cancelled 정책 적용, React #130 무결점(표시 경계 준수)  
**작성자**: core-designer

---

## 1. 개요 및 기본 정책

- **위치**: IntegratedMatchingSchedule 화면 좌측 사이드바 (고정 너비 **380px**)
- **밀도 토글 (Density Toggle)**: 
  - **Comfortable (기본값)**: 기존 여유로운 패딩과 높이를 가진 카드/로우 형태.
  - **Compact (Toggle ON 시에만)**: 한 화면에 더 많은 데이터(20+ rows)를 볼 수 있도록 상하 패딩과 폰트 크기를 최적화한 압축 형태.
- **제약 사항**:
  - **20+ row 이름 손실 금지**: 20개 이상의 row가 표시되더라도 이름(텍스트)이 완전히 가려지거나 손실되지 않아야 함. (말줄임표 `text-overflow: ellipsis` 적용 및 툴팁 제공으로 최소 가독성 보장)
  - **React #130 0**: 모든 텍스트 렌더링은 객체 렌더링 오류 방지를 위해 `SafeText` 또는 `toDisplayString` 등 표시 경계를 통과한 안전한 문자열만 사용.
  - **V0 Seq 8 cancelled 정책**: 이전 V0 Seq 8 정책의 레이아웃/기획은 전면 폐기하고, 본 문서의 Compact Row 스펙을 단일 진실 공급원(SSOT)으로 적용.

---

## 2. 레이아웃 및 비주얼 스펙 (Compact Mode)

### 2.1 사이드바 컨테이너 (380px)
- **너비**: 380px (고정)
- **배경색**: `var(--mg-color-background-main)` (#FAF9F7)
- **우측 테두리**: 1px solid `var(--mg-color-border-main)` (#D4CFC8)
- **내부 패딩**: 좌우 16px (Compact 모드 시 좌우 여백을 유지하면서 내부 콘텐츠 밀도를 높임)

### 2.2 Compact Row (개별 항목)
- **높이 (Height)**: 32px ~ 36px (Comfortable 대비 대폭 축소)
- **패딩 (Padding)**: 상하 6px, 좌우 8px
- **배경색**: 
  - 기본: 투명 또는 `var(--mg-color-surface-main)` (#F5F3EF)
  - 호버(Hover): `var(--mg-color-background-main)`
  - 활성(Active): `var(--mg-color-primary-light)` (#4A6354) 10% opacity 배경
- **테두리 (Border)**: 하단 1px solid `var(--mg-color-border-main)` (구분선 역할)
- **Border Radius**: 6px

### 2.3 타이포그래피 및 데이터 표시
- **폰트**: Noto Sans KR
- **이름/주요 텍스트**: 
  - 크기: 13px (Comfortable 14px에서 축소)
  - 색상: `var(--mg-color-text-main)` (#2C2C2C)
  - 굵기: fontWeight 500
  - **손실 금지 정책**: `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis` 적용. 텍스트가 잘릴 경우 브라우저 기본 `title` 속성이나 커스텀 툴팁으로 전체 이름 제공.
- **보조 텍스트 (시간, 상태 등)**:
  - 크기: 11px ~ 12px
  - 색상: `var(--mg-color-text-secondary)` (#5C6B61)
- **좌측 악센트 바 (선택적 상태 표시)**:
  - 폭 3px, 높이 100%, `var(--mg-color-primary-main)` 등 상태에 따른 토큰 색상 적용.

---

## 3. 밀도 토글 (Density Toggle) UI

- **위치**: 사이드바 상단 필터/검색 영역 우측
- **상태**:
  - 비활성 (Comfortable - Default): `var(--mg-color-text-secondary)` 아이콘
  - 활성 (Compact): `var(--mg-color-primary-main)` 아이콘 및 활성 배경
- **동작**: 클릭 시 사이드바 내 리스트가 Comfortable <-> Compact 상태로 즉시 전환.

---

## 4. 개발자 인계 (Developer Handoff) 체크리스트

코더(core-coder)는 다음 스펙을 준수하여 구현합니다:

1. **CSS/토큰 사용**: `var(--mg-*)` 디자인 토큰만 사용하여 하드코딩된 색상을 배제할 것.
2. **React #130 방어**: 행(Row)에 출력되는 모든 데이터(이름, 시간 등)는 렌더링 전 `safeDisplay.js`의 `toDisplayString` 혹은 `SafeText` 컴포넌트를 거쳐 렌더링할 것.
3. **말줄임 및 툴팁**: 380px 너비 내에서 20개 이상의 항목이 스크롤될 때, 이름이 길어 영역을 벗어나면 반드시 `text-overflow: ellipsis` 처리하고 `title` 속성으로 풀네임을 제공할 것.
4. **V0 Seq 8 Cancelled**: 이전 V0 Seq 8 정책의 레이아웃은 폐기하고, 본 문서의 Compact Row 스펙을 우선 적용할 것.
