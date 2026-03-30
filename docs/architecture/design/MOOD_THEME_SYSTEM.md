# 분위기 테마 시스템 가이드 🎨

## 📋 개요

MindGarden의 **분위기 테마 시스템**은 전체 UI를 바꾸지 않고 **분위기만 바뀌는** 간단하고 세련된 테마 시스템입니다.

### 🎯 설계 원칙
- **최소한의 변경**: 기본 레이아웃과 구조는 유지
- **분위기 중심**: 색상과 그림자로만 분위기 변경
- **부드러운 전환**: 0.3초 애니메이션으로 자연스러운 변화
- **확장 가능**: 새로운 분위기 쉽게 추가 가능

---

## 🎨 분위기 종류

### 1. 기본 분위기 (Default)
```css
[data-mood="default"] {
  --mood-accent: #007aff;        /* iOS 블루 */
  --mood-card-bg: rgba(255, 255, 255, 0.95);
  --mood-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```
- **느낌**: 깔끔하고 전문적인 iOS 스타일
- **사용**: 일반적인 상황, 기본 상태

### 2. 따뜻한 분위기 (Warm)
```css
[data-mood="warm"] {
  --mood-accent: #ff6b35;        /* 따뜻한 오렌지 */
  --mood-card-bg: rgba(255, 248, 245, 0.95);
  --mood-shadow: 0 2px 8px rgba(255, 107, 53, 0.12);
}
```
- **느낌**: 따뜻하고 친근한 느낌
- **사용**: 고객 상담, 친근한 커뮤니케이션

### 3. 차분한 분위기 (Cool)
```css
[data-mood="cool"] {
  --mood-accent: #34c759;        /* 차분한 그린 */
  --mood-card-bg: rgba(245, 255, 248, 0.95);
  --mood-shadow: 0 2px 8px rgba(52, 199, 89, 0.12);
}
```
- **느낌**: 차분하고 안정적인 느낌
- **사용**: 집중이 필요한 작업, 분석 대시보드

### 4. 우아한 분위기 (Elegant)
```css
[data-mood="elegant"] {
  --mood-accent: #5856d6;        /* 우아한 퍼플 */
  --mood-card-bg: rgba(248, 247, 255, 0.95);
  --mood-shadow: 0 2px 8px rgba(88, 86, 214, 0.12);
}
```
- **느낌**: 우아하고 고급스러운 느낌
- **사용**: 프리미엄 서비스, 고급 기능

### 5. 에너지 분위기 (Energetic)
```css
[data-mood="energetic"] {
  --mood-accent: #ff2d92;        /* 에너지틱한 핑크 */
  --mood-card-bg: rgba(255, 245, 252, 0.95);
  --mood-shadow: 0 2px 8px rgba(255, 45, 146, 0.12);
}
```
- **느낌**: 활기차고 역동적인 느낌
- **사용**: 동기부여, 에너지가 필요한 상황

---

## 🔧 사용 방법

### 1. HTML에 분위기 적용
```html
<html data-mood="warm">
  <!-- 따뜻한 분위기 적용 -->
</html>
```

### 2. JavaScript로 분위기 변경
```javascript
// 분위기 변경
document.documentElement.setAttribute('data-mood', 'cool');

// 현재 분위기 확인
const currentMood = document.documentElement.getAttribute('data-mood');
```

### 3. React 훅 사용
```javascript
import { useMoodTheme } from '../hooks/useTheme';

function MyComponent() {
  const { currentMood, setMood, availableMoods } = useMoodTheme();
  
  return (
    <div>
      <button onClick={() => setMood('warm')}>따뜻한 분위기</button>
      <button onClick={() => setMood('cool')}>차분한 분위기</button>
    </div>
  );
}
```

---

## 🎨 CSS 변수 시스템

### 기본 변수 구조
```css
[data-mood="분위기명"] {
  /* 액센트 색상 */
  --mood-accent: #색상코드;
  --mood-accent-light: rgba(색상코드, 0.1);
  --mood-accent-dark: #어두운색상;
  
  /* 카드 스타일 */
  --mood-card-bg: rgba(배경색, 0.95);
  --mood-card-border: rgba(테두리색, 0.08);
  --mood-shadow: 0 2px 8px rgba(그림자색, 0.12);
  
  /* 텍스트 색상 */
  --mood-text-primary: #주텍스트색;
  --mood-text-secondary: #보조텍스트색;
}
```

### 자동 적용되는 컴포넌트
- `.data-card` - 데이터 카드
- `.stat-card` - 통계 카드
- `.btn--primary` - 기본 버튼
- `.stat-card__icon--primary` - 기본 아이콘
- `.notification-item--info` - 정보 알림
- `.activity-item__status--active` - 활성 상태

---

## 🚀 새 분위기 추가하기

### 1. CSS 변수 정의
```css
/* 새 분위기 추가 */
[data-mood="new-mood"] {
  --mood-accent: #새로운색상;
  --mood-accent-light: rgba(새로운색상, 0.1);
  --mood-accent-dark: #어두운버전;
  
  --mood-card-bg: rgba(배경색, 0.95);
  --mood-card-border: rgba(테두리색, 0.08);
  --mood-shadow: 0 2px 8px rgba(그림자색, 0.12);
  
  --mood-text-primary: #주텍스트색;
  --mood-text-secondary: #보조텍스트색;
}
```

