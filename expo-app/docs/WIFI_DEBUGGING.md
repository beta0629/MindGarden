# Android 기기 디버깅 — USB / Wi-Fi (Expo / MindGarden)

## 0. USB 디버깅 + Metro (와이파이 없이, 가장 단순)

**전제:** 폰에 **개발 빌드**(Expo dev client, `npx expo run:android`로 설치한 앱)가 있어야 PC Metro에 붙습니다. `android:apk:dev`로 만든 **릴리스형 APK**는 USB여도 번들 주소를 바꿀 수 없습니다.

### 0.1 폰 설정 (삼성 갤럭시)

1. **설정 → 휴대전화 정보 → 소프트웨어 정보**에서 **빌드 번호**를 7번 탭 → 개발자 옵션 켜기  
2. **설정 → 개발자 옵션**에서  
   - **USB 디버깅** 켜기  
   - (있으면) **USB 디버깅(보안 설정)** / **기본 USB 구성**은 **파일 전송(MTP)** 또는 **USB 테더링 안 함** 권장  
3. USB로 Mac에 연결 → **“이 컴퓨터의 RSA 지문 허용”** 확인

### 0.2 Mac 터미널

```bash
adb devices
# `device` 로만 나와야 함 (`unauthorized`면 폰에서 USB 디버깅 허용)

# 기기가 여러 대면 시리얼 지정 (예: 실기기만)
adb -s R3CY307TQGL reverse tcp:8081 tcp:8081

# 한 대만 연결됐으면
cd expo-app
npm run adb:reverse-metro
```

USB를 뺐다 꼽을 때마다 **`adb reverse`** 를 한 번 더 실행하는 것이 안전합니다.

### 0.3 Metro + 앱

```bash
cd expo-app
npm run start:localhost
```

앱(개발 빌드)을 폰에서 실행하면, `adb reverse` 덕분에 기기의 **`127.0.0.1:8081`** 이 Mac의 Metro로 연결됩니다.

### 0.4 개발 빌드 다시 깔기 (USB로)

```bash
cd expo-app
npx expo run:android --device
```

에뮬레이터와 실기기가 같이 잡히면 `--device` 대화형으로 고르거나, `ANDROID_SERIAL=R3CY307TQGL npx expo run:android --device` 처럼 시리얼을 지정합니다.

### 0.5 실기기 + 에뮬레이터 **병행** (Metro 하나로 둘 다)

- **Metro는 PC에서 한 번만** 띄웁니다 (`npm run start:localhost` 등).
- **기기마다** 포트 포워딩이 따로 필요합니다. 둘 다 `adb devices`에 `device`로 보이면:

```bash
cd expo-app
npm run adb:reverse-metro:all
```

내부적으로 `R3CY307TQGL`, `emulator-5554` 등 **연결된 모든 기기**에 `adb -s <시리얼> reverse tcp:8081 tcp:8081`을 순서대로 실행합니다.

- USB를 뺐다 꼽거나 에뮬을 재시작한 뒤에는 **`adb:reverse-metro:all`을 다시** 실행하는 것이 좋습니다.
- **앱 설치**는 기기별로 한 번씩 하면 됩니다. 예:

```bash
ANDROID_SERIAL=R3CY307TQGL npx expo run:android --device
ANDROID_SERIAL=emulator-5554 npx expo run:android --device
```

(이미 둘 다 개발 빌드가 깔려 있으면 Metro만 켜고 앱만 열어도 됩니다.)

### 0.6 Metro 없이 동작하는 APK (릴리스 번들 내장)

**목표:** PC에서 `expo start`를 켜지 않아도 앱이 바로 뜨고, “개발 서버 URL 입력” 화면에 멈추지 않게 합니다.

1. **네이티브 트리를 dev client 없이 다시 생성**해야 합니다. `expo-dev-client`가 한 번이라도 prebuild에 포함된 `android/` 폴더만 두고 `./gradlew assembleRelease`만 돌리면, **옛날 네이티브 설정이 남아** 여전히 Metro·URL 화면을 요구할 수 있습니다.  
   - **권장 한 줄:** 저장소 루트에서 `cd expo-app` 후 **`npm run android:apk:dev`** 또는 동일 파이프라인 별칭 **`npm run android:apk:standalone`** (`EXPO_USE_DEV_CLIENT=0` + `expo prebuild --platform android --clean` + `assembleRelease`).  
   - `app.config.ts` 주석과 같이, **`EXPO_USE_DEV_CLIENT=0`** 이면 prebuild 시 `expo-dev-client` 플러그인이 빠지고, 릴리스 APK는 **빌드 시점에 JS 번들이 embed** 되는 설정(`export:embed`)을 따릅니다.

2. **디버그 설치물과 구분:** `npx expo run:android`로 깔린 **디버그 빌드**는 Metro에 붙는 것이 정상입니다. Metro 없이 쓰려면 위 스크립트로 만든 **release APK**를 `adb install` 등으로 설치하세요.

