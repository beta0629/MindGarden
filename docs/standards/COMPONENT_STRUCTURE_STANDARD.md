# 화면 컴포넌트 구성 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 화면 컴포넌트 구성 표준입니다.  
div 태그 오류 방지 및 일관된 컴포넌트 구조를 위한 표준을 정의합니다.

### 참조 문서
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md)
- [반응형 레이아웃 표준](./RESPONSIVE_LAYOUT_STANDARD.md)
- [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md)

### 구현 위치
- **표준 레이아웃**: `frontend/src/components/layout/SimpleLayout.js`
- **대시보드 레이아웃**: `frontend/src/components/ui/Layout/DashboardLayout.js`
- **레이아웃 유틸리티**: `frontend/src/components/common/MGLayout.js`

---

## 🎯 컴포넌트 구성 원칙

### 1. 표준 레이아웃 컴포넌트 사용
```
모든 화면은 표준 레이아웃 컴포넌트 사용
```

**원칙**:
- ✅ `SimpleLayout` 또는 `DashboardLayout` 사용
- ✅ 의미 있는 HTML 태그 사용 (header, main, section, article 등)
- ✅ 중복 div 래퍼 제거
- ❌ 불필요한 div 중첩 금지
- ❌ 의미 없는 div 래퍼 금지

### 2. 중첩 깊이 제한
```
div 태그 중첩 깊이 최대 5단계로 제한
```

**원칙**:
- ✅ 최대 5단계 중첩 허용
- ✅ 6단계 이상 중첩 금지
- ✅ 컴포넌트 분리로 중첩 깊이 줄이기
- ✅ 의미 있는 HTML 태그로 대체

### 3. 의미 있는 HTML 태그 사용
```
div 대신 의미 있는 HTML 태그 우선 사용
```

**원칙**:
- ✅ `header`, `main`, `footer`, `nav` - 페이지 구조
- ✅ `section`, `article`, `aside` - 콘텐츠 구분
- ✅ `ul`, `ol`, `li` - 리스트
- ✅ `table`, `thead`, `tbody`, `tr`, `td` - 테이블
- ✅ `form`, `fieldset`, `legend` - 폼
- ❌ 모든 곳에 div 사용 금지

---

## 📐 표준 컴포넌트 계층 구조

### 1. 페이지 레이아웃 구조

#### 기본 구조
```javascript
import SimpleLayout from '../layout/SimpleLayout';

const MyPage = () => {
    return (
        <SimpleLayout title="페이지 제목">
            {/* 페이지 내용 */}
        </SimpleLayout>
    );
};
```

#### 내부 구조 (SimpleLayout 기준)
```html
<div class="simple-layout">          <!-- 레이아웃 루트 -->
    <header>                          <!-- 헤더 -->
        <!-- UnifiedHeader -->
    </header>
    
    <main class="simple-main">        <!-- 메인 콘텐츠 -->
        <div class="simple-container"> <!-- 컨테이너 -->
            <!-- 페이지 내용 -->
        </div>
    </main>
</div>
```

### 2. 대시보드 레이아웃 구조

```javascript
import DashboardLayout from '../ui/Layout/DashboardLayout';

const DashboardPage = () => {
    return (
        <DashboardLayout
            title="대시보드"
            subtitle="부제목"
        >
            {/* 대시보드 위젯들 */}
        </DashboardLayout>
    );
};
```

#### 내부 구조
```html
<div class="mg-dashboard-layout">     <!-- 대시보드 루트 -->
    <div class="mg-dashboard-header"> <!-- 헤더 -->
        <div class="mg-dashboard-header-content">
            <div class="mg-dashboard-header-left">
                <!-- 아이콘, 제목 -->
            </div>
            <div class="mg-dashboard-header-right">
                <!-- 액션 버튼 -->
            </div>
        </div>
    </div>
    
    <!-- 대시보드 콘텐츠 -->
</div>
```

### 3. 섹션 구조

