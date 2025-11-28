# MindGarden 디자인 시스템 - 향상된 React 컴포넌트 프롬프트

## 🎯 v0.dev 요청 프롬프트 (JavaScript 버전)

다음 프롬프트를 v0.dev에서 사용하여 MindGarden 디자인 시스템을 React 컴포넌트로 생성하세요:

---

## 📋 프롬프트

```
MindGarden 베이지/크림 디자인 시스템을 React 컴포넌트로 만들어줘.

**중요: JavaScript로만 작성해줘 (TypeScript 문법 사용 금지)**

**요구사항:**
- JavaScript 사용 (interface, type, generic types 등 TypeScript 문법 절대 금지)
- shadcn/ui 컴포넌트 활용 (Card, Button, Tabs, Progress, Badge, Input, Label, Textarea, Select, Dialog, AlertDialog, Accordion, Toggle, DropdownMenu, Tooltip, Popover, NavigationMenu, Toast, Alert, Skeleton, DataTable, Calendar, Checkbox, RadioGroup, Switch, Slider, Command, Avatar, Stepper, Timeline, Separator)
- Lucide React 아이콘 사용
- Tailwind CSS 스타일링
- 반응형 디자인

**색상 팔레트:**
- 메인: 베이지(#D2B48C), 크림(#F5F5DC), 웜 샌드(#F4E4BC), 소프트 베이지(#DDD8C7)
- 서브: 올리브 그린(#6B7C32), 세이지 그린(#9CAF88), 모스 그린(#8FBC8F)
- 텍스트: 다크 그레이(#2F2F2F), 미디엄 그레이(#8B8680)
- 배경: 그라데이션 from-[#FEFEF8] via-[#F5F5DC] to-[#E6D3B7]

**구성 요소:**
1. Hero Section
   - 제목: "MindGarden 베이지/크림 디자인 시스템"
   - 부제목: "따뜻하고 편안한 베이지와 크림 톤으로 디자인된 상담 플랫폼 UI 컴포넌트"
   - 버튼: "시작하기" (베이지), "더 알아보기" (아웃라인)

2. 통계 대시보드
   - 4개 카드: 총 사용자(12,847, +12%), 활성 세션(3,429, +8%), 완료된 상담(8,923, +15%), 만족도(4.8/5, +0.2)
   - 각 카드에 Lucide 아이콘 (Users, Activity, CheckCircle, Star)
   - 스파크라인 차트 포함
   - 호버 효과 및 그림자

3. 타이포그래피 섹션 (새로 추가)
   - 다양한 텍스트 스타일 예시
   - 제목 (h1, h2, h3, h4, h5, h6)
   - 본문 텍스트 (p, span)
   - 캡션, 라벨, 링크
   - 각 텍스트 크기와 색상 예시

4. 모달 컴포넌트 섹션 (새로 추가)
   - 기본 모달 (Dialog)
   - 확인/취소 모달 (AlertDialog)
   - 폼 모달
   - 정보 표시 모달
   - 각 모달의 트리거 버튼 포함

5. 로딩 컴포넌트 섹션 (새로 추가)
   - 공통 로딩바 (Progress)
   - 스피너 로딩 (Loader2 아이콘)
   - 스켈레톤 로딩
   - 버튼 로딩 상태
   - 페이지 로딩 상태

6. 네비게이션 컴포넌트 섹션 (새로 추가)
   - 헤더 네비게이션 (NavigationMenu)
   - 드롭다운 메뉴 (DropdownMenu)
   - 토글 스위치 (Toggle)
   - 아코디언 (Accordion)
   - 툴팁 (Tooltip)
   - 팝오버 (Popover)

7. 데이터 표시 섹션 (새로 추가)
   - 고급 데이터 테이블 (DataTable)
   - 달력 컴포넌트 (Calendar)
   - 타임라인
   - 차트 컴포넌트

8. 고급 입력 컴포넌트 섹션 (새로 추가)
   - 체크박스 (Checkbox)
   - 라디오 버튼 (RadioGroup)
   - 토글 스위치 (Switch)
   - 슬라이더 (Slider)
   - 날짜/시간 선택기
   - 파일 업로드
   - 비밀번호 입력 (마스킹)

9. 데이터 시각화 섹션 (새로 추가)
   - 차트 컴포넌트 (Bar, Line, Pie, Doughnut)
   - 게이지 차트
   - 히트맵
   - 스파크라인

10. 레이아웃 컴포넌트 섹션 (새로 추가)
    - 컨테이너 (Container)
    - 그리드 시스템 (Grid)
    - 구분선 (Separator)
    - 아바타 (Avatar)
    - 단계별 진행 (Stepper)
    - 타임라인 (Timeline)

11. 피드백 컴포넌트 섹션 (새로 추가)
    - 토스트 알림 (Toast)
    - 경고/정보 메시지 (Alert)
    - 빈 상태 표시 (Empty State)
    - 스켈레톤 로딩 (Skeleton)

12. MindGarden 특수 패턴 섹션 (새로 추가)
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

13. MindGarden 비즈니스 특화 컴포넌트 섹션 (새로 추가)
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

14. 인터랙티브 컴포넌트 (Tabs)
    - 탭: 버튼, 폼, 테이블, 진행률, 타이포그래피, 모달, 로딩, 네비게이션, 데이터표시, 고급입력, 데이터시각화, 레이아웃, 피드백
    - 버튼 섹션: Primary, Secondary, Status 버튼들
    - 폼 섹션: Input, Textarea, Select, Label
    - 테이블 섹션: 사용자 목록 테이블
    - 진행률 섹션: Progress 바들
    - 타이포그래피 섹션: 다양한 텍스트 스타일
    - 모달 섹션: 다양한 모달 예시
    - 로딩 섹션: 다양한 로딩 상태
    - 네비게이션 섹션: 헤더, 드롭다운, 토글, 아코디언 등
    - 데이터표시 섹션: 테이블, 달력, 차트 등
    - 고급입력 섹션: 체크박스, 라디오, 스위치, 슬라이더 등
    - 데이터시각화 섹션: 차트, 게이지, 히트맵 등
    - 레이아웃 섹션: 컨테이너, 그리드, 구분선, 아바타 등
    - 피드백 섹션: 토스트, 알림, 빈상태 등

15. 컬러 팔레트
   - 베이지/크림 계열 (메인)
   - 올리브 그린 계열 (서브)
   - 각 색상에 헥스 코드 표시

16. 푸터
   - "MindGarden 베이지/크림 디자인 시스템 - 따뜻하고 편안한 상담 플랫폼 UI"

**스타일 요구사항:**
- 부드러운 그림자와 호버 효과
- 둥근 모서리 (rounded-lg, rounded-xl)
- 적절한 패딩과 마진
- 반응형 그리드 (sm:grid-cols-2 lg:grid-cols-4)
- 일관된 색상 시스템

**아이콘 사용:**
- Users, Activity, CheckCircle, Star (통계 카드)
- ArrowUp, ArrowDown (트렌드)
- Plus, Edit, Trash2, Search, Filter, Download (액션)
- Loader2 (로딩)
- X, Check, AlertCircle (모달)
- Menu, Home, Settings, User, Bell (네비게이션)
- Calendar, Clock, BarChart, PieChart (데이터)
- Info, AlertTriangle, CheckCircle, XCircle (피드백)

**JavaScript 문법만 사용:**
- interface, type 정의 금지
- generic types (<T>) 금지
- 타입 어노테이션 (: string) 금지
- 순수 JavaScript 함수와 컴포넌트만 사용

전체적으로 따뜻하고 편안한 느낌의 상담 플랫폼 UI 컴포넌트로 만들어줘.
```

