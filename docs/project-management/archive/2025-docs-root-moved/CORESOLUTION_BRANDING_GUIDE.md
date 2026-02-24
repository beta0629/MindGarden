# CoreSolution 브랜딩 변경 가이드

## 📋 **개요**

CoreSolution은 **CSS 변수 중심 아키텍처**로 구축되어 있어, **핵심 CSS 파일 몇 개만 수정하면 전체 시스템의 브랜딩이 변경**됩니다.

## 🎯 **핵심 원리**

```
CSS 변수 (1개 파일) → 전체 시스템 (수백 개 컴포넌트)
```

**한 곳에서 변경 → 모든 곳에 적용**

---

## 🔧 **1단계: 기본 브랜딩 변경 (전체 시스템)**

### **📁 핵심 파일: `frontend/src/styles/unified-design-tokens.css`**

이 파일 **하나만 수정하면 전체 시스템이 바뀝니다**.

```css
:root {
  /* ===== 테넌트 기본 브랜딩 ===== */
  --tenant-name: 'CoreSolution';                    /* 회사명 */
  --tenant-primary: #3b82f6;                       /* 메인 색상 */
  --tenant-secondary: #6b7280;                     /* 보조 색상 */
  --tenant-logo-url: '/images/coresolution-logo.png'; /* 로고 경로 */
  --tenant-favicon: '/favicon-coresolution.ico';   /* 파비콘 */
}
```

### **🎨 색상 변경 예시**

```css
/* 파란색 계열로 변경 */
--tenant-primary: #2563eb;
--tenant-secondary: #64748b;

/* 초록색 계열로 변경 */
--tenant-primary: #059669;
--tenant-secondary: #6b7280;

/* 보라색 계열로 변경 */
--tenant-primary: #7c3aed;
--tenant-secondary: #a855f7;
```

---

## 🏢 **2단계: 테넌트별 개별 브랜딩 (데이터베이스 기반)**

### **📊 데이터베이스 테이블: `tenant_branding`**

```sql
-- 테넌트별 브랜딩 정보 추가/수정
INSERT INTO tenant_branding (
    tenant_id, 
    company_name, 
    primary_color, 
    secondary_color, 
    logo_url, 
    favicon_url
) VALUES (
    'tenant-abc-123',
    '새로운 상담소',
    '#ff6b6b',
    '#4ecdc4',
    '/images/tenants/tenant-abc-123/logo.png',
    '/images/tenants/tenant-abc-123/favicon.ico'
);
```

### **🔄 자동 적용 시스템**

테넌트가 로그인하면 **자동으로 CSS 변수가 변경**됩니다:

```javascript
// useTenantBranding.js - 자동 실행
document.documentElement.style.setProperty('--tenant-primary', '#ff6b6b');
document.documentElement.style.setProperty('--tenant-name', '새로운 상담소');
document.documentElement.style.setProperty('--tenant-logo-url', '/images/new-logo.png');
```

---

## 📂 **3단계: 로고 및 파비콘 파일 관리**

### **📁 파일 구조**

```
frontend/public/images/
├── coresolution-logo.png          # 기본 CoreSolution 로고
├── tenants/                       # 테넌트별 로고 폴더
│   ├── tenant-abc-123/
│   │   ├── logo.png
│   │   └── favicon.ico
│   └── tenant-def-456/
│       ├── logo.png
│       └── favicon.ico
└── favicon-coresolution.ico       # 기본 파비콘
```

### **🖼️ 로고 업로드 API**

```javascript
// 관리자 페이지에서 로고 업로드
const formData = new FormData();
formData.append('file', logoFile);

fetch('/api/admin/branding/logo', {
  method: 'POST',
  body: formData
});
// → 자동으로 CSS 변수 업데이트됨
```

---

## 🎨 **4단계: 고급 브랜딩 커스터마이징**

### **📋 변경 가능한 CSS 변수 목록**

```css
:root {
  /* ===== 기본 브랜딩 ===== */
  --tenant-name: 'CoreSolution';
  --tenant-primary: #3b82f6;
  --tenant-secondary: #6b7280;
  --tenant-logo-url: '/images/coresolution-logo.png';
  --tenant-favicon: '/favicon-coresolution.ico';
  
  /* ===== 확장 색상 시스템 ===== */
  --tenant-primary-light: rgba(59, 130, 246, 0.2);
  --tenant-primary-dark: #1e40af;
  --tenant-primary-hover: #2563eb;
  
  /* ===== 폰트 시스템 ===== */
  --font-family-primary: 'Pretendard', sans-serif;
  --font-family-display: 'Pretendard', sans-serif;
  
  /* ===== 레이아웃 ===== */
  --tenant-logo-width: 200px;
  --tenant-logo-height: 60px;
}
```

### **🌈 색상 팔레트 시스템**

