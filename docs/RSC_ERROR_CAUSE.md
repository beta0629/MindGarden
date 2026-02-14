# Server Components render 오류 원인 및 조치

프로덕션에서 "An error occurred in the Server Components render" (digest 포함) 가 나올 때 참고.

## 원인

- **서버 컴포넌트**가 **클라이언트 컴포넌트**(예: `Link`, 버튼)에 **이벤트 핸들러**(onClick, onMouseEnter, onMouseLeave 등)나 **함수**를 props로 넘기면, 직렬화할 수 없어 오류 발생.
- 프로덕션 빌드에서는 보안상 실제 메시지가 숨겨지고, 개발 모드(`npm run dev`)에서는 "Event handlers cannot be passed to Client Component props" 등으로 표시됨.

## 이 프로젝트에서 적용한 조치

1. **블로그 상세 (`/blog/[id]`)**
   - 서버 페이지는 데이터만 가져와 직렬화 가능한 `post` 객체만 생성.
   - `BlogPostView`(클라이언트)가 그 데이터를 받아 본문·Link·버튼 전부 렌더. → 서버는 Link/이벤트를 넘기지 않음.

2. **블로그 목록 (`/blog`)**
   - 서버에서 `Link`를 여러 개 직접 렌더하지 않음.
   - 직렬화 가능한 `post`만 `BlogCard`(클라이언트)에 넘기고, 카드·Link·날짜 포맷은 전부 `BlogCard` 안에서 처리. → 서버→클라이언트 경계에서 함수/이벤트 제거.

3. **GNB (Navigation)**
   - 호버 시 서브메뉴용 이벤트는 `Link`가 아닌 **래퍼 div**(`display: contents`)에만 부여해, `Link`에는 이벤트가 전달되지 않도록 수정.

## 재발 시 확인할 것

- **서버 컴포넌트**(파일 상단에 `'use client'` 없음)에서:
  - `Link`, `button`, 커스텀 클라이언트 컴포넌트에 `onClick`, `onMouseEnter`, `onMouseLeave`, `onChange` 등 **함수형 props**를 넘기고 있지 않은지 확인.
- **직렬화 가능한 것**: 문자열, 숫자, 불리언, null, plain object/array(함수·Symbol·Date 등 없음).
- **직렬화 불가**: 함수, Symbol, Date(객체), 클래스 인스턴스 등.

## 개발 모드에서 정확한 위치 확인

```bash
npm run dev
```

브라우저에서 오류 나는 경로로 이동한 뒤, 터미널/브라우저 콘솔에 찍힌 **에러 메시지와 컴포넌트 스택**을 보면 어떤 서버 컴포넌트에서 어떤 클라이언트에 잘못된 props를 넘기는지 확인할 수 있음.
