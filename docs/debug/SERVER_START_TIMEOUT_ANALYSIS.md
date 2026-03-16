# 서버 시작 타임아웃 및 "Run Command Timeout" 분석

**문서 유형**: 디버그·원인 분석  
**관련**: `deploy-backend-dev.yml` 서비스 시작 단계, ANTLR 기동 실패

---

## 증상

- CI 로그: "🚀 서비스 시작 중...", "⏳ 서비스 시작 대기 중..." 후 **Run Command Timeout** 또는 **Process completed with exit code 1**
- 사용자 인지: "서버 빌드 오류"

---

## 원인 요약

1. **앱 기동 실패(ANTLR)**  
   - 배포된 JAR가 ANTLR 4.10.1 vs 4.13.0 불일치로 기동 직후 종료(exit 1).  
   - 상세: [PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md](./PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md) 2절 참고.

2. **헬스체크 대기 90초**  
   - 워크플로는 `systemctl start mindgarden-dev.service` 후 최대 90초 동안 `curl http://localhost:8080/actuator/health` 성공을 대기.  
   - 앱이 크래시하면 헬스체크가 절대 성공하지 않아 90초 전부 대기 후 실패 처리.

3. **Run Command Timeout**  
   - 서비스 시작을 수행하는 SSH 스텝에 `command_timeout: 5m` 설정됨.  
   - 90초 대기 + 상태 확인 + (실패 시) 롤백 + journalctl 출력까지 포함해 5분을 넘기면 해당 스텝이 "Run Command Timeout"으로 종료됨.

4. **exit code 1**  
   - 서비스가 기동되지 않으면 스크립트가 `journalctl` 출력 후 `exit 1`로 종료.  
   - "서버 빌드 오류"로 인지되는 경우는, 실제로는 **빌드가 아니라 서버에서의 앱 기동 실패**인 경우가 많음.

---

## 대응

| 구분 | 조치 |
|------|------|
| **근본** | ANTLR 버전 통일(pom.xml antlr4 4.13.0)이 반영된 JAR로 재배포. 배포 파이프라인이 수정된 pom으로 빌드한 JAR를 사용하는지 확인. |
| **타임아웃** | 서비스 시작 SSH 스텝의 `command_timeout`을 5m → 10m 등으로 확대하여, 대기·롤백·로그 출력이 5분 안에 끝나지 않아도 Run Command Timeout이 나지 않도록 함. |
| **로그** | 실패 시 90초 대기 직후 곧바로 `journalctl -u mindgarden-dev.service -n 100` 출력하도록 되어 있음. 이 로그에서 ANTLR 관련 스택트레이스 확인. |

---

## 관련 파일

- `.github/workflows/deploy-backend-dev.yml` — 서비스 중지/시작, 90초 대기, `command_timeout`, 실패 시 journalctl
- `pom.xml` — antlr4 / antlr4-runtime 버전
- `docs/debug/PROCEDURE_DEPLOY_AND_BUILD_ERROR_ANALYSIS.md` — ANTLR 상세 분석