### 2. 훅에 새 분위기 등록
```javascript
// useMoodTheme.js에서
const AVAILABLE_MOODS = [
  'default', 'warm', 'cool', 'elegant', 'energetic', 'new-mood'
];
```

### 3. 분위기 선택 UI 업데이트
```javascript
const moodOptions = [
  { value: 'default', label: '기본', icon: '🔵' },
  { value: 'warm', label: '따뜻한', icon: '🟠' },
  { value: 'cool', label: '차분한', icon: '🟢' },
  { value: 'elegant', label: '우아한', icon: '🟣' },
  { value: 'energetic', label: '에너지', icon: '🟡' },
  { value: 'new-mood', label: '새분위기', icon: '⭐' }
];
```

---

## 📱 반응형 대응

### 모바일 최적화
```css
@media (max-width: 768px) {
  [data-mood] .data-card {
    /* 모바일에서 그림자 약화 */
    --mood-shadow: 0 1px 4px rgba(색상, 0.08);
  }
}
```

### 접근성 고려
```css
/* 애니메이션 비활성화 */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

---

## 🎯 활용 예시

### 1. 시간대별 자동 분위기
```javascript
const getMoodByTime = () => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) return 'warm';    // 아침: 따뜻한
  if (hour >= 12 && hour < 18) return 'default'; // 오후: 기본
  if (hour >= 18 && hour < 22) return 'cool';   // 저녁: 차분한
  return 'elegant';                             // 밤: 우아한
};
```

### 2. 사용자 역할별 분위기
```javascript
const getMoodByRole = (userRole) => {
  const moodMap = {
    'admin': 'elegant',      // 관리자: 우아한
    'consultant': 'warm',    // 상담사: 따뜻한
    'client': 'cool',        // 고객: 차분한
    'supervisor': 'default'  // 감독자: 기본
  };
  return moodMap[userRole] || 'default';
};
```

### 3. 작업 유형별 분위기
```javascript
const getMoodByTask = (taskType) => {
  const moodMap = {
    'analysis': 'cool',      // 분석: 차분한
    'communication': 'warm', // 소통: 따뜻한
    'management': 'elegant', // 관리: 우아한
    'creative': 'energetic'  // 창작: 에너지
  };
  return moodMap[taskType] || 'default';
};
```

---

## 📊 성능 최적화

### CSS 변수 캐싱
```javascript
// 분위기 변경 시 CSS 변수 미리 로드
const preloadMoodVariables = (mood) => {
  const style = document.createElement('style');
  style.textContent = `[data-mood="${mood}"] { /* 변수 정의 */ }`;
  document.head.appendChild(style);
};
```

### 부드러운 전환
```css
/* 전역 전환 설정 */
* {
  transition: 
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease;
}
```

---

## 🔍 테스트 방법

### 1. 분위기 전환 테스트
```javascript
// 모든 분위기 순차 테스트
const testAllMoods = () => {
  const moods = ['default', 'warm', 'cool', 'elegant', 'energetic'];
  
  moods.forEach((mood, index) => {
    setTimeout(() => {
      document.documentElement.setAttribute('data-mood', mood);
      console.log(`Testing mood: ${mood}`);
    }, index * 1000);
  });
};
```

### 2. 시각적 일관성 확인
- [ ] 모든 카드가 동일한 분위기 적용
- [ ] 버튼 색상이 액센트 색상과 일치
- [ ] 그림자와 테두리가 분위기에 맞게 변경
- [ ] 텍스트 가독성 유지

---

## 📝 체크리스트

### 개발 시 확인사항
- [ ] 새 분위기 CSS 변수 정의
- [ ] 컴포넌트 자동 적용 확인
- [ ] 전환 애니메이션 테스트
- [ ] 반응형 대응 확인
- [ ] 접근성 고려사항 적용

### 배포 전 확인사항
- [ ] 모든 분위기 정상 작동
- [ ] localStorage 저장/로드 확인
- [ ] 성능 영향 측정
- [ ] 사용자 피드백 수집

---

## 🎨 디자인 가이드라인

### 색상 선택 원칙
1. **가독성 우선**: 텍스트와 배경 대비 충분
2. **브랜드 일관성**: 기존 색상 팔레트와 조화
3. **감정적 연관성**: 분위기에 맞는 색상 선택
4. **접근성 고려**: 색맹 사용자도 구분 가능

### 그림자 사용법
- **기본**: `0 2px 8px rgba(색상, 0.08)`
- **강조**: `0 2px 8px rgba(색상, 0.12)`
- **모바일**: `0 1px 4px rgba(색상, 0.08)`

### 투명도 활용
- **카드 배경**: `rgba(색상, 0.95)` - 약간의 투명도로 깊이감
- **경계선**: `rgba(색상, 0.08)` - 부드러운 경계
- **배경**: `rgba(색상, 0.1)` - 은은한 강조

---

**작성일**: 2025-10-03  
**작성자**: AI Assistant  
**버전**: 1.0  
**상태**: 완료

**업데이트**: 2025-10-03 - 분위기 테마 시스템 가이드 작성 완료

