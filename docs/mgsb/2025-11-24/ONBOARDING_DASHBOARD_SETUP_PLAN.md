# 온보딩 대시보드 설정 UI 개발 계획

**작성일**: 2025-11-24  
**목적**: 온보딩 플로우에서 대시보드 위젯을 쉽게 설정할 수 있는 UI 개발 (애니메이션 포함)

---

## 📋 개요

온보딩 플로우에서 테넌트 관리자가 처음 대시보드를 설정할 때, 직관적이고 간편한 UI를 제공하여 쉽게 위젯을 선택하고 배치할 수 있도록 합니다.

**핵심 원칙**:
- **간편함**: 복잡한 설정 없이 몇 번의 클릭으로 완료
- **안내 메시지**: 각 단계별 명확한 안내
- **애니메이션**: 부드러운 전환과 시각적 피드백
- **템플릿 기반**: 업종별/역할별 기본 템플릿 제공

---

## 🎯 목표

### 사용자 경험 목표
1. **3분 이내 설정 완료**: 복잡한 설정 없이 빠르게 완료
2. **직관적인 UI**: 드래그 앤 드롭 또는 클릭으로 간편하게
3. **시각적 피드백**: 애니메이션으로 설정 과정을 명확히 표시
4. **안내 메시지**: 각 단계별 친절한 안내

---

## 🏗️ 구현 계획

### Phase 1: 온보딩 대시보드 설정 스텝 추가 (2-3일)

#### 1.1 온보딩 플로우에 대시보드 설정 스텝 추가

**위치**: `frontend-trinity/app/onboarding/page.tsx`

**현재 스텝**:
1. 기본 정보 (Step 1)
2. 업종 선택 (Step 2)
3. 요금제 선택 (Step 3)
4. 결제 방법 (Step 4) - 현재 숨김
5. 완료 (Step 5)

**제안하는 스텝**:
1. 기본 정보 (Step 1)
2. 업종 선택 (Step 2)
3. 요금제 선택 (Step 3)
4. 결제 및 PG 설정 (Step 4) - 확장 필요 (PG 사 등록/변경/삭제)
5. 대시보드 위젯 설정 (Step 5) - 신규 추가
6. 완료 (Step 6)

**참고**: 온보딩에서 초기 설정을 완료하고, 이후 코어 솔루션에서 컨텐츠 위주로 운영하며 필요 시 설정 변경

**구조**:
```typescript
{step === 6 && (
  <Step6DashboardSetup
    formData={formData}
    setFormData={setFormData}
    businessType={formData.businessType}
    onComplete={handleDashboardSetupComplete}
  />
)}
```

#### 1.2 대시보드 설정 컴포넌트 생성

**파일**: `frontend-trinity/components/onboarding/Step6DashboardSetup.tsx`

**기능**:
- 업종별/역할별 기본 템플릿 선택
- 위젯 추가/제거 (간편한 UI)
- 드래그 앤 드롭 레이아웃 편집 (선택적)
- 실시간 미리보기
- 애니메이션 효과

---

### Phase 2: 템플릿 기반 위젯 선택 UI (2일)

#### 2.1 업종별/역할별 템플릿 제공

**템플릿 종류**:
- **상담소 (CONSULTATION)**
  - 관리자: 환영, 통계, 일정, 상담 요약
  - 상담사: 일정, 상담 기록, 통계
  - 내담자: 일정, 알림, 결제 내역

- **학원 (ACADEMY)**
  - 관리자: 환영, 통계, 일정, 출석 관리
  - 선생님: 일정, 출석 관리, 통계
  - 학생: 일정, 알림, 수강 내역

**UI 구조**:
```
┌─────────────────────────────────────┐
│  대시보드 설정                        │
├─────────────────────────────────────┤
│  💡 안내: 역할별 기본 위젯을 선택하세요  │
│                                      │
│  [템플릿 선택]                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 관리자  │ │ 상담사  │ │ 내담자  │ │
│  │ 템플릿  │ │ 템플릿  │ │ 템플릿  │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                      │
│  [미리보기]                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │ 환영    │ │ 통계    │ │ 일정    │ │
│  └─────────┘ └─────────┘ └─────────┘ │
│                                      │
│  [다음 단계] [건너뛰기]               │
└─────────────────────────────────────┘
```

#### 2.2 템플릿 선택 애니메이션

**애니메이션 효과**:
- 템플릿 카드 호버 시 확대 효과
- 선택 시 체크 표시 애니메이션
- 미리보기 페이드 인/아웃
- 위젯 추가 시 슬라이드 인

