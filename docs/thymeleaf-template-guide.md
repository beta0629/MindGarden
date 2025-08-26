# Thymeleaf 공통 템플릿 사용 가이드

## 개요
MindGarden 프로젝트는 Thymeleaf 공통 템플릿을 사용하여 일관성 있는 UI/UX를 제공합니다. 
페이지마다 독립적으로 HTML을 작성하지 말고, 공통 템플릿을 활용하여 효율적으로 개발하세요.

## 템플릿 구조

### 1. 테블릿용 공통 템플릿
- **파일 위치**: `src/main/resources/templates/common/layout/tablet-base.html`
- **용도**: 테블릿 전용 페이지들의 공통 레이아웃
- **특징**: 햄버거 메뉴, 하단 네비게이션, 고정 레이아웃

### 2. 홈페이지용 공통 템플릿
- **파일 위치**: `src/main/resources/templates/common/layout/homepage-base.html`
- **용도**: 홈페이지 전용 페이지들의 공통 레이아웃
- **특징**: 반응형 디자인, 헤더/푸터 포함

## 사용법

### 🚀 빠른 시작 (복사해서 바로 사용)

#### 테블릿 페이지 템플릿
```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>페이지 제목</title>
</head>
<body th:replace="~{common/layout/tablet-base}">
    
    <!-- 페이지별 컨텐츠 -->
    <div th:fragment="content" class="tablet-페이지명-page">
        <!-- 여기에 실제 페이지 컨텐츠만 작성 -->
        <div class="page-content">
            <h1>페이지 제목</h1>
            <p>페이지 내용...</p>
        </div>
    </div>
    
    <!-- 페이지별 JavaScript -->
    <script th:fragment="additionalScripts">
        // 여기에 페이지별 JavaScript 함수만 작성
        function pageSpecificFunction() {
            // 페이지별 로직
        }
    </script>
</body>
</html>
```

#### 홈페이지 템플릿
```html
<!DOCTYPE html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>페이지 제목</title>
</head>
<body th:replace="~{common/layout/homepage-base}">
    
    <!-- 페이지별 컨텐츠 -->
    <div th:fragment="content" class="homepage-페이지명-page">
        <!-- 여기에 실제 페이지 컨텐츠만 작성 -->
        <div class="page-content">
            <h1>페이지 제목</h1>
            <p>페이지 내용...</p>
        </div>
    </div>
    
    <!-- 페이지별 JavaScript -->
    <script th:fragment="additionalScripts">
        // 여기에 페이지별 JavaScript 함수만 작성
        function pageSpecificFunction() {
            // 페이지별 로직
        }
    </script>
</body>
</html>
```

### 필수 요소

#### 1. `th:replace` 속성
- **테블릿 페이지**: `th:replace="~{common/layout/tablet-base}"`
- **홈페이지**: `th:replace="~{common/layout/homepage-base}"`

#### 2. `th:fragment="content"`
- 페이지의 메인 컨텐츠를 감싸는 div에 필수
- 공통 템플릿에서 이 부분을 `th:replace`로 삽입

#### 3. `th:fragment="additionalScripts"`
- 페이지별 JavaScript 코드를 감싸는 script 태그에 필수
- 공통 템플릿에서 이 부분을 `th:replace`로 삽입

## 자동으로 제공되는 요소

### 🎯 테블릿 템플릿 (`tablet-base.html`)
- ✅ **CSS**: `tablet-common.css`, `tablet.css` 자동 로드
- ✅ **네비게이션**: 햄버거 메뉴 + 하단 네비게이션
- ✅ **컴포넌트**: 소셜 회원가입 모달, 알림 시스템
- ✅ **레이아웃**: 고정 테블릿 레이아웃 (반응형 아님)
- ✅ **JavaScript**: 공통 유틸리티 함수들
- ✅ **아이콘**: Bootstrap Icons 자동 로드

### 🎯 홈페이지 템플릿 (`homepage-base.html`)
- ✅ **CSS**: `homepage-common.css` 자동 로드
- ✅ **레이아웃**: 반응형 디자인 (모바일/태블릿/데스크톱)
- ✅ **컴포넌트**: 헤더, 푸터, 네비게이션
- ✅ **JavaScript**: 공통 유틸리티 함수들

