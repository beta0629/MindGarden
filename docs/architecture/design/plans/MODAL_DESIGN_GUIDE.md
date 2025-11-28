# 모달 디자인 가이드 🎨

## 📋 개요

MindGarden 프로젝트의 모달 컴포넌트에 대한 통합된 디자인 가이드입니다. 현재 여러 모달 컴포넌트가 서로 다른 클래스명과 구조를 사용하고 있어 일관성이 없는 문제를 해결하기 위해 작성되었습니다.

## 🚨 현재 문제점

### 1. 모달 컴포넌트 분산
- `Modal.js` - `modal-overlay`, `modal-container` 클래스 사용
- `BaseModal.js` - `mg-modal-overlay`, `mg-modal` 클래스 사용  
- `ErpModal.js` - `erp-modal-overlay`, `erp-modal` 클래스 사용
- `ConfirmModal.js` - 자체 CSS 클래스 사용
- `ScheduleDetailModal.js` - 개별 스타일링

### 2. z-index 충돌
- 여러 파일에 중복 정의된 z-index 값들
- 모달 계층 구조 불명확
- 확인 모달이 메인 모달 뒤에 나타나는 문제

### 3. 스타일 일관성 부족
- 각 모달마다 다른 배경색, 그림자, 애니메이션
- 크기 변형 (`small`, `medium`, `large`) 불일치
- 글라스모피즘 vs 단색 배경 혼재

## 🎯 통합 모달 시스템

### 1. 표준 클래스명 체계

```css
/* 메인 모달 구조 */
.mg-modal-overlay { }           /* 모달 배경 오버레이 */
.mg-modal { }                   /* 모달 컨테이너 */
.mg-modal__header { }           /* 모달 헤더 */
.mg-modal__title { }            /* 모달 제목 */
.mg-modal__close { }            /* 닫기 버튼 */
.mg-modal__body { }             /* 모달 본문 */
.mg-modal__actions { }          /* 액션 버튼 영역 */

/* 크기 변형 */
.mg-modal--small { }            /* 작은 모달 */
.mg-modal--medium { }           /* 중간 모달 (기본) */
.mg-modal--large { }            /* 큰 모달 */
.mg-modal--fullscreen { }       /* 전체화면 모달 */

/* 타입 변형 */
.mg-modal--confirm { }          /* 확인 모달 */
.mg-modal--alert { }            /* 알림 모달 */
.mg-modal--form { }             /* 폼 모달 */
```

### 2. z-index 계층 구조

```css
:root {
  /* 모달 z-index 체계 */
  --z-modal-backdrop: 1040;     /* 모달 배경 */
  --z-modal: 1050;              /* 일반 모달 */
  --z-modal-confirm: 1060;      /* 확인/알림 모달 */
  --z-modal-toast: 1070;        /* 토스트 알림 */
}
```

### 3. 모달 컴포넌트 표준화

#### BaseModal (표준 모달)
```javascript
const BaseModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  type = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true 
}) => {
  if (!isOpen) return null;

  return (
    <div className={`mg-modal-overlay ${isOpen ? 'mg-modal-overlay--visible' : ''}`}>
      <div className={`mg-modal mg-modal--${size} mg-modal--${type}`}>
        {title && (
          <div className="mg-modal__header">
            <h2 className="mg-modal__title">{title}</h2>
            {showCloseButton && (
              <button className="mg-modal__close" onClick={onClose}>×</button>
            )}
          </div>
        )}
        <div className="mg-modal__body">
          {children}
        </div>
      </div>
    </div>
  );
};
```

#### ConfirmModal (확인 모달)
```javascript
const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "확인", 
  message = "정말로 진행하시겠습니까?",
  confirmText = "확인",
  cancelText = "취소",
  type = "default" 
}) => {
  return (
    <div className="mg-modal-overlay mg-modal-overlay--visible" style={{ zIndex: 'var(--z-modal-confirm)' }}>
      <div className={`mg-modal mg-modal--small mg-modal--confirm`}>
        <div className="mg-modal__header">
          <h3 className="mg-modal__title">{title}</h3>
        </div>
        <div className="mg-modal__body">
          <p>{message}</p>
          <div className="mg-modal__actions">
            <button className="mg-btn mg-btn--secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button className={`mg-btn mg-btn--${type}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 🎨 디자인 시스템

### 1. 색상 체계

```css
:root {
  /* 모달 배경 */
  --modal-bg-primary: var(--glass-bg-medium);
  --modal-bg-confirm: rgba(255, 255, 255, 0.95);
  --modal-bg-alert: rgba(255, 255, 255, 0.98);
  
  /* 오버레이 */
  --modal-overlay: rgba(0, 0, 0, 0.5);
  --modal-overlay-light: rgba(0, 0, 0, 0.3);
  
  /* 테두리 */
  --modal-border: var(--glass-border);
  --modal-border-confirm: 1px solid var(--color-border);
}
```