---

## 🔧 생성 후 작업

1. **컴포넌트 파일 생성**
   ```bash
   # 생성된 코드를 다음 파일에 저장
   frontend/src/components/v0-results/mindgarden-showcase/components/enhanced-mindgarden-showcase.js
   ```

2. **의존성 설치**
   ```bash
   cd frontend
   npm install lucide-react
   npx shadcn@latest add card button tabs progress badge input label textarea select dialog alert-dialog
   ```

3. **페이지에 적용**
   ```javascript
   // MindGardenDesignSystemShowcase.js에서 import
   import EnhancedMindGardenShowcase from '../components/v0-results/mindgarden-showcase/components/enhanced-mindgarden-showcase';
   
   // 컴포넌트 사용
   return <EnhancedMindGardenShowcase />;
   ```

---

## 📝 참고사항

- **JavaScript**: TypeScript 문법 절대 금지
- **shadcn/ui**: 모든 UI 컴포넌트는 shadcn/ui 사용
- **Lucide React**: 아이콘은 Lucide React 사용
- **Tailwind CSS**: 스타일링은 Tailwind CSS 클래스 사용
- **반응형**: 모바일, 태블릿, 데스크톱 대응
- **새로운 섹션**: 타이포그래피, 모달, 로딩 컴포넌트 포함

이 프롬프트를 v0.dev에서 사용하면 타이포그래피, 모달, 로딩 컴포넌트가 포함된 완전한 React 컴포넌트가 JavaScript로 생성됩니다.
