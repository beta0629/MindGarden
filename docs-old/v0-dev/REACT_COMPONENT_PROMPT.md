# MindGarden 디자인 시스템 - React 컴포넌트 프롬프트

## 🎯 v0.dev 요청 프롬프트

다음 프롬프트를 v0.dev에서 사용하여 MindGarden 디자인 시스템을 React 컴포넌트로 생성하세요:

---

## 📋 프롬프트

```
MindGarden 베이지/크림 디자인 시스템을 React 컴포넌트로 만들어줘.

**요구사항:**
- TypeScript 사용
- shadcn/ui 컴포넌트 활용 (Card, Button, Tabs, Progress, Badge, Input, Label, Textarea, Select)
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

3. 인터랙티브 컴포넌트 (Tabs)
   - 탭: 버튼, 폼, 테이블, 진행률
   - 버튼 섹션: Primary, Secondary, Status 버튼들
   - 폼 섹션: Input, Textarea, Select, Label
   - 테이블 섹션: 사용자 목록 테이블
   - 진행률 섹션: Progress 바들

4. 컬러 팔레트
   - 베이지/크림 계열 (메인)
   - 올리브 그린 계열 (서브)
   - 각 색상에 헥스 코드 표시

5. 푸터
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

전체적으로 따뜻하고 편안한 느낌의 상담 플랫폼 UI 컴포넌트로 만들어줘.
```

---

## 🔧 생성 후 작업

1. **컴포넌트 파일 생성**
   ```bash
   # 생성된 코드를 다음 파일에 저장
   frontend/src/components/v0-results/mindgarden-design-system/components/mindgarden/beige-cream-showcase.tsx
   ```

2. **의존성 설치**
   ```bash
   cd frontend
   npm install lucide-react
   npx shadcn@latest add card button tabs progress badge input label textarea select
   ```

3. **페이지에 적용**
   ```javascript
   // MindGardenDesignSystemShowcase.js에서 import
   import BeigeCreamShowcase from '../components/v0-results/mindgarden-design-system/components/mindgarden/beige-cream-showcase';
   
   // 컴포넌트 사용
   return <BeigeCreamShowcase />;
   ```

---

## 📝 참고사항

- **TypeScript**: 원본에서 TypeScript 사용
- **shadcn/ui**: 모든 UI 컴포넌트는 shadcn/ui 사용
- **Lucide React**: 아이콘은 Lucide React 사용
- **Tailwind CSS**: 스타일링은 Tailwind CSS 클래스 사용
- **반응형**: 모바일, 태블릿, 데스크톱 대응

이 프롬프트를 v0.dev에서 사용하면 정확한 React 컴포넌트가 생성됩니다.
