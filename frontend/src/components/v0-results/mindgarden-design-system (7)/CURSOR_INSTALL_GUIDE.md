# MindGarden 디자인 시스템 - Cursor 설치 가이드

## 1단계: 새 Next.js 프로젝트 생성

\`\`\`bash
npx create-next-app@latest mindgarden-design-system
cd mindgarden-design-system
\`\`\`

설치 옵션:
- TypeScript? **No** (JavaScript 사용)
- ESLint? Yes
- Tailwind CSS? Yes
- `src/` directory? No
- App Router? Yes
- Turbopack? Yes (선택사항)

## 2단계: 필수 패키지 설치

\`\`\`bash
npm install lucide-react recharts date-fns
\`\`\`

## 3단계: shadcn/ui 설치

\`\`\`bash
npx shadcn@latest init
\`\`\`

설치 옵션:
- Style: Default
- Base color: Slate
- CSS variables: Yes

필요한 컴포넌트 설치:
\`\`\`bash
npx shadcn@latest add button card input label select textarea checkbox radio-group switch slider accordion dialog tabs table
\`\`\`

## 4단계: 파일 구조

v0에서 생성된 프로젝트의 파일 구조:

\`\`\`
mindgarden-design-system/
├── app/
│   ├── page.jsx                 # 메인 페이지
│   ├── layout.tsx               # 루트 레이아웃
│   └── globals.css              # 전역 스타일 (MindGarden CSS 포함)
├── components/
│   ├── mindgarden/              # MindGarden 컴포넌트들
│   │   ├── hero-section.jsx
│   │   ├── stats-dashboard.jsx
│   │   ├── typography-showcase.jsx
│   │   ├── button-showcase.jsx
│   │   ├── card-showcase.jsx
│   │   ├── form-showcase.jsx
│   │   ├── modal-showcase.jsx
│   │   ├── loading-showcase.jsx
│   │   ├── client-card-showcase.jsx
│   │   ├── chart-showcase.jsx
│   │   ├── navigation-showcase.jsx
│   │   ├── notification-showcase.jsx
│   │   ├── table-showcase.jsx
│   │   ├── calendar-showcase.jsx
│   │   ├── accordion-showcase.jsx
│   │   ├── color-palette-showcase.jsx
│   │   ├── theme-settings.jsx
│   │   └── standalone-wrapper.jsx
│   └── ui/                      # shadcn/ui 컴포넌트들
├── scripts/
│   └── generate-theme.js        # 테마 생성 스크립트
├── MINDGARDEN_README.md         # 사용 가이드
└── package.json
\`\`\`

## 5단계: v0에서 코드 가져오기

### 방법 1: v0 UI에서 다운로드
1. v0 채팅 화면에서 "Restore" 버튼 클릭
2. 오른쪽 상단 점 3개(⋮) 메뉴 클릭
3. "Download ZIP" 선택
4. 압축 해제 후 파일 복사

### 방법 2: 파일별로 복사
v0 채팅에서 각 파일의 코드를 복사하여 Cursor에 붙여넣기

주요 파일:
- `app/page.jsx` - 메인 컴포넌트
- `app/globals.css` - MindGarden 스타일
- `components/mindgarden/*.jsx` - 모든 컴포넌트 파일들

## 6단계: 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 `http://localhost:3000` 열기

## 7단계: 독립 컴포넌트로 사용하기

다른 프로젝트에 통합하려면:

\`\`\`jsx
import { MindGardenWrapper } from './components/mindgarden/standalone-wrapper'
import { HeroSection } from './components/mindgarden/hero-section'

function MyApp() {
  return (
    <MindGardenWrapper>
      <HeroSection />
      {/* 다른 MindGarden 컴포넌트들 */}
    </MindGardenWrapper>
  )
}
\`\`\`

## 주요 기능

### 색상 팔레트
- 메인: 크림 `#F5F5DC`, 베이지 `#F5E6D3`
- 서브: 올리브 그린 `#808000`, 민트 `#98FF98`

### 테마 설정
- 오른쪽 하단 팔레트 버튼으로 테마 변경
- 5가지 프리셋 테마 제공
- 커스텀 색상 설정 가능
- JSON 내보내기/가져오기

### CSS 격리
- 모든 스타일이 `.mindgarden-design-system` 클래스로 스코프됨
- 다른 프로젝트 CSS와 충돌 없음

### 모바일 최적화
- 햄버거 메뉴
- 터치 친화적 UI (최소 44px)
- 반응형 레이아웃

## 문제 해결

### 컴포넌트가 보이지 않는 경우
- `npm install` 실행 확인
- shadcn/ui 컴포넌트 설치 확인
- import 경로 확인 (`@/components/...`)

### 스타일이 적용되지 않는 경우
- `app/globals.css`에 MindGarden CSS 포함 확인
- 최상위 div에 `mindgarden-design-system` 클래스 추가 확인

### 테마 버튼이 보이지 않는 경우
- `ThemeSettings` 컴포넌트가 `app/page.jsx`에 포함되어 있는지 확인
- z-index 충돌 확인

## 추가 리소스

- [MINDGARDEN_README.md](./MINDGARDEN_README.md) - 전체 사용 가이드
- [scripts/generate-theme.js](./scripts/generate-theme.js) - 테마 데이터 확인

## 지원

문제가 발생하면 v0 채팅에서 질문하세요!
