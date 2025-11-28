# 다음 작업 시 개선 계획 (디자인 룰 완벽 적용)

**작성일**: 2025-11-27 17:45  
**목적**: 이따 작업 재개 시 더 좋게 만들기 위한 계획

---

## 🎯 **다음 작업 시 완벽하게 적용할 디자인 룰들**

### **마인드가든 디자인 시스템 v2.0 완벽 준수**
1. **mg- 접두사**: 모든 CSS 클래스에 mg- 접두사 필수
2. **CSS Variables**: 모든 값이 var(--mg-*) 형태
3. **인라인 스타일 완전 금지**: 모든 스타일이 CSS 파일에
4. **비즈니스 로직과 CSS 완전 분리**: JavaScript에 스타일 코드 없음
5. **기존 컴포넌트 활용**: UnifiedModal, MGButton 등 표준 컴포넌트

### **하드코딩 완전 제거 원칙**
1. **백엔드**: 모든 설정값이 공통코드에서 동적 조회
2. **프론트엔드**: 상수는 허용하되 API에서 받은 데이터 기반
3. **권한 시스템**: 완전히 공통코드 기반 동적 관리
4. **위젯 시스템**: 메타데이터 기반 완전 동적

---

## 🛠️ **다음 작업 시 올바른 접근법**

### **1. DashboardFormModal 개선 (올바른 방법)**

#### 현재 문제점:
- 복잡한 탭 구조 (3D, JSON, 시각적)
- 인라인 스타일 남용
- 커스텀 모달 구조

#### 개선 방향:
```javascript
// ✅ 올바른 방법
const DashboardFormModal = ({ isOpen, onClose, dashboard, onSave }) => {
  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title="대시보드 편집"
      size="fullscreen"
      className="mg-dashboard-editor-modal"
    >
      <div className="mg-dashboard-editor-container">
        {/* 마인드가든 표준 컴포넌트들만 사용 */}
        <CompactWidgetPalette />
        <RealTimePreview />
      </div>
      
      {/* 마인드가든 표준 버튼들 */}
      <div className="mg-modal-actions">
        <MGButton variant="secondary" onClick={onClose}>취소</MGButton>
        <MGButton variant="primary" type="submit">저장</MGButton>
      </div>
    </UnifiedModal>
  );
};
```

#### CSS 구조:
```css
/* ✅ 마인드가든 디자인 룰 준수 */
.mg-dashboard-editor-container {
  display: grid;
  grid-template-columns: var(--mg-editor-sidebar-width) 1fr;
  gap: var(--mg-spacing-lg);
  height: var(--mg-editor-height);
}

.mg-compact-widget-card {
  display: flex;
  flex-direction: column;
  padding: var(--mg-spacing-sm);
  border: var(--mg-border-width) solid var(--mg-border-color);
  border-radius: var(--mg-border-radius-md);
  /* 모든 값이 CSS Variables */
}
```

### **2. 위젯 카드 개선 (컴팩트 그리드)**

#### 목표:
- **3열 그리드**: 한 화면에 9개 위젯
- **컴팩트 카드**: 높이 60-80px
- **카테고리별 색상**: mg-category-* 클래스
- **호버 효과**: mg-hover-* 클래스

#### 구조:
```
┌─────┬─────┬─────┐ ← 컴팩트한 3열 그리드
│통계 │차트 │테이블│ ← 작은 아이콘 + 짧은 이름
├─────┼─────┼─────┤
│캘린더│폼   │커스텀│ ← 카테고리별 색상 구분
├─────┼─────┼─────┤
│환영 │요약 │액션 │ ← 호버 시 + 버튼 표시
└─────┴─────┴─────┘
```

### **3. 실시간 미리보기 개선**

#### 특징:
- **즉시 반영**: 위젯 추가하면 오른쪽에 바로 표시
- **드래그 앤 드롭**: ReactSortable로 부드러운 이동
- **시각적 피드백**: 드래그 시 그림자, 색상 변화
- **그리드 가이드**: 3열 그리드 가이드라인 표시

---

## 💡 **핵심 개선 포인트**

### **사용자 경험 (UX)**
1. **직관성**: 클릭 → 드래그 → 저장 (3단계)
2. **피드백**: 모든 액션에 즉시 시각적 반응
3. **가독성**: 컴팩트한 그리드로 한눈에 파악
4. **속도**: 실시간 미리보기로 빠른 편집

### **개발자 경험 (DX)**  
1. **유지보수**: 모든 스타일이 CSS Variables
2. **확장성**: 새 위젯 추가 시 자동 적용
3. **일관성**: 마인드가든 표준 컴포넌트만 사용
4. **문서화**: 모든 변경사항 문서화

---

## 🚀 **다음 작업 시 순서**

1. **현재 상태 커밋** (개발 브랜치에만)
2. **DashboardFormModal 완전 재작성** (마인드가든 룰 100% 준수)
3. **CompactWidgetPalette 구현** (3열 그리드)
4. **RealTimePreview 구현** (즉시 반영)
5. **통합 테스트** (모든 기능 검증)

---

## 📋 **체크리스트 (다음 작업 시)**

### **디자인 룰 체크:**
- [ ] mg- 접두사 모든 클래스에 적용
- [ ] CSS Variables 100% 사용  
- [ ] 인라인 스타일 0개
- [ ] UnifiedModal, MGButton 등 표준 컴포넌트만 사용

### **기능 체크:**
- [ ] 3D, JSON 모드 완전 제거
- [ ] 컴팩트한 3열 그리드 위젯 팔레트
- [ ] 실시간 드래그 앤 드롭 미리보기
- [ ] 카테고리별 필터링 및 검색

### **품질 체크:**
- [ ] 모든 파일 문법 검사 통과
- [ ] React key 중복 없음
- [ ] 성능 최적화 (메모화, 가상화)
- [ ] 모바일 반응형

---

**다음 작업 시 이 계획을 따라 더 완벽한 시스템을 만들겠습니다!**

---

**상태**: 현재 작업 중단, 다음 작업 시 개선 계획 준비 완료  
**목표**: 마인드가든 디자인 룰 100% 준수하는 완벽한 편집기

---

**마지막 업데이트**: 2025-11-27 17:45