## 페이지별로 작성해야 하는 것

### 📝 1. 컨텐츠 영역 (필수)
```html
<div th:fragment="content" class="tablet-페이지명-page">
    <!-- 실제 페이지 내용만 작성 -->
    <div class="page-content">
        <h1>페이지 제목</h1>
        <p>페이지 내용...</p>
    </div>
</div>
```

**클래스명 규칙:**
- **테블릿**: `tablet-페이지명-page` (예: `tablet-login-page`, `tablet-dashboard-page`)
- **홈페이지**: `homepage-페이지명-page` (예: `homepage-index-page`, `homepage-about-page`)

### 📝 2. JavaScript 함수 (필수)
```html
<script th:fragment="additionalScripts">
    // 페이지에서만 사용하는 함수들
    function handleFormSubmit() {
        // 폼 제출 로직
    }
    
    function validateInput() {
        // 입력 검증 로직
    }
    
    // 페이지 로드 시 실행할 코드
    document.addEventListener('DOMContentLoaded', function() {
        // 초기화 코드
    });
</script>
```

### 📝 3. 페이지별 클래스명 (필수)
- **CSS 스타일링을 위한 고유 클래스명 지정**
- **예시**: `tablet-login-page`, `tablet-register-page`, `tablet-dashboard-page`
- **용도**: 페이지별 스타일링, JavaScript에서 요소 선택

## ⚠️ 주의사항

### ❌ 하지 말아야 할 것
1. **전체 HTML 구조를 독립적으로 작성하지 말 것**
   ```html
   <!-- 🚫 잘못된 예 -->
   <!DOCTYPE html>
   <html>
   <head>
       <link rel="stylesheet" href="/css/tablet.css">  <!-- ❌ 중복 -->
       <script src="/js/utils.js"></script>            <!-- ❌ 중복 -->
   </head>
   <body>
       <header>...</header>                            <!-- ❌ 중복 -->
       <main>...</main>                                <!-- ❌ 중복 -->
       <footer>...</footer>                            <!-- ❌ 중복 -->
   </body>
   </html>
   ```

2. **공통 요소를 중복 작성하지 말 것**
   - ❌ CSS/JS 파일 링크
   - ❌ 헤더, 네비게이션
   - ❌ 메타 태그들
   - ❌ Bootstrap Icons

3. **`th:fragment` 없이 컨텐츠를 작성하지 말 것**
   - ❌ `th:fragment="content"` 누락
   - ❌ `th:fragment="additionalScripts"` 누락

### ✅ 올바른 사용법
1. **공통 템플릿 활용**
   ```html
   <!-- 테블릿용 -->
   <body th:replace="~{common/layout/tablet-base}">
   
   <!-- 홈페이지용 -->
   <body th:replace="~{common/layout/homepage-base}">
   ```

2. **컨텐츠만 fragment로 작성**
   ```html
   <div th:fragment="content" class="tablet-페이지명-page">
       <!-- 페이지 내용만 작성 -->
   </div>
   ```

3. **JavaScript만 fragment로 작성**
   ```html
   <script th:fragment="additionalScripts">
       // 페이지별 함수들만 작성
   </script>
   ```

## 📚 예시 페이지들

### 🔐 로그인 페이지
- **파일**: `src/main/resources/templates/tablet/login.html`
- **클래스**: `tablet-login-page`
- **특징**: 2열 레이아웃, 소셜 로그인 (카카오/네이버)
- **복사해서 사용**: 위의 "빠른 시작" 템플릿 복사 후 수정

### 📝 회원가입 페이지
- **파일**: `src/main/resources/templates/tablet/register.html`
- **클래스**: `tablet-register-page`
- **특징**: 폼 검증, 전화번호 자동 하이픈
- **복사해서 사용**: 위의 "빠른 시작" 템플릿 복사 후 수정