**구현 방법**:
```typescript
// CSS 애니메이션 또는 Framer Motion 사용
.template-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.template-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.template-card.selected {
  animation: selectPulse 0.5s ease;
}

@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

---

### Phase 3: 간편한 위젯 편집 UI (2-3일)

#### 3.1 위젯 추가/제거 UI

**기능**:
- 위젯 목록에서 클릭으로 추가
- 추가된 위젯 목록 표시
- 위젯 삭제 버튼
- 위젯 순서 변경 (드래그 앤 드롭 또는 위/아래 버튼)

**애니메이션**:
- 위젯 추가 시 슬라이드 인 애니메이션
- 위젯 삭제 시 페이드 아웃 애니메이션
- 위젯 순서 변경 시 부드러운 이동 애니메이션

#### 3.2 실시간 미리보기

**기능**:
- 선택한 위젯을 실시간으로 미리보기
- 레이아웃 그리드 표시
- 위젯 크기 및 위치 시각화

**애니메이션**:
- 미리보기 업데이트 시 페이드 전환
- 위젯 배치 변경 시 부드러운 이동

---

### Phase 4: 안내 메시지 및 가이드 (1일)

#### 4.1 단계별 안내 메시지

**안내 메시지 예시**:
1. **시작 안내**
   ```
   💡 대시보드를 설정해주세요
   역할별로 필요한 위젯을 선택하면 자동으로 대시보드가 생성됩니다.
   나중에 언제든지 수정할 수 있습니다.
   ```

2. **템플릿 선택 안내**
   ```
   📋 템플릿을 선택하세요
   업종과 역할에 맞는 기본 위젯이 포함된 템플릿입니다.
   필요에 따라 위젯을 추가하거나 제거할 수 있습니다.
   ```

3. **위젯 추가 안내**
   ```
   ➕ 위젯을 추가하세요
   필요한 위젯을 클릭하여 추가할 수 있습니다.
   최대 10개까지 추가 가능합니다.
   ```

4. **완료 안내**
   ```
   ✅ 설정이 완료되었습니다!
   대시보드를 저장하면 바로 사용할 수 있습니다.
   ```

#### 4.2 툴팁 및 도움말

**기능**:
- 각 위젯에 대한 설명 툴팁
- "이 위젯이 무엇인가요?" 버튼
- 예시 이미지 또는 GIF

---

## 🎨 애니메이션 상세 계획

### 1. 페이지 전환 애니메이션

**효과**: 슬라이드 또는 페이드 전환
```css
.onboarding-step {
  animation: slideInRight 0.5s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### 2. 템플릿 카드 애니메이션

**효과**: 호버, 선택, 펄스
```css
.template-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.template-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.template-card.selected {
  animation: selectAnimation 0.6s ease;
  border: 2px solid #007bff;
}

@keyframes selectAnimation {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.05); }
  50% { transform: scale(1.02); }
}
```

### 3. 위젯 추가/삭제 애니메이션

**효과**: 슬라이드 인/아웃, 페이드
```css
.widget-item {
  animation: widgetSlideIn 0.4s ease;
}

.widget-item.removing {
  animation: widgetSlideOut 0.3s ease;
}

@keyframes widgetSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes widgetSlideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
}
```

### 4. 드래그 앤 드롭 애니메이션

**효과**: 부드러운 이동, 고스트 효과
```css
.widget-item.dragging {
  opacity: 0.5;
  transform: rotate(2deg);
}

.widget-item.drag-over {
  animation: dragOverPulse 0.3s ease;
}

@keyframes dragOverPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### 5. 미리보기 업데이트 애니메이션

**효과**: 페이드 전환
```css
.dashboard-preview {
  animation: previewFade 0.5s ease;
}

@keyframes previewFade {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}
```

### 6. 진행 상태 애니메이션

**효과**: 프로그레스 바, 체크 표시
```css
.progress-bar {
  animation: progressFill 0.8s ease;
}

.check-icon {
  animation: checkBounce 0.5s ease;
}

@keyframes checkBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

---

## 📦 필요한 라이브러리

### 애니메이션 라이브러리

**옵션 1**: CSS 애니메이션 (권장, 가벼움)
- 추가 설치 불필요
- 성능 우수
- 커스터마이징 용이

**옵션 2**: Framer Motion (고급 애니메이션)
```json
{
  "framer-motion": "^10.16.4"
}
```
- 장점: 복잡한 애니메이션 구현 용이
- 단점: 번들 크기 증가

**옵션 3**: React Spring (물리 기반 애니메이션)
```json
{
  "@react-spring/web": "^9.7.3"
}
```

**권장**: CSS 애니메이션 + `react-sortablejs` (이미 설치됨)

---

## 🎯 UI/UX 디자인

### 1. 단계별 진행 표시

```
[●]────[●]────[●]────[○]────[○]
기본    업종   요금제  대시보드 완료
정보    선택   선택    설정
```

**애니메이션**:
- 현재 단계 하이라이트 펄스
- 완료된 단계 체크 표시 애니메이션
- 다음 단계로 전환 시 슬라이드

### 2. 안내 메시지 표시

**위치**: 각 단계 상단
**스타일**: 부드러운 등장 애니메이션

```typescript
<div className="guide-message" style={{
  animation: 'fadeInDown 0.5s ease'
}}>
  <Icon />
  <p>안내 메시지</p>
</div>
```

### 3. 위젯 선택 UI

**레이아웃**: 그리드 또는 리스트
**인터랙션**: 호버, 클릭, 드래그

---

## 📝 구현 상세

### 1. Step6DashboardSetup 컴포넌트

```typescript
// frontend-trinity/components/onboarding/Step6DashboardSetup.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // 또는 CSS 애니메이션

interface Step6DashboardSetupProps {
  formData: OnboardingFormData;
  setFormData: (data: OnboardingFormData) => void;
  businessType: string;
  onComplete: () => void;
}

const Step6DashboardSetup: React.FC<Step6DashboardSetupProps> = ({
  formData,
  setFormData,
  businessType,
  onComplete
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // 템플릿 선택 애니메이션
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    // 템플릿에 포함된 위젯 자동 선택
    const templateWidgets = getTemplateWidgets(templateId, businessType);
    setSelectedWidgets(templateWidgets);
    setShowPreview(true);
  };

  // 위젯 추가 애니메이션
  const handleAddWidget = (widgetType: string) => {
    if (!selectedWidgets.includes(widgetType)) {
      setSelectedWidgets([...selectedWidgets, widgetType]);
      // 슬라이드 인 애니메이션
    }
  };

  // 위젯 삭제 애니메이션
  const handleRemoveWidget = (widgetType: string) => {
    setSelectedWidgets(selectedWidgets.filter(w => w !== widgetType));
    // 페이드 아웃 애니메이션
  };

  return (
    <div className="step6-dashboard-setup">
      {/* 안내 메시지 (애니메이션 포함) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="guide-message"
      >
        <Icon name="lightbulb" />
        <h3>대시보드를 설정해주세요</h3>
        <p>역할별로 필요한 위젯을 선택하면 자동으로 대시보드가 생성됩니다.</p>
      </motion.div>

      {/* 템플릿 선택 (애니메이션 포함) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="template-selection"
      >
        <h4>템플릿 선택</h4>
        <div className="template-grid">
          {getAvailableTemplates(businessType).map(template => (
            <motion.div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <Icon name={template.icon} />
              <h5>{template.name}</h5>
              <p>{template.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 위젯 선택 (애니메이션 포함) */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="widget-selection"
          >
            <h4>위젯 추가/제거</h4>
            <div className="available-widgets">
              {getAvailableWidgets(businessType).map(widget => (
                <motion.button
                  key={widget.type}
                  className={`widget-button ${selectedWidgets.includes(widget.type) ? 'selected' : ''}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => 
                    selectedWidgets.includes(widget.type)
                      ? handleRemoveWidget(widget.type)
                      : handleAddWidget(widget.type)
                  }
                >
                  <Icon name={widget.icon} />
                  <span>{widget.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 미리보기 (애니메이션 포함) */}
      <AnimatePresence>
        {showPreview && selectedWidgets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="dashboard-preview"
          >
            <h4>미리보기</h4>
            <div className="preview-grid">
              {selectedWidgets.map((widgetType, index) => (
                <motion.div
                  key={widgetType}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="preview-widget"
                >
                  {getWidgetPreview(widgetType)}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 액션 버튼 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="action-buttons"
      >
        <button onClick={onComplete} className="btn-skip">
          건너뛰기 (나중에 설정)
        </button>
        <button 
          onClick={handleSave} 
          className="btn-complete"
          disabled={selectedWidgets.length === 0}
        >
          완료하고 다음 단계
        </button>
      </motion.div>
    </div>
  );
};
```

### 2. CSS 애니메이션 (Framer Motion 대신 사용 시)

```css
/* step6-dashboard-setup.css */

/* 페이지 전환 */
.step6-dashboard-setup {
  animation: slideInRight 0.5s ease;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 안내 메시지 */
.guide-message {
  animation: fadeInDown 0.5s ease;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 템플릿 카드 */
.template-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.template-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.template-card.selected {
  animation: selectPulse 0.6s ease;
  border: 2px solid #007bff;
}

@keyframes selectPulse {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.05); }
  50% { transform: scale(1.02); }
}

/* 위젯 추가/삭제 */
.widget-item {
  animation: widgetSlideIn 0.4s ease;
}

.widget-item.removing {
  animation: widgetSlideOut 0.3s ease;
}

@keyframes widgetSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes widgetSlideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
}

/* 미리보기 */
.dashboard-preview {
  animation: previewFade 0.5s ease;
}

@keyframes previewFade {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}

/* 진행 상태 */
.progress-bar {
  animation: progressFill 0.8s ease;
}

.check-icon {
  animation: checkBounce 0.5s ease;
}

@keyframes checkBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

---

## 🎯 사용자 플로우

### 시나리오 1: 템플릿 선택 (가장 간편)

```
1. 안내 메시지 표시 (페이드 인)
   ↓
2. 템플릿 카드 표시 (슬라이드 인)
   ↓
3. 템플릿 호버 (확대 애니메이션)
   ↓
4. 템플릿 선택 (펄스 애니메이션)
   ↓
5. 미리보기 표시 (페이드 인)
   ↓
6. 완료 버튼 활성화 (펄스)
```

### 시나리오 2: 위젯 직접 선택

```
1. 안내 메시지 표시
   ↓
2. 위젯 목록 표시
   ↓
3. 위젯 클릭 (슬라이드 인 애니메이션)
   ↓
4. 미리보기 업데이트 (페이드 전환)
   ↓
5. 위젯 추가/제거 반복
   ↓
6. 완료
```

---

## 📋 TODO 리스트

### Phase 1: 기본 구조 (1일)
- [ ] `Step6DashboardSetup.tsx` 컴포넌트 생성
- [ ] 온보딩 플로우에 스텝 추가
- [ ] 기본 레이아웃 및 스타일

### Phase 2: 템플릿 선택 UI (1일)
- [ ] 업종별/역할별 템플릿 데이터 정의
- [ ] 템플릿 카드 컴포넌트
- [ ] 템플릿 선택 애니메이션
- [ ] 미리보기 컴포넌트

### Phase 3: 위젯 편집 UI (1일)
- [ ] 위젯 목록 표시
- [ ] 위젯 추가/제거 기능
- [ ] 위젯 추가/삭제 애니메이션
- [ ] 실시간 미리보기 업데이트

### Phase 4: 안내 메시지 및 애니메이션 (1일)
- [ ] 단계별 안내 메시지 컴포넌트
- [ ] 모든 애니메이션 효과 적용
- [ ] 툴팁 및 도움말
- [ ] 반응형 디자인

### Phase 5: 통합 및 테스트 (1일)
- [ ] 온보딩 플로우 통합
- [ ] API 연동 (대시보드 설정 저장)
- [ ] 테스트 및 버그 수정

---

## 🎨 디자인 가이드라인

### 색상
- **주요 색상**: 부드러운 파스텔 톤 (사용자 선호도 반영)
- **강조 색상**: 선택된 항목 하이라이트
- **배경**: 깔끔한 흰색 또는 연한 회색

### 애니메이션 타이밍
- **빠른 전환**: 0.2-0.3초 (호버, 클릭)
- **일반 전환**: 0.4-0.5초 (페이지 전환, 추가/삭제)
- **느린 전환**: 0.6-0.8초 (복잡한 레이아웃 변경)

### 애니메이션 이징
- **기본**: `ease` 또는 `cubic-bezier(0.4, 0, 0.2, 1)`
- **부드러운**: `ease-in-out`
- **탄성**: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (선택적)

---

## 📚 참고 자료

- [온보딩 프로세스 문서](../ONBOARDING_ADMIN_ACCOUNT_PROCESS.md)
- [대시보드 위젯 편집 계획](./DASHBOARD_WIDGET_EDITOR_PLAN.md)
- [위젯 설정 가이드](./WIDGET_CONFIGURATION_GUIDE.md)
- [Framer Motion 문서](https://www.framer.com/motion/) (선택적)

---

**작성자**: 개발팀  
**예상 완료일**: 2025-11-30 (5일)  
**우선순위**: 높음 (온보딩 UX 개선)

