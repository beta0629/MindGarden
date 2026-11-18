# 히어로 나비 v1.3 — 구현 메모 (홈페이지 리뉴얼 봇 전달용)

작성: 앱웹 디자인 · 2026-11-11 (KST) · 재학 확정 16:02, 16:04 꽃 화단 변경 반영
상태: **시안/에셋만. 게시·배포 전 재학 확인 필요.**

## 1. 파일
| 파일 | 용도 | 크기 | 비고 |
|---|---|---|---|
| `web/hero-butterfly.glb` | 데스크톱 3D(틸트) | 202 KB (202,336 B) | Draco(KHR_draco_mesh_compression, 필수 확장), 날개 텍스처 JPEG 1024×766 1장, 나머지 단색 재질 |
| `motion/hero-loop.mp4` | 모바일 루프 + 데스크톱 폴백 | 246 KB (245,716 B) | H.264 High, 1080×626, 30fps, 무음 |
| `motion/hero-loop.webm` | 위와 동일(VP9) | 99 KB (98,798 B) | 1080×626, 30fps, 무음 |
| `motion/hero-poster.webp` / `.png` | 포스터·reduced-motion 정지 | 36 KB / 625 KB | 1620×940(2x). 1x는 `hero-poster-1080.webp` |
| `motion/hero-preview-v1.3.mp4` | 리뷰용(3사이클 15초) | 1.5 MB | 배포용 아님 |

- mp4 루프 이음매: 0f(I프레임)와 149f 사이 날개 외곽선 선명도 차이가 아주 약간 있음(x264 특성, 2배 확대해야 보임). webm은 이음매 차이 거의 0 → `<source>` 순서 webm 먼저.
- 영상 배경은 **샌드 #EAE2D2로 구워져 있음**(투명 아님). 히어로 패널 배경도 `#EAE2D2`로 맞추면 경계가 안 보입니다. (VP9 알파는 Safari에서 검게 나올 수 있어 일부러 제외.)
- 패널 비율 81:47 (1440 기준 810×470). 영상·포스터·glb 카메라 모두 이 비율 기준. 모바일은 `object-fit: cover; object-position: 50% 60%`.

## 2. 루프 / 애니메이션
- glTF 애니메이션 클립 1개: **`WingFold`**, 길이 **5.0초**(150f @30fps), 채널 2개(WingL_pivot, WingR_pivot 회전).
- 각도: 펼침 9° ↔ 접힘 60°(몸통 축 기준 각 날개), **사인 ease-in-out** `a(t)=9°+51°·(1−cos(2πt/5))/2`. 0초 = 5초 프레임 동일 → 이음매 없음.
- 바운스·부유·반짝임 없음. 꽃 화단·몸통은 정지.
- 영상도 동일 곡선(0→75f 렌더 후 역재생 74→1f 이어붙임, 150f).
- 꽃 화단은 **glb 안의 별도 정적 메시**(`FlowerBed` 그룹: 꽃 23개+잎 16장, 단색 무광 재질)입니다. 포스터·영상에도 같은 메시가 렌더돼 있어 세 결과물이 일치합니다.

## 3. 데스크톱: 틸트 3D (three.js 권장)
- 최대 기울기 **7°**(x·y 각각, 범위 6~8° 내), 마우스 위치(패널 기준 −1..1) → 목표각, **댐핑** `cur += (target−cur)·(1−exp(−dt·4))` (≈0.25s 시정수). 스크롤 연동 시 패널 진입 진행도 0..1 → x축 −3°..+3°(합산 후 7° 클램프).
- 마우스가 패널을 벗어나면 목표각 0으로 천천히 복귀.
- 렌더 세팅(블렌더 시안과 색 맞춘 값):
  - `renderer.toneMapping = THREE.NeutralToneMapping`, exposure 0.95, `outputColorSpace = SRGB`
  - `RoomEnvironment` PMREM, `scene.environmentIntensity = 0.9`
  - HemisphereLight(0xfff7ee, 0xd9cfbd, 0.6) + DirectionalLight(0xfff3e6, 1.6) 위치 (−1.2, 3.4, 0.6), 그림자 1024, 바닥은 `ShadowMaterial({opacity:0.16})`
  - 카메라 PerspectiveCamera(fov 30, aspect 81/47) 위치 (0.12, 1.5, 1.95), lookAt (0, 0.15, 0.06)
