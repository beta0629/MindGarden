# MindGarden Design System - React 버전

순수 React + Vite 프로젝트로 변환되었습니다.

## 설치 방법

\`\`\`bash
npm install
npm run dev
\`\`\`

## 주요 변경사항

1. **Next.js → React + Vite**
   - app/page.jsx → src/App.jsx
   - app/layout.jsx 제거
   - index.html, src/main.jsx 추가

2. **Tailwind CSS v3 사용**
   - @tailwind base/components/utilities
   - tailwind.config.js 설정

3. **Import 경로**
   - 모든 컴포넌트: `./components/...`
   - 상대 경로 사용

4. **실행 명령어**
   - 개발: `npm run dev`
   - 빌드: `npm run build`
   - 프리뷰: `npm run preview`

## 폴더 구조

\`\`\`
├── index.html
├── src/
│   ├── main.jsx (진입점)
│   ├── App.jsx (메인 컴포넌트)
│   ├── index.css (Tailwind CSS)
│   ├── components/
│   │   ├── mindgarden/ (16개 쇼케이스)
│   │   └── ui/ (shadcn/ui 컴포넌트)
│   └── lib/
│       └── utils.jsx
├── package.json
├── vite.config.js
└── tailwind.config.js
\`\`\`

## 특징

- 순수 React (Next.js 의존성 없음)
- Vite 빌드 시스템 (빠른 개발 서버)
- Tailwind CSS v3
- 모든 컴포넌트 .jsx 확장자
- 상대 경로 import
