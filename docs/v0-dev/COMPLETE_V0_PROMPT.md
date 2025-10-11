# MindGarden 완전한 디자인 시스템 v0.dev 요청 프롬프트

## 🎯 v0.dev에 복사해서 사용할 완전한 프롬프트

---

```
MindGarden 크림 베이지/코코아 디자인 시스템을 React 컴포넌트로 만들어줘.

**중요: JavaScript로만 작성해줘 (TypeScript 문법 사용 금지)**

**요구사항:**
- JavaScript 사용 (interface, type, generic types 등 TypeScript 문법 절대 금지)
- shadcn/ui 컴포넌트 활용 (Card, Button, Tabs, Progress, Badge, Input, Label, Textarea, Select, Dialog, AlertDialog, Accordion, Toggle, DropdownMenu, Tooltip, Popover, NavigationMenu, Toast, Alert, Skeleton, DataTable, Calendar, Checkbox, RadioGroup, Switch, Slider, Command, Avatar, Stepper, Timeline, Separator)
- Lucide React 아이콘 사용
- Tailwind CSS 스타일링
- 반응형 디자인

**색상 팔레트:**
- 메인: 크림 베이지(#F5F5DC), 웜 크림(#FDF5E6), 바닐라 크림(#FFF8DC), 소프트 크림(#FFFACD)
- 서브: 코코아 브라운(#8B4513), 다크 코코아(#654321), 올리브 그린(#6B7C32), 세이지 그린(#9CAF88)
- 텍스트: 다크 브라운(#3C2415), 미디엄 브라운(#8B4513), 라이트 크림(#FFFEF7)
- 배경: 그라데이션 from-[#FFFEF7] via-[#F5F5DC] to-[#FDF5E6]

**구성 요소:**

1. Hero Section (고급 디자인)
   - 제목: "MindGarden 크림 베이지/코코아 디자인 시스템" (그라데이션 텍스트 효과)
   - 부제목: "따뜻하고 고급스러운 크림 베이지와 코코아 톤으로 디자인된 상담 플랫폼 UI 컴포넌트"
   - 버튼: "시작하기" (베이지, 호버 애니메이션), "더 알아보기" (아웃라인, 글라스 효과)
   - 배경: 미묘한 radial-gradient 패턴
   - 텍스트에 페이드 인 애니메이션 (animate-in, fade-in)
   - 버튼에 호버 시 스케일 변화 (hover:scale-105)

2. 통계 대시보드 (글라스모피즘 스타일)
   - 4개 카드: 총 사용자(12,847, +12%), 활성 세션(3,429, +8%), 완료된 상담(8,923, +15%), 만족도(4.8/5, +0.2)
   - 각 카드에 Lucide 아이콘 (Users, Activity, CheckCircle, Star)
   - 스파크라인 차트 포함
   - 글라스모피즘 효과: backdrop-blur-md, 반투명 배경
   - 호버 시 부드러운 변형 애니메이션 (hover:scale-105, hover:-translate-y-1)
   - 미묘한 그라데이션 오버레이와 깊이감 있는 그림자
   - 트렌드 화살표에 페이드 인 애니메이션

3. 타이포그래피 섹션
   - 다양한 텍스트 스타일 예시
   - 제목 (h1, h2, h3, h4, h5, h6)
   - 본문 텍스트 (p, span)
   - 캡션, 라벨, 링크
   - 각 텍스트 크기와 색상 예시

4. 모달 컴포넌트 섹션
   - 기본 모달 (Dialog)
   - 확인/취소 모달 (AlertDialog)
   - 폼 모달
   - 정보 표시 모달
   - 각 모달의 트리거 버튼 포함

5. 로딩 컴포넌트 섹션
   - 공통 로딩바 (Progress)
   - 스피너 로딩 (Loader2 아이콘)
   - 스켈레톤 로딩
   - 버튼 로딩 상태
   - 페이지 로딩 상태

6. 네비게이션 컴포넌트 섹션
   - 헤더 네비게이션 (NavigationMenu)
   - 드롭다운 메뉴 (DropdownMenu)
   - 토글 스위치 (Toggle)
   - 아코디언 (Accordion)
   - 툴팁 (Tooltip)
   - 팝오버 (Popover)

7. 데이터 표시 섹션
   - 고급 데이터 테이블 (DataTable)
   - 달력 컴포넌트 (Calendar)
   - 타임라인
   - 차트 컴포넌트

8. 고급 입력 컴포넌트 섹션
   - 체크박스 (Checkbox)
   - 라디오 버튼 (RadioGroup)
   - 토글 스위치 (Switch)
   - 슬라이더 (Slider)
   - 날짜/시간 선택기
   - 파일 업로드
   - 비밀번호 입력 (마스킹)

9. 데이터 시각화 섹션
   - 차트 컴포넌트 (Bar, Line, Pie, Doughnut)
   - 게이지 차트
   - 히트맵
   - 스파크라인

10. 레이아웃 컴포넌트 섹션
    - 컨테이너 (Container)
    - 그리드 시스템 (Grid)
    - 구분선 (Separator)
    - 아바타 (Avatar)
    - 단계별 진행 (Stepper)
    - 타임라인 (Timeline)

11. 피드백 컴포넌트 섹션
    - 토스트 알림 (Toast)
    - 경고/정보 메시지 (Alert)
    - 빈 상태 표시 (Empty State)
    - 스켈레톤 로딩 (Skeleton)

12. MindGarden 특수 패턴 섹션
    - 글래스모피즘 효과 (Glassmorphism)
    - 통합 모달 시스템 (UnifiedModal)
    - 커스텀 필터 시스템 (CustomFilter)
    - 통계 카드 with 스파크라인
    - 폼 검증 시스템
    - 파일 업로드 with 드래그앤드롭
    - 날짜 범위 선택기
    - 다중 선택 드롭다운
    - 로딩 상태 관리
    - 에러 바운더리

13. MindGarden 비즈니스 특화 컴포넌트 섹션
    - 상담 기록 편집기 (Rich Text Editor)
    - 스케줄 캘린더 (Calendar with time slots)
    - 평가/평점 시스템 (Rating Component)
    - 알림 시스템 (Notification Center)
    - 파일 관리 (File Upload/Download)
    - 고급 검색 및 필터링
    - 권한 관리 테이블 (Permission Matrix)
    - 사용자 역할 변경 (Role Assignment)
    - 통계 대시보드 (Analytics Dashboard)
    - 재무 차트 (Financial Charts)
    - ERP 연동 컴포넌트
    - 단계별 폼 (Multi-step Forms)
    - 드래그 앤 드롭 (Drag & Drop)
    - 무한 스크롤 (Infinite Scroll)
    - 가상화 리스트 (Virtualized Lists)
    - 실시간 업데이트 (Real-time Updates)

14. 인터랙티브 컴포넌트 (Tabs with 애니메이션)
    - 탭: 버튼, 폼, 테이블, 진행률, 타이포그래피, 모달, 로딩, 네비게이션, 데이터표시, 고급입력, 데이터시각화, 레이아웃, 피드백, 비즈니스특화, 내담자카드
    - 각 탭에서 해당 컴포넌트들의 다양한 예시와 사용법 표시
    - 탭 전환 시 슬라이드 애니메이션 (slide-in-from-right)
    - 활성 탭에 부드러운 하이라이트 효과
    - 탭 콘텐츠에 페이드 인 애니메이션

14-1. 내담자 카드 컴포넌트 (프리미엄 디자인)
    - 내담자 프로필 정보 표시
    - 아바타, 이름, 상태, 마지막 상담일, 진행률
    - 긴급도 표시 (색상 코딩)
    - 상담 히스토리 미리보기
    - 빠른 액션 버튼 (연락하기, 상담 예약, 기록 보기)
    - 호버 시 상세 정보 확장 애니메이션
    - 글라스모피즘 효과와 미세한 애니메이션

15. 컬러 팔레트 (인터랙티브)
    - 베이지/크림 계열 (메인)
    - 올리브 그린 계열 (서브)
    - 각 색상에 헥스 코드 표시
    - 색상 박스에 호버 시 확대 애니메이션 (hover:scale-110)
    - 색상 전환 시 부드러운 애니메이션
    - 그라데이션 미리보기 포함

16. 푸터
    - "MindGarden 베이지/크림 디자인 시스템 - 따뜻하고 편안한 상담 플랫폼 UI"

**스타일 요구사항:**

**기본 디자인:**
- 부드러운 그림자와 호버 효과
- 둥근 모서리 (rounded-lg, rounded-xl)
- 적절한 패딩과 마진
- 반응형 그리드 (sm:grid-cols-2 lg:grid-cols-4)
- 일관된 색상 시스템

**프리미엄 글라스모피즘 디자인:**
- 고급 backdrop-blur-xl 효과 (더 강한 블러)
- 다층 반투명 배경 (rgba 레이어링)
- 복잡한 그라데이션 오버레이 (radial + linear)
- 홀로그래픽 테두리 효과 (border-gradient)
- 다층 그림자 시스템 (shadow-2xl + shadow-inner)
- 미세한 노이즈 텍스처 오버레이
- 빛의 반사 효과 (box-shadow inset)

**애니메이션 효과:**
- 호버 시 부드러운 변형 (hover:scale-105, hover:-translate-y-1)
- 페이드 인/아웃 애니메이션 (animate-in, fade-in)
- 슬라이드 애니메이션 (slide-in-from-bottom, slide-in-from-left)
- 로딩 스피너 애니메이션 (animate-spin)
- 버튼 클릭 피드백 (active:scale-95)
- 부드러운 전환 효과 (transition-all duration-300)

**디테일한 디자인 요소:**
- 그라데이션 텍스트 (bg-gradient-to-r, bg-clip-text)
- 미묘한 패턴 배경 (radial-gradient, conic-gradient)
- 아이콘과 텍스트의 완벽한 정렬
- 미세한 그림자와 하이라이트
- 호버 시 색상 변화 (hover:shadow-lg)
- 포커스 상태 디자인 (focus:ring-2, focus:ring-offset-2)
- 활성 상태 표시 (data-[state=active] 스타일링)

**아이콘 사용:**
- Users, Activity, CheckCircle, Star (통계 카드)
- ArrowUp, ArrowDown (트렌드)
- Plus, Edit, Trash2, Search, Filter, Download (액션)
- Loader2 (로딩)
- X, Check, AlertCircle (모달)
- Menu, Home, Settings, User, Bell (네비게이션)
- Calendar, Clock, BarChart, PieChart (데이터)
- Info, AlertTriangle, CheckCircle, XCircle (피드백)
- MessageCircle, Heart, FileText, Upload (비즈니스)

**JavaScript 문법만 사용:**
- interface, type 정의 금지
- generic types (<T>) 금지
- 타입 어노테이션 (: string) 금지
- 순수 JavaScript 함수와 컴포넌트만 사용

**프리미엄 반응형 디자인:**

**모바일 특화 디자인:**
- 모바일 우선 설계 (Mobile First)
- 터치 친화적 인터페이스 (최소 44px 터치 영역)
- 스와이프 제스처 지원
- 모바일 네비게이션 (햄버거 메뉴, 바텀 시트)
- 모바일 전용 애니메이션 (pull-to-refresh, 스크롤 바운스)
- 모바일 키보드 대응 (키보드 올라올 때 레이아웃 조정)
- 모바일 카드 스택 뷰 (swipeable cards)

**태블릿 및 데스크톱 대응:**
- 태블릿: 2-3 컬럼 레이아웃
- 데스크톱: 멀티 패널 레이아웃
- 호버 상태 최적화
- 키보드 단축키 지원

**접근성 고려:**
- WCAG 2.1 AA 준수
- 스크린 리더 지원
- 고대비 모드 지원
- 포커스 관리
- 색상 대비 최적화

**추가 디자인 가이드라인:**

**글라스모피즘 구현:**
- 모든 카드와 모달에 backdrop-blur 효과 적용
- 반투명 배경 (rgba(255, 255, 255, 0.1) ~ 0.3)
- 미묘한 테두리 (border-white/10)
- 깊이감 있는 그림자 (shadow-2xl, shadow-inner)

**애니메이션 타이밍:**
- 빠른 상호작용: 150ms (버튼 클릭)
- 부드러운 전환: 300ms (호버, 포커스)
- 페이지 전환: 500ms (모달, 탭)

**프리미엄 미세한 디테일:**
- 아이콘과 텍스트 간격 정밀 조정 (golden ratio 기반)
- 그림자 방향 일관성 (light source from top-left)
- 포커스 링 색상은 베이지 톤 사용
- 비활성 상태는 opacity-60으로 처리
- 미세한 노이즈 텍스처 (subtle grain effect)
- 홀로그래픽 반사 효과
- 그라데이션 마스크 효과
- 미세한 애니메이션 (breathing effect, subtle glow)

**내담자 카드 특화 디자인:**
- 프로필 아바타에 부드러운 그라데이션 테두리
- 상태 표시에 펄스 애니메이션 (긴급도에 따라)
- 진행률 바에 부드러운 채우기 애니메이션
- 카드 호버 시 3D 틸트 효과
- 액션 버튼에 마이크로 인터랙션
- 상담 히스토리에 타임라인 애니메이션

전체적으로 따뜻하고 편안한 느낌의 상담 플랫폼 UI 컴포넌트로 만들어줘. 모든 컴포넌트는 실제 상담 플랫폼에서 사용할 수 있는 수준으로 완성도 있게 구현해줘. 글라스모피즘과 애니메이션을 적절히 활용하여 현대적이고 세련된 디자인으로 완성해줘.
```

---

## 📋 사용 방법

1. **위의 프롬프트 전체를 복사**
2. **v0.dev에 접속**
3. **프롬프트를 붙여넣기**
4. **생성된 JavaScript 코드를 받아서 사용**

## ✅ 포함된 모든 컴포넌트

- **기본 UI**: Button, Card, Input, Select, Textarea, Label
- **고급 UI**: Modal, Tabs, Accordion, Toggle, Dropdown
- **데이터 표시**: Table, Chart, Calendar, Timeline
- **피드백**: Toast, Alert, Loading, Skeleton
- **레이아웃**: Container, Grid, Avatar, Stepper
- **MindGarden 특화**: 상담 기록, 스케줄, 권한 관리, ERP 연동

**총 16개 섹션, 50+ 컴포넌트가 포함된 완전한 디자인 시스템!** 🚀