- DRACOLoader 필요(`three/examples/jsm/libs/draco/gltf/`).
- `devicePixelRatio`는 최대 2로 제한, 패널이 화면 밖이면 렌더 루프 정지(IntersectionObserver), 탭 숨김 시 정지.

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
export async function mountHero(panel) {
  if (reduce.matches || !desktop.matches) return;           // 포스터/영상 그대로 둠
  const canvas = panel.querySelector('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;
  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xd9cfbd, 0.6));
  const key = new THREE.DirectionalLight(0xfff3e6, 1.6); key.position.set(-1.2, 3.4, 0.6);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5 }); scene.add(key);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const cam = new THREE.PerspectiveCamera(30, 81 / 47, 0.1, 50); cam.position.set(0.12, 1.5, 1.95); cam.lookAt(0, 0.15, 0.06);
  const draco = new DRACOLoader().setDecoderPath('/vendor/draco/gltf/');
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('/assets/hero/hero-butterfly.glb');
  gltf.scene.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const tilt = new THREE.Group(); tilt.add(gltf.scene); scene.add(tilt);
  const mixer = new THREE.AnimationMixer(gltf.scene);
  mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations, 'WingFold')).play(); // LoopRepeat 기본
  const MAX = THREE.MathUtils.degToRad(7); let tx = 0, ty = 0, cx = 0, cy = 0;
  panel.addEventListener('pointermove', e => { const r = panel.getBoundingClientRect();
    ty = ((e.clientX - r.left) / r.width * 2 - 1) * MAX; tx = ((e.clientY - r.top) / r.height * 2 - 1) * MAX * 0.6; });
  panel.addEventListener('pointerleave', () => { tx = ty = 0; });
  const size = () => { const { width, height } = panel.getBoundingClientRect(); renderer.setSize(width, height, false); cam.aspect = width / height; cam.updateProjectionMatrix(); };
  size(); new ResizeObserver(size).observe(panel);
  let visible = true; new IntersectionObserver(([en]) => visible = en.isIntersecting).observe(panel);
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => { const dt = Math.min(clock.getDelta(), 0.1); if (!visible || document.hidden) return;
    const k = 1 - Math.exp(-dt * 4); cx += (tx - cx) * k; cy += (ty - cy) * k;
    tilt.rotation.set(THREE.MathUtils.clamp(cx, -MAX, MAX), THREE.MathUtils.clamp(cy, -MAX, MAX), 0);
    mixer.update(dt); renderer.render(scene, cam); });
  panel.classList.add('is-3d');                               // 3D 준비되면 포스터 숨김
  reduce.addEventListener('change', e => { if (e.matches) { renderer.setAnimationLoop(null); panel.classList.remove('is-3d'); } });
}
```
- model-viewer 대안(간단 버전): `<model-viewer src="hero-butterfly.glb" autoplay animation-name="WingFold" camera-orbit="4deg 52deg auto" disable-zoom disable-pan interaction-prompt="none" shadow-intensity="0.5" tone-mapping="neutral" exposure="0.95" poster="hero-poster.webp">`. 틸트는 pointermove에서 `camera-orbit` 방위·고도를 ±7° 안에서 갱신(`interpolation-decay="200"`이 댐핑 역할). Draco 디코더는 model-viewer가 자체 로드.

## 4. 모바일 / 태블릿 / reduced-motion
- 모바일(<1024px 또는 터치): **glb 안 씀**. 영상 루프만.
```html
<div class="hero-media">
  <video class="hero-loop" autoplay muted loop playsinline preload="metadata" poster="/assets/hero/hero-poster.webp" aria-hidden="true">
    <source src="/assets/hero/hero-loop.webm" type="video/webm">
    <source src="/assets/hero/hero-loop.mp4" type="video/mp4">
  </video>
  <img class="hero-still" src="/assets/hero/hero-poster.webp" alt="" width="1620" height="940">
  <canvas class="hero-3d" aria-hidden="true"></canvas>
