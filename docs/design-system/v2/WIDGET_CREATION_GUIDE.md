# MindGarden 위젯 생성 가이드

## 📋 개요

MindGarden 프로젝트에서 표준화된 위젯을 생성하기 위한 완전 자동화 도구입니다.

## 🎯 핵심 원칙

### 1. CSS와 비즈니스 로직 완전 분리
- **CSS 상수화**: 모든 스타일 값은 CSS 변수 사용
- **인라인 스타일 금지**: `style` 속성 사용 금지
- **하드코딩 금지**: 모든 값은 상수 파일에서 관리

### 2. MindGarden 디자인 시스템 우선 적용
- **mg- 접두사**: 모든 CSS 클래스는 `mg-` 접두사 사용
- **디자인 토큰**: `MG_DESIGN_TOKENS` 사용 필수
- **표준 컴포넌트**: `StatCard`, `MGButton` 등 기존 컴포넌트 활용

### 3. 표준화된 구조
- **일관된 파일 구조**: 모든 위젯 동일한 패턴
- **자동 테스트**: 테스트 파일 자동 생성
- **문서화**: 스토리북 및 마크다운 문서 자동 생성

## 🚀 사용법

### 기본 명령어
```bash
node scripts/create-widget.js <위젯명> <타입> [옵션]
```

### 위젯 타입
- `admin`: 관리자 전용 위젯
- `common`: 공통 위젯 (모든 역할에서 사용 가능)
- `consultation`: 상담 관련 위젯
- `academy`: 아카데미 관련 위젯

### 옵션
- `--api=<엔드포인트>`: 단일 API 엔드포인트 지정
- `--multiple-apis`: 다중 API 호출 위젯
- `--no-api`: API 호출 없는 정적 위젯
- `--description=<설명>`: 위젯 설명

## 📝 예시

### 1. 단일 API 위젯
```bash
node scripts/create-widget.js PendingDeposits admin --api="/api/admin/pending-deposits" --description="입금 확인 대기 목록"
```

### 2. 다중 API 위젯
```bash
node scripts/create-widget.js SystemOverview admin --multiple-apis --description="시스템 전체 현황"
```

### 3. 정적 위젯
```bash
node scripts/create-widget.js WelcomeMessage common --no-api --description="환영 메시지"
```

## 📁 생성되는 파일들

### 1. 위젯 컴포넌트
- **경로**: `frontend/src/components/dashboard/widgets/{타입}/{위젯명}Widget.js`
- **내용**: React 컴포넌트 (MindGarden 디자인 시스템 적용)

### 2. CSS 스타일
- **경로**: `frontend/src/components/dashboard/widgets/Widget.css`
- **내용**: 위젯별 CSS 클래스 추가 (CSS 변수 사용)

### 3. 테스트 파일
- **경로**: `frontend/src/components/dashboard/widgets/__tests__/{위젯명}Widget.test.js`
- **내용**: Jest 테스트 케이스

### 4. 스토리북 파일
- **경로**: `frontend/src/components/dashboard/widgets/__stories__/{위젯명}Widget.stories.js`
- **내용**: Storybook 스토리

### 5. 문서 파일
- **경로**: `docs/widgets/{위젯명}Widget.md`
- **내용**: 위젯 사용법 및 API 문서

### 6. 레지스트리 업데이트
- **파일**: `frontend/src/components/dashboard/widgets/WidgetRegistry.js`
- **내용**: 새 위젯 자동 등록

## 🎨 생성된 위젯 구조

### React 컴포넌트 구조
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import StatCard from '../../ui/Card/StatCard';
import MGButton from '../../common/MGButton';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import { MG_DESIGN_TOKENS } from '../../../constants/designTokens';
import '../Widget.css';
import '../../../styles/mindgarden-design-system.css';

const YourWidget = ({ widget, user }) => {
  // 상태 관리 (API 위젯인 경우)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 설정 및 로직
  const config = widget.config || {};

  // API 호출 (필요한 경우)
  const loadData = async () => {
    // API 호출 로직
  };

  // 렌더링: 로딩 상태
  if (loading) {
    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTAINER('widget-type')}>
        {/* 로딩 UI */}
      </div>
    );
  }

  // 렌더링: 에러 상태
  if (error) {
    return (
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTAINER('widget-type')}>
        {/* 에러 UI */}
      </div>
    );
  }

  // 렌더링: 정상 상태
  return (
    <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTAINER('widget-type')}>
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_HEADER}>
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_HEADER}>
          <h3 className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_TITLE}>
            {config.title || WIDGET_CONSTANTS.DEFAULT_TITLES.YOUR_WIDGET}
          </h3>
        </div>
      </div>
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_BODY}>
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_CARD_BODY}>
          {/* 위젯 내용 */}
        </div>
      </div>
    </div>
  );
};