3. **API 주소:** `android:apk:standalone` / `android:apk:dev` 스크립트는 빌드 시 `EXPO_PUBLIC_API_BASE_URL`을 박아 둡니다. 다른 환경용 APK가 필요하면 해당 스크립트를 복제해 URL만 바꾸거나, 동일 env를 셸에서 덮어쓴 뒤 같은 prebuild + `assembleRelease` 흐름을 따르세요.

---

## 1. Metro(자바스크립트) — Wi-Fi

PC와 휴대폰이 **같은 Wi-Fi**에 있어야 합니다. 회사 VPN이 켜져 있으면 끄거나, VPN이 LAN을 가리는지 확인하세요.

### 1.1 LAN으로 Metro

Metro가 **LAN IP**로 뜨도록 시작합니다.

```bash
cd expo-app
npm run dev:metro-url
npm run start:lan
```

위 첫 줄은 이 PC의 `http://<IP>:8081`을 출력합니다. 둘째 줄이 Metro를 LAN 모드로 띄웁니다.

**주의:** `package.json`의 `"scripts"` 값에 `… # 설명`처럼 **`#` 주석을 넣지 마세요.** Expo가 프로젝트 경로를 `…/expo-app/#`처럼 잘못 읽어 `Invalid project root`가 날 수 있습니다. 터미널에도 `npm run start:lan` **한 줄만** 입력하세요. (`start:*` 스크립트는 내부적으로 `scripts/run-expo.js`로 Expo CLI를 호출합니다.)

그다음 **실기기**에서:

- Android: 흔들기(또는 `adb shell input keyevent 82`) → **Change bundle location** / **Debug server host & port for device** → 위에서 출력된 `http://<PC의 LAN IP>:8081` 형태로 설정  
- iOS: 개발자 메뉴에서 동일하게 번들러 주소를 LAN IP로 지정 (Expo Go / Dev Client 문서 참고)

**막힐 때**

- macOS **방화벽**에서 Node / 터미널 앱에 **수신 허용** (포트 8081).
- `npm run start:tunnel` — 같은 Wi-Fi가 아니거나 LAN이 막혀 있을 때(느릴 수 있음).

로컬 루프백만 쓰려면(시뮬레이터·USB `adb reverse` 등) 기존 `npm run start:localhost`를 사용합니다.

### `Invalid project root: …/expo-app/#`

`package.json`의 `start:lan` / `dev:metro-url` 등에 **`#`로 시작하는 셸 주석**을 붙여 저장했거나, Expo에 `#`가 인자로 넘어간 경우입니다. 해당 스크립트 값은 **따옴표 안에 명령만** 두세요.

- 올바름: `"start:lan": "node ./scripts/run-expo.js start --lan"` (저장소 기본값)
- 잘못됨: `"start:lan": "expo start --lan # Wi-Fi용 Metro"` (`#` 포함)

## 2. Android — 무선 디버깅(ADB, 네이티브 설치·로그)

Android 11 이상에서는 **설정 → 개발자 옵션 → 무선 디버깅**에서 페어링 후, PC에서:

```bash
adb pair <휴대폰에 표시된 IP:포트>
adb connect <휴대폰 IP:5555>   # 무선 디버깅 화면에 표시된 주소 사용
adb devices
```

이후 `adb install`, `adb logcat`, `npx expo run:android` 등을 USB 없이 사용할 수 있습니다.

(구형 방식) USB로 한 번 연결한 뒤:

```bash
adb tcpip 5555
adb connect <휴대폰 Wi-Fi IP>:5555
```

## 3. iOS — 실기기와 같은 네트워크

Xcode로 설치한 개발 빌드는 PC의 Metro에 붙을 때 **같은 Wi-Fi + LAN 번들 URL**이 필요한 경우가 많습니다. `npm run start:lan`과 위 1절과 동일한 방식으로 번들 주소를 맞춥니다.

시뮬레이터만 쓸 때는 `npm run start:localhost`가 단순합니다.

## 4. 프로젝트 npm 스크립트 요약

| 스크립트 | 설명 |
|-----------|------|
| `npm run start:lan` | Metro를 LAN에 바인딩 (Wi-Fi 실기기 디버깅) |
| `npm run start:tunnel` | Expo 터널 (다른 네트워크·방화벽 우회) |
| `npm run start:localhost` | localhost 전용 (시뮬레이터·**USB `adb reverse` 후** 실기기) |
| `npm run adb:reverse-metro` | `adb reverse tcp:8081 tcp:8081` (기기 **한 대**만 연결됐을 때) |
| `npm run adb:reverse-metro:all` | 연결된 **모든** 기기(실기기+에뮬)에 reverse 적용 |
| `npm run dev:metro-url` | 이 머신의 `http://<IP>:8081` 안내 출력 |
| `npm run android:apk:standalone` | Metro 없이 쓰는 **릴리스 APK** 빌드 (`EXPO_USE_DEV_CLIENT=0` prebuild + `assembleRelease`) |
