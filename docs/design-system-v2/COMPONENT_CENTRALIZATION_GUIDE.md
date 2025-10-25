# MindGarden 컴포넌트 중앙화 가이드

## 📋 개요

MindGarden 디자인 시스템 v2.0의 컴포넌트 중앙화 전략을 설명합니다. **Presentational(UI) + Container(로직) 분리 패턴**을 적용하여 유지보수성과 일관성을 향상시킵니다.

## 🎯 핵심 전략

### 1. 컴포넌트 분리 패턴

#### Presentational Component (UI만)
```jsx
// components/ui/Card/Card.js
const Card = ({ children, variant = 'default' }) => {
  return (
    <div className={`mg-v2-card mg-v2-card--${variant}`}>
      {children}
    </div>
  );
};
```

#### Container Component (로직만)
```jsx
// components/admin/SessionManagement.js
const SessionManagement = () => {
  // 복잡한 비즈니스 로직 (건드리지 않음)
  const [sessions, setSessions] = useState([]);
  const fetchSessions = async () => { /* 복잡한 로직 */ };
  
  // UI만 공통 컴포넌트 사용
  return (
    <div className="mg-v2-dashboard-layout">
      <Card variant="stat">
        <CardHeader icon={<ICONS.CALENDAR />} title="회기 관리" />
        <CardContent>
          <span>{sessions.length}</span>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 2. 디렉토리 구조

```
frontend/src/
├── components/
│   ├── ui/  ← 새로 생성 (순수 UI, 재사용)
│   │   ├── Card/
│   │   │   ├── Card.js
│   │   │   ├── CardHeader.js
│   │   │   ├── CardContent.js
│   │   │   ├── CardFooter.js
│   │   │   ├── Card.css
│   │   │   └── index.js
│   │   ├── Button/
│   │   ├── Icon/
│   │   ├── Modal/
│   │   └── Table/
│   │
│   ├── admin/  ← 기존 (비즈니스 로직)
│   │   ├── SessionManagement.js  ← ui/ 컴포넌트 사용
│   │   └── AdminDashboard.js     ← ui/ 컴포넌트 사용
│   │
│   └── common/
│       └── MGButton.js  → ui/Button/으로 이동
```

## 🎨 CSS 네이밍 규칙

### 필수 규칙
```css
.mg-v2-{component}-{variant}-{state}

예시:
.mg-v2-card                    /* 기본 카드 */
.mg-v2-card-glass              /* 글래스 카드 */
.mg-v2-card-header             /* 카드 헤더 */
.mg-v2-button-primary          /* 주요 버튼 */
.mg-v2-icon-sm                 /* 작은 아이콘 */
```

### 금지 사항
```css
❌ .card  (접두사 없음)
❌ .mg-card  (레거시와 충돌)
❌ .new-card  (규칙 위반)
✅ .mg-v2-card  (올바름)
```

## 🧩 컴포넌트 사용법

### Card 컴포넌트

#### 기본 사용
```jsx
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';

<Card>
  <CardHeader title="제목" />
  <CardContent>
    <p>내용</p>
  </CardContent>
  <CardFooter meta="2025-01-23" />
</Card>
```

#### 아이콘과 함께
```jsx
<Card variant="glass">
  <CardHeader 
    icon={<ICONS.CALENDAR size={24} />}
    title="회기 관리" 
    subtitle="상담 회기를 관리합니다"
  />
  <CardContent>
    <div>15</div>
  </CardContent>
</Card>
```

#### 액션과 함께
```jsx
<Card variant="floating">
  <CardHeader title="사용자 정보" />
  <CardContent>
    <p>이름: 홍길동</p>
  </CardContent>
  <CardFooter 
    actions={[
      { label: '수정', onClick: handleEdit },
      { label: '삭제', onClick: handleDelete }
    ]}
  />
</Card>
```

### Icon 컴포넌트 (예정)

```jsx
import { Icon } from '../ui/Icon';

<Icon name="CALENDAR" size="lg" variant="primary" />
```

### Button 컴포넌트 (예정)

```jsx
import { Button } from '../ui/Button';

<Button variant="primary" size="medium" onClick={handleClick}>
  저장
</Button>
```

## 🔄 마이그레이션 가이드

### 기존 코드 → 새 코드

#### Before (기존)
```jsx
// ❌ 인라인 스타일, 커스텀 클래스
<div style={{background: '#fff', padding: '20px'}}>
  <div className="custom-card">
    <h3>제목</h3>
    <p>내용</p>
    <button className="btn btn-primary">버튼</button>
  </div>
</div>
```

#### After (새로운)
```jsx
// ✅ 공통 컴포넌트 사용
<Card variant="default">
  <CardHeader title="제목" />
  <CardContent>
    <p>내용</p>
  </CardContent>
  <CardFooter 
    actions={[
      { label: '버튼', onClick: handleClick, variant: 'mg-v2-button--primary' }
    ]}
  />
</Card>
```

## 🛡️ 안전장치

### 1. CSS 충돌 방지
- CSS 클래스 레지스트리로 중복 감지
- `.mg-v2-` 접두사 강제
- Git hook으로 자동 검증

### 2. 작업 범위 제한
- Phase 2: Admin 5개 파일만
- Phase 3: Consultant 5개 파일만
- 금지 파일 목록 명시

### 3. 쇼케이스 참조 필수
- 모든 작업 전 쇼케이스 확인
- `http://localhost:3000/design-system`
- `frontend/src/components/mindgarden/` 참조

## 📊 성공 지표

### Phase 1 완료 시
- [ ] 5개 UI 컴포넌트 생성 (Card, Icon, Button, Modal, Table)
- [ ] 모든 컴포넌트 `.mg-v2-` 접두사 사용
- [ ] CSS 충돌 0개
- [ ] Storybook 문서화

### Phase 2 완료 시
- [ ] Admin 5개 파일 리팩토링
- [ ] 아이콘 직접 import 0개
- [ ] 인라인 스타일 0개
- [ ] 모든 버튼 MGButton 사용

## 🚀 다음 단계

1. **Phase 1**: 기반 구축 (UI 컴포넌트 5개)
2. **Phase 2**: Admin Dashboard 적용 (5개 파일)
3. **Phase 3**: Consultant Dashboard 적용 (5개 파일)
4. **Phase 4**: Client Dashboard 적용 (5개 파일)
5. **Phase 5+**: 나머지 Dashboard들

---

**마지막 업데이트**: 2025-01-23