</div>
```
```css
.hero-media{background:#EAE2D2;aspect-ratio:81/47;position:relative;overflow:hidden}
.hero-media>*{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 60%}
.hero-still,.hero-3d{display:none}
.hero-media.is-3d .hero-loop{display:none}.hero-media.is-3d .hero-3d{display:block}
@media (prefers-reduced-motion: reduce){.hero-loop,.hero-3d{display:none!important}.hero-still{display:block}}
```
- JS에서도 `prefers-reduced-motion: reduce`면 `video.pause()` + 소스 제거(데이터 절약), 3D 마운트 안 함. 설정 변경 이벤트 처리.
- 장식 이미지라 `alt=""`/`aria-hidden`. 의미 텍스트는 H1·부제에 있음. 영상 자동재생 5초 초과 루프 → WCAG 2.2.2 대응으로 **정지 버튼(일시정지/재생 토글, 44×44, 패널 우하단)** 추가 권장.
- 데이터 절약(`navigator.connection.saveData`)이면 포스터만.

## 5. 확인 필요 / 한계
- 디자인 원칙상 무한 루프는 지양이지만 **재학 명시 요청**이라 적용. 정지 버튼 + reduced-motion으로 보완.
- glb 웹 렌더는 three.js(헤드리스 크로미움)에서 로드·애니메이션 재생 확인함. 조명 값에 따라 색이 달라지니 위 값 유지 권장.
- 서브페이지·관리자·모바일 시안은 계속 보류 상태.

---
## 부록 A — 카메라 오빗 + 줌 변형 (재학 요청 16:43 / 16:47, 시안 단계)
- 영상: `motion/orbit/hero-orbit-loop.webm`, `hero-orbit-loop.mp4` (960×556, 30fps, 무음, 샌드 #EAE2D2 배경), 리뷰용 `orbit-preview.mp4`(2바퀴 30초). 원본 씬 `blender/hero-butterfly-v1.3-orbit.blend`.
- 루프 **15.0초**(450f): 카메라 360° 한 바퀴(24°/s, 등속) = 날개 접기 3사이클(5s×3) = 줌 1사이클 → 이음매 없음.
- 줌: 초점거리 38mm → 43.7mm(**+15%**) → 38mm, 사인 ease-in-out `lens(t)=38·(1+0.15·(1−cos(2πt/15))/2)`. 가장 가까운 시점 = 7.5초(뒤쪽 180° 부근, 화단이 가장 얕게 보이는 각도). 모든 각도에서 프레임 여백 최소 약 6% 확인(잘림 없음).
- 조명은 카메라와 함께 회전(턴테이블 방식) → 어느 각도든 같은 무광 톤. 그림자 농도는 v1.3과 동일(변경 보류 중).
- **데스크톱 라이브 버전은 추가 에셋 없이 기존 `web/hero-butterfly.glb`로 가능**:
  - 카메라를 화단 중심 (0, 0, 0.04)[glTF 좌표] 둘레로 천천히 자동 회전: 방위각 `θ += dt·(2π/15)`(15초 1바퀴), 고도는 고정(카메라 높이 1.95, 반경 2.6 → 약 37°).
  - 줌 = **카메라 반경 이징**: `r(t) = 2.6 / (1 + 0.15·(1−cos(2πt/15))/2)` (가장 가까울 때 ≈2.26), 또는 `camera.fov`/`zoom`을 같은 곡선으로. `lookAt(0, -0.1, 0.04)` 유지.
  - 회전은 WingFold 클립(5s)과 같은 시계(`clock`)로 돌리면 15초마다 자연히 맞물림.
  - **hover 시 일시정지**(pointerenter → 각속도를 0으로 0.6s 감속, pointerleave → 다시 가속; 툭 멈추지 않게), 탭 숨김·화면 밖이면 정지, `prefers-reduced-motion: reduce`면 오빗·줌·날개 모두 끄고 포스터.
  - 틸트(±7°)와 함께 쓸 경우 틸트는 오빗 리그 위에 더하되 hover 중에만 적용 권장(동시에 두 가지가 움직이면 산만함).
  - model-viewer: `auto-rotate auto-rotate-delay="0" rotation-per-second="24deg"` + JS로 `camera-orbit`의 반경을 위 곡선으로 갱신, hover 시 `auto-rotate` 해제.
- 확인 필요: 오빗 영상은 15초라 정지 컨트롤(WCAG 2.2.2) 필수. 기본 히어로(고정 시점 v1.3)와 오빗 중 어느 쪽을 쓸지는 재학 결정 대기.

## Addendum B — 회전 속도 정정 (2026-11-11 17:22 재학)
- 실제 구현에서는 더 천천히 돈다. 1바퀴 **30초**(12°/s, 미리보기 15초의 절반 속도).
- 줌(카메라 반경 2.6 → 약 2.26 → 2.6, sine ease-in-out)도 30초 주기로 1회, 회전과 같은 박자.
- 날개 WingFold 5초 루프는 그대로(1바퀴 = 6회). 30은 5의 배수라 처음으로 돌아갈 때 끊기지 않는다.
- three.js: `controls.autoRotateSpeed`를 쓰면 1바퀴 30초 = autoRotateSpeed 2.0(60fps 기준) 또는 직접 `angle += (2π/30) * dt`.
- model-viewer: `rotation-per-second="12deg"`.
- 영상 대체본(hero-orbit-loop.*)은 15초 버전이다. 영상이 필요하면 30초로 다시 렌더한다(미정).
- hover 시 감속 정지, reduced-motion 시 포스터 정지, 일시정지 버튼(WCAG 2.2.2)은 Addendum A와 같다.
