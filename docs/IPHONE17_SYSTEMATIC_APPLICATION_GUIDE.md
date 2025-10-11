# iPhone 17 디자인 시스템 체계적 적용 가이드

## 📋 개요
iPhone 17 디자인 시스템을 MindGarden 프로젝트에 체계적으로 적용하는 완전한 가이드입니다.

## 🎯 목표
1. **일관된 디자인**: 모든 페이지와 컴포넌트가 iPhone 17 디자인 언어 사용
2. **개발 효율성**: 새로운 페이지/컴포넌트 생성 시 표준화된 템플릿 사용
3. **유지보수성**: 중앙화된 디자인 시스템으로 쉬운 관리
4. **점진적 적용**: 기존 코드를 단계적으로 마이그레이션

---

## 1. 📄 새 페이지 생성 템플릿 방법

### 1.1 기본 페이지 템플릿

#### **React 컴포넌트 템플릿**
```jsx
// src/pages/YourPageName.js
import React from 'react';
import UnifiedHeader from '../components/common/UnifiedHeader';
import CommonPageTemplate from '../components/common/CommonPageTemplate';
import UnifiedNotification from '../components/common/UnifiedNotification';
import IPhone17Card from '../components/common/IPhone17Card';
import IPhone17Button from '../components/common/IPhone17Button';
import './YourPageName.css';

const YourPageName = () => {
  return (
    <CommonPageTemplate
      title="페이지 제목"
      description="페이지 설명"
      bodyClass="your-page-class"
    >
      <UnifiedHeader
        title="페이지 제목"
        subtitle="페이지 부제목"
      />
      
      <div className="your-page-container">
        {/* iPhone 17 컴포넌트 사용 */}
        <IPhone17Card variant="content" title="콘텐츠 제목">
          <p>콘텐츠 내용</p>
        </IPhone17Card>
        
        <IPhone17Button variant="primary">
          액션 버튼
        </IPhone17Button>
      </div>
      
      <UnifiedNotification />
    </CommonPageTemplate>
  );
};

export default YourPageName;
```

#### **CSS 템플릿**
```css
/* src/pages/YourPageName.css */
.your-page-container {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.your-page-container h1 {
  color: var(--ios-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-4);
}

.your-page-container p {
  color: var(--ios-text-secondary);
  font-size: var(--font-size-base);
  line-height: 1.4;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .your-page-container {
    padding: var(--spacing-4);
  }
}
```

### 1.2 페이지 생성 체크리스트

#### **필수 요소**
- [ ] `CommonPageTemplate` 래퍼 사용
- [ ] `UnifiedHeader` 컴포넌트 사용
- [ ] `UnifiedNotification` 컴포넌트 사용
- [ ] iPhone 17 CSS 변수 사용 (`var(--ios-*)`)
- [ ] iPhone 17 컴포넌트 사용 (`IPhone17Card`, `IPhone17Button`)
- [ ] 반응형 디자인 적용
- [ ] 다크모드 지원 확인

#### **권장 사항**
- [ ] 의미있는 CSS 클래스명 사용
- [ ] 접근성 고려 (ARIA 라벨, 키보드 네비게이션)
- [ ] 성능 최적화 (불필요한 리렌더링 방지)

---

## 2. 🔄 기존 페이지 마이그레이션 전략

### 2.1 단계별 마이그레이션 계획

#### **Phase 1: 핵심 페이지 (우선순위 높음)**
1. **대시보드 페이지**
   - 관리자 대시보드
   - 사용자 대시보드
   - 통계 페이지

2. **주요 기능 페이지**
   - 사용자 관리
   - 세션 관리
   - 결제 관리

#### **Phase 2: 일반 페이지**
1. **설정 페이지**
2. **프로필 페이지**
3. **도움말 페이지**

#### **Phase 3: 특수 페이지**
1. **로그인/회원가입**
2. **에러 페이지**
3. **테스트 페이지**

### 2.2 마이그레이션 체크리스트

#### **CSS 마이그레이션**
```css
/* 기존 스타일 */
.old-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* iPhone 17 스타일로 변경 */
.old-card {
  background: var(--ios-bg-primary);
  border: 0.5px solid var(--ios-system-gray5);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-card);
}
```

