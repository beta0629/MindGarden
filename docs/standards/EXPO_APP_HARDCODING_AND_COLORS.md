# Expo 네이티브 앱(`expo-app/`) — 하드코딩·색상 표준

**버전**: 1.0.0  
**최종 업데이트**: 2026-05-13  
**상태**: 공식 표준  
**적용 범위**: 저장소 루트의 `expo-app/` 디렉터리 전체 (React Native / Expo)

---

## 1. 목적

웹 프론트엔드의 `var(--mg-*)`와 동일하게, 네이티브 앱에서도 **색·간격·그림자 등 시각 값이 화면 코드에 흩어지지 않도록** 단일 소스를 둔다.  
특히 **색상 하드코딩(HEX·RGB·HSL 리터럴을 화면·컴포넌트·훅에 직접 박는 것)**은 개발 단계에서도 예외 없이 금지한다.

---

## 2. 색상 — 허용되는 위치만

| 위치 | 역할 | 비고 |
|------|------|------|
| `expo-app/src/theme/tokens.ts` | 앱 팔레트·공통 색·그레이 스케일의 **단일 소스(SSOT)** | 여기서만 HEX 문자열을 정의한다. |
| `expo-app/src/constants/oauthProviderBrand.ts` | 카카오·네이버 등 **제3자 브랜드 가이드가 고정한 색** | 신규 OAuth·브랜드 고정색은 **별도 상수 파일**에만 추가하고, 화면에서는 해당 상수를 import 한다. |

**그 외 모든 `*.ts` / `*.tsx`**(앱 라우트 `app/`, 컴포넌트 `src/components/`, 훅 등)에서는 다음을 **금지**한다.

- `#RGB`, `#RRGGBB`, `#RRGGBBAA` 형태의 문자열
- `rgb(...)`, `rgba(...)`, `hsl(...)`, `hsla(...)` **색상 목적** 리터럴 (애니메이션·수학과 무관한 시각 색)

**권장 사용 방식**

- 런타임 스타일: `ThemeProvider`가 주입하는 테마(`clientTheme` / `consultantTheme`)의 `theme.colors.*` 또는 `tokens`에서 import 한 `colors` 객체.
- `app.config.ts`, WebView용 HTML 문자열 등 **토큰을 직접 쓸 수 있는 모듈**: `import { colors } from './src/theme/tokens'` 등으로 **토큰·상수만** 참조한다.

---

## 3. 색 외 하드코딩

- **간격·라운드**: `expo-app/src/theme/tokens.ts`의 `spacing`, `borderRadius` 등을 사용한다. 화면에 매직 넘버 `12`, `16`만 반복하는 것은 지양하고, 토큰 또는 의미 있는 로컬 상수로 묶는다.
- **그림자**: `expo-app/src/theme/shadows.ts` — 그림자 색은 `colors.common.shadowSource` 등 토큰을 통해 일원화한다.
- **API URL·테넌트**: [API 연동 표준](./API_INTEGRATION_STANDARD.md), [테넌트 컨텍스트 사용](./TENANT_CONTEXT_USAGE.md) 및 프로젝트 기존 룰을 따른다 (본 문서는 색·시각 토큰에 초점).

---

## 4. 검증·게이트

- **저장소 훅**: `scripts/design-system/automation/pre-commit-hardcoding-check.sh`는 주로 `frontend/` CSS·JS 관례와 맞춰져 있다. Expo 코드도 스테이징되면 동일 훅이 스캔할 수 있으므로, **위 색상 규칙을 먼저 지키는 것**이 커밋·CI 충돌을 줄인다.
- **운영 반영 전**: 워크스페이스 규칙에 따른 하드코딩 게이트·체크리스트(`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md` 등)를 따른다.

---

## 5. 관련 문서

- [Expo 네이티브 앱 기획서](../project-management/EXPO_NATIVE_APP_PLAN.md) — 디자인 시스템·토큰 구조
- [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md) — 웹(`frontend/`) 측 CSS 변수·토큰
- [프론트엔드 개발 표준](./FRONTEND_DEVELOPMENT_STANDARD.md) — 웹/React; Expo는 본 문서를 추가로 준수

---

## 6. 코더·리뷰 체크리스트

- [ ] 새 화면·컴포넌트에 `#` + HEX 또는 `rgb`/`rgba` 색 리터럴이 없다.
- [ ] 새 색이 필요하면 `tokens.ts`에 의미 있는 키로 추가했거나, 브랜드 고정색이면 `oauthProviderBrand.ts` 같은 **상수 모듈**에만 있다.
- [ ] `app.config.ts`·인라인 HTML 등은 **토큰/상수 import**로만 색을 지정한다.
