# MindGarden 디자인 시스템 - React 호환 프롬프트

## 🎯 프로젝트 컨텍스트 (중요!)
**우리 프로젝트는 React + Create React App을 사용합니다. Next.js가 아닙니다!**

### 기술 스택:
- **Framework**: React with Create React App (NOT Next.js, NOT Vite)
- **Build Tool**: react-scripts (Create React App)
- **Tailwind CSS**: v3.4.1 (NOT v4)
- **PostCSS**: Standard configuration with `tailwindcss: {}`
- **File Structure**: Standard React components in `src/components/`
- **Import paths**: Relative paths only (`../components/...`)

## 📋 v0.dev 프롬프트

```
**PROJECT CONTEXT - MUST FOLLOW:**
- Framework: React with Create React App (NOT Next.js, NOT Vite)
- Build Tool: react-scripts (Create React App)
- Tailwind CSS: v3.4.1 (NOT v4)
- PostCSS: Standard configuration with tailwindcss: {}
- File Structure: Standard React components in src/components/
- Import paths: Relative paths only (../components/...)

Create a simple MindGarden design system showcase with these requirements:

**CRITICAL REQUIREMENTS:**
- Use ONLY React components with .jsx extensions (NO TypeScript)
- Use Create React App structure (NO Next.js files)
- Use Tailwind CSS v3.4.1 syntax ONLY
- Use @tailwind base; @tailwind components; @tailwind utilities;
- ALL imports must be relative paths (../components/ui/button)
- Include ALL CSS in a single styles.css file

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

## File Structure (Create React App compatible)
```
mindgarden-design-system/
├── MindGardenDesignSystem.jsx (main component)
├── styles.css (all styles with @tailwind directives)
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

## Technical Requirements
- Use ONLY JavaScript (.js/.jsx files, NO .ts/.tsx)
- Use relative imports ONLY (../components/... not @/components/...)
- NO absolute imports (@/...)
- Include ALL CSS in a single styles.css file
- Use Tailwind CSS v3.4.1 classes with @tailwind directives
- Make it responsive (mobile, tablet, desktop)
- Include glassmorphism effects
- Add smooth animations and transitions
- Use the exact color palette specified above
- ALL import paths must be relative (../components/ui/button, not @/components/ui/button)

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
- **MUST be compatible with Create React App (NOT Next.js, NOT Vite)**
- **MUST use Tailwind CSS v3.4.1 syntax ONLY**
- DO NOT use any TypeScript syntax
- DO NOT use absolute imports (@/...)
- DO NOT modify the color palette
- ALL imports must be relative paths (../components/...)
- Use @tailwind base; @tailwind components; @tailwind utilities; in styles.css
- NO @import "tailwindcss", @custom-variant, @theme inline, @apply, or other v4 syntax
- Include ALL necessary dependencies in package.json
- Make sure all components are fully functional
- Use semantic HTML elements
- Include proper accessibility attributes
- Make it production-ready
- Test all import paths before submitting

Please create a complete, working design system that can be directly integrated into a Create React App project without any modifications.
```

## 🎨 색상 팔레트 상세
- **Cream (#F5F5DC)**: 메인 배경색
- **Light Beige (#FDF5E6)**: 보조 배경색
- **Cocoa (#8B4513)**: 텍스트 및 강조색
- **Olive Green (#808000)**: 버튼 및 액센트 색상
- **Mint Green (#98FB98)**: 포인트 색상
- **Soft Mint (#B6E5D8)**: 부드러운 액센트

## ⚠️ 주의사항
- **Create React App 구조 사용 (Next.js, Vite 금지)**
- **Tailwind CSS v3.4.1 문법만 사용 (v4 금지)**
- TypeScript 사용 금지
- 절대 경로 import 금지
- 색상 팔레트 수정 금지
- 완전한 JavaScript로만 작성
- @tailwind 지시어 사용 (NOT @import "tailwindcss")
- @custom-variant, @theme inline, @apply 등 v4 문법 금지
- 모든 CSS는 styles.css에 포함
- 반응형 디자인 필수
- 글라스모피즘 효과 포함
- 애니메이션 및 트랜지션 포함

이 프롬프트를 v0.dev에 입력하면 Create React App과 완벽하게 호환되는 디자인을 받을 수 있습니다.
