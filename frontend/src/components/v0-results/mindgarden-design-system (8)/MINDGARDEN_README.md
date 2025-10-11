# MindGarden 디자인 시스템

심리 상담 플랫폼을 위한 완전한 UI 컴포넌트 라이브러리

## 색상 팔레트

### 메인 색상 (크림/베이지)
- 크림: `#F5F5DC`
- 웜 크림: `#FDF5E6`
- 베이지: `#F5F5DC`
- 소프트 베이지: `#EDE8DC`
- 웜 베이지: `#E8DCC4`

### 서브 색상 (올리브 그린/민트)
- 올리브 그린: `#808000`
- 소프트 올리브: `#9CAF88`
- 세이지 올리브: `#B5A642`
- 민트 그린: `#98FB98`
- 소프트 민트: `#B6E5D8`
- 라이트 민트: `#D4F1E8`

### 텍스트 색상
- 다크 그레이: `#2F2F2F`
- 미디엄 그레이: `#6B6B6B`
- 라이트 크림: `#FFFEF7`

## 폴더 구조

\`\`\`
mindgarden-design-system/
├── app/
│   ├── page.jsx              # 메인 컴포넌트
│   └── globals.css           # 격리된 CSS (.mindgarden-design-system 스코프)
├── components/
│   ├── mindgarden/           # 각 섹션 컴포넌트들
│   │   ├── hero-section.jsx
│   │   ├── stats-dashboard.jsx
│   │   ├── button-showcase.jsx
│   │   ├── card-showcase.jsx
│   │   ├── form-showcase.jsx
│   │   ├── theme-settings.jsx
│   │   ├── standalone-wrapper.jsx  # 독립 사용을 위한 래퍼
│   │   └── ...
│   └── ui/                   # shadcn/ui 컴포넌트들
└── scripts/
    └── generate-theme.js     # 테마 생성 스크립트
\`\`\`

## CSS 격리

모든 스타일은 `.mindgarden-design-system` 클래스로 스코프되어 기존 프로젝트 CSS와 충돌하지 않습니다.

\`\`\`css
.mindgarden-design-system {
  --cream: #F5F5DC;
  --warm-cream: #FDF5E6;
  --beige: #F5F5DC;
  /* ... */
}
\`\`\`

## 독립적으로 사용하기

다른 프로젝트에서 MindGarden 컴포넌트를 사용하려면:

\`\`\`jsx
import { MindGardenWrapper } from '@/components/mindgarden/standalone-wrapper'
import { ButtonShowcase } from '@/components/mindgarden/button-showcase'

function MyPage() {
  return (
    <MindGardenWrapper>
      <ButtonShowcase />
    </MindGardenWrapper>
  )
}
\`\`\`

## 테마 설정

### 프리셋 테마
- MindGarden (기본) - 크림, 베이지, 올리브 그린, 민트
- 오션 블루 - 시원한 바다 색상
- 선셋 오렌지 - 따뜻한 노을 색상
- 라벤더 드림 - 부드러운 보라색
- 포레스트 그린 - 자연의 초록색

### 커스텀 테마
1. 테마 설정 버튼 클릭 (오른쪽 하단 팔레트 아이콘)
2. 커스텀 색상 섹션에서 원하는 색상 선택
3. "커스텀 색상 적용" 버튼 클릭
4. JSON 파일로 내보내기/가져오기 가능

### 테마 스크립트 실행

\`\`\`bash
node scripts/generate-theme.js
\`\`\`

모든 테마 프리셋의 CSS 변수와 JSON 데이터를 콘솔에 출력합니다.

## 컴포넌트 목록

1. 히어로 섹션
2. 통계 대시보드
3. 타이포그래피
4. 버튼 (8가지 변형)
5. 카드 (6가지 변형)
6. 폼 (Input, Textarea, Select, Checkbox, Radio, Switch, Slider, DatePicker)
7. 모달 (4가지 타입)
8. 로딩 상태 (5가지 타입)
9. 내담자 카드
10. 차트 (5가지 타입)
11. 네비게이션 (3가지 타입)
12. 알림 시스템 (4가지 타입)
13. 테이블
14. 캘린더
15. 아코디언
16. 색상 팔레트

## 모바일 최적화

- 반응형 디자인 (모바일, 태블릿, 데스크톱)
- 터치 친화적인 버튼 크기 (최소 44px)
- 햄버거 메뉴 (모바일)
- 가로 스크롤 테이블 (모바일)
- 반응형 텍스트 크기

## 기술 스택

- React (JavaScript)
- shadcn/ui
- Lucide React (아이콘)
- Tailwind CSS
- Recharts (차트)

## 라이선스

MIT
