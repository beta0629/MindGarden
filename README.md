# 마인드 가든 홈페이지

Next.js 기반의 반응형 홈페이지입니다.

## 기술 스택

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **코어솔루션 API 연동**

## 주요 기능

- ✅ 반응형 디자인 (모바일, 태블릿, 데스크톱)
- ✅ 이미지 최적화 (Next.js Image 컴포넌트)
- ✅ 코어솔루션 API 연동
- ✅ 서버 사이드 렌더링 (SSR)
- ✅ 밝은 파스텔 톤 디자인
- ✅ 블로그 기능 (글 작성, 이미지 업로드)
- ✅ 블로그 관리자 인증 시스템
- ✅ 홈페이지 전용 독립 데이터베이스 (코어솔루션과 완전 분리)
- ✅ 갤러리 이미지 관리 (서버 사이드 자동 리사이징)
- ✅ 상담 문의 접수 시스템

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# API 기본 URL
NEXT_PUBLIC_API_BASE_URL=https://api.mindgarden.co.kr

# 블로그 관리자 비밀번호 (필수)
BLOG_ADMIN_PASSWORD=your-secure-password-here

# 홈페이지 전용 데이터베이스 연결 정보
DB_HOST=localhost
DB_PORT=3306
DB_USER=homepage_user
DB_PASSWORD=Homepage2025
DB_NAME=mindgarden_homepage
```

또는 개발 서버 사용 시:

```env
NEXT_PUBLIC_API_BASE_URL=http://beta0629.cafe24.com:8080
BLOG_ADMIN_PASSWORD=your-secure-password-here
```

**중요**: `BLOG_ADMIN_PASSWORD`는 블로그 관리 페이지 접근을 위한 비밀번호입니다. 반드시 안전한 비밀번호로 설정하세요.

### 3. 개발 서버 실행

**방법 1: npm 스크립트 사용**
```bash
# 프론트엔드 개발 서버 실행 (포트 3000)
npm run dev

# 또는 명시적으로
npm run dev:frontend
```

**방법 2: 쉘 스크립트 사용 (권장)**
```bash
# 개발 서버 실행 (포트 확인 및 환경 변수 체크 포함)
./scripts/dev.sh
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

**포트 설정:**
- 프론트엔드: 포트 3000 (코어솔루션 8080과 겹치지 않음)
- Next.js는 프론트엔드와 API Routes를 모두 제공하므로 하나의 서버로 실행됩니다

### 4. 프로덕션 빌드 및 실행

**빌드:**
```bash
npm run build
```

**실행:**
```bash
# npm 스크립트 사용
npm run start

# 또는 쉘 스크립트 사용
./scripts/start.sh
```

### 5. 사용 가능한 스크립트

```bash
# 개발
npm run dev              # 개발 서버 실행 (포트 3000)
npm run dev:frontend     # 프론트엔드 개발 서버 (포트 3000)

# 프로덕션
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 실행 (포트 3000)
npm run start:frontend   # 프론트엔드 프로덕션 서버 (포트 3000)

# 기타
npm run lint             # 코드 린팅
```

## 프로젝트 구조

```
마인드가든_홈페이지/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (백엔드)
│   │   └── blog/          # 블로그 API
│   ├── blog/              # 블로그 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   └── globals.css         # 글로벌 스타일
├── components/            # React 컴포넌트
│   ├── Navigation.tsx      # 네비게이션
│   ├── HeroSection.tsx     # 히어로 섹션
│   ├── GalleryMarquee.tsx # 갤러리 마퀴
│   └── Footer.tsx          # 푸터
├── lib/                   # 유틸리티 및 서비스
│   ├── config.ts          # API 설정
│   └── api.ts             # API 서비스
├── scripts/               # 실행 스크립트
│   ├── dev.sh             # 개발 서버 실행 스크립트
│   └── start.sh           # 프로덕션 서버 실행 스크립트
├── public/                # 정적 파일
│   └── assets/
│       └── images/        # 이미지 파일
└── package.json
```