#### **컴포넌트 마이그레이션**
```jsx
// 기존 컴포넌트
<div className="old-card">
  <h3>제목</h3>
  <p>내용</p>
</div>

// iPhone 17 컴포넌트로 변경
<IPhone17Card variant="content" title="제목">
  <p>내용</p>
</IPhone17Card>
```

### 2.3 마이그레이션 도구

#### **자동 변환 스크립트**
```bash
# CSS 변수 변환
find src -name "*.css" -exec sed -i 's/#ffffff/var(--ios-bg-primary)/g' {} \;
find src -name "*.css" -exec sed -i 's/#000000/var(--ios-text-primary)/g' {} \;
find src -name "*.css" -exec sed -i 's/16px/var(--spacing-4)/g' {} \;
```

---

## 3. 🪟 기존 모달 iPhone 17 스타일 적용

### 3.1 모달 컴포넌트 업데이트

#### **기존 모달을 iPhone 17 스타일로 업데이트**
```jsx
// src/components/common/IPhone17Modal.js
import React from 'react';
import './IPhone17Modal.css';

const IPhone17Modal = ({ isOpen, onClose, title, children, variant = 'default' }) => {
  if (!isOpen) return null;

  return (
    <div className="iphone17-modal-overlay" onClick={onClose}>
      <div 
        className={`iphone17-modal ${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="iphone17-modal-header">
          <h2 className="iphone17-modal-title">{title}</h2>
          <button 
            className="iphone17-modal-close"
            onClick={onClose}
            aria-label="모달 닫기"
          >
            ✕
          </button>
        </div>
        <div className="iphone17-modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default IPhone17Modal;
```

#### **iPhone 17 모달 CSS**
```css
/* src/styles/06-components/_base/_iphone17-modals.css */
.iphone17-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  animation: fadeIn 0.3s ease;
}

.iphone17-modal {
  background: var(--ios-bg-primary);
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--shadow-floating);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.iphone17-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-6);
  border-bottom: 0.5px solid var(--ios-system-gray6);
}