```javascript
import { MGSection, MGContainer } from '../common/MGLayout';

const MyPage = () => {
    return (
        <SimpleLayout title="페이지 제목">
            <MGSection variant="default" padding="medium">
                <MGContainer size="xl">
                    <section className="content-section">
                        <h2>섹션 제목</h2>
                        {/* 섹션 내용 */}
                    </section>
                </MGContainer>
            </MGSection>
        </SimpleLayout>
    );
};
```

---

## 🚫 금지 사항

### 1. 과도한 div 중첩

```javascript
// ❌ 금지: 6단계 이상 중첩
const BadComponent = () => {
    return (
        <div>
            <div>
                <div>
                    <div>
                        <div>
                            <div>
                                <div>  {/* 7단계 - 금지! */}
                                    내용
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ✅ 권장: 의미 있는 태그 사용 및 중첩 깊이 제한
const GoodComponent = () => {
    return (
        <section className="content-section">
            <header className="section-header">
                <h2>제목</h2>
            </header>
            <div className="section-body">
                내용
            </div>
        </section>
    );
};
```

### 2. 의미 없는 div 래퍼

```javascript
// ❌ 금지: 의미 없는 div 래퍼
const BadComponent = () => {
    return (
        <div>
            <div>
                <div>
                    <button>버튼</button>
                </div>
            </div>
        </div>
    );
};

// ✅ 권장: 불필요한 래퍼 제거
const GoodComponent = () => {
    return (
        <div className="action-group">
            <button>버튼</button>
        </div>
    );
};
```

### 3. 중복 컨테이너

```javascript
// ❌ 금지: 중복 컨테이너
const BadComponent = () => {
    return (
        <SimpleLayout>
            <div className="container">
                <div className="container">  {/* 중복! */}
                    <div className="container">  {/* 중복! */}
                        내용
                    </div>
                </div>
            </div>
        </SimpleLayout>
    );
};

// ✅ 권장: 단일 컨테이너만 사용
const GoodComponent = () => {
    return (
        <SimpleLayout>
            {/* SimpleLayout 내부에 이미 simple-container가 있음 */}
            내용
        </SimpleLayout>
    );
};
```

### 4. 인라인 스타일을 위한 div 추가

```javascript
// ❌ 금지: 스타일링만을 위한 불필요한 div
const BadComponent = () => {
    return (
        <div style={{ padding: '20px' }}>
            <div style={{ margin: '10px' }}>
                <div style={{ background: 'red' }}>
                    내용
                </div>
            </div>
        </div>
    );
};

// ✅ 권장: CSS 클래스 사용
const GoodComponent = () => {
    return (
        <section className="content-section">
            내용
        </section>
    );
};
```

---

## ✅ 권장 패턴

### 1. 페이지 컴포넌트 구조

```javascript
import SimpleLayout from '../layout/SimpleLayout';
import { MGSection, MGContainer } from '../common/MGLayout';

const UserListPage = () => {
    return (
        <SimpleLayout title="사용자 목록">
            <MGSection variant="default" padding="medium">
                <MGContainer size="xl">
                    <section className="user-list-section">
                        <header className="section-header">
                            <h2>사용자 목록</h2>
                        </header>
                        
                        <div className="user-list-content">
                            {/* 사용자 목록 */}
                        </div>
                    </section>
                </MGContainer>
            </MGSection>
        </SimpleLayout>
    );
};
```

### 2. 카드/위젯 구조

```javascript
const StatCard = ({ title, value, icon }) => {
    return (
        <article className="mg-card">
            <header className="mg-card__header">
                <h3 className="mg-card__title">{title}</h3>
                {icon && <span className="mg-card__icon">{icon}</span>}
            </header>
            
            <div className="mg-card__body">
                <div className="stat-value">{value}</div>
            </div>
        </article>
    );
};
```

### 3. 폼 구조

