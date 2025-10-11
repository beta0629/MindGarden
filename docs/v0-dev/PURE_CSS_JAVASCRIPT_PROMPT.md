# MindGarden 디자인 시스템 - 순수 CSS + JavaScript 프롬프트

## 🎯 프로젝트 컨텍스트 (중요!)
**우리 프로젝트는 React + Create React App을 사용합니다. Next.js가 아닙니다!**

### 기술 스택:
- **Framework**: React 18.2.0 with Create React App (NOT Next.js, NOT Vite)
- **Build Tool**: react-scripts 5.0.1 (Create React App)
- **PostCSS**: Standard configuration with autoprefixer only
- **File Structure**: Standard React components in `src/components/`
- **Import paths**: Relative paths only (`../components/...`)
- **Installed packages**: lucide-react, @radix-ui/*, clsx, tailwind-merge

## 📋 v0.dev 프롬프트

```
**PROJECT CONTEXT - MUST FOLLOW:**
- Framework: React 18.2.0 with Create React App (NOT Next.js, NOT Vite)
- Build Tool: react-scripts 5.0.1 (Create React App)
- PostCSS: Standard configuration (autoprefixer only)
- NO Tailwind CSS
- NO TypeScript
- File Structure: src/components/
- Import paths: Relative paths only
- Installed packages: lucide-react, @radix-ui/*, clsx, tailwind-merge

Create a complete MindGarden design system showcase page with these requirements:

**CRITICAL REQUIREMENTS:**
- Use ONLY React components with .jsx extensions (NO TypeScript)
- Use Create React App structure (NO Next.js files)
- Use 100% pure CSS only (NO Tailwind CSS at all)
- ALL imports must be relative paths (../components/ui/button)
- Include ALL CSS in a single styles.css file as pure CSS
- NO @tailwind directives
- NO utility classes (bg-blue-500, p-4 등)

## CSS REQUIREMENTS:
- NO Tailwind CSS at all
- NO @tailwind directives  
- NO utility classes (bg-blue-500, p-4 등)
- 100% pure CSS only
- Use CSS custom properties (variables)
- Use CSS Grid and Flexbox for layouts
- Use CSS media queries for responsive design
- All styles in styles.css as pure CSS
- Use backdrop-filter for glassmorphism
- Use @keyframes for animations

## JAVASCRIPT REQUIREMENTS:
- React 18.2.0 syntax
- Use .jsx extensions (NOT .tsx)
- NO TypeScript syntax at all
- NO type annotations (: string, : number 등)
- NO interfaces or types
- Use useState, useEffect, useMemo, useCallback
- Use relative imports only (../components/...)
- NO absolute imports (@/...)
- Use lucide-react for icons (already installed)
- Use @radix-ui components (already installed)
- Compatible with react-scripts 5.0.1

## Color Palette (CSS Variables)
```css
:root {
  /* Main Colors */
  --cream: #F5F5DC;
  --light-beige: #FDF5E6;
  --cocoa: #8B4513;
  --olive-green: #808000;
  --mint-green: #98FB98;
  --soft-mint: #B6E5D8;
  
  /* Text Colors */
  --dark-gray: #2F2F2F;
  --medium-gray: #6B6B6B;
  --light-cream: #FFFEF7;
  
  /* Glass Effects */
  --glass-bg: rgba(255, 255, 255, 0.2);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-blur: 12px;
}
```

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
├── styles.css (all styles as pure CSS)
├── components/
│   ├── mindgarden/ (16개 쇼케이스 컴포넌트)
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
│   └── ui/ (16개 UI 컴포넌트)
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
└── utils.js (helper functions, NO TypeScript)
```

## Pure CSS Examples

**Glassmorphism Effect:**
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

**Gradient Text:**
```css
.gradient-text {
  background: linear-gradient(135deg, var(--olive-green), var(--mint-green));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Animations:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.5s ease-out;
}
```

**Responsive Design:**
```css
/* Desktop */
.sidebar {
  width: 256px;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
}

/* Mobile */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
}
```

