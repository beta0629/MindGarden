# Expo App i18n 정책 (A8 — P0)

> 최종 갱신: 2026-06-14 · 적용 대상: `expo-app/`
> 관련 PR: feat(expo-app): A8 i18n 정책·인프라 P0 도입

## 0. 배경

4영역 explore A 결과 — **expo-app 내 인라인 한국어 문자열 약 20,718 라인**.
국제화 정책·SSOT가 부재하여 향후 다국어 출시·QA·디자인 v2 재구성 시 모든 화면을 다시
손봐야 하는 비용이 누적되고 있다. 본 문서는 P0 인프라 도입 후 점진 마이그의 **단일 SSOT**다.

## 1. SSOT (Single Source of Truth)

- **번역 SSOT**: `expo-app/src/i18n/translations/<lang>.json`
  - 한국어: `ko.json`
  - 영어 스텁: `en.json` (미마이그 키는 영어 placeholder 또는 한국어 그대로 둘 수 있음 — 단, 키 자체는 동일해야 한다)
- **초기화 SSOT**: `expo-app/src/i18n/index.ts`
  - `i18next` + `react-i18next` 단일 인스턴스
  - 디바이스 로케일 감지: `expo-localization` `getLocales()`
  - `bootstrapI18n()` 멱등 — 모듈 import 부수효과로 1회 호출됨
- **부트스트랩**: `expo-app/app/_layout.tsx` 최상단에서 `import '@/i18n'`

### 미준수 시 영향

- 인라인 한국어 추가 → ESLint `no-restricted-syntax` **warn** (현재) → 디자인 v2 종료 후 `error` 로 승격
- SSOT 외 다른 i18n 라이브러리·자체 dictionary 추가 금지

## 2. 사용 패턴

### 2.1 컴포넌트에서

```tsx
import { useTranslation } from 'react-i18next';

const KEYS = Object.freeze({
  TITLE: 'auth.login.duplicate.modalTitle',
  CONFIRM: 'auth.login.duplicate.confirmLabel',
} as const);

export function Foo() {
  const { t } = useTranslation();
  return (
    <Text>{t(KEYS.TITLE)}</Text>
  );
}
```

### 2.2 비-React 코드(서비스·유틸)에서

```ts
import { t } from '@/i18n';

throw new Error(t('common.errors.network'));
```

### 2.3 키 네이밍

- 도메인.화면.섹션.역할 (`auth.login.duplicate.modalTitle`)
- 영어 소문자 + 마침표 구분, 중간에 한국어/공백 금지
- 같은 문구라도 의미 맥락이 다르면 별도 키 (예: `common.actions.confirm` vs `auth.login.duplicate.confirmLabel`)

## 3. 적용 범위 (단계)

### Phase 1 — P0 (본 PR 범위)

- 인프라: 라이브러리·SSOT·부트스트랩·ESLint 규칙·정책 문서
- 1차 마이그: **로그인 화면**(`app/(auth)/login.tsx`) 의 모달·배너·핵심 에러 메시지

### Phase 2 — 디자인 v2 와 병행

- 인증 흐름 잔여(메인·소셜가입·OAuth 후속 화면)
- 메인 화면, 마이페이지, 상담일정 등 고빈도 화면
- 공통 컴포넌트(UnifiedModal 등) 의 기본 라벨

### Phase 3 — 영어·다국어

- `en.json` placeholder 를 실제 번역으로 채움
- `expo-localization` 폴백을 통한 디바이스 언어 자동 전환 검증

### 일괄 마이그 금지 (Phase 1)

- 디자인 v2 와 병행해 화면 단위로 진행한다.
- 1 PR 에서 전체 20,718 라인을 일괄 변환하면 시각 회귀 검증이 불가능해진다.

## 4. ESLint 규칙

```js
// eslint.config.js (mindgarden/legacy-eslintrc-parity)
'no-restricted-syntax': [
  'warn',
  { selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]', message: '색상 하드코딩 금지 …' },
  {
    selector:
      'Literal[value=/[\\uAC00-\\uD7A3]/], TemplateElement[value.raw=/[\\uAC00-\\uD7A3]/], JSXText[value=/[\\uAC00-\\uD7A3]/]',
    message: '한국어 인라인 문자열 금지 — src/i18n/translations/ko.json 에 키를 정의하고 …',
  },
],
```

### 제외 경로

- `src/i18n/translations/**/*.json` — 한국어 SSOT 그 자체
- `src/i18n/index.ts`, `src/i18n/__tests__/**` — 부트스트랩·테스트
- `app.config.ts`, `app.json` — 빌드 메타 (사용자 가시 UI 아님)
- `scripts/**` — CLI 안내 문구
- `**/__tests__/**`, `**/*.test.{ts,tsx}` — 테스트 데이터

## 5. 검증 체크리스트 (PR 리뷰 시)

- [ ] 신규 한국어 인라인 문자열이 추가되지 않았는가? (ESLint warn 0 유지가 목표)
- [ ] `src/i18n/translations/ko.json` 키와 `en.json` 키가 동일하게 존재하는가?
- [ ] 컴포넌트는 `useTranslation()` 또는 `t()` 만 사용하는가? (직접 dictionary 접근 금지)
- [ ] 새 키는 `도메인.화면.섹션.역할` 네이밍을 따르는가?
- [ ] 부트스트랩 (`import '@/i18n'`) 이 `_layout.tsx` 최상단에 존재하는가?

## 6. 의도적 비범위

- 본 PR(P0) 는 **로그인 화면 이외 화면의 인라인 한국어를 마이그하지 않는다**.
- 일괄 변환 스크립트(`scripts/i18n-migrate.ts`) 도입은 디자인 v2 와 함께 별도 PR.
- 다국어 BE 메시지(서버 에러 메시지)는 본 정책 범위 외 (별도 정책 필요 시 후속).

## 7. 변경 이력

| 일자       | 변경                                                          | PR    |
| ---------- | ------------------------------------------------------------- | ----- |
| 2026-06-14 | P0 인프라·정책 도입, 로그인 화면 1차 마이그, ESLint warn 신설 | (PR-B) |
