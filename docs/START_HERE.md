# 🚀 MindGarden 프로젝트 시작 가이드

**최종 업데이트**: 2025년 10월 14일

---

## 👋 환영합니다!

MindGarden 프로젝트에 오신 것을 환영합니다. 이 문서는 프로젝트를 시작하는 가장 빠른 방법을 안내합니다.

---

## 📍 당신의 역할은?

### 🎨 프론트엔드 개발자

**필수 문서 (순서대로 읽기)**:

1. [실전 적용 플랜](design-system-v2/IMPLEMENTATION_PLAN.md) 🚀 **구현 시작 전 필수**
   - Phase 1-5 실행 계획
   - 공통 컴포넌트 구축
   - 페이지 마이그레이션
   - 체크리스트

2. [디자인 시스템 가이드](design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) ⭐ **가장 중요**
   - 18개 컴포넌트 사용법
   - 색상, 타이포그래피, 레이아웃
   - 대시보드 레이아웃

3. [디자인 시스템 아키텍처](design-system-v2/DESIGN_SYSTEM_ARCHITECTURE.md)
   - CSS 구조
   - 컴포넌트 패턴
   - 개발 워크플로우

4. [프로젝트 구조](setup/PROJECT_STRUCTURE.md)
   - 폴더 구조
   - 파일 네이밍

**즉시 확인하기**:
```bash
# 디자인 시스템 쇼케이스
http://localhost:3000/design-system
```

---

### 💻 백엔드 개발자

**필수 문서 (순서대로 읽기)**:

1. [프로젝트 구조](setup/PROJECT_STRUCTURE.md)
   - 백엔드 패키지 구조
   - Java 클래스 위치

2. API 문서 (작성 예정)
   - REST API 명세
   - 에러 코드

3. 보안 가이드 (작성 예정)
   - 인증/권한
   - 데이터 보호

---

### 🚀 DevOps / 시스템 관리자

**필수 문서**:

1. [환경 설정](setup/ENVIRONMENT_SETUP.md) (작성 예정)
2. [배포 가이드](deployment/DEPLOYMENT_GUIDE.md) (작성 예정)
3. [CI/CD](deployment/CI_CD.md) (작성 예정)

---

### 👔 PM / 기획자

**필수 문서**:

1. [README](README.md) - 전체 문서 인덱스
2. [기능 명세](features/) (작성 예정)
3. [시스템 아키텍처](architecture/) (작성 예정)

---

### 🆕 신규 개발자 (온보딩)

**1주차 체크리스트**:

- [ ] Day 1: 이 문서 읽기
- [ ] Day 1: [README.md](README.md) 읽기
- [ ] Day 1-2: [프로젝트 구조](setup/PROJECT_STRUCTURE.md) 이해
- [ ] Day 2-3: [디자인 시스템 가이드](design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) 읽기
- [ ] Day 3-4: 개발 환경 설정
- [ ] Day 4-5: 디자인 시스템 쇼케이스 탐색
- [ ] Day 5: 간단한 페이지 작성 실습

---

## 📚 문서 구조 한눈에 보기

```
docs/
│
├── START_HERE.md                    ⭐ 이 문서 (시작점)
├── README.md                        📚 전체 문서 인덱스
│
├── design-system-v2/                🎨 디자인 시스템 v2.0 (최우선)
│   ├── README.md                    폴더 가이드
│   ├── MINDGARDEN_DESIGN_SYSTEM_GUIDE.md        ⭐ 사용 가이드
│   ├── DESIGN_SYSTEM_ARCHITECTURE.md            ⭐ 아키텍처
│   ├── DOCUMENT_STRUCTURE_GUIDE.md              문서 구조
│   └── 2025-10-14-DOCUMENTATION_RESTRUCTURE_REPORT.md
│
├── setup/                           🛠️ 환경 설정
│   └── PROJECT_STRUCTURE.md
│
├── development/                     💻 개발 가이드
├── architecture/                    🏗️ 시스템 아키텍처
├── features/                        🎯 기능 명세
├── api/                            📊 API 문서
├── security/                       🔐 보안
├── deployment/                     🚢 배포
├── testing/                        🧪 테스트
│
└── archive/                        🗄️ 아카이브 (백업)
    ├── design-backup-2025-10-14/
    └── legacy-docs-backup-2025-10-14/
```

---

## 🎨 디자인 시스템 v2.0 핵심 요약

### 출시일: 2025년 10월 14일

### 주요 특징

- ✅ **18개 표준 컴포넌트**
- ✅ **통일된 대시보드 레이아웃**
- ✅ **완벽한 모바일 반응형**
- ✅ **CSS Variables 기반 테마**
- ✅ **순수 CSS + JavaScript**

