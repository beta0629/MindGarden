# MindGarden 디자인 시스템 - Cursor 설치 가이드

## 📋 요구사항 충족 확인

✅ **JavaScript만 사용** - 모든 파일이 .js 확장자
✅ **상대 경로 import** - @/ 대신 ../ 사용
✅ **단일 CSS 파일** - globals.css에 모든 스타일 포함
✅ **정확한 색상 팔레트** - Cursor 요청 색상 적용
  - Cream (#F5F5DC)
  - Light Beige (#FDF5E6)
  - Cocoa (#8B4513)
  - Olive Green (#808000)
  - Mint Green (#98FB98)
  - Soft Mint (#B6E5D8)

## 🚀 Cursor에서 설치하기

### 1단계: 프로젝트 다운로드
v0에서 "Download ZIP" 또는 GitHub로 푸시

### 2단계: Cursor에서 열기
\`\`\`bash
cd mindgarden-design-system
code .  # 또는 Cursor로 폴더 열기
\`\`\`

### 3단계: 의존성 설치
\`\`\`bash
npm install
\`\`\`

### 4단계: 개발 서버 실행
\`\`\`bash
npm run dev
\`\`\`

### 5단계: 브라우저에서 확인
http://localhost:3000

## 📁 파일 구조

\`\`\`
mindgarden-design-system/
├── app/
│   ├── page.js (메인 컴포넌트)
│   ├── layout.tsx
│   └── globals.css (모든 스타일)
├── components/
│   ├── mindgarden/ (16개 쇼케이스 컴포넌트)
│   │   ├── hero-section.js
│   │   ├── stats-dashboard.js
│   │   ├── typography-showcase.js
│   │   ├── button-showcase.js
│   │   ├── card-showcase.js
│   │   ├── form-showcase.js
│   │   ├── modal-showcase.js
│   │   ├── loading-showcase.js
│   │   ├── client-card-showcase.js
│   │   ├── chart-showcase.js
│   │   ├── navigation-showcase.js
│   │   ├── notification-showcase.js
│   │   ├── table-showcase.js
│   │   ├── calendar-showcase.js
│   │   ├── accordion-showcase.js
│   │   ├── color-palette-showcase.js
│   │   ├── theme-settings.js
│   │   └── standalone-wrapper.js
│   └── ui/ (shadcn/ui 컴포넌트)
│       ├── button.jsx
│       ├── card.jsx
│       ├── input.jsx
│       └── ... (기타 UI 컴포넌트)
├── lib/
│   └── utils.js (헬퍼 함수)
├── scripts/
│   └── generate-theme.js
└── package.json
\`\`\`

## 🎨 색상 팔레트 사용법

\`\`\`javascript
// CSS 변수로 사용
className="bg-[var(--cream)] text-[var(--cocoa)]"

// 직접 hex 코드 사용
className="bg-[#F5F5DC] text-[#8B4513]"

// Tailwind 클래스로 사용
className="bg-[#F5F5DC] hover:bg-[#FDF5E6]"
\`\`\`

## 🔧 커스터마이징

### 색상 변경
`app/globals.css`에서 CSS 변수 수정:
\`\`\`css
.mindgarden-design-system {
  --cream: #F5F5DC;
  --cocoa: #8B4513;
  /* ... */
}
\`\`\`

### 컴포넌트 추가
`components/mindgarden/` 폴더에 새 파일 생성

### 테마 설정
오른쪽 하단 팔레트 버튼으로 실시간 테마 변경

## 📦 주요 의존성

\`\`\`json
{
  "dependencies": {
    "react": "^19",
    "next": "^15",
    "lucide-react": "latest",
    "recharts": "^2",
    "date-fns": "^2"
  }
}
\`\`\`

## ⚠️ 주의사항

- TypeScript 파일 사용 금지
- 절대 경로 import 금지 (@/ 사용 안 함)
- 색상 팔레트 임의 수정 금지
- 모든 CSS는 globals.css에 작성

## 🆘 문제 해결

### Import 오류
- 상대 경로 확인: `../components/...`
- 파일 확장자 확인: `.js` 또는 `.jsx`

### 스타일 미적용
- `mindgarden-design-system` 클래스 확인
- globals.css import 확인

### 빌드 오류
\`\`\`bash
rm -rf .next node_modules
npm install
npm run dev