.iphone17-modal-title {
  color: var(--ios-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.iphone17-modal-close {
  background: none;
  border: none;
  color: var(--ios-text-secondary);
  font-size: var(--font-size-lg);
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--border-radius-sm);
  transition: var(--transition-fast);
}

.iphone17-modal-close:hover {
  background: var(--ios-bg-secondary);
  color: var(--ios-text-primary);
}

.iphone17-modal-content {
  padding: var(--spacing-6);
  max-height: 60vh;
  overflow-y: auto;
}

/* 다크모드 지원 */
.dark-mode .iphone17-modal {
  background: var(--ios-bg-primary);
}

/* 애니메이션 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 3.2 기존 모달 마이그레이션 예시

#### **기존 모달**
```jsx
// 기존 모달 사용법
<Modal isOpen={isOpen} onClose={onClose}>
  <Modal.Header>제목</Modal.Header>
  <Modal.Body>내용</Modal.Body>
</Modal>
```

#### **iPhone 17 모달로 변경**
```jsx
// iPhone 17 모달 사용법
<IPhone17Modal 
  isOpen={isOpen} 
  onClose={onClose}
  title="제목"
  variant="content"
>
  <p>내용</p>
  <IPhone17Button variant="primary" onClick={onSave}>
    저장
  </IPhone17Button>
</IPhone17Modal>
```

---

## 4. 📁 공통 파일 적용 방법

### 4.1 CSS 파일 구조

#### **기존 파일 업데이트**
```
frontend/src/styles/
├── main.css                    # 메인 엔트리 (이미 업데이트됨)
├── 01-settings/
│   ├── _iphone17-tokens.css    # iPhone 17 디자인 토큰 (신규)
│   ├── _colors.css             # 기존 색상 (호환성 유지)
│   └── ...
├── 06-components/
│   ├── _base/
│   │   ├── _iphone17-cards.css # iPhone 17 카드 (신규)
│   │   ├── _iphone17-buttons.css # iPhone 17 버튼 (신규)
│   │   ├── _iphone17-modals.css # iPhone 17 모달 (신규)
│   │   └── ...
│   └── ...
```

### 4.2 기존 CSS 파일 업데이트

#### **기존 컴포넌트 CSS 업데이트**
```css
/* src/components/admin/AdminDashboard.css */
/* 기존 스타일을 iPhone 17 변수로 업데이트 */

.admin-dashboard {
  /* 기존 */
  background: #ffffff;
  color: #333333;
  padding: 24px;
  
  /* iPhone 17로 변경 */
  background: var(--ios-bg-primary);
  color: var(--ios-text-primary);
  padding: var(--spacing-6);
}

.admin-dashboard .card {
  /* 기존 */
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  
  /* iPhone 17로 변경 */
  background: var(--ios-bg-secondary);
  border: 0.5px solid var(--ios-system-gray5);
  border-radius: var(--border-radius-xl);
}
```

### 4.3 공통 유틸리티 클래스

#### **iPhone 17 유틸리티 클래스 추가**
```css
/* src/styles/07-utilities/_iphone17-utilities.css */

/* 텍스트 유틸리티 */
.text-ios-primary { color: var(--ios-text-primary); }
.text-ios-secondary { color: var(--ios-text-secondary); }
.text-ios-tertiary { color: var(--ios-text-tertiary); }

/* 배경 유틸리티 */
.bg-ios-primary { background: var(--ios-bg-primary); }
.bg-ios-secondary { background: var(--ios-bg-secondary); }

/* 간격 유틸리티 */
.p-ios-1 { padding: var(--spacing-1); }
.p-ios-2 { padding: var(--spacing-2); }
.p-ios-4 { padding: var(--spacing-4); }
.p-ios-6 { padding: var(--spacing-6); }

.m-ios-1 { margin: var(--spacing-1); }
.m-ios-2 { margin: var(--spacing-2); }
.m-ios-4 { margin: var(--spacing-4); }
.m-ios-6 { margin: var(--spacing-6); }

/* 그림자 유틸리티 */
.shadow-ios-card { box-shadow: var(--shadow-card); }
.shadow-ios-hover { box-shadow: var(--shadow-card-hover); }
.shadow-ios-glass { box-shadow: var(--shadow-glass); }
```

---

## 5. 🎨 HTML/CSS 적용 방법

### 5.1 HTML 클래스 네이밍 규칙

#### **iPhone 17 클래스 네이밍**
```html
<!-- 페이지 컨테이너 -->
<div class="iphone17-page-container">
  
  <!-- 섹션 -->
  <section class="iphone17-section">
    <h2 class="iphone17-section-title">섹션 제목</h2>
    
    <!-- 그리드 레이아웃 -->
    <div class="iphone17-grid">
      
      <!-- 카드 -->
      <div class="iphone17-card iphone17-stat-card">
        <div class="iphone17-stat-icon">📊</div>
        <div class="iphone17-stat-content">
          <div class="iphone17-stat-value">1,234</div>
          <div class="iphone17-stat-label">총 사용자</div>
        </div>
      </div>
      
    </div>
  </section>
  
</div>
```

### 5.2 CSS 작성 가이드

#### **iPhone 17 CSS 작성 규칙**
```css
/* 1. iPhone 17 변수 사용 필수 */
.your-component {
  background: var(--ios-bg-primary);           /* ❌ background: #ffffff; */
  color: var(--ios-text-primary);              /* ❌ color: #333333; */
  padding: var(--spacing-4);                   /* ❌ padding: 16px; */
  border-radius: var(--border-radius-xl);      /* ❌ border-radius: 16px; */
  box-shadow: var(--shadow-card);              /* ❌ box-shadow: 0 2px 4px; */
}

/* 2. 반응형 디자인 필수 */
@media (max-width: 768px) {
  .your-component {
    padding: var(--spacing-3);
    font-size: var(--font-size-sm);
  }
}

/* 3. 다크모드 지원 필수 */
.dark-mode .your-component {
  background: var(--ios-bg-primary);
  color: var(--ios-text-primary);
}

/* 4. 애니메이션은 iPhone 17 표준 사용 */
.your-component {
  transition: var(--transition-normal);
}

.your-component:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

### 5.3 컴포넌트 사용 예시

#### **완전한 페이지 예시**
```jsx
// src/pages/UserDashboard.js
import React from 'react';
import UnifiedHeader from '../components/common/UnifiedHeader';
import CommonPageTemplate from '../components/common/CommonPageTemplate';
import IPhone17Card from '../components/common/IPhone17Card';
import IPhone17Button from '../components/common/IPhone17Button';
import './UserDashboard.css';

const UserDashboard = () => {
  return (
    <CommonPageTemplate
      title="사용자 대시보드"
      description="사용자 대시보드 페이지"
      bodyClass="user-dashboard-page"
    >
      <UnifiedHeader
        title="사용자 대시보드"
        subtitle="환영합니다"
      />
      
      <div className="iphone17-page-container">
        
        {/* 통계 섹션 */}
        <section className="iphone17-section">
          <h2 className="iphone17-section-title">통계 현황</h2>
          <div className="iphone17-grid">
            <IPhone17Card
              variant="stat"
              icon="👥"
              value="1,234"
              label="총 사용자"
            />
            <IPhone17Card
              variant="stat"
              icon="💬"
              value="89"
              label="활성 세션"
            />
          </div>
        </section>
        
        {/* 액션 섹션 */}
        <section className="iphone17-section">
          <div className="iphone17-btn-group">
            <IPhone17Button variant="primary">
              새 사용자 추가
            </IPhone17Button>
            <IPhone17Button variant="secondary">
              설정
            </IPhone17Button>
          </div>
        </section>
        
      </div>
    </CommonPageTemplate>
  );
};

export default UserDashboard;
```

```css
/* src/pages/UserDashboard.css */
.iphone17-page-container {
  padding: var(--spacing-6);
  max-width: 1200px;
  margin: 0 auto;
}

.iphone17-section {
  margin-bottom: var(--spacing-8);
}

.iphone17-section-title {
  color: var(--ios-text-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-6);
  text-align: center;
}

.iphone17-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-4);
}

.iphone17-btn-group {
  display: flex;
  gap: var(--spacing-4);
  justify-content: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .iphone17-page-container {
    padding: var(--spacing-4);
  }
  
  .iphone17-grid {
    grid-template-columns: 1fr;
  }
  
  .iphone17-btn-group {
    flex-direction: column;
    align-items: center;
  }
}
```

---

## 6. 📋 체계적 적용 체크리스트

### 6.1 새 페이지 생성 체크리스트
- [ ] `CommonPageTemplate` 래퍼 사용
- [ ] `UnifiedHeader` 컴포넌트 사용
- [ ] `UnifiedNotification` 컴포넌트 사용
- [ ] iPhone 17 CSS 변수 사용 (`var(--ios-*)`)
- [ ] iPhone 17 컴포넌트 사용
- [ ] 반응형 디자인 적용
- [ ] 다크모드 지원 확인
- [ ] 접근성 고려
- [ ] 성능 최적화

### 6.2 기존 페이지 마이그레이션 체크리스트
- [ ] CSS 변수를 iPhone 17 변수로 변경
- [ ] 기존 컴포넌트를 iPhone 17 컴포넌트로 교체
- [ ] 반응형 디자인 확인
- [ ] 다크모드 동작 확인
- [ ] 브라우저 테스트 완료
- [ ] 접근성 테스트 완료

### 6.3 품질 보증 체크리스트
- [ ] 모든 페이지에서 일관된 디자인 확인
- [ ] 모든 브라우저에서 정상 동작 확인
- [ ] 모바일/태블릿/데스크톱 반응형 확인
- [ ] 다크모드/라이트모드 전환 확인
- [ ] 성능 측정 및 최적화 완료

---

## 7. 🚀 다음 단계

### 7.1 즉시 실행 가능한 작업
1. **새 페이지 생성**: 위 템플릿 사용
2. **기존 모달 업데이트**: iPhone 17 모달 스타일 적용
3. **공통 유틸리티 클래스 추가**: 개발 효율성 향상

### 7.2 중장기 계획
1. **단계적 마이그레이션**: 우선순위에 따른 기존 페이지 업데이트
2. **성능 최적화**: CSS 번들 크기 최적화
3. **문서화**: 개발자 가이드 및 베스트 프랙티스 문서 작성

이 가이드를 따라하면 iPhone 17 디자인 시스템을 체계적이고 일관되게 적용할 수 있습니다.
