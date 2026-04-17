# Trinity (`frontend-trinity`) npm audit 스냅샷

**목적**: `frontend-trinity` 의존성 취약점 현황을 기록한다. **자동 `npm audit fix`는 실행하지 않았다.** 수정·업그레이드는 **별도 PR·검토** 후 진행한다.

| 항목 | 값 |
|------|-----|
| 기록일 | 2026-04-12 |
| 명령 | `cd frontend-trinity && npm audit` (참고: `npm audit --json`) |
| `package-lock.json` | 이 문서 작성 시 **의도적으로 변경하지 않음** |

## 요약 (npm `metadata.vulnerabilities`)

| 심각도 | 개수 |
|--------|------|
| critical | **0** |
| high | **7** |
| moderate | 2 |
| low | 4 |
| **total** | 13 |

## high / critical 상세 (패키지·버전 수준)

**critical**: 없음.

**high** (감사 트리에 표시된 항목 요약):

| 패키지 | 비고 |
|--------|------|
| `next` | 직접 의존성 **14.2.33** — 감사상 일부 DoS·RSC 관련 권고 범위에 포함. `fixAvailable` 예: **14.2.35** (동일 메이저) |
| `eslint-config-next` | 직접 의존성 **14.2.33** — `@next/eslint-plugin-next` 경유. `fixAvailable` 예: **16.2.3** (메이저 업) |
| `@next/eslint-plugin-next` | `glob` 등 전이 |
| `glob` | `eslint-config-next` 체인과 연관; `fixAvailable`이 `eslint-config-next` 쪽으로 제시됨 |
| `flatted` | 전이; `fixAvailable: true` |
| `minimatch` | 전이; `fixAvailable: true` |
| `picomatch` | 전이; `fixAvailable: true` |

> 상세 CVE·GHSA 본문은 `npm audit` 출력 또는 [GitHub Advisory Database](https://github.com/advisories)에서 패키지명으로 조회한다.

## 재실행 방법

```bash
cd frontend-trinity && npm audit
```

---

*이 파일은 보고용 스냅샷이다. 의존성 정책·업그레이드 결정은 팀 검토·별도 PR로 진행한다.*
