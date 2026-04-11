# SEC-01: 공개 온보딩 — 엣지·운영 역할 분리

**목적**: 공개 온보딩·공개 API에 대한 **애플리케이션 레이트리밋**과 **Nginx 엣지 이중화**의 요지, CAPTCHA·Trinity(프론트) 관점, **인프라 전담 항목**을 한 곳에 정리한다. 상세 Nginx 패턴·예시는 아래 링크를 따른다.

**범위**: 운영 절차의 역할 구분·저장소 문서 연계. 비밀값·시크릿이 포함된 URL·환경 변수 **값**은 문서에 적지 않는다.

---

## 이중 방어: 앱 + 엣지(Nginx)

| 층 | 역할 (요지) |
|----|-------------|
| **앱** | Spring Security·필터 등으로 IP 기준 상한·429, 필요 시 Micrometer 메트릭 |
| **엣지** | 동일·우선 경로에 Nginx `limit_req` 등으로 **추가 상한** (엣지에서 먼저 걸러질 수 있음) |

- **상세·`limit_req_zone` / `location` 예시**: [`NGINX_RATE_LIMIT_PUBLIC_API.md`](./NGINX_RATE_LIMIT_PUBLIC_API.md)
- **개발 서버 Nginx 설정 배포(GitHub Actions)**: [`.github/workflows/deploy-nginx-dev.yml`](../../.github/workflows/deploy-nginx-dev.yml) — `config/nginx/**` 변경 시 `develop` 푸시 또는 수동 `workflow_dispatch` 로 연계됨(저장소 `on:` 이 최종 근거).

---

## CAPTCHA (백엔드 설정 키만)

운영·개발에서 Turnstile 등 검증을 켜려면 **환경 변수** `MINDGARDEN_CAPTCHA_*` 와 **설정 프로퍼티** `mindgarden.security.captcha.*` 를 사용한다.  
구체 키 이름·프로파일별 조합은 `application.yml` 및 보안 설정 클래스를 따른다. **시크릿·사이트키·시크릿 키 값은 본 문서에 예시로 적지 않는다.**

---

## Trinity(프론트): 콜백과 CAPTCHA 토큰

OAuth 등 **콜백 경로**로 돌아온 뒤 온보딩 요청을 이어갈 때, CAPTCHA 토큰은 **sessionStorage** 등 브라우저 저장소로 전달하는 방식으로 구현할 수 있다(구현 세부는 `frontend-trinity` 코드 기준).

**운영 반영 후 확인** 시에는 엣지·WAF·CAPTCHA·리다이렉트가 한꺼번에 개입하므로, **온보딩 플로 전체 스모크**(공개 페이지 → 인증/콜백 → 제출)를 권장한다.

---

## 인프라 담당 (본 저장소 문서 범위 밖)

아래는 **인프라·플랫폼 담당**에서 정책·절차·도구 저장소에 따라 수행한다. 애플리케이션 저장소만으로는 완결되지 않는다.

| 항목 | 비고 |
|------|------|
| **WAF** | 규칙·차단·로그는 클라우드/엣지 제품 측 |
| **Prometheus·알람** | 앱 메트릭(예: 레이트리밋 차단 카운터) 수집·대시보드·임계 알람은 인프라 측 정의 — [`NGINX_RATE_LIMIT_PUBLIC_API.md`](./NGINX_RATE_LIMIT_PUBLIC_API.md) 의 메트릭 절 참고 |
| **운영 Nginx reload** | `nginx -t`·`reload`·무중단 적용은 서버·배포 파이프라인별 절차(운영용 워크플로·수동 반영은 [`GITHUB_ACTIONS_WORKFLOW_INDEX.md`](./GITHUB_ACTIONS_WORKFLOW_INDEX.md) 등으로 확인) |

---

## 운영 게이트 (참고)

- [`docs/운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md`](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)
- [`docs/standards/DEPLOYMENT_STANDARD.md`](../standards/DEPLOYMENT_STANDARD.md)

**최종 업데이트**: 2026-04-11
