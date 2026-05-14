# MindGarden 모바일(Expo) 릴리즈

## 버전 규칙 (Semantic Versioning)

| 구분 | 예시 | 언제 올리나 |
|------|------|-------------|
| **MAJOR** (앞자리) | `1.x.x` → `2.0.0` | 메뉴·IA 큰 개편, 호환성 깨지는 변경, 제품 단계 전환 등 **큰 변동** |
| **MINOR** (중간) | `1.0.x` → `1.1.0` | 기능 단위 추가·중간 규모 UI/플로우 변경 (하위 호환 유지) |
| **PATCH** (뒷자리) | `1.0.0` → `1.0.1` | 버그픽스·문구·스타일·탭 안전영역 등 **자잘한 수정** |

- 사용자 표현 기준: **“메뉴처럼 큰 변동” → MAJOR**, **“자잘한 것” → PATCH** (필요 시 MINOR는 중간 크기 기능에 사용).

## 단일 소스

1. **`package.json`의 `version`** — 앱 표시 버전·`app.config.ts`가 여기를 읽음.
2. **`releases/manifest.json`의 `androidVersionCode`** — Google Play에 올리는 **정수 빌드 번호**. 스토어에 새 바이너리를 올릴 때마다 **항상 1씩 증가** (되돌리지 않음).

## 릴리즈 절차 (체크리스트)

1. 위 규칙에 맞게 `package.json`의 `version` 수정.
2. Android 스토어/내부 트랙에 새 APK·AAB를 올릴 때는 `releases/manifest.json`의 `androidVersionCode`를 **+1**.
3. `lastReleaseNote`에 한 줄 요약(선택).
4. `npm run android:apk:dev` 등으로 빌드 후, 아카이브가 필요하면 `npm run release:archive-dev-apk`.
5. 커밋 메시지에 버전 명시 (예: `release(mobile): 1.0.1`).

## `artifacts/`

빌드 산출 APK 사본을 버전 이름으로 남길 때 사용. `*.apk`는 Git에 올리지 않음(용량·보안). 로컬 보관만.