### 📊 클라이언트 대시보드
- **파일**: `src/main/resources/templates/tablet/client-dashboard.html`
- **클래스**: `tablet-dashboard-page`
- **특징**: 카드 레이아웃, 통계 정보, 상담 예약
- **복사해서 사용**: 위의 "빠른 시작" 템플릿 복사 후 수정

### 🏠 홈페이지
- **파일**: `src/main/resources/templates/homepage/index.html`
- **클래스**: `homepage-index-page`
- **특징**: 반응형 디자인, 서비스 소개
- **복사해서 사용**: 홈페이지 템플릿 복사 후 수정

## 🎨 CSS 스타일링

### 📝 페이지별 스타일 추가 방법
```css
/* src/main/resources/static/css/tablet.css에 추가 */
.tablet-페이지명-page {
    /* 페이지 전용 스타일 */
    background: var(--tablet-gradient-primary);
}

.tablet-페이지명-page .form-container {
    /* 페이지 내 특정 요소 스타일 */
    max-width: 1400px;
}

.tablet-페이지명-page .page-content {
    /* 페이지 컨텐츠 스타일 */
    padding: var(--space-6);
}
```

### 🎨 공통 스타일 변수 활용
```css
/* src/main/resources/static/css/tablet-common.css의 CSS 변수들 */
:root {
    /* 파스텔 색상 */
    --tablet-primary: #FEF3C7;        /* 파스텔 옐로우 */
    --tablet-secondary: #DBEAFE;      /* 파스텔 블루 */
    --tablet-accent: #A7F3D0;         /* 파스텔 그린 */
    
    /* 그라데이션 */
    --tablet-gradient-primary: linear-gradient(135deg, #FEF3C7 0%, #DBEAFE 100%);
    --tablet-gradient-secondary: linear-gradient(135deg, #FDE68A 0%, #A7F3D0 100%);
    
    /* 간격 */
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
}
```

### 🔧 자주 사용하는 CSS 클래스들
```css
/* 폼 컨테이너 */
.form-container {
    max-width: 1400px;
    padding: var(--space-6);
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 페이지 헤더 */
.page-header {
    text-align: center;
    margin-bottom: var(--space-8);
}

/* 카드 레이아웃 */
.dashboard-card {
    background: white;
    border-radius: 12px;
    padding: var(--space-6);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
```

## 🚨 문제 해결

### ❌ 자주 발생하는 오류와 해결법

#### 1. "Property or field 'requestURI' cannot be found on null"
- **🔍 원인**: `th:classappend`에서 `#httpServletRequest` 사용
- **✅ 해결**: `th:classappend` 제거 또는 조건 수정
- **💡 예시**: `th:classappend="${#httpServletRequest.requestURI == '/tablet/login'} ? 'active'"` → 제거

#### 2. 페이지 컨텐츠가 보이지 않음
- **🔍 원인**: `th:fragment="content"` 누락
- **✅ 해결**: 컨텐츠 div에 `th:fragment="content"` 추가
- **💡 예시**: `<div class="page-content">` → `<div th:fragment="content" class="page-content">`

#### 3. JavaScript가 실행되지 않음
- **🔍 원인**: `th:fragment="additionalScripts"` 누락
- **✅ 해결**: script 태그에 `th:fragment="additionalScripts"` 추가
- **💡 예시**: `<script>` → `<script th:fragment="additionalScripts">`

#### 4. CSS 스타일이 적용되지 않음
- **🔍 원인**: 페이지별 클래스명 누락
- **✅ 해결**: `th:fragment="content"` div에 적절한 클래스명 추가
- **💡 예시**: `<div th:fragment="content">` → `<div th:fragment="content" class="tablet-페이지명-page">`

#### 5. 햄버거 메뉴가 작동하지 않음
- **🔍 원인**: 공통 템플릿의 JavaScript가 로드되지 않음
- **✅ 해결**: `tablet-base.html` 사용 확인, `th:replace` 올바르게 설정

#### 6. 소셜 로그인이 작동하지 않음
- **🔍 원인**: `th:fragment="additionalScripts"` 누락 또는 잘못된 fragment 이름
- **✅ 해결**: script 태그에 정확한 fragment 이름 사용

## 🚀 개발 워크플로우