```javascript
const UserForm = () => {
    return (
        <form className="user-form">
            <fieldset className="form-section">
                <legend>기본 정보</legend>
                
                <div className="form-group">
                    <label htmlFor="name">이름</label>
                    <input id="name" type="text" />
                </div>
                
                <div className="form-group">
                    <label htmlFor="email">이메일</label>
                    <input id="email" type="email" />
                </div>
            </fieldset>
            
            <div className="form-actions">
                <button type="submit">저장</button>
            </div>
        </form>
    );
};
```

### 4. 리스트 구조

```javascript
const UserList = ({ users }) => {
    return (
        <section className="user-list">
            <header className="list-header">
                <h2>사용자 목록</h2>
            </header>
            
            <ul className="user-list__items">
                {users.map(user => (
                    <li key={user.id} className="user-list__item">
                        <article className="user-card">
                            <header className="user-card__header">
                                <h3>{user.name}</h3>
                            </header>
                            <div className="user-card__body">
                                <p>{user.email}</p>
                            </div>
                        </article>
                    </li>
                ))}
            </ul>
        </section>
    );
};
```

---

## 🔍 오류 방지 체크리스트

### 컴포넌트 작성 시 확인 사항

- [ ] 표준 레이아웃 컴포넌트 사용 (`SimpleLayout`, `DashboardLayout`)
- [ ] div 중첩 깊이 5단계 이하
- [ ] 의미 있는 HTML 태그 사용 (section, article, header, main 등)
- [ ] 불필요한 div 래퍼 제거
- [ ] 중복 컨테이너 없음
- [ ] CSS 클래스 사용 (인라인 스타일 금지)
- [ ] 접근성 속성 추가 (aria-label, role 등)
- [ ] 반응형 레이아웃 고려

### 코드 리뷰 시 확인 사항

- [ ] 컴포넌트 계층 구조가 표준에 맞는지
- [ ] div 태그가 적절히 사용되었는지
- [ ] 의미 있는 HTML 태그가 사용되었는지
- [ ] 중첩 깊이가 적절한지
- [ ] 불필요한 래퍼가 없는지

---

## 📏 중첩 깊이 측정 방법

### 중첩 깊이 계산 예시