## React Component Example
```jsx
// Pure JavaScript React Component
import { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import '../styles.css';

const Button = ({ children, variant = 'primary', size = 'medium', onClick, disabled = false }) => {
  return (
    <button 
      className={`mg-button mg-button-${variant} mg-button-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <section className="hero-section">
      <div className="glass-card">
        <div className="welcome-badge">
          <Sparkles className="icon" />
          <span>MindGarden에 오신 것을 환영합니다</span>
        </div>
        <h1 className="gradient-text">마음을 가꾸고, 웰니스를 키워가세요</h1>
        <p className="description">당신의 여정을 진심으로 응원하는 전문 상담사와 함께하는 따뜻한 정신 건강 지원 공간입니다.</p>
        <div className="button-container">
          <Button variant="primary">시작하기</Button>
          <Button variant="outline">자세히 알아보기</Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
```

## Technical Requirements
- Use ONLY JavaScript (.js/.jsx files, NO .ts/.tsx)
- Use relative imports ONLY (../components/... not @/components/...)
- NO absolute imports (@/...)
- Include ALL CSS in a single styles.css file as pure CSS
- Use CSS custom properties for colors
- Use CSS Grid and Flexbox for layouts
- Use CSS media queries for responsive design
- Make it responsive (mobile, tablet, desktop)
- Include glassmorphism effects with backdrop-filter
- Add smooth animations and transitions with @keyframes
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

## FORBIDDEN (절대 사용 금지):
❌ Tailwind CSS classes
❌ @tailwind directives
❌ TypeScript syntax (: type, interface, type 등)
❌ .tsx files
❌ Absolute imports (@/...)
❌ Next.js specific code (app/, layout.tsx 등)
❌ Vite specific code
❌ @import "tailwindcss"
❌ @custom-variant, @theme inline, @apply

## REQUIRED (반드시 포함):
✅ Pure CSS only in styles.css
✅ Pure JavaScript React (.jsx)
✅ React 18.2.0 hooks (useState, useEffect 등)
✅ Relative imports (../components/...)
✅ CSS variables for colors
✅ CSS Grid/Flexbox for layouts
✅ CSS media queries for responsive
✅ lucide-react icons
✅ @radix-ui components (optional)
✅ Glassmorphism with backdrop-filter
✅ Animations with @keyframes
✅ Mobile-first responsive design

## Important Notes
- **MUST be compatible with Create React App (NOT Next.js, NOT Vite)**
- **MUST use 100% pure CSS (NO Tailwind CSS at all)**
- **MUST use pure JavaScript (NO TypeScript at all)**
- DO NOT use any TypeScript syntax
- DO NOT use absolute imports (@/...)
- DO NOT modify the color palette
- ALL imports must be relative paths (../components/...)
- Use ONLY pure CSS - NO Tailwind CSS classes at all
- Use regular CSS classes and custom properties
- NO @tailwind, @apply, or any Tailwind directives
- NO Tailwind utility classes (like bg-blue-500, p-4, etc.)
- Include all styles in styles.css as regular CSS
- Use CSS Grid and Flexbox for layouts
- Use CSS media queries for responsive design
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
├── styles.css (모든 스타일을 순수 CSS로)
├── components/
│   ├── mindgarden/ (16개 쇼케이스 컴포넌트)
│   └── ui/ (16개 UI 컴포넌트)
└── utils.js (헬퍼 함수)
```

## ⚠️ 주의사항
- **Create React App 구조 사용 (Next.js, Vite 금지)**
- **순수 CSS만 사용 (Tailwind CSS 완전 금지)**
- **순수 JavaScript만 사용 (TypeScript 완전 금지)**
- 절대 경로 import 금지
- 색상 팔레트 수정 금지
- 완전한 JavaScript로만 작성
- 순수 CSS만 사용 (Tailwind CSS 완전 금지)
- @tailwind, @apply 등 모든 Tailwind 지시어 금지
- Tailwind 유틸리티 클래스 금지 (bg-blue-500, p-4 등)
- 모든 CSS는 styles.css에 순수 CSS로 포함
- CSS Grid와 Flexbox로 레이아웃 구성
- CSS 미디어 쿼리로 반응형 디자인
- 글라스모피즘 효과 포함
- 애니메이션 및 트랜지션 포함

이 프롬프트를 v0.dev에 입력하면 완전한 순수 CSS + JavaScript 샘플을 받을 수 있습니다.
