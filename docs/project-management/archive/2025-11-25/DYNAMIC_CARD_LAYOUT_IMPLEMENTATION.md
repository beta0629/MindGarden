# 동적 카드 레이아웃 구현 가이드

**작성일**: 2025-11-25  
**목적**: 대시보드 위젯의 카드 레이아웃을 메타데이터 기반으로 동적으로 구성

---

## 📋 개요

기존에 하드코딩되어 있던 카드 스타일을 메타데이터 기반으로 전환하여, 대시보드별/위젯별로 카드 레이아웃을 동적으로 설정할 수 있도록 구현했습니다.

---

## 🎨 카드 스타일 타입

### 1. v2 (기본)
- MindGarden v2 디자인 시스템 카드
- 흰색 배경, 테두리, 그림자 효과

### 2. glass (글래스모피즘)
- 반투명 배경, 블러 효과
- 모던한 느낌의 카드

### 3. flat (평면)
- 그림자 없음, 평면 스타일
- 미니멀한 디자인

### 4. bordered (테두리 강조)
- 두꺼운 테두리
- 강조가 필요한 카드

### 5. minimal (미니멀)
- 배경 없음, 테두리 없음
- 콘텐츠 중심 디자인

---

## 🔧 카드 Variant

### 1. elevated (기본)
- 그림자 효과로 입체감 표현

### 2. outlined
- 테두리만 표시, 그림자 없음

### 3. filled
- 배경색 채움

### 4. text
- 배경 없음, 텍스트만

---

## 📝 설정 방법

### 대시보드 기본 카드 스타일

```json
{
  "cardLayout": {
    "defaultStyle": "v2",
    "defaultVariant": "elevated",
    "defaultPadding": "md",
    "defaultBorderRadius": "md",
    "hoverEffect": true,
    "shadow": "md"
  }
}
```

### 위젯별 카드 스타일

```json
{
  "id": "widget-1",
  "type": "statistics",
  "cardStyle": {
    "style": "glass",
    "variant": "elevated",
    "padding": "lg",
    "borderRadius": "lg",
    "hoverEffect": true,
    "shadow": "lg",
    "glassEffect": true
  },
  "config": {
    "title": "통계"
  }
}
```

---

## 🏗️ 구현 구조

### 1. WidgetCardWrapper 컴포넌트
- 위젯을 감싸서 카드 스타일 적용
- 동적 클래스 및 인라인 스타일 생성

### 2. DynamicDashboard 통합
- `cardLayout` 설정 읽기
- 위젯별 `cardStyle` 적용
- 기본값과 위젯별 설정 병합

### 3. 백엔드 자동 설정
- 대시보드 생성 시 기본 카드 레이아웃 자동 추가
- `addCardLayoutConfig()` 헬퍼 메서드 사용

---

## 📊 설정 우선순위

1. **위젯별 `cardStyle`** (최우선)
2. **대시보드 `cardLayout` 기본값**
3. **시스템 기본값** (v2, elevated, md)

---

## 🎯 사용 예제

### 예제 1: 글래스모피즘 카드

```json
{
  "cardStyle": {
    "style": "glass",
    "glassEffect": true,
    "padding": "lg",
    "borderRadius": "lg"
  }
}
```

### 예제 2: 미니멀 카드

```json
{
  "cardStyle": {
    "style": "minimal",
    "variant": "text",
    "padding": "sm",
    "shadow": "none"
  }
}
```

### 예제 3: 강조 카드

```json
{
  "cardStyle": {
    "style": "bordered",
    "borderColor": "#007bff",
    "border": true,
    "shadow": "lg",
    "hoverEffect": true
  }
}
```

---

## ✅ 완료된 작업

1. ✅ 대시보드 스키마에 `cardLayout` 설정 추가
2. ✅ 위젯 스키마에 `cardStyle` 설정 추가
3. ✅ `WidgetCardWrapper` 컴포넌트 생성
4. ✅ `DynamicDashboard`에 카드 스타일 적용
5. ✅ 백엔드 대시보드 생성 시 카드 레이아웃 자동 추가
6. ✅ CSS 스타일 정의

---

## 📝 다음 단계

- [ ] CommonCode에 카드 레이아웃 템플릿 추가
- [ ] 관리자 화면에서 카드 스타일 편집 기능
- [ ] 카드 스타일 프리뷰 기능
- [ ] 반응형 카드 스타일 최적화

---

## 🔗 관련 파일

- `frontend/src/components/dashboard/widgets/WidgetCardWrapper.js`
- `frontend/src/components/dashboard/widgets/WidgetCardWrapper.css`
- `frontend/src/components/dashboard/DynamicDashboard.js`
- `src/main/java/com/coresolution/core/service/impl/TenantDashboardServiceImpl.java`
- `docs/mgsb/2025-11-22/META_SYSTEM_DASHBOARD_SCHEMA.md`

