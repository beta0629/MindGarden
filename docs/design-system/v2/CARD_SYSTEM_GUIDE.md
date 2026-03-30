# MindGarden 카드 시스템 가이드

## 📋 개요

MindGarden 카드 시스템은 **통일된 레이아웃 구조**를 가진 재사용 가능한 카드 컴포넌트들로 구성됩니다.

## 🎯 핵심 원칙

### 1. 통일된 레이아웃 구조
**모든 카드는 동일한 3단 구조**를 가집니다:

```
┌─────────────────────────┐
│ [Header]  (선택)        │ ← 아이콘 + 제목
├─────────────────────────┤
│ [Content] (필수)        │ ← 내용 영역
├─────────────────────────┤
│ [Footer]  (선택)        │ ← 액션/메타정보
└─────────────────────────┘
```

### 2. 반응형 규칙
- **모바일**: 패딩 12px, 단일 컬럼
- **태블릿**: 패딩 16px, 2-3 컬럼  
- **데스크탑**: 패딩 20px, 3-4 컬럼
- **레이아웃 구조는 동일**, 크기만 조정

## 🧩 컴포넌트 구조

### BaseCard (핵심 컨테이너)
```jsx
<BaseCard
  header={<CardHeader icon="USERS" title="통계" />}
  content={<CardContent>{children}</CardContent>}
  footer={<CardFooter actions={actions} />}
  variant="default|elevated|outlined|glass|gradient"
  theme="client|consultant|admin"
/>
```

**Props**:
- `header`: 헤더 컴포넌트 (선택)
- `content`: 내용 컴포넌트 (필수)
- `footer`: 푸터 컴포넌트 (선택)
- `variant`: 스타일 변형
- `theme`: 테마 (자동 감지)

### CardHeader
```jsx
<CardHeader
  icon="USERS"
  title="통계"
  subtitle="사용자 통계 정보"
  actions={<MGButton>추가</MGButton>}
/>
```

### CardContent
```jsx
<CardContent>
  {/* 내용 컴포넌트들 */}
</CardContent>
```

### CardFooter
```jsx
<CardFooter
  actions={[
    { label: "상세보기", onClick: handleDetail },
    { label: "편집", onClick: handleEdit }
  ]}
  meta="마지막 업데이트: 2025-01-23"
/>
```

## 📦 Content 컴포넌트들

### 통계 관련 (Stat Content)

#### StatContent
```jsx
<StatContent 
  icon="USERS" 
  value={100} 
  label="총 사용자"
  trend="up"
  trendValue="+12%"
/>
```

#### TrendStatContent
```jsx
<TrendStatContent 
  icon="TRENDING_UP" 
  value={85} 
  label="성장률"
  trend="up"
  trendValue="+5.2%"
  period="지난 주 대비"
/>
```

#### ComparisonStatContent
```jsx
<ComparisonStatContent 
  icon="BAR_CHART" 
  current={120} 
  previous={100} 
  label="매출"
  unit="만원"
/>
```

### 사용자 관련 (User Content)

#### UserContent
```jsx
<UserContent 
  avatar="/path/to/avatar.jpg"
  name="홍길동"
  role="내담자"
  status="ACTIVE"
/>
```

#### ClientContent
```jsx
<ClientContent 
  name="홍길동"
  sessions={10}
  status="ACTIVE"
  lastSession="2025-01-20"
  specialty="우울증"
/>
```

#### ConsultantContent
```jsx
<ConsultantContent 
  name="김상담"
  rating={4.8}
  specialty="우울증"
  experience={5}
  clients={25}
/>
```

### 정보 관련 (Info Content)

#### InfoContent
```jsx
<InfoContent 
  icon="INFO"
  title="시스템 공지"
  description="새로운 기능이 추가되었습니다."
  timestamp="2025-01-23 14:30"
/>
```

#### MessageContent
```jsx
<MessageContent 
  sender="김상담사"
  message="안녕하세요. 상담 일정을 확인해주세요."
  time="10분 전"
  isRead={false}
/>
```

#### NotificationContent
```jsx
<NotificationContent 
  icon="BELL"
  title="새로운 알림"
  description="상담 일정이 변경되었습니다."
  time="5분 전"
  type="info"
/>
```

