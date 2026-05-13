# Expo 앱(`expo-app`) — Metro·alias·MMKV 핸드오프 (다음 에이전트·개발자용)

**목적**: `Unable to resolve module` / `@/` / `getMmkv` 관련 **같은 작업 반복**을 막기 위한 단일 기준과 위임 시 체크리스트.

**관련 코드**: `expo-app/metro.config.js`, `expo-app/src/lib/getMmkv.ts`, `expo-app/tsconfig.json`

---

## 1. 원인 요약 (한 줄)

**`tsconfig.json`의 `paths`(`@/*` 등)는 Metro가 기본으로 따르지 않는다.**  
에디터·`tsc`는 통과해도 시뮬레이터 번들에서만 모듈 해석이 실패할 수 있다.

---

## 2. 고정 규칙 (예외 없이)

| 항목 | 규칙 |
|------|------|
| MMKV 브리지 import | **`@/lib/getMmkv`만 사용**한다. |
| 가짜 패키지명 | **`mindgarden-mmkv-bridge` 등 bare 패키지 alias는 사용하지 않는다.** (과거 시도로 반복·혼선만 유발) |
| 번들러 | **`expo-app` 디렉터리에서** `expo start` / EAS 빌드한다. (상위 루트에서 실행 시 설정·cwd 불일치 주의) |

---

## 3. Metro가 하는 일 (`metro.config.js`)

소스에서는 **`import … from '@/lib/getMmkv'`만** 쓰되, Metro에 들어오는 **모듈 문자열 변형**은 아래로 모두 `src/lib/getMmkv.ts` 하나로 수렴한다. (`npm run verify:metro-mmkv`로 회귀 검증.)

**Metro 입력으로 허용·처리되는 변형(요약)**

1. **`@/lib/getMmkv`** — 즉시 `sourceFile`로 `getMmkv.ts` 반환.
2. **선행 `./`·`../` 제거 후 `lib/getMmkv`** (예: `../lib/getMmkv`, `../../lib/getMmkv`) — **origin이 프로젝트 1st-party**(루트 기준 `node_modules` 밖)일 때만 동일 TS로 수렴.
3. **선행 제거 후 `src/lib/getMmkv`** (예: `../../../../src/lib/getMmkv`, `../../../src/lib/getMmkv`) — **정규화 결과가 이 문자열이면 MindGarden 전용 규약으로 보고, `originModulePath`가 비어 있거나 1st-party가 아니어도** 동일 TS로 수렴한다. (Expo Router·가상 경로·`realpath`/`path.relative` 엣지 대응.) **`tryMmkvExplicitResolution`에서는 이 규약 문자열만 `mmkvExplicitSourceResolution()`으로 처리하며 origin 검증을 하지 않는다.**
4. **그 외 `.`로 시작하는 상대 지정자** — origin 디렉터리와 결합한 경로가 `getMmkv` TS(또는 확장자 없는 동일 베이스)와 **realpath 기준**으로 같으면 동일 TS로 수렴.

**`mindGardenResolveRequest`**는 위 MMKV 전담 분기 이후, `@/`를 `…/src/…` 절대 경로로 바꿔 upstream에 넘기고, 1st-party 상대 요청 중 `src/…`로 정규화되는 것도 `projectRoot/src`에 맞춘다. 정규화 결과가 정확히 `src/lib/getMmkv`인 상대는 1st-party 검사 없이 동일 베이스의 절대 경로로 치환한다(MMKV 전담 분기와 이중 방어). MMKV와 겹치는 상대는 **`joinedRelativeResolvesToMmkv`**로 판별해 `next`를 브리지 베이스로 맞춘다.

**Babel**(`babel.config.js`): `babel-plugin-module-resolver`로 `@/`를 바꾸지 않는다. **`api.cache`**는 함수 `babelCacheKey`가 반환하는 **`mindgarden-expo-babel-v11-mmkv-relative`** 문자열로 Babel 캐시 버킷만 바꾼다(코드·alias 변경 시 이 문자열을 올리면 Babel 캐시 무효화). **Metro·Expo 번들 캐시**는 별도이므로, 오래된 상대 경로만 남는 증상이면 **`npm run start:clean`**(§4)도 함께 수행한다.