```javascript
// 1단계
<div>  {/* 깊이 1 */}
    내용
</div>

// 2단계
<div>  {/* 깊이 1 */}
    <div>  {/* 깊이 2 */}
        내용
    </div>
</div>

// 5단계 (허용 최대)
<div>  {/* 깊이 1 */}
    <div>  {/* 깊이 2 */}
        <div>  {/* 깊이 3 */}
            <div>  {/* 깊이 4 */}
                <div>  {/* 깊이 5 */}
                    내용
                </div>
            </div>
        </div>
    </div>
</div>

// 6단계 (금지!)
<div>  {/* 깊이 1 */}
    <div>  {/* 깊이 2 */}
        <div>  {/* 깊이 3 */}
            <div>  {/* 깊이 4 */}
                <div>  {/* 깊이 5 */}
                    <div>  {/* 깊이 6 - 금지! */}
                        내용
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 중첩 깊이 줄이기 방법

1. **컴포넌트 분리**
```javascript
// Before: 깊이가 깊음
const DeepComponent = () => {
    return (
        <div>
            <div>
                <div>
                    <div>
                        <div>
                            <ComplexContent />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// After: 컴포넌트 분리로 깊이 줄임
const Wrapper = ({ children }) => (
    <div className="wrapper">
        <div className="content">
            {children}
        </div>
    </div>
);

const DeepComponent = () => {
    return (
        <Wrapper>
            <Wrapper>
                <ComplexContent />
            </Wrapper>
        </Wrapper>
    );
};
```

2. **의미 있는 태그 사용**
```javascript
// Before: div만 사용
const Component = () => {
    return (
        <div>
            <div>
                <div>
                    <div>내용</div>
                </div>
            </div>
        </div>
    );
};

// After: 의미 있는 태그 사용
const Component = () => {
    return (
        <section>
            <header>
                <h2>제목</h2>
            </header>
            <article>
                내용
            </article>
        </section>
    );
};
```

---

## 🎨 표준 레이아웃 컴포넌트 사용법

### 1. SimpleLayout

```javascript
import SimpleLayout from '../layout/SimpleLayout';

const MyPage = () => {
    return (
        <SimpleLayout title="페이지 제목">
            {/* 페이지 내용 - SimpleLayout이 자동으로 컨테이너 제공 */}
            <section className="content">
                내용
            </section>
        </SimpleLayout>
    );
};
```

### 2. DashboardLayout

```javascript
import DashboardLayout from '../ui/Layout/DashboardLayout';

const DashboardPage = () => {
    return (
        <DashboardLayout
            title="대시보드"
            subtitle="부제목"
            icon={<DashboardIcon />}
            actions={
                <>
                    <button>액션 1</button>
                    <button>액션 2</button>
                </>
            }
        >
            {/* 대시보드 위젯들 */}
            <div className="dashboard-widgets">
                {/* 위젯들 */}
            </div>
        </DashboardLayout>
    );
};
```

### 3. MGSection, MGContainer

```javascript
import { MGSection, MGContainer } from '../common/MGLayout';

const MyPage = () => {
    return (
        <SimpleLayout title="페이지">
            <MGSection variant="default" padding="medium">
                <MGContainer size="xl">
                    <section className="content">
                        내용
                    </section>
                </MGContainer>
            </MGSection>
        </SimpleLayout>
    );
};
```

---

## 💡 베스트 프랙티스

### 1. 컴포넌트 분리 원칙

- **단일 책임**: 각 컴포넌트는 하나의 책임만 가짐
- **재사용성**: 재사용 가능한 컴포넌트로 분리
- **가독성**: 복잡한 컴포넌트는 작은 컴포넌트로 분리

### 2. HTML 시맨틱 태그 활용

```javascript
// ✅ 권장: 시맨틱 태그 사용
const ArticlePage = () => {
    return (
        <SimpleLayout>
            <article className="article">
                <header className="article-header">
                    <h1>글 제목</h1>
                    <time>2025-12-03</time>
                </header>
                
                <section className="article-content">
                    내용
                </section>
                
                <footer className="article-footer">
                    태그, 댓글 등
                </footer>
            </article>
        </SimpleLayout>
    );
};
```

### 3. CSS 클래스 명명 규칙

```javascript
// ✅ 권장: BEM 방식 또는 의미 있는 클래스명
<div className="user-list">
    <header className="user-list__header">
        <h2 className="user-list__title">사용자 목록</h2>
    </header>
    
    <ul className="user-list__items">
        <li className="user-list__item">
            {/* 내용 */}
        </li>
    </ul>
</div>
```

---

## 🚨 자주 발생하는 오류 패턴

### 1. 불필요한 중첩

```javascript
// ❌ 잘못된 패턴
<div className="page">
    <div className="container">
        <div className="wrapper">
            <div className="content">
                <div className="inner">
                    <div className="box">
                        내용  {/* 6단계 중첩! */}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

// ✅ 올바른 패턴
<section className="page-content">
    <div className="content-box">
        내용
    </div>
</section>
```

### 2. 컨테이너 중복

```javascript
// ❌ 잘못된 패턴
<SimpleLayout>  {/* 이미 simple-container 내부 */}
    <div className="container">  {/* 중복! */}
        <div className="wrapper">  {/* 불필요! */}
            내용
        </div>
    </div>
</SimpleLayout>

// ✅ 올바른 패턴
<SimpleLayout>
    내용  {/* SimpleLayout이 이미 컨테이너 제공 */}
</SimpleLayout>
```

### 3. 의미 없는 래퍼

```javascript
// ❌ 잘못된 패턴
<div>
    <div>
        <div>
            <button>버튼</button>
        </div>
    </div>
</div>

// ✅ 올바른 패턴
<div className="action-group">
    <button>버튼</button>
</div>
```

---

## 📞 문의

화면 컴포넌트 구성 표준 관련 문의:
- 프론트엔드 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03

