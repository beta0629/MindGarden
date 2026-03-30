# MindGarden 디자인 시스템 - 완전한 JavaScript 샘플 프롬프트

## 🎯 요청사항
**중요: 이 디자인을 정확히 그대로 적용해야 하므로, 색상이나 스타일을 임의로 수정하지 마세요.**

## 📋 프롬프트

```
Create a complete MindGarden design system showcase page in pure JavaScript React (NO TypeScript, NO Next.js) with the following requirements:

**IMPORTANT: Use Create React App structure, NOT Next.js**
- Use React components with .jsx extensions
- NO Next.js specific files (layout.jsx, page.jsx, etc.)
- NO Next.js imports or routing
- Use standard React patterns and hooks

## Color Palette
- Main: Cream (#F5F5DC), Light Beige (#FDF5E6)
- Sub: Cocoa (#8B4513), Olive Green (#808000)
- Accent: Mint Green (#98FB98), Soft Mint (#B6E5D8)

## Components to Include
1. Hero Section with glassmorphism effect
2. Statistics Dashboard with glass cards
3. Typography showcase
4. Button variations (primary, secondary, outline, ghost)
5. Card components (basic, glass, gradient, floating, border, animation)
6. Form components (input, textarea, select, checkbox, radio, switch, slider)
7. Modal components (basic, confirm)
8. Loading states
9. Client cards
10. Chart components
11. Navigation
12. Notifications
13. Table
14. Calendar
15. Accordion
16. Color palette showcase

## Technical Requirements
- Use ONLY JavaScript (.js/.jsx files, NO .ts/.tsx)
- Use relative imports ONLY (../components/... not @/components/...)
- NO absolute imports (@/...)
- Include ALL CSS in a single globals.css file
- **Use Tailwind CSS v3 syntax (NOT v4)**
- Use @tailwind directives (NOT @import "tailwindcss")
- NO @custom-variant, @theme inline, or other v4-specific syntax
- Make it responsive (mobile, tablet, desktop)
- Include glassmorphism effects
- Add smooth animations and transitions
- Use the exact color palette specified above
- ALL import paths must be relative (../components/ui/button, not @/components/ui/button)

## File Structure (Create React App compatible)
```
mindgarden-design-system/
├── MindGardenDesignSystem.jsx (main component)
├── styles.css (all styles)
├── components/
│   ├── mindgarden/
│   │   ├── HeroSection.jsx
│   │   ├── StatsDashboard.jsx
│   │   ├── TypographyShowcase.jsx
│   │   ├── ButtonShowcase.jsx
│   │   ├── CardShowcase.jsx
│   │   ├── FormShowcase.jsx
│   │   ├── ModalShowcase.jsx
│   │   ├── LoadingShowcase.jsx
│   │   ├── ClientCardShowcase.jsx
│   │   ├── ChartShowcase.jsx
│   │   ├── NavigationShowcase.jsx
│   │   ├── NotificationShowcase.jsx
│   │   ├── TableShowcase.jsx
│   │   ├── CalendarShowcase.jsx
│   │   ├── AccordionShowcase.jsx
│   │   └── ColorPaletteShowcase.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Input.jsx
│       ├── Textarea.jsx
│       ├── Select.jsx
│       ├── Checkbox.jsx
│       ├── Radio.jsx
│       ├── Switch.jsx
│       ├── Slider.jsx
│       ├── Modal.jsx
│       ├── Loading.jsx
│       ├── Chart.jsx
│       ├── Table.jsx
│       ├── Calendar.jsx
│       ├── Accordion.jsx
│       └── Notification.jsx
└── utils.js (helper functions)
```

## Design Requirements
- Professional and clean design
- Consistent spacing and typography
- Smooth hover effects
- Glassmorphism effects on cards and modals
- Gradient backgrounds
- Proper contrast ratios
- Mobile-first responsive design
- Loading states and animations
- Interactive elements

## Important Notes
- **DO NOT use Next.js - use Create React App structure**
- DO NOT use any TypeScript syntax
- DO NOT use absolute imports (@/...)
- DO NOT modify the color palette
- ALL imports must be relative paths (../components/...)
- **Use ONLY pure CSS - NO Tailwind CSS classes at all**
- **Use regular CSS classes and custom properties**
- **NO @tailwind, @apply, or any Tailwind directives**
- **NO Tailwind utility classes (like bg-blue-500, p-4, etc.)**
- Include all styles in styles.css as regular CSS
- Use CSS Grid and Flexbox for layouts
- Use CSS custom properties (--variable) for colors
- Make it responsive with CSS media queries
- Include ALL necessary dependencies in package.json
- Make sure all components are fully functional
- Use semantic HTML elements
- Include proper accessibility attributes
- Make it production-ready
- Test all import paths before submitting

Please create a complete, working design system that can be directly integrated into a React project without any modifications.
```

## 🎨 색상 팔레트 상세
- **Cream (#F5F5DC)**: 메인 배경색
- **Light Beige (#FDF5E6)**: 보조 배경색
- **Cocoa (#8B4513)**: 텍스트 및 강조색
- **Olive Green (#808000)**: 버튼 및 액센트 색상
- **Mint Green (#98FB98)**: 포인트 색상
- **Soft Mint (#B6E5D8)**: 부드러운 액센트

## 📁 폴더 구조 (Create React App 호환)
```
mindgarden-design-system/
├── MindGardenDesignSystem.jsx (메인 컴포넌트)
├── styles.css (모든 스타일)
├── components/
│   ├── mindgarden/ (16개 쇼케이스 컴포넌트)
│   └── ui/ (16개 UI 컴포넌트)
└── utils.js (헬퍼 함수)
```

## ⚠️ 주의사항
- **Next.js 사용 금지 - Create React App 구조 사용**
- TypeScript 사용 금지
- 절대 경로 import 금지
- 색상 팔레트 수정 금지
- 완전한 JavaScript로만 작성
- **순수 CSS만 사용 (Tailwind CSS 완전 금지)**
- **@tailwind, @apply 등 모든 Tailwind 지시어 금지**
- **Tailwind 유틸리티 클래스 금지 (bg-blue-500, p-4 등)**
- 모든 CSS는 styles.css에 순수 CSS로 포함
- CSS Grid와 Flexbox로 레이아웃 구성
- CSS 미디어 쿼리로 반응형 디자인
- 글라스모피즘 효과 포함
- 애니메이션 및 트랜지션 포함

이 프롬프트를 v0.dev에 입력하면 완전한 JavaScript 샘플을 받을 수 있습니다.
