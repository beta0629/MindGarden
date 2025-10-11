# MindGarden 빠른 시작 가이드

## Cursor에서 바로 시작하기

### 1. 프로젝트 생성 (30초)
\`\`\`bash
npx create-next-app@latest mindgarden --no-typescript --tailwind --app
cd mindgarden
npm install lucide-react recharts date-fns
npx shadcn@latest init -y
npx shadcn@latest add button card input label select textarea checkbox radio-group switch slider accordion dialog tabs table
\`\`\`

### 2. v0에서 코드 복사 (2분)

**필수 파일 3개만 복사하면 됩니다:**

1. **app/page.jsx** - v0 채팅에서 복사
2. **app/globals.css** - v0 채팅에서 복사  
3. **components/mindgarden/** 폴더 전체 - v0에서 다운로드

### 3. 실행 (5초)
\`\`\`bash
npm run dev
\`\`\`

## 가장 빠른 방법

v0 UI에서:
1. "Restore" 버튼 클릭
2. 오른쪽 상단 ⋮ 메뉴
3. "Download ZIP" 클릭
4. 압축 해제 후 Cursor에서 열기
5. `npm install && npm run dev`

끝!