## 코어솔루션 API 연동

API 서비스는 `lib/api.ts`에서 관리됩니다. 

### API 엔드포인트

**홈페이지 데이터:**
- `GET /api/v1/home` - 홈페이지 메인 데이터
- `GET /api/v1/gallery` - 갤러리 이미지
- `GET /api/v1/clinic/info` - 상담소 정보
- `GET /api/v1/notices` - 공지사항
- `GET /api/v1/programs` - 프로그램 정보

**블로그:**
- `GET /api/v1/blog/posts` - 블로그 포스트 목록
- `GET /api/v1/blog/posts/:id` - 블로그 포스트 상세
- `POST /api/v1/blog/posts` - 블로그 포스트 작성
- `POST /api/v1/blog/images` - 블로그 이미지 업로드

**블로그 관리 인증:**
- `POST /api/blog/auth` - 로그인
- `DELETE /api/blog/auth` - 로그아웃
- `GET /api/blog/auth` - 인증 상태 확인

### API 응답 형식

**홈 데이터:**
```json
{
  "slogan": {
    "sub": "새로운 희망이 시작되는 곳",
    "main": "당신의 하루가\n더 맑아지도록"
  }
}
```

**갤러리 이미지:**
```json
{
  "images": [
    {
      "url": "/assets/images/gallery_1.png",
      "alt": "Gallery Image 1"
    }
  ]
}
```

## 배포

### Vercel 배포 (권장)

1. GitHub에 프로젝트 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 환경 변수 설정
4. 자동 배포 완료

### 기타 플랫폼

Next.js는 다양한 플랫폼에서 배포 가능합니다:
- Vercel (권장)
- Netlify
- AWS Amplify
- 자체 서버 (Node.js)

## 블로그 관리

### 관리자 로그인 방법

1. **로그인 페이지 접근**
   - URL: `http://localhost:3000/blog/admin/login` (또는 배포된 도메인)
   - 또는 블로그 관리 페이지(`/blog/admin`) 접근 시 자동으로 로그인 페이지로 이동

2. **비밀번호 입력**
   - 환경 변수 `BLOG_ADMIN_PASSWORD`에 설정한 비밀번호 입력
   - 환경 변수가 없으면 기본값: `admin123` (프로덕션에서는 반드시 변경!)

3. **로그인 후 기능**
   - 블로그 글 작성 (`/blog/admin`)
   - 블로그 목록 관리 (`/blog/admin/list`)
   - 글 수정/삭제
   - 로그인 상태는 30일간 유지됩니다

### 관리 페이지

- **글 작성**: `/blog/admin`
- **목록 관리**: `/blog/admin/list`
- **로그인**: `/blog/admin/login`

### 주요 기능

1. **글 작성**: 로그인 후 블로그 글을 작성하고 이미지를 업로드할 수 있습니다
2. **홈페이지 전용**: "홈페이지 전용" 옵션을 체크하면 홈페이지에서만 표시되는 글을 작성할 수 있습니다
3. **글 관리**: 목록에서 모든 글을 확인하고 수정/삭제할 수 있습니다

### 보안 설정

**중요**: 관리자 비밀번호는 환경 변수 `BLOG_ADMIN_PASSWORD`로 설정하며, 반드시 안전한 비밀번호를 사용하세요.

```env
BLOG_ADMIN_PASSWORD=your-strong-password-here
```

프로덕션 환경에서는 기본값(`admin123`)을 절대 사용하지 마세요!

## 개발 팁

- 이미지는 `public/assets/images/` 폴더에 저장
- 외부 이미지는 `next.config.js`의 `remotePatterns`에 추가 필요
- API 호출은 서버 컴포넌트에서 수행 (SSR)
- 클라이언트 상호작용은 `'use client'` 디렉티브 사용
- 블로그 관리자 비밀번호는 프로덕션 환경에서 반드시 변경하세요

## 라이선스

© 2025 Mind Garden. All rights reserved.

