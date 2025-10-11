# MindGarden Design System

심리 상담 플랫폼을 위한 순수 React 디자인 시스템입니다.

## 기술 스택

- **React 18** - 순수 React (Next.js 아님)
- **Vite** - 빠른 개발 서버
- **Tailwind CSS v3.4.17** - 유틸리티 CSS 프레임워크
- **Radix UI** - 접근성 최적화 컴포넌트
- **Lucide React** - 아이콘 라이브러리
- **Recharts** - 차트 라이브러리

## 설치 및 실행

\`\`\`bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
\`\`\`

## 색상 팔레트

- **Cream**: #F5F5DC - 메인 배경색
- **Light Beige**: #FDF5E6 - 보조 배경색
- **Cocoa**: #8B4513 - 텍스트 및 강조색
- **Olive Green**: #808000 - 버튼 및 액센트
- **Mint Green**: #98FB98 - 포인트 색상
- **Soft Mint**: #B6E5D8 - 부드러운 액센트

## 컴포넌트

16개의 쇼케이스 섹션:
1. 히어로 섹션
2. 통계 대시보드
3. 타이포그래피
4. 버튼
5. 카드
6. 폼
7. 모달
8. 로딩 상태
9. 내담자 카드
10. 차트
11. 네비게이션
12. 알림
13. 테이블
14. 캘린더
15. 아코디언
16. 색상 팔레트

## 특징

- ✨ 글라스모피즘 디자인
- 📱 완전한 반응형 레이아웃
- 🎨 부드러운 애니메이션
- ♿ 접근성 최적화
- 📲 모바일 친화적
- 🎯 순수 JavaScript (TypeScript 없음)
- 🚀 Vite 기반 빠른 개발 환경

## 프로젝트 구조

\`\`\`
mindgarden-design-system/
├── src/
│   ├── App.jsx                    # 메인 앱 컴포넌트
│   ├── main.jsx                   # React 진입점
│   ├── index.css                  # Tailwind CSS 설정
│   ├── components/
│   │   ├── mindgarden/           # 쇼케이스 컴포넌트
│   │   └── ui/                   # 재사용 가능한 UI 컴포넌트
│   └── lib/
│       └── utils.js              # 유틸리티 함수
├── index.html                     # HTML 진입점
├── vite.config.js                # Vite 설정
├── tailwind.config.js            # Tailwind 설정
└── postcss.config.js             # PostCSS 설정
\`\`\`

## 라이선스

MIT
