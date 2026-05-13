# MindGarden Expo 앱 (`expo-app`)

Cursor에서 `expo-app/**` 파일을 주로 다룰 때는 프로젝트 규칙 **`.cursor/rules/expo-app-metro-handoff.mdc`** 가 자동 적용될 수 있다.

## 빠른 시작

```bash
cd expo-app
npm install
npm run start:clean
```

`expo start`는 **`expo-app` 루트**에서 실행한다.

## Metro·`@/`·MMKV — 다음 작업·에이전트 필독

모듈 해석(`getMmkv`, `@/lib/...`) 이슈는 **TypeScript paths와 Metro가 분리**되어 있어, 잘못 손대면 같은 수정이 반복된다.  
**규칙·체크리스트·금지 사항**은 아래 문서에만 둔다.

→ **[EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md](../docs/project-management/EXPO_APP_METRO_ALIAS_AND_MMKV_HANDOFF.md)**

위임 시 `core-coder` 프롬프트에 위 문서 경로를 넣고, 문서 §5 체크리스트를 완료 조건에 포함한다.