### 액션 관련 (Action Content)

#### ActionContent
```jsx
<ActionContent 
  icon="PLUS"
  title="회기 추가"
  description="새로운 상담 회기를 추가합니다."
  onClick={handleAddSession}
/>
```

#### QuickActionContent
```jsx
<QuickActionContent 
  icon="EDIT"
  label="편집"
  onClick={handleEdit}
/>
```

### 리스트 관련 (List Content)

#### ListItemContent
```jsx
<ListItemContent 
  icon="USER"
  title="홍길동"
  subtitle="내담자 • 10회 상담"
  rightAction={<MGButton size="small">상세</MGButton>}
/>
```

#### ExpandableContent
```jsx
<ExpandableContent 
  header="상세 정보"
  isExpanded={false}
  onToggle={handleToggle}
>
  <div>펼쳐지는 내용...</div>
</ExpandableContent>
```

## 🎨 사용 예시

### 통계 카드
```jsx
<BaseCard
  content={
    <StatContent 
      icon="USERS" 
      value={100} 
      label="총 사용자" 
    />
  }
/>
```

### 사용자 카드
```jsx
<BaseCard
  header={<CardHeader title="내담자 정보" />}
  content={
    <ClientContent 
      name="홍길동"
      sessions={10}
      status="ACTIVE"
    />
  }
  footer={
    <CardFooter 
      actions={[
        { label: "상세보기", onClick: handleDetail }
      ]} 
    />
  }
/>
```

### 메시지 카드
```jsx
<BaseCard
  content={
    <MessageContent 
      sender="상담사"
      message="안녕하세요"
      time="10분 전"
    />
  }
/>
```

### 액션 카드
```jsx
<BaseCard
  content={
    <ActionContent 
      icon="PLUS"
      title="회기 추가"
      description="새로운 상담 회기를 추가합니다."
      onClick={handleAddSession}
    />
  }
  variant="elevated"
/>
```

## 🎭 카드 변형 (Variants)

**레이아웃은 동일, 스타일만 변경**:

- `default` - 기본 카드 (흰색 배경)
- `elevated` - 그림자 강조
- `outlined` - 테두리 강조
- `glass` - 글래스모피즘 효과
- `gradient` - 그라데이션 배경

```jsx
<BaseCard variant="glass" content={<StatContent />} />
<BaseCard variant="gradient" content={<ActionContent />} />
```

## 📱 모바일 최적화

### 터치 영역
- 최소 44x44px (Apple HIG 권장)
- 카드 간 간격 최소 8px

### 스와이프 제스처
- 좌우 스와이프: 삭제/편집 액션
- 상하 스와이프: 스크롤

### 성능
- 카드 렌더링 최적화 (가상 스크롤)
- 이미지 최적화 (WebP, 레이지 로딩)
- 애니메이션 최적화 (transform, opacity만 사용)

## 🔧 개발 가이드

### 새 Content 컴포넌트 생성
```jsx
// contents/NewContent.js
const NewContent = ({ prop1, prop2, ...props }) => {
  return (
    <div className="mg-content-new">
      {/* 내용 구현 */}
    </div>
  );
};

export default NewContent;
```

### BaseCard 확장
```jsx
// variants/SpecialCardVariant.js
const SpecialCardVariant = ({ children, ...props }) => {
  return (
    <div className="mg-card mg-card--special" {...props}>
      {children}
    </div>
  );
};
```

## 📚 참고 문서

- [MASTER_GUIDE.md](./MASTER_GUIDE.md) - 전체 디자인 시스템
- [ICON_LAYOUT_CENTRALIZATION_GUIDE.md](./ICON_LAYOUT_CENTRALIZATION_GUIDE.md) - 아이콘/레이아웃 중앙화
- [MGBUTTON_MIGRATION_GUIDE.md](./MGBUTTON_MIGRATION_GUIDE.md) - MGButton 마이그레이션

## 🚀 다음 단계

1. BaseCard 컴포넌트 구현
2. 10개 Content 컴포넌트 구현
3. 기존 카드 컴포넌트 마이그레이션
4. 모바일 최적화 적용
5. 성능 테스트 및 최적화

---

**마지막 업데이트**: 2025-01-23