### 📝 1. 새 페이지 생성 (단계별 가이드)
```bash
# 1단계: 파일 생성
touch src/main/resources/templates/tablet/새페이지명.html

# 2단계: 기본 템플릿 복사
# 위의 "빠른 시작" 템플릿을 복사해서 붙여넣기

# 3단계: 페이지별 수정
# - title 태그 수정
# - th:fragment="content" div의 클래스명 수정
# - 실제 컨텐츠 작성
# - JavaScript 함수 작성
```

**체크리스트:**
- [ ] `th:replace="~{common/layout/tablet-base}"` 설정
- [ ] `th:fragment="content"` 클래스명을 `tablet-새페이지명-page`로 설정
- [ ] `th:fragment="additionalScripts"` script 태그 추가
- [ ] 페이지별 컨텐츠만 작성 (헤더, CSS, JS 링크 제거)

### 🔧 2. 기존 페이지 수정
1. **공통 템플릿 사용 여부 확인**
   - `th:replace` 속성 확인
   - `th:fragment` 사용 여부 확인

2. **공통 템플릿 적용**
   ```html
   <!-- 기존: 독립적 HTML -->
   <body>
       <header>...</header>
       <main>...</main>
   </body>
   
   <!-- 수정: 공통 템플릿 사용 -->
   <body th:replace="~{common/layout/tablet-base}">
       <div th:fragment="content" class="tablet-페이지명-page">
           <main>...</main>
       </div>
   </body>
   ```

3. **중복 코드 제거**
   - CSS/JS 링크 제거
   - 헤더/푸터 제거
   - 메타 태그 제거

### 🎯 3. 공통 요소 수정
1. **공통 템플릿 파일 수정**
   - `tablet-base.html` → 모든 테블릿 페이지에 적용
   - `homepage-base.html` → 모든 홈페이지에 적용

2. **자동 적용 확인**
   - 개별 페이지 수정 불필요
   - 모든 페이지에 즉시 반영

### 📋 4. 개발 완료 체크리스트
- [ ] 페이지가 정상적으로 렌더링되는가?
- [ ] 햄버거 메뉴가 작동하는가?
- [ ] 하단 네비게이션이 보이는가?
- [ ] CSS 스타일이 적용되는가?
- [ ] JavaScript 함수가 실행되는가?
- [ ] 공통 컴포넌트들이 정상 작동하는가?

## 🎯 결론

### ✨ Thymeleaf 공통 템플릿의 장점
- ✅ **일관성**: 모든 페이지가 동일한 레이아웃과 스타일
- ✅ **유지보수성**: 공통 요소 수정 시 한 곳만 변경
- ✅ **개발 효율성**: 페이지별로 컨텐츠만 작성
- ✅ **코드 품질**: 중복 코드 제거, 구조화된 개발
- ✅ **팀 협업**: 다른 개발자도 쉽게 이해하고 수정 가능

### 🚀 빠른 시작 요약
1. **파일 생성**: `src/main/resources/templates/tablet/새페이지명.html`
2. **템플릿 복사**: 위의 "빠른 시작" 템플릿 복사
3. **수정**: 페이지명, 컨텐츠, JavaScript만 변경
4. **테스트**: 체크리스트 확인

### 📚 추가 자료
- **공통 템플릿**: `src/main/resources/templates/common/layout/`
- **CSS 파일**: `src/main/resources/static/css/`
- **예시 페이지**: `src/main/resources/templates/tablet/`

---

## ⚠️ 중요: 반드시 이 가이드를 따라 개발하세요!

**이 가이드를 무시하고 독립적으로 HTML을 작성하면:**
- ❌ 일관성 없는 UI/UX
- ❌ 유지보수 어려움
- ❌ 코드 중복
- ❌ 개발 시간 증가

**올바른 방법:**
- ✅ 공통 템플릿 활용
- ✅ `th:fragment` 사용
- ✅ 페이지별 컨텐츠만 작성
- ✅ 체크리스트 확인

---

**📖 이 문서는 다른 AI나 개발자가 와도 바로 이해하고 개발할 수 있도록 작성되었습니다.**