export default YourWidget;
```

### CSS 구조
```css
/* 위젯별 CSS 변수 정의 */
.mg-widget--your-widget {
  --widget-primary-color: var(--mg-primary-500);
  --widget-background: var(--mg-white);
  --widget-border: var(--mg-gray-200);
  --widget-shadow: var(--mg-shadow-sm);
  
  /* 스타일 적용 */
  background-color: var(--widget-background);
  border: 1px solid var(--widget-border);
  box-shadow: var(--widget-shadow);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .mg-widget--your-widget {
    /* 모바일 스타일 */
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .mg-widget--your-widget {
    --widget-background: var(--mg-gray-800);
    --widget-border: var(--mg-gray-700);
  }
}
```

## 🔧 상수 파일 활용

### 1. WIDGET_CONSTANTS 사용
```javascript
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';

// CSS 클래스
className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTAINER('widget-type')}

// 기본 제목
{config.title || WIDGET_CONSTANTS.DEFAULT_TITLES.YOUR_WIDGET}

// 로딩 메시지
{WIDGET_CONSTANTS.LOADING_MESSAGES.DEFAULT}

// 에러 메시지
{WIDGET_CONSTANTS.ERROR_MESSAGES.LOAD_FAILED}
```

### 2. MG_DESIGN_TOKENS 사용
```javascript
import { MG_DESIGN_TOKENS } from '../../../constants/designTokens';

// 색상
color={MG_DESIGN_TOKENS.COLORS.PRIMARY}

// 버튼 변형
variant={MG_DESIGN_TOKENS.BUTTON_VARIANTS.PRIMARY}

// 크기
size={MG_DESIGN_TOKENS.BUTTON_SIZES.MEDIUM}
```

## 📋 생성 후 작업 순서

### 1. 위젯 내용 구현
- TODO 주석 부분을 실제 로직으로 교체
- StatCard, MGButton 등 표준 컴포넌트 활용
- API 응답 데이터에 맞게 렌더링 로직 구현

### 2. CSS 스타일링 (필요시)
- CSS 변수 추가 정의
- 위젯별 고유 스타일 추가
- 반응형 디자인 적용

### 3. 테스트 작성
- API 모킹 테스트
- 렌더링 테스트
- 사용자 인터랙션 테스트

### 4. DynamicDashboard 설정 추가
```javascript
// DynamicDashboard.js에서 위젯 설정 추가
{
  id: 'unique-widget-id',
  type: 'your-widget-type',
  position: { row: 1, col: 1, colspan: 2, rowspan: 1 },
  config: {
    title: '위젯 제목',
    subtitle: '위젯 부제목'
  }
}
```

## 🧪 테스트 실행

### 단위 테스트
```bash
npm test -- YourWidget.test.js
```

### 스토리북 실행
```bash
npm run storybook
```

### 전체 테스트
```bash
npm test
```

## 📚 참고 자료

- [MindGarden 디자인 시스템 가이드](./MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)
- [위젯 아키텍처 문서](./DESIGN_SYSTEM_ARCHITECTURE.md)
- [CSS 변수 레퍼런스](../frontend/src/styles/mindgarden-design-system.css)

## 🔍 문제 해결

### 자주 발생하는 오류

1. **CSS 클래스 오류**
   - 해결: `WIDGET_CONSTANTS.CSS_CLASSES` 사용 확인
   - 예시: `className="widget"` → `className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTAINER('type')}`

2. **상수 참조 오류**
   - 해결: import 문 확인
   - 예시: `import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';`

3. **API 엔드포인트 오류**
   - 해결: 백엔드 API 구현 확인
   - 예시: 404 오류 시 컨트롤러에 해당 엔드포인트 추가

### 디버깅 팁

1. **개발자 도구 활용**
   - CSS 변수 값 확인: `getComputedStyle(element).getPropertyValue('--mg-primary-500')`
   - 콘솔에서 위젯 상태 확인

2. **스토리북 활용**
   - 독립적인 위젯 테스트 환경
   - 다양한 props 조합 테스트

3. **로그 활용**
   - API 호출 로그 확인
   - 렌더링 로그 확인

## 🎯 베스트 프랙티스

1. **일관성 유지**
   - 모든 위젯은 동일한 패턴 사용
   - 상수 파일 적극 활용

2. **성능 최적화**
   - `useCallback`, `useMemo` 적절히 사용
   - 불필요한 리렌더링 방지

3. **접근성 고려**
   - ARIA 라벨 추가
   - 키보드 네비게이션 지원

4. **반응형 디자인**
   - 모바일 우선 설계
   - CSS Grid/Flexbox 활용

---

**📝 작성일**: 2025-11-28  
**✍️ 작성자**: MindGarden 개발팀  
**🔄 버전**: 1.0.0