**수정 시 주의**: 커스텀 `resolveRequest`를 제거·단순화하기 전에 **`npm run verify:metro-mmkv`**와 클린 Metro로 대표 화면 번들을 확인한다.

---

## 4. 캐시·재현 절차

증상이 “갑자기” 나올 때:

1. `cd expo-app`
2. `npm run start:clean` (또는 `expo start --clear`)
3. 시뮬레이터/기기에서 앱 완전 재로드(필요 시 재설치)

4. **시뮬에서 같은 오류가 나는데 `npm run verify:metro-mmkv`는 통과**하면 stale Metro·번들러 프로세스 가능성이 크다. `killall node`(또는 Metro/Expo에 해당하는 Node 프로세스만 선택 종료) 후, **`expo-app` 디렉터리에서** `npm run start:clean`으로 다시 기동한다. (상위 루트에서 `expo start`하지 말 것.)

캐시 없이 재빌드했을 때만 **진짜 설정 오류**로 본다.

### 4.1 CI·비대화형에서의 번들 검증 (`CI=1`)

- **`CI=1 npx expo start`** 는 비대화형 환경에서 계정·`EXPO_TOKEN` 등 **인증 프롬프트(`CommandError`)** 로 막힐 수 있다. **자동화·CI·“한 번에 끝내는” 검증**에는 **`expo start`를 쓰지 않는다.**
- **권장**: `npm run verify:bundle:ci` — 내부적으로 `verify:metro-mmkv` 후 **`CI=1 npx expo export --platform web --output-dir /tmp/mg-expo-ci-web`** 로 실제 Metro 번들을 돌려 `@/`·`getMmkv` 해석을 확인한다. (`web`이 가볍고 iOS와 동일 `resolveRequest`를 쓰는 경우가 많다. iOS만 필요하면 동일 패턴으로 `--platform ios`를 별도 스크립트로 둔다.)
- **`prestart`의 `verify:metro-mmkv`** 는 Metro 커스텀 `resolveRequest` 회귀용이고, **`verify:bundle:ci`** 는 전체 번들(export) 게이트용으로 **역할이 겹치지 않는다.**

---

## 5. 다음 에이전트 위임 시 — 복붙용 체크리스트

다음 작업을 **한 라운드**에서 끝내려면 순서를 지킨다.

1. [ ] `grep -r "mindgarden-mmkv-bridge" expo-app` → **0건**인지 확인  
2. [ ] `grep -r "from '@/lib/getMmkv'" expo-app` (또는 `getMmkv` import) → **모두 동일 패턴**인지 확인  
3. [ ] `expo-app`에서 `npx tsc --noEmit` 통과  
4. [ ] `npm run verify:metro-mmkv` → **전 케이스 통과**  
5. [ ] `node -e "const c=require('./metro.config.js'); console.log(typeof c.resolver.resolveRequest)"` → **`function`**  
6. [ ] `npm run verify:bundle:ci` → **exit 0** (CI·비대화형 번들 게이트; §4.1)  
7. [ ] (로컬 개발) `npm run start:clean` 후 대표 화면(예: 심리교육 목록) 번들 성공 — **`CI=1 expo start`로 대체하지 말 것**

**하지 말 것**: `tsconfig paths`만 믿고 Metro를 손대지 않기, import 경로를 여러 스타일로 혼용, 가짜 `node_modules` 패키지명으로 우회만 추가하기.

---

## 6. 관련 문서·규칙

- `docs/project-management/EXPO_NATIVE_APP_PLAN.md` — 앱 전체 계획
- `docs/standards/EXPO_APP_HARDCODING_AND_COLORS.md` — Expo 쪽 하드코딩·색상 기준
- `.cursor/rules/expo-app-metro-handoff.mdc` — `expo-app/**` 작업 시 Cursor가 이 핸드오프를 따르도록 하는 규칙

---

**작성**: 2026-05-13 — Metro MMKV 모듈 해석 반복 이슈 정리 후 핸드오프용.
