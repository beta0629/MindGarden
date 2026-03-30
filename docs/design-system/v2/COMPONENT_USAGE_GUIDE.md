# MindGarden 디자인 시스템 v2.0 - 컴포넌트 사용 가이드

**작성일**: 2025-01-XX  
**버전**: 1.0

## 📚 목차

1. [StatCard 컴포넌트](#statcard-컴포넌트)
2. [DashboardSection 컴포넌트](#dashboardsection-컴포넌트)
3. [MGButton 컴포넌트](#mgbutton-컴포넌트)
4. [UnifiedNotification 컴포넌트](#unifiednotification-컴포넌트)
5. [ConfirmModal 컴포넌트](#confirmmodal-컴포넌트)

---

## StatCard 컴포넌트

통계 정보를 표시하는 카드 컴포넌트입니다.

### Import
```javascript
import StatCard from '../ui/Card/StatCard';
```

### 기본 사용법
```javascript
<StatCard
  icon={<Calendar />}
  value={statistics.todayConsultations}
  label="오늘의 상담"
  change="전체 15개"
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | `ReactNode` | Yes | - | 카드 아이콘 |
| `value` | `string \| number` | Yes | - | 메인 값 |
| `label` | `string` | Yes | - | 라벨 텍스트 |
| `change` | `string` | No | - | 변경 사항 표시 |
| `onClick` | `function` | No | - | 클릭 핸들러 |
| `variant` | `string` | No | `default` | 카드 변형 스타일 |

### 예시

#### 기본 사용
```javascript
<StatCard
  icon={<Users />}
  value={42}
  label="전체 사용자"
/>
```

#### 클릭 가능한 카드
```javascript
<StatCard
  icon={<Calendar />}
  value={statistics.todayCount}
  label="오늘의 상담"
  change={`전체 ${statistics.totalCount}개`}
  onClick={() => navigate('/consultations')}
/>
```

#### 여러 카드를 그리드로 배치
```javascript
<div className="mg-dashboard-stats">
  <StatCard icon={<Users />} value={100} label="전체 사용자" />
  <StatCard icon={<Calendar />} value={25} label="오늘의 상담" />
  <StatCard icon={<MessageSquare />} value={10} label="새 메시지" />
</div>
```

---

## DashboardSection 컴포넌트

대시보드의 섹션을 일관되게 표시하는 컴포넌트입니다.

### Import
```javascript
import DashboardSection from '../layout/DashboardSection';
```

### 기본 사용법
```javascript
<DashboardSection
  title="시스템 도구"
  subtitle="시스템 관리 및 유지보수 도구"
  icon={<Settings />}
>
  {/* 섹션 내용 */}
</DashboardSection>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | Yes | - | 섹션 제목 |
| `subtitle` | `string` | No | - | 섹션 부제목 |
| `icon` | `ReactNode` | No | - | 섹션 아이콘 |
| `actions` | `ReactNode` | No | - | 액션 버튼들 |
| `collapsible` | `boolean` | No | `false` | 접기/펼치기 가능 여부 |
| `defaultCollapsed` | `boolean` | No | `false` | 기본 접힘 상태 |

### 예시

#### 기본 섹션
```javascript
<DashboardSection
  title="관리 기능"
  subtitle="시스템 관리 및 설정 기능"
  icon={<Settings />}
>
  <div className="mg-management-grid">
    {/* 관리 기능 카드들 */}
  </div>
</DashboardSection>
```

#### 액션 버튼이 있는 섹션
```javascript
<DashboardSection
  title="지점 현황"
  icon={<MapPin />}
  actions={
    <MGButton
      variant="outline"
      size="small"
      onClick={handleBranchManagement}
    >
      전체보기
    </MGButton>
  }
>
  {/* 지점 목록 */}
</DashboardSection>
```

#### 접기/펼치기 가능한 섹션
```javascript
<DashboardSection
  title="통계 현황"
  icon={<BarChart />}
  collapsible={true}
  defaultCollapsed={false}
>
  {/* 통계 내용 */}
</DashboardSection>
```

---

## MGButton 컴포넌트

공통 버튼 컴포넌트로, 중복 클릭 방지 및 로딩 상태를 지원합니다.

### Import
```javascript
import MGButton from '../common/MGButton';
```

### 기본 사용법
```javascript
<MGButton
  variant="primary"
  size="medium"
  onClick={handleClick}
>
  버튼 텍스트
</MGButton>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `variant` | `string` | No | `primary` | 버튼 스타일 (primary, secondary, success, danger, warning, info, outline) |
| `size` | `string` | No | `medium` | 버튼 크기 (small, medium, large) |
| `disabled` | `boolean` | No | `false` | 비활성화 상태 |
| `loading` | `boolean` | No | `false` | 로딩 상태 |
| `loadingText` | `string` | No | `처리 중...` | 로딩 중 표시 텍스트 |
| `onClick` | `function` | No | - | 클릭 핸들러 |
| `fullWidth` | `boolean` | No | `false` | 전체 너비 사용 |
| `preventDoubleClick` | `boolean` | No | `true` | 중복 클릭 방지 |

### 예시

#### 다양한 Variant
```javascript
<MGButton variant="primary">주요 액션</MGButton>
<MGButton variant="secondary">보조 액션</MGButton>
<MGButton variant="danger">삭제</MGButton>
<MGButton variant="outline">취소</MGButton>
```

#### 크기별 버튼
```javascript
<MGButton size="small">작은 버튼</MGButton>
<MGButton size="medium">중간 버튼</MGButton>
<MGButton size="large">큰 버튼</MGButton>
```

#### 로딩 상태
```javascript
<MGButton
  variant="primary"
  loading={isProcessing}
  loadingText="저장 중..."
  onClick={handleSave}
>
  저장하기
</MGButton>
```

#### 전체 너비 버튼
```javascript
<MGButton
  variant="primary"
  fullWidth={true}
  onClick={handleSubmit}
>
  제출하기
</MGButton>
```

---

## UnifiedNotification 컴포넌트

통일된 알림 시스템을 제공하는 컴포넌트입니다.

### Import
```javascript
import notificationManager from '../../utils/notification';
```

### 기본 사용법
```javascript
// 성공 메시지
notificationManager.success('작업이 완료되었습니다.');

// 에러 메시지
notificationManager.error('오류가 발생했습니다.');

// 정보 메시지
notificationManager.info('안내 메시지입니다.');

// 경고 메시지
notificationManager.warning('경고 메시지입니다.');
```

### 사용 예시

#### API 호출 후 알림
```javascript
const handleSave = async () => {
  try {
    const response = await apiPost('/api/save', data);
    if (response.success) {
      notificationManager.success('저장이 완료되었습니다.');
    } else {
      notificationManager.error('저장에 실패했습니다.');
    }
  } catch (error) {
    notificationManager.error('오류가 발생했습니다.');
  }
};
```

---

## ConfirmModal 컴포넌트

확인 다이얼로그를 위한 모달 컴포넌트입니다.

### Import
```javascript
import ConfirmModal from '../common/ConfirmModal';
```

### 기본 사용법
```javascript
const [confirmModal, setConfirmModal] = useState({
  isOpen: false,
  title: '',
  message: '',
  type: 'default',
  onConfirm: null
});

// 모달 열기
const handleDelete = () => {
  setConfirmModal({
    isOpen: true,
    title: '삭제 확인',
    message: '정말 삭제하시겠습니까?',
    type: 'danger',
    onConfirm: async () => {
      await deleteItem();
      setConfirmModal({ isOpen: false, title: '', message: '', type: 'default', onConfirm: null });
    }
  });
};

// 컴포넌트에서 사용
<ConfirmModal
  isOpen={confirmModal.isOpen}
  onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', type: 'default', onConfirm: null })}
  onConfirm={confirmModal.onConfirm}
  title={confirmModal.title}
  message={confirmModal.message}
  type={confirmModal.type}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | 모달 열림 상태 |
| `onClose` | `function` | Yes | - | 닫기 핸들러 |
| `onConfirm` | `function` | Yes | - | 확인 핸들러 |
| `title` | `string` | Yes | - | 모달 제목 |
| `message` | `string` | Yes | - | 모달 메시지 |
| `type` | `string` | No | `default` | 모달 타입 (default, danger, warning) |

---

## 🔗 관련 문서

- [CSS 클래스 레퍼런스](./CSS_CLASS_REFERENCE.md) (작성 예정)
- [디자인 시스템 가이드](./MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [Phase 5 최적화 보고서](./PHASE5_OPTIMIZATION_REPORT.md)

---

**마지막 업데이트**: 2025-01-XX