```css
/* 메인 색상에서 자동 생성되는 색상들 */
--primary-50: /* 가장 밝은 색 */
--primary-100: 
--primary-200: 
--primary-300: 
--primary-400: 
--primary-500: /* 메인 색상 */
--primary-600: 
--primary-700: 
--primary-800: 
--primary-900: /* 가장 어두운 색 */
```

---

## 🚀 **5단계: 실시간 브랜딩 변경 테스트**

### **🔧 개발자 도구에서 즉시 테스트**

브라우저 개발자 도구 Console에서:

```javascript
// 색상 즉시 변경 테스트
document.documentElement.style.setProperty('--tenant-primary', '#ff6b6b');
document.documentElement.style.setProperty('--tenant-name', '테스트 상담소');

// 로고 즉시 변경 테스트
document.documentElement.style.setProperty('--tenant-logo-url', '/images/test-logo.png');
```

### **📱 반응형 테스트**

```css
/* 모바일에서 로고 크기 조정 */
@media (max-width: 768px) {
  :root {
    --tenant-logo-width: 150px;
    --tenant-logo-height: 45px;
  }
}
```

---

## 📋 **6단계: 브랜딩 변경 체크리스트**

### **✅ 기본 브랜딩 변경**
- [ ] `unified-design-tokens.css`에서 `--tenant-name` 변경
- [ ] `--tenant-primary` 색상 변경
- [ ] `--tenant-logo-url` 경로 변경
- [ ] `--tenant-favicon` 경로 변경

### **✅ 파일 준비**
- [ ] 로고 파일 업로드 (`/images/coresolution-logo.png`)
- [ ] 파비콘 파일 업로드 (`/favicon-coresolution.ico`)
- [ ] 모바일용 로고 준비 (선택사항)

### **✅ 테스트**
- [ ] 데스크톱에서 로고 표시 확인
- [ ] 모바일에서 로고 표시 확인
- [ ] 다크모드에서 로고 표시 확인
- [ ] 브라우저 탭 파비콘 확인

### **✅ 테넌트별 브랜딩 (선택사항)**
- [ ] 데이터베이스에 테넌트 브랜딩 정보 추가
- [ ] 테넌트 로그인 시 자동 적용 확인
- [ ] 테넌트별 로고 파일 업로드

---

## 🔍 **7단계: 문제 해결**

### **❗ 로고가 안 보일 때**

```javascript
// 1. 파일 경로 확인
console.log(getComputedStyle(document.documentElement).getPropertyValue('--tenant-logo-url'));

// 2. 파일 존재 확인
fetch('/images/coresolution-logo.png')
  .then(response => console.log('로고 파일 상태:', response.status));
```

### **❗ 색상이 안 바뀔 때**

```javascript
// CSS 변수 적용 상태 확인
console.log(getComputedStyle(document.documentElement).getPropertyValue('--tenant-primary'));

// 강제로 CSS 변수 재적용
document.documentElement.style.setProperty('--tenant-primary', '#새로운색상', 'important');
```

### **❗ 캐시 문제 해결**

```javascript
// 브랜딩 캐시 강제 새로고침
import { clearBrandingCache } from '../utils/brandingUtils';
clearBrandingCache();
window.location.reload();
```

---

## 📚 **8단계: 고급 활용**

### **🎨 테마별 브랜딩**

```css
/* 라이트 테마 */
[data-theme="light"] {
  --tenant-primary: #3b82f6;
  --tenant-background: #ffffff;
}

/* 다크 테마 */
[data-theme="dark"] {
  --tenant-primary: #60a5fa;
  --tenant-background: #1f2937;
}
```

### **🏢 업종별 브랜딩**

```css
/* 상담소 */
[data-business-type="CONSULTATION"] {
  --tenant-primary: #3b82f6;
}

/* 병원 */
[data-business-type="HOSPITAL"] {
  --tenant-primary: #059669;
}

/* 학교 */
[data-business-type="EDUCATION"] {
  --tenant-primary: #7c3aed;
}
```

---

## 🎯 **요약**

### **🚀 빠른 브랜딩 변경 (5분)**
1. `frontend/src/styles/unified-design-tokens.css` 열기
2. `--tenant-name`, `--tenant-primary`, `--tenant-logo-url` 수정
3. 로고 파일 업로드
4. 새로고침

### **💡 핵심 포인트**
- **1개 파일 수정 = 전체 시스템 변경**
- **CSS 변수 중심 아키텍처**
- **테넌트별 자동 브랜딩 적용**
- **실시간 미리보기 가능**

---

## 📞 **지원**

브랜딩 변경 관련 문의:
- 개발팀: dev@coresolution.co.kr
- 기술문서: `/docs/CORESOLUTION_BRANDING_GUIDE.md`
- API 문서: `/api/admin/branding` 엔드포인트 참조

---

*마지막 업데이트: 2025-11-28*
*버전: 1.0.0*
*작성자: CoreSolution 개발팀*