### 2. 크기 시스템

```css
.mg-modal--small {
  width: 400px;
  max-width: 90vw;
}

.mg-modal--medium {
  width: 600px;
  max-width: 90vw;
}

.mg-modal--large {
  width: 800px;
  max-width: 95vw;
}

.mg-modal--fullscreen {
  width: 95vw;
  height: 95vh;
}
```

### 3. 애니메이션

```css
/* 모달 오버레이 애니메이션 */
.mg-modal-overlay {
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.mg-modal-overlay--visible {
  opacity: 1;
  visibility: visible;
}

/* 모달 컨텐츠 애니메이션 */
.mg-modal {
  transform: scale(0.9) translateY(20px);
  transition: transform 0.3s ease;
}

.mg-modal-overlay--visible .mg-modal {
  transform: scale(1) translateY(0);
}
```

## 📱 반응형 디자인

### 1. 모바일 최적화

```css
@media (max-width: 768px) {
  .mg-modal {
    width: 95vw !important;
    max-height: 90vh;
    margin: 20px;
  }
  
  .mg-modal--fullscreen {
    width: 100vw;
    height: 100vh;
    margin: 0;
    border-radius: 0;
  }
  
  .mg-modal__header {
    padding: var(--spacing-md);
  }
  
  .mg-modal__body {
    padding: var(--spacing-md);
  }
}
```

### 2. 태블릿 최적화

```css
@media (min-width: 769px) and (max-width: 1024px) {
  .mg-modal {
    width: 90vw;
    max-width: 700px;
  }
}
```

## 🔧 구현 가이드

### 1. 기존 모달 마이그레이션

#### Before (기존)
```javascript
// ScheduleDetailModal.js
<div className="schedule-detail-modal-overlay">
  <div className="schedule-detail-modal">
    <div className="schedule-detail-modal-header">
      <h3>스케줄 상세 정보</h3>
      <button className="schedule-detail-close-btn">×</button>
    </div>
    <div className="schedule-detail-modal-content">
      {/* 내용 */}
    </div>
  </div>
</div>
```

#### After (표준화)
```javascript
// ScheduleDetailModal.js
<BaseModal 
  isOpen={isOpen}
  onClose={onClose}
  title="📋 스케줄 상세 정보"
  size="large"
>
  {/* 내용 */}
</BaseModal>
```

### 2. 확인 모달 구현

```javascript
// 사용 예시
const [showConfirm, setShowConfirm] = useState(false);

const handleDelete = () => {
  setShowConfirm(true);
};

const handleConfirmDelete = () => {
  // 삭제 로직
  setShowConfirm(false);
};

return (
  <>
    <button onClick={handleDelete}>삭제</button>
    
    {showConfirm && (
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="삭제 확인"
        message="정말로 삭제하시겠습니까?"
        type="danger"
        confirmText="삭제"
        cancelText="취소"
      />
    )}
  </>
);
```

## 📋 체크리스트

### Phase 1: 기반 구축
- [ ] `BaseModal` 컴포넌트 표준화
- [ ] `ConfirmModal` 컴포넌트 통일
- [ ] z-index 시스템 정리
- [ ] CSS 변수 통합

### Phase 2: 기존 모달 마이그레이션
- [ ] `ScheduleDetailModal` 마이그레이션
- [ ] `ErpModal` 마이그레이션
- [ ] `Modal.js` 마이그레이션
- [ ] 중복 CSS 제거

### Phase 3: 고급 기능
- [ ] 모달 스택 관리
- [ ] 키보드 네비게이션
- [ ] 접근성 개선
- [ ] 애니메이션 최적화

## 🎯 성공 지표

1. **모달 컴포넌트 통일**: 모든 모달이 `mg-modal` 클래스 사용
2. **z-index 충돌 제거**: 모달 계층 구조 명확화
3. **일관된 디자인**: 모든 모달이 동일한 스타일 가이드 적용
4. **개발 생산성 향상**: 모달 구현 시간 50% 단축
5. **유지보수성 향상**: 모달 스타일 수정 시 한 곳에서만 변경

## 📚 참고 문서

- [CSS 아키텍처 개선 계획](./CSS_ARCHITECTURE_IMPROVEMENT_PLAN.md)
- [디자인 구현 계획](../implementation/DESIGN_IMPLEMENTATION_PLAN.md)
- [BEM 방법론 가이드](https://getbem.com/)
- [ITCSS 아키텍처](https://itcss.io/)

---

**작성일**: 2025-01-02  
**작성자**: AI Assistant  
**버전**: 1.0  
**상태**: 초안
