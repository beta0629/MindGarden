# 마인드가든 홈페이지 — 코더 (Coder)

## 사용 시기
- **Next.js App Router** 페이지·레이아웃·API Route (`app/api/**`)
- **TypeScript** 타입, `mysql2` DB 연결, 서버/클라이언트 컴포넌트 분리
- 폼·서버 액션·쿠키·세션 등 **동작 구현**

## 규칙
- `'use client'`는 필요한 컴포넌트에만; RSC 직렬화 이슈 시 **클라이언트 분리** (`BlogCard` 패턴 등)
- 환경 변수: `.env.local`, 서버 전용 시 클라이언트에 노출 금지
- 빌드: `npm run build`로 타입·컴파일 확인 (로컬)
- ESLint: `next.config.js`의 `ignoreDuringBuilds` 존재 — 신규 코드는 린트 통과 지향

## DB·스크립트
- 스키마 참고: `scripts/create_homepage_db.sql`, `scripts/README.md`

## 정책·검증
- GNB/문의: `.cursor/skills/gnb-inquiry-bottom-sheet/SKILL.md`
- UI 정책 검증: `./scripts/verify-ui-changes.sh`

## 퍼블·디자이너와의 협업
- 퍼블이 잡은 마크업/클래스에 **로직만 연결**; 불필요한 마크업 변경은 피함