### 빠른 사용법

```jsx
// 1. CSS 클래스 사용 (mg- 접두사)
<div className="mg-dashboard-layout">
  <div className="mg-card">
    <h3 className="mg-h3">제목</h3>
    <p className="mg-body-medium">내용</p>
    <button className="mg-button mg-button-primary">버튼</button>
  </div>
</div>

// 2. CSS Variables 사용
<div style={{ 
  padding: 'var(--spacing-lg)',
  color: 'var(--text-primary)',
  background: 'var(--bg-surface)'
}}>
  내용
</div>
```

### 쇼케이스

```
http://localhost:3000/design-system
```

---

## 🚀 개발 환경 시작하기

### 백엔드 실행

```bash
cd /Users/mind/mindGarden
mvn spring-boot:run
```

**접속**: `http://localhost:8080`

### 프론트엔드 실행

```bash
cd /Users/mind/mindGarden/frontend
npm install
npm start
```

**접속**: `http://localhost:3000`

---

## 📖 자주 찾는 문서

| 질문 | 문서 |
|------|------|
| 디자인 시스템 어떻게 구현? | [실전 적용 플랜](design-system-v2/IMPLEMENTATION_PLAN.md) |
| 디자인 시스템 사용법? | [디자인 가이드](design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) |
| CSS 구조는? | [디자인 아키텍처](design-system-v2/DESIGN_SYSTEM_ARCHITECTURE.md) |
| 프로젝트 구조는? | [프로젝트 구조](setup/PROJECT_STRUCTURE.md) |
| 문서 어디 있어? | [문서 구조 가이드](design-system-v2/DOCUMENT_STRUCTURE_GUIDE.md) |
| 어떤 작업 완료됐어? | [재구조화 리포트](design-system-v2/2025-10-14-DOCUMENTATION_RESTRUCTURE_REPORT.md) |
| 모든 문서 목록? | [README.md](README.md) |

---

## ⚡ 빠른 팁

### CSS 클래스 네이밍

```
✅ Good: mg-button, mg-card, mg-dashboard-layout
❌ Bad: button, my-card, custom-layout
```

### CSS Variables 사용

```css
✅ Good: color: var(--text-primary);
❌ Bad: color: #2F2F2F;
```

### 반응형 테스트

```
✅ 모바일: < 768px
✅ 태블릿: 769px - 1024px
✅ 데스크탑: > 1024px
```

---

## 🔍 문제 해결

### 디자인이 안 나와요

1. `mindgarden-design-system.css` import 확인
2. CSS 클래스 이름 확인 (`mg-` 접두사)
3. 쇼케이스에서 예시 확인

### 모바일에서 깨져요

1. 반응형 CSS 확인
2. 테이블에 `data-label` 추가했나요?
3. `viewport` meta 태그 있나요?

### 문서를 못 찾겠어요

1. [README.md](README.md) 확인
2. [문서 구조 가이드](design-system-v2/DOCUMENT_STRUCTURE_GUIDE.md) 확인
3. `docs/` 폴더 검색

---

## 📞 도움이 필요하신가요?

### 문의처

- **디자인 시스템**: design@mindgarden.com
- **개발 지원**: development@mindgarden.com
- **문서**: docs@mindgarden.com
- **시스템 이슈**: support@mindgarden.com

### 슬랙 채널 (예정)

- `#design-system` - 디자인 관련
- `#dev-frontend` - 프론트엔드
- `#dev-backend` - 백엔드
- `#help` - 일반 질문

---

## ✨ 다음 단계

### 개발자라면

1. [디자인 시스템 가이드](design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md) 정독
2. [디자인 시스템 쇼케이스](http://localhost:3000/design-system) 탐색
3. 간단한 페이지 만들어보기
4. 팀 리드에게 코드 리뷰 요청

### 기획자/PM이라면

1. [README.md](README.md) 읽기
2. 기능 명세 문서 확인 (작성 예정)
3. 개발팀과 협의

### 신규 입사자라면

1. 이 문서의 온보딩 체크리스트 따라하기
2. 1주일 안에 간단한 기능 구현해보기
3. 팀원들과 인사하기 😊

---

## 🎯 핵심 메시지

> **MindGarden 디자인 시스템 v2.0은 2025년 10월 14일부터 프로덕션 준비 완료입니다.**
> 
> 모든 디자인 작업은 [디자인 시스템 가이드](design-system-v2/MINDGARDEN_DESIGN_SYSTEM_GUIDE.md)를 참고하세요.

---

**작성일**: 2025년 10월 14일  
**문서 버전**: 1.0  
**상태**: ✅ 최신

