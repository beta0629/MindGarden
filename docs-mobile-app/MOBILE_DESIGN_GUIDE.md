# MindGarden 모바일 디자인 시스템 가이드

**작성일**: 2025년 1월  
**버전**: 1.0  
**작성자**: MindGarden Development Team

---

## 목차

1. [소개](#소개)
2. [핵심 원칙](#핵심-원칙)
3. [스타일 작성 규칙](#스타일-작성-규칙)
4. [디자인 토큰 시스템](#디자인-토큰-시스템)
5. [레이아웃 패턴](#레이아웃-패턴)
6. [컴포넌트 사용 가이드](#컴포넌트-사용-가이드)
7. [웹-모바일 매핑](#웹-모바일-매핑)
8. [코드 예시 및 베스트 프랙티스](#코드-예시-및-베스트-프랙티스)
9. [체크리스트 및 검증](#체크리스트-및-검증)

---

## 소개

MindGarden 모바일 디자인 시스템은 **React Native**로 구현된 통일된 UI 프레임워크입니다. 웹 디자인 시스템과 일관성을 유지하면서 모바일 플랫폼(iOS/Android)의 특성을 최대한 활용하도록 설계되었습니다.

### 목적

- 모든 모바일 화면에서 일관된 사용자 경험 제공
- 웹 애플리케이션과의 디자인 일관성 유지
- 개발 생산성 향상 및 유지보수성 확보
- 코드 재사용성 최대화

### 기술 스택

- **React Native**: 크로스 플랫폼 모바일 개발
- **StyleSheet**: React Native 스타일 시스템
- **React Navigation**: 화면 네비게이션
- **Lucide React Native**: 아이콘 라이브러리

---

## 핵심 원칙

### 1. 일관성 (Consistency)
모든 화면과 컴포넌트에서 동일한 디자인 패턴과 스타일 규칙을 적용합니다.

### 2. 재사용성 (Reusability)
공통 컴포넌트와 스타일 상수를 최대한 재사용하여 코드 중복을 방지합니다.

### 3. 접근성 (Accessibility)
터치 타겟 크기, 색상 대비, 텍스트 크기 등 모바일 접근성 가이드라인을 준수합니다.

### 4. 성능 (Performance)
StyleSheet를 사용하여 네이티브 렌더링 최적화를 달성합니다.

### 5. 유지보수성 (Maintainability)
중앙화된 상수와 명확한 구조로 코드 수정 및 확장이 용이합니다.

---

## 스타일 작성 규칙

### 필수 규칙

#### 1. StyleSheet 사용 필수
모든 스타일은 `StyleSheet.create()`를 사용하여 정의해야 합니다.

**올바른 예시:**
```javascript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
});

// 사용
<View style={styles.container}>
  <Text style={styles.title}>제목</Text>
</View>
```

**잘못된 예시 (인라인 스타일 금지):**
```javascript
// ❌ 금지: 인라인 스타일 객체
<View style={{ flex: 1, backgroundColor: '#ffffff' }}>
  <Text style={{ fontSize: 18, color: '#000000' }}>제목</Text>
</View>

// ❌ 금지: 하드코딩된 값
<View style={{ padding: 16, margin: 8 }}>
</View>
```

#### 2. 상수 사용 필수
모든 스타일 값은 상수 파일에서 가져와야 합니다.

**사용 가능한 상수:**
- `COLORS` - 색상 값
- `SPACING` - 간격 값
- `TYPOGRAPHY` - 타이포그래피 설정
- `SIZES` - 크기 값
- `BORDER_RADIUS` - 모서리 둥글기
- `SHADOWS` - 그림자 효과

**올바른 예시:**
```javascript
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
});
```

**잘못된 예시:**
```javascript
// ❌ 금지: 하드코딩된 색상
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    color: '#000000',
  },
});

// ❌ 금지: 하드코딩된 간격
const styles = StyleSheet.create({
  card: {
    padding: 16,
    margin: 8,
  },
});
```

#### 3. 상태별 스타일 정의
동적으로 변경되는 스타일은 StyleSheet에 상태별 스타일을 미리 정의하고 조건부로 적용합니다.

**올바른 예시:**
```javascript
const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusBadgeScheduled: {
    backgroundColor: COLORS.primaryLight,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.successLight,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  statusTextScheduled: {
    color: COLORS.primary,
  },
  statusTextCompleted: {
    color: COLORS.success,
  },
});

// 사용
<View style={[
  styles.statusBadge,
  status === 'SCHEDULED' && styles.statusBadgeScheduled,
  status === 'COMPLETED' && styles.statusBadgeCompleted,
]}>
  <Text style={[
    styles.statusText,
    status === 'SCHEDULED' && styles.statusTextScheduled,
    status === 'COMPLETED' && styles.statusTextCompleted,
  ]}>
    {statusText}
  </Text>
</View>
```

**잘못된 예시:**
```javascript
// ❌ 금지: 인라인 스타일 객체
<View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
  <Text style={[styles.statusText, { color: statusInfo.color }]}>
    {statusText}
  </Text>
</View>
```

### 스타일 파일 구조

각 화면 컴포넌트 파일 하단에 StyleSheet를 정의합니다.

```javascript
// 컴포넌트 코드
const MyComponent = () => {
  // ...
};

// 스타일 정의 (파일 하단)
const styles = StyleSheet.create({
  // ...
});

export default MyComponent;
```

---

## 디자인 토큰 시스템

모든 디자인 값은 중앙화된 상수 파일에서 관리됩니다.

### 색상 시스템

**파일**: `mobile/src/constants/colors.js`

```javascript
import { COLORS } from '../constants/theme';

// Primary Colors
COLORS.primary          // #007bff - 주요 액션
COLORS.primaryLight     // #66b3ff - 주요 배경
COLORS.primaryDark      // #0056b3 - 주요 강조

// Secondary Colors
COLORS.secondary        // #6c757d
COLORS.secondaryLight   // #9ca3af
COLORS.secondaryDark    // #495057

// Status Colors
COLORS.success          // #28a745 - 성공
COLORS.successLight     // #6cbb6d - 성공 배경
COLORS.error            // #dc3545 - 오류
COLORS.errorLight       // #f56565 - 오류 배경
COLORS.warning          // #ffc107 - 경고
COLORS.warningLight     // #ffeaa7 - 경고 배경
COLORS.info             // #17a2b8 - 정보
COLORS.infoLight        // #bbdefb - 정보 배경

// Text Colors
COLORS.white            // #ffffff
COLORS.black            // #000000
COLORS.dark             // #212529 - 주요 텍스트
COLORS.darkGray         // #2F2F2F
COLORS.mediumGray       // #6B6B6B - 보조 텍스트
COLORS.gray500          // 중간 회색
COLORS.gray600          // 어두운 회색

// Background Colors
COLORS.background       // 화면 배경
COLORS.white            // 카드 배경
COLORS.gray50           // 연한 배경
COLORS.gray100          // 밝은 배경
COLORS.gray200          // 경계선
```

**사용 예시:**
```javascript
const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
  },
  text: {
    color: COLORS.dark,
  },
  card: {
    backgroundColor: COLORS.white,
  },
});
```

### 간격 시스템

**파일**: `mobile/src/constants/spacing.js`

```javascript
import { SPACING } from '../constants/theme';

// 기본 간격
SPACING.xs      // 8px  - 매우 작은 간격
SPACING.sm      // 12px - 작은 간격
SPACING.md      // 16px - 중간 간격 (표준)
SPACING.lg      // 20px - 큰 간격
SPACING.xl      // 24px - 매우 큰 간격
SPACING['2xl']  // 32px - 특대 간격

// 화면 여백
SPACING.screen.horizontal  // 16px - 좌우 여백
SPACING.screen.vertical    // 20px - 상하 여백

// 컴포넌트별 간격
SPACING.card.padding       // 16px - 카드 패딩
SPACING.card.gap           // 12px - 카드 내 요소 간격
SPACING.button.padding.horizontal  // 20px
SPACING.button.padding.vertical    // 12px
SPACING.button.gap         // 8px
```

**사용 예시:**
```javascript
const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  card: {
    padding: SPACING.card.padding,
    gap: SPACING.card.gap,
  },
});
```

### 타이포그래피 시스템

**파일**: `mobile/src/constants/typography.js`

```javascript
import { TYPOGRAPHY } from '../constants/theme';

// Font Sizes
TYPOGRAPHY.fontSize.xs     // 10px
TYPOGRAPHY.fontSize.sm     // 12px
TYPOGRAPHY.fontSize.base   // 14px (표준)
TYPOGRAPHY.fontSize.lg     // 16px
TYPOGRAPHY.fontSize.xl    // 18px
TYPOGRAPHY.fontSize['2xl'] // 20px
TYPOGRAPHY.fontSize['3xl'] // 22px
TYPOGRAPHY.fontSize['4xl'] // 24px

// Font Weights
TYPOGRAPHY.fontWeight.normal    // '400'
TYPOGRAPHY.fontWeight.medium    // '500'
TYPOGRAPHY.fontWeight.semibold  // '600'
TYPOGRAPHY.fontWeight.bold      // '700'

// Line Heights
TYPOGRAPHY.lineHeight.tight     // 1.2
TYPOGRAPHY.lineHeight.normal   // 1.5
TYPOGRAPHY.lineHeight.relaxed  // 1.75
```

**사용 예시:**
```javascript
const styles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    lineHeight: TYPOGRAPHY.fontSize.xl * TYPOGRAPHY.lineHeight.normal,
  },
  body: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.normal,
  },
});
```

### 크기 시스템

**파일**: `mobile/src/constants/sizes.js`

```javascript
import { SIZES } from '../constants/theme';

// 터치 타겟
SIZES.TOUCH_TARGET.MINIMUM    // 44px - 최소 터치 타겟
SIZES.TOUCH_TARGET.PREFERRED  // 48px - 권장 터치 타겟

// 아이콘 크기
SIZES.ICON.XS      // 16px
SIZES.ICON.SM      // 20px
SIZES.ICON.MD      // 24px (표준)
SIZES.ICON.LG      // 28px
SIZES.ICON.XL      // 32px
SIZES.ICON['2XL']  // 40px

// 버튼 높이
SIZES.BUTTON_HEIGHT.SM  // 44px
SIZES.BUTTON_HEIGHT.MD  // 48px
SIZES.BUTTON_HEIGHT.LG  // 52px

// 카드
SIZES.CARD.BORDER_RADIUS  // 12px
SIZES.CARD.PADDING        // 16px

// 경계선 두께
SIZES.BORDER_WIDTH.THIN   // 0.5
SIZES.BORDER_WIDTH.MEDIUM // 1
SIZES.BORDER_WIDTH.THICK  // 2
```

### 테마 통합

**파일**: `mobile/src/constants/theme.js`

모든 상수를 한 곳에서 import:

```javascript
import { 
  COLORS, 
  SPACING, 
  TYPOGRAPHY, 
  SIZES, 
  BORDER_RADIUS, 
  SHADOWS 
} from '../constants/theme';

// BORDER_RADIUS
BORDER_RADIUS.none  // 0
BORDER_RADIUS.xs    // 4px
BORDER_RADIUS.sm    // 8px
BORDER_RADIUS.md    // 12px
BORDER_RADIUS.lg    // 16px
BORDER_RADIUS.xl    // 20px
BORDER_RADIUS['2xl'] // 24px
BORDER_RADIUS.full   // 9999

// SHADOWS
SHADOWS.none  // 그림자 없음
SHADOWS.xs    // 아주 미묘한 그림자
SHADOWS.sm    // 카드 기본 그림자
SHADOWS.md    // 강조된 카드 그림자
SHADOWS.lg    // 모달, 팝업 그림자
SHADOWS.xl    // 특수 강조 요소 그림자
```

**SHADOWS 사용 예시:**
```javascript
const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,  // 스프레드 연산자로 적용
  },
});
```

---

## 레이아웃 패턴

### 통계 카드 레이아웃

통계 카드는 전체 너비를 사용하여 세로로 배치합니다.

**패턴:**
```javascript
<View style={styles.statsContainer}>
  <StatCard
    icon={<Users size={SIZES.ICON.LG} color={COLORS.primary} />}
    value="66"
    label="전체 사용자"
    style={styles.statCard}
  />
  <StatCard
    icon={<Users size={SIZES.ICON.LG} color={COLORS.success} />}
    value="13"
    label="전체 상담사"
    style={styles.statCard}
  />
</View>

const styles = StyleSheet.create({
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
});
```

**주의사항:**
- 카드 간격은 `gap` 속성을 사용
- 각 카드는 `width: '100%'`로 설정
- `flexWrap` 또는 `flexDirection: 'row'` 사용 금지 (전체 너비 세로 배치)

### 대시보드 섹션 구조

DashboardSection 컴포넌트를 사용하여 섹션을 구분합니다.

**패턴:**
```javascript
<DashboardSection 
  title="시스템 상태" 
  icon={<Settings size={SIZES.ICON.MD} color={COLORS.primary} />}
>
  {/* 섹션 내용 */}
</DashboardSection>
```

### 리스트/카드 컴포넌트 패턴

리스트 아이템은 일관된 스타일을 사용합니다.

**패턴:**
```javascript
<View style={styles.listContainer}>
  {items.map((item) => (
    <View key={item.id} style={styles.listItem}>
      <Text style={styles.listItemTitle}>{item.title}</Text>
      <Text style={styles.listItemSubtitle}>{item.subtitle}</Text>
    </View>
  ))}
</View>

const styles = StyleSheet.create({
  listContainer: {
    gap: SPACING.md,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  listItemTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  listItemSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
  },
});
```

### 모달 구조

모달은 하단에서 올라오는 슬라이드 형태로 구현됩니다.

**패턴:**
```javascript
<Modal
  visible={showModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowModal(false)}
>
  <GestureHandlerRootView style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>제목</Text>
        <TouchableOpacity
          onPress={() => setShowModal(false)}
          style={styles.modalCloseButton}
        >
          <X size={SIZES.ICON.MD} color={COLORS.gray600} />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.formContainer}>
        {/* 모달 내용 */}
      </ScrollView>
    </View>
  </GestureHandlerRootView>
</Modal>

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
  },
  formContainer: {
    width: '100%',
    flex: 1,
    minHeight: 0,
  },
});
```

---

## 컴포넌트 사용 가이드

### StatCard 컴포넌트

통계 정보를 표시하는 카드 컴포넌트입니다.

**파일**: `mobile/src/components/StatCard.js`

**Props:**
- `icon` (ReactNode, optional): 아이콘 요소 (lucide-react-native 아이콘 권장)
- `value` (string, required): 통계 값 (숫자 문자열)
- `label` (string, required): 라벨 텍스트
- `change` (string, optional): 변화량 표시 (예: "+5%")
- `variant` (string, default: 'default'): 'default' | 'highlight'
- `style` (object, optional): 추가 스타일 (StyleSheet 객체)

**스타일 특징:**
- 카드 패딩: `SIZES.CARD.PADDING` (16px)
- 모서리 둥글기: `SIZES.CARD.BORDER_RADIUS` (12px)
- 그림자: `SHADOWS.sm`
- 값 텍스트: `TYPOGRAPHY.fontSize['2xl']` (20px), bold
- 라벨 텍스트: `TYPOGRAPHY.fontSize.base` (14px)

**사용 예시:**
```javascript
import StatCard from '../../components/StatCard';
import { Users } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants/theme';

<StatCard
  icon={<Users size={SIZES.ICON.LG} color={COLORS.primary} />}
  value="66"
  label="전체 사용자"
  style={styles.statCard}
/>
```

**레이아웃:**
- `statsContainer`에서 `gap` 사용
- 각 카드는 `width: '100%'`로 설정

### DashboardSection 컴포넌트

대시보드 섹션을 구분하는 래퍼 컴포넌트입니다.

**파일**: `mobile/src/components/DashboardSection.js`

**Props:**
- `title` (string): 섹션 제목
- `icon` (ReactNode, optional): 아이콘 요소
- `actions` (ReactNode, optional): 액션 버튼
- `children` (ReactNode): 섹션 내용
- `style` (object, optional): 추가 스타일

**사용 예시:**
```javascript
import DashboardSection from '../../components/DashboardSection';
import { Calendar } from 'lucide-react-native';
import { COLORS, SIZES } from '../../constants/theme';

<DashboardSection 
  title="오늘의 활동" 
  icon={<Calendar size={SIZES.ICON.MD} color={COLORS.primary} />}
>
  {/* 섹션 내용 */}
</DashboardSection>
```

### MGButton 컴포넌트

공통 버튼 컴포넌트입니다. 터치 타겟 크기를 자동으로 보장하며, 중복 클릭 방지 기능을 내장하고 있습니다.

**파일**: `mobile/src/components/MGButton.js`

**Props:**
- `variant` (string, default: 'primary'): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline'
- `size` (string, default: 'medium'): 'small' | 'medium' | 'large'
- `disabled` (boolean, default: false): 비활성화 상태
- `loading` (boolean, default: false): 로딩 상태 (ActivityIndicator 표시)
- `loadingText` (string, optional): 로딩 중 표시할 텍스트
- `preventDoubleClick` (boolean, default: true): 중복 클릭 방지 활성화
- `clickDelay` (number, default: 1000): 클릭 후 대기 시간 (ms)
- `fullWidth` (boolean, default: false): 전체 너비 사용
- `onPress` (function): 클릭 핸들러 (Promise 반환 가능)
- `style` (object, optional): 추가 스타일
- `children` (ReactNode): 버튼 내용 (Text 컴포넌트 권장)

**사용 예시:**
```javascript
import MGButton from '../../components/MGButton';
import { Text } from 'react-native';

// 기본 버튼
<MGButton
  variant="primary"
  size="medium"
  onPress={handleSubmit}
>
  <Text>제출하기</Text>
</MGButton>

// 로딩 상태 버튼
<MGButton
  variant="primary"
  size="medium"
  fullWidth
  loading={isSubmitting}
  loadingText="처리 중..."
  onPress={handleSubmit}
>
  <Text>제출하기</Text>
</MGButton>

// Outline 버튼
<MGButton
  variant="outline"
  size="small"
  onPress={handleCancel}
>
  <Text>취소</Text>
</MGButton>
```

**특징:**
- 자동 터치 타겟 크기 보장 (최소 44px)
- 중복 클릭 자동 방지 (기본 활성화)
- Promise를 반환하는 `onPress` 핸들러 자동 처리
- 로딩 상태 시 ActivityIndicator 표시
- 모든 variant는 StyleSheet로 정의되어 있음

### SimpleLayout 컴포넌트

기본 레이아웃 컴포넌트입니다. SafeAreaView를 사용하여 안전 영역을 자동으로 처리하며, 헤더와 콘텐츠 영역을 제공합니다.

**파일**: `mobile/src/components/layout/SimpleLayout.js`

**Props:**
- `title` (string, optional): 화면 제목 (없으면 헤더 표시 안함)
- `loading` (boolean, default: false): 로딩 상태
- `loadingText` (string, optional): 로딩 텍스트 (기본값: `STRINGS.COMMON.LOADING_DATA`)
- `loadingVariant` (string, optional): 로딩 컴포넌트 variant
- `showBackButton` (boolean, default: true): 뒤로가기 버튼 표시 여부
- `children` (ReactNode): 화면 내용

**사용 예시:**
```javascript
import SimpleLayout from '../../components/layout/SimpleLayout';

// 기본 사용
<SimpleLayout title="대시보드">
  {/* 화면 내용 */}
</SimpleLayout>

// 로딩 상태
<SimpleLayout 
  title="데이터 로딩 중" 
  loading={true}
  loadingText="데이터를 불러오는 중..."
>
  {/* 로딩 중에는 children 표시 안됨 */}
</SimpleLayout>

// 뒤로가기 버튼 숨김
<SimpleLayout 
  title="메인 화면" 
  showBackButton={false}
>
  {/* 화면 내용 */}
</SimpleLayout>
```

**특징:**
- `SafeAreaView` 사용으로 iOS 노치 영역 자동 처리
- `navigation.canGoBack()` 체크로 뒤로가기 버튼 조건부 표시
- 헤더가 없으면 헤더 영역 자체를 표시하지 않음
- 화면 좌우 여백은 `SPACING.screen.horizontal` 사용

---

## 웹-모바일 매핑

### 디자인 토큰 매핑

| 웹 (CSS 변수) | 모바일 (JavaScript 상수) | 값 | 파일 |
|--------------|-------------------------|------|------|
| `--color-primary` | `COLORS.primary` | `#007bff` | `colors.js` |
| `--color-primary-light` | `COLORS.primaryLight` | `#66b3ff` | `colors.js` |
| `--color-primary-dark` | `COLORS.primaryDark` | `#0056b3` | `colors.js` |
| `--color-secondary` | `COLORS.secondary` | `#6c757d` | `colors.js` |
| `--status-success` | `COLORS.success` | `#28a745` | `colors.js` |
| `--status-error` | `COLORS.error` | `#dc3545` | `colors.js` |
| `--status-warning` | `COLORS.warning` | `#ffc107` | `colors.js` |
| `--status-info` | `COLORS.info` | `#17a2b8` | `colors.js` |
| `--status-pending` | `COLORS.pending` | `#fd7e14` | `colors.js` |
| `--cream` | `COLORS.cream` | `#F5F5DC` | `colors.js` |
| `--light-beige` | `COLORS.lightBeige` | `#FDF5E6` | `colors.js` |
| `--color-dark` | `COLORS.dark` | `#212529` | `colors.js` |
| `--dark-gray` | `COLORS.darkGray` | `#2F2F2F` | `colors.js` |
| `--medium-gray` | `COLORS.mediumGray` | `#6B6B6B` | `colors.js` |
| `--spacing-xs` | `SPACING.xs` | `8px` | `spacing.js` |
| `--spacing-sm` | `SPACING.sm` | `12px` | `spacing.js` |
| `--spacing-md` | `SPACING.md` | `16px` | `spacing.js` |
| `--spacing-lg` | `SPACING.lg` | `20px` | `spacing.js` |
| `--spacing-xl` | `SPACING.xl` | `24px` | `spacing.js` |
| `--font-size-xs` | `TYPOGRAPHY.fontSize.xs` | `10px` | `typography.js` |
| `--font-size-sm` | `TYPOGRAPHY.fontSize.sm` | `12px` | `typography.js` |
| `--font-size-base` | `TYPOGRAPHY.fontSize.base` | `14px` | `typography.js` |
| `--font-size-lg` | `TYPOGRAPHY.fontSize.lg` | `16px` | `typography.js` |
| `--font-size-xl` | `TYPOGRAPHY.fontSize.xl` | `18px` | `typography.js` |
| `--border-radius-md` | `BORDER_RADIUS.md` | `12px` | `theme.js` |
| `box-shadow` | `SHADOWS.sm` | `shadowStyle` | `theme.js` |

### 컴포넌트 매핑

| 웹 컴포넌트 | 모바일 컴포넌트 | 경로 |
|-----------|---------------|------|
| `MGButton` | `MGButton` | `components/MGButton.js` |
| `StatCard` | `StatCard` | `components/StatCard.js` |
| `DashboardSection` | `DashboardSection` | `components/DashboardSection.js` |
| `SimpleLayout` | `SimpleLayout` | `components/layout/SimpleLayout.js` |

### 스타일 작성 방식 매핑

| 웹 | 모바일 |
|----|--------|
| CSS 클래스 (`className="mg-card"`) | StyleSheet (`style={styles.card}`) |
| CSS 변수 (`var(--spacing-md)`) | JavaScript 상수 (`SPACING.md`) |
| 인라인 스타일 (가능) | 인라인 스타일 (금지) |
| CSS 파일 분리 | StyleSheet.create (파일 내부) |

### 레이아웃 패턴 차이

| 웹 | 모바일 |
|----|--------|
| 그리드 레이아웃 (2열) | 세로 스택 레이아웃 (전체 너비) |
| `flex-wrap: wrap` | `gap` 속성 사용 |
| CSS 미디어 쿼리 | 플랫폼별 조건부 렌더링 (필요시) |

---

## 코드 예시 및 베스트 프랙티스

### 올바른 스타일 작성 예시

**전체 예시:**
```javascript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import StatCard from '../components/StatCard';
import DashboardSection from '../components/DashboardSection';
import { Users } from 'lucide-react-native';
import SIZES from '../constants/sizes';

const AdminDashboard = () => {
  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <StatCard
          icon={<Users size={SIZES.ICON.LG} color={COLORS.primary} />}
          value="66"
          label="전체 사용자"
          style={styles.statCard}
        />
      </View>
      
      <DashboardSection 
        title="시스템 상태" 
        icon={<Users size={SIZES.ICON.MD} color={COLORS.primary} />}
      >
        <View style={styles.systemStatus}>
          <Text style={styles.statusLabel}>시스템 건강도</Text>
        </View>
      </DashboardSection>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  systemStatus: {
    padding: SPACING.md,
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
});

export default AdminDashboard;
```

### 잘못된 스타일 작성 예시 (금지)

**인라인 스타일 사용:**
```javascript
// ❌ 금지
<View style={{ flex: 1, padding: 16, backgroundColor: '#ffffff' }}>
  <Text style={{ fontSize: 18, color: '#000000' }}>제목</Text>
</View>
```

**하드코딩된 값:**
```javascript
// ❌ 금지
const styles = StyleSheet.create({
  card: {
    padding: 16,        // ❌ SPACING.md 사용해야 함
    margin: 8,          // ❌ SPACING.sm 사용해야 함
    backgroundColor: '#ffffff',  // ❌ COLORS.white 사용해야 함
    borderRadius: 12,   // ❌ BORDER_RADIUS.md 사용해야 함
  },
  text: {
    fontSize: 18,      // ❌ TYPOGRAPHY.fontSize.xl 사용해야 함
    color: '#000000',  // ❌ COLORS.dark 사용해야 함
  },
});
```

**인라인 동적 스타일:**
```javascript
// ❌ 금지
<View style={[styles.badge, { backgroundColor: statusColor }]}>
  <Text style={[styles.text, { color: textColor }]}>상태</Text>
</View>
```

### 상태별 스타일 적용 방법

**올바른 방법:**
```javascript
const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeActive: {
    backgroundColor: COLORS.successLight,
  },
  badgeInactive: {
    backgroundColor: COLORS.gray100,
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  textActive: {
    color: COLORS.success,
  },
  textInactive: {
    color: COLORS.gray600,
  },
});

// 사용
<View style={[
  styles.badge,
  isActive ? styles.badgeActive : styles.badgeInactive,
]}>
  <Text style={[
    styles.text,
    isActive ? styles.textActive : styles.textInactive,
  ]}>
    {label}
  </Text>
</View>
```

### 컴포넌트 조합 패턴

**통계 카드 그룹:**
```javascript
<View style={styles.statsContainer}>
  {stats.map((stat) => (
    <StatCard
      key={stat.id}
      icon={stat.icon}
      value={stat.value}
      label={stat.label}
      style={styles.statCard}
    />
  ))}
</View>
```

**섹션 그룹:**
```javascript
<DashboardSection title="섹션 1" icon={<Icon1 />}>
  {/* 내용 1 */}
</DashboardSection>

<DashboardSection title="섹션 2" icon={<Icon2 />}>
  {/* 내용 2 */}
</DashboardSection>
```

---

## 컴포넌트 분리 패턴 (Presentational/Container)

### 개요

웹과 동일하게 **Presentational(UI) + Container(로직) 분리 패턴**을 적용하여 디자인과 로직을 명확히 분리합니다.

### 패턴 구조

#### Presentational Component (UI만 담당)
- 순수 UI 컴포넌트, 재사용 가능
- props로만 데이터를 받음
- 비즈니스 로직 없음
- `mobile/src/components/admin/{ScreenName}/` 폴더에 위치

**예시:**
```javascript
// mobile/src/components/admin/AdminDashboard/AdminDashboardStats.js
const AdminDashboardStats = ({ stats = {}, loading = false }) => {
  // UI만 렌더링
  return (
    <View style={styles.container}>
      {statCards.map((card) => (
        <StatCard key={card.id} {...card} />
      ))}
    </View>
  );
};
```

#### Container Component (로직만 담당)
- 데이터 fetching, 상태 관리, 비즈니스 로직만 담당
- Presentational 컴포넌트를 조합하여 화면 구성
- `mobile/src/screens/admin/{ScreenName}.js`에 위치

**예시:**
```javascript
// mobile/src/screens/admin/AdminDashboard.js
const AdminDashboard = () => {
  const { user } = useSession();
  const [dashboardData, setDashboardData] = useState({});
  
  // 데이터 로드 로직
  const loadDashboardData = useCallback(async () => {
    // API 호출, 상태 업데이트
  }, [user?.id]);
  
  // UI는 Presentational 컴포넌트에 위임
  return (
    <SimpleLayout>
      <AdminDashboardStats stats={dashboardData} loading={isLoading} />
      <AdminDashboardActions onNavigate={handleNavigate} />
    </SimpleLayout>
  );
};
```

### 디렉토리 구조

```
mobile/src/
├── screens/admin/              ← Container 컴포넌트 (로직)
│   ├── AdminDashboard.js
│   ├── MappingManagement.js
│   └── SessionManagement.js
│
└── components/admin/           ← Presentational 컴포넌트 (UI)
    ├── AdminDashboard/
    │   ├── AdminDashboardStats.js
    │   ├── AdminDashboardActions.js
    │   ├── AdminDashboardSystem.js
    │   └── AdminDashboardActivities.js
    └── MappingManagement/
        └── MappingStats.js
```

### 규칙

1. **Presentational 컴포넌트**:
   - props로만 데이터 받음
   - 상태 관리 없음 (useState, useReducer 사용 금지)
   - API 호출 없음
   - 이벤트 핸들러는 props로 받음

2. **Container 컴포넌트**:
   - 모든 로직 담당
   - Presentational 컴포넌트 조합만
   - 최소한의 스타일만 가짐 (레이아웃 관련)

3. **스타일**:
   - Presentational 컴포넌트 내부에서만 스타일 정의
   - Container는 레이아웃 관련 스타일만

### 웹과의 일관성

웹의 `frontend/src/components/admin/AdminDashboard/` 구조와 동일하게 앱도 `mobile/src/components/admin/AdminDashboard/`로 분리합니다.

---

## 체크리스트 및 검증

### 코드 작성 전 체크리스트

- [ ] StyleSheet.create()를 사용하는가?
- [ ] 인라인 스타일 객체를 사용하지 않는가?
- [ ] 모든 색상 값이 COLORS 상수에서 가져오는가?
- [ ] 모든 간격 값이 SPACING 상수에서 가져오는가?
- [ ] 모든 폰트 크기가 TYPOGRAPHY 상수에서 가져오는가?
- [ ] 하드코딩된 숫자 값이 없는가?
- [ ] 상태별 스타일이 StyleSheet에 미리 정의되어 있는가?

### 스타일 검증 항목

1. **상수 사용 검증**
   ```javascript
   // ✅ 올바름
   padding: SPACING.md
   color: COLORS.primary
   fontSize: TYPOGRAPHY.fontSize.base
   
   // ❌ 잘못됨
   padding: 16
   color: '#007bff'
   fontSize: 14
   ```

2. **StyleSheet 사용 검증**
   ```javascript
   // ✅ 올바름
   const styles = StyleSheet.create({ ... });
   <View style={styles.container}>
   
   // ❌ 잘못됨
   <View style={{ flex: 1 }}>
   ```

3. **동적 스타일 검증**
   ```javascript
   // ✅ 올바름
   <View style={[styles.badge, status === 'active' && styles.badgeActive]}>
   
   // ❌ 잘못됨
   <View style={[styles.badge, { backgroundColor: getColor(status) }]}>
   ```

### 일관성 검증 방법

1. **색상 일관성**: 같은 의미의 색상은 항상 같은 COLORS 상수 사용
2. **간격 일관성**: 유사한 요소는 같은 SPACING 값 사용
3. **타이포그래피 일관성**: 같은 계층의 텍스트는 같은 TYPOGRAPHY 값 사용
4. **컴포넌트 일관성**: 유사한 UI는 같은 컴포넌트 사용 (StatCard, DashboardSection 등)

---

## 추가 리소스

### 참조 문서
- 웹 디자인 시스템 가이드: `docs/design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md`
- 모바일 구현 가이드: `docs-mobile-app/DETAILED_IMPLEMENTATION_GUIDE.md`

### 상수 파일 위치
- `mobile/src/constants/theme.js` - 테마 통합
- `mobile/src/constants/colors.js` - 색상
- `mobile/src/constants/spacing.js` - 간격
- `mobile/src/constants/typography.js` - 타이포그래피
- `mobile/src/constants/sizes.js` - 크기

### 컴포넌트 파일 위치
- `mobile/src/components/StatCard.js`
- `mobile/src/components/DashboardSection.js`
- `mobile/src/components/MGButton.js`
- `mobile/src/components/layout/SimpleLayout.js`

---

**마지막 업데이트**: 2025년 1월

