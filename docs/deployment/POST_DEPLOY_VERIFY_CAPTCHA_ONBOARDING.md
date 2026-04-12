# 운영 배포 후 확인 — CAPTCHA·공개 온보딩

**목적**: 온보딩·Turnstile(CAPTCHA) 관련 변경을 운영에 반영한 뒤 **확인 순서**를 짧게 고정한다. **비밀값·시크릿·토큰·키 값 예시는 문서에 적지 않는다.**

**관련**: [SEC-01 공개 온보딩 — 엣지·운영 역할 분리](./SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md) · Trinity 운영 배포 워크플로 [`.github/workflows/deploy-trinity-prod.yml`](../../.github/workflows/deploy-trinity-prod.yml)

---

## 1. 확인 순서 (고정)

| 순서 | 확인 내용 |
|------|-----------|
| **1** | **GitHub Actions**: 해당 배포 워크플로 실행이 **성공(녹색)** 인지 확인한다. 실패 시 로그·아티팩트로 원인을 본 뒤 재실행하거나 수정 배포한다. |
| **2** | **서버 프로세스·정적 반영**: **코어 백엔드(JAR)** 배포를 포함했다면, 해당 호스트에서 애플리케이션 서비스가 **기대대로 기동·재시작** 되었는지 확인한다(워크플로가 `systemctl` 등으로 처리하는 경우 그 완료를 신뢰하되, **환경 변수·설정 변경**이 있었다면 재시작 없이는 반영되지 않을 수 있다). **Trinity 정적 프론트만** 배포한 경우, [`.github/workflows/deploy-trinity-prod.yml`](../../.github/workflows/deploy-trinity-prod.yml) → 재사용 배포에서 **파일 반영·nginx 검증·헬스 URL 요청**까지 수행되는 것이 통상 경로이며, 별도 JVM 재시작은 없다. |
| **3** | **선택 — 헬스·엔드포인트**: 운영에서 허용하는 범위에서 **로컬 액추에이터 헬스**(`http://localhost:8080/actuator/health` 등) 또는 **공개 URL**로 응답만 확인할 수 있다. 구체 URL·호스트는 운영 표준과 워크플로 `health_urls` 정의를 따른다(값·쿼리에 시크릿을 넣지 않는다). |

---

## 2. 설정 이름만 (값·예시 금지)

### 백엔드 (Turnstile 검증)

| 종류 | 이름 (참고만) |
|------|----------------|
| 환경 변수 | `MINDGARDEN_CAPTCHA_SECRET_KEY`, `MINDGARDEN_CAPTCHA_SITE_KEY` |
| 설정 프로퍼티 | `mindgarden.security.captcha.enabled`, `mindgarden.security.captcha.secret-key`, `mindgarden.security.captcha.site-key` (실제 바인딩은 `application.yml`·프로파일·보안 설정 클래스 기준) |

구체 조합은 [SEC-01 문서](./SEC01_PUBLIC_ONBOARDING_EDGE_AND_OPS.md) 및 저장소 `application.yml`을 따른다.

### Trinity(빌드 시 주입되는 공개 키 이름)

| 이름 (참고만) |
|----------------|
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` |

빌드·CI에서 다른 `NEXT_PUBLIC_*` 또는 저장소 시크릿 이름이 붙는 경우는 [`.github/workflows/deploy-trinity-prod.yml`](../../.github/workflows/deploy-trinity-prod.yml) 주석·`env` 블록을 따른다. **저장소 GitHub Secrets 값은 문서나 커밋에 평문으로 넣지 않는다.**

---

## 3. 스모크 (한 줄)

**공개 온보딩 페이지**에서 Turnstile 위젯이 보이는지 확인한다. **백엔드 시크릿·사이트 키·프론트 빌드 타임 키가 기대대로 없으면** 위젯이 **표시되지 않거나** 검증이 동작하지 않을 수 있으므로, 그 경우는 설정·배포 범위를 먼저 맞춘 뒤 다시 본다.

---

## 4. 운영 게이트 (참고)

- [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)
- [`docs/standards/DEPLOYMENT_STANDARD.md`](../standards/DEPLOYMENT_STANDARD.md)

**최종 업데이트**: 2026-04-12
