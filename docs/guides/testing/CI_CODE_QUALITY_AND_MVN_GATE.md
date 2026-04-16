# CI 코드 품질·Maven 테스트 게이트

## `mvn test`와 Job 실패

[`.github/workflows/code-quality-check.yml`](../../../.github/workflows/code-quality-check.yml)의 **테스트 실행** 단계에서는 `mvn test -Dspring.profiles.active=test`를 실행하며, **`|| true` 등으로 성공만 강제하지 않습니다.** 따라서 테스트가 실패하면 해당 단계가 비정상 종료되고, **job 전체가 실패**합니다.

## 로컬에서 CI와 동일하게 검증

PR 전에 아래와 같이 실행하는 것을 권장합니다.

```bash
set -o pipefail
mvn test -Dspring.profiles.active=test
```

- **프로필**: CI와 동일하게 `test` 프로필을 지정합니다.
- **`set -o pipefail`**: 파이프(`|`)로 연결된 명령 중 하나라도 실패하면 전체 실패로 처리해, 로컬에서도 실패를 놓치지 않기 쉽습니다.

## Checkstyle·SpotBugs (현재 워크플로)

- **현재**: [`.github/workflows/code-quality-check.yml`](../../../.github/workflows/code-quality-check.yml)에서 Checkstyle·SpotBugs 단계는 **`|| true`가 붙어 있어**, 위반만으로는 **job이 실패하지 않습니다.** (레거시 코드베이스의 대량 위반을 한 번에 게이트로 걸리면 CI가 항상 빨간색이 되기 때문입니다.)
- **권장**: 변경한 모듈·패키지에 대해 로컬에서 `mvn checkstyle:check` / `mvn spotbugs:check`를 돌려 **새 위반을 만들지 않는 것**을 PR 리뷰에서 권장합니다.
- **엄격 게이트로 전환**은 별도 에픽에서 위반 건수를 줄인 뒤 워크플로에서 `|| true`를 제거하는 방식으로 진행합니다.

**구분**: **코드 품질 메트릭 수집·리포트 생성** Node 단계도 `|| true`일 수 있으며, **`mvn test` 단계는 `|| true` 없이** 실패 시 job 실패입니다.

## PR 전 체크리스트

- [ ] `set -o pipefail` 후 `mvn test -Dspring.profiles.active=test`가 로컬에서 통과하는가
- [ ] (권장) 변경한 Java 경로에 대해 `mvn checkstyle:check` / `mvn spotbugs:check` 결과를 확인했는가(전체는 레거시 위반 다수 가능)
- [ ] 변경 범위에 맞는 단위·통합 테스트를 추가하거나 수정했는가
- [ ] 하드코딩 검사·프론트 정적 검증 등 CI의 다른 필수 단계와 충돌이 없는가
- [ ] 테스트 데이터에 고정된 운영 ID·비밀값을 넣지 않았는가
- [ ] 멀티테넌트 관련 시나리오에서 `tenantId` 누락이 없는가
- [ ] 실패한 테스트를 `|| true`나 `@Disabled`로 우회하지 않았는가
- [ ] 필요 시 관련 문서(`docs/standards/TESTING_STANDARD.md` 등)와 정책을 확인했는가
