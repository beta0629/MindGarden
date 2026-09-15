# 배포 덮어쓰기 금지 게이트 (IL SSOT · 일지 · 카드 일정)

**상태**: 필수 (PROD / SSH / Actions 컷오버 전)  
**관련**: `/core-solution-deployment` 스킬 「배포 덮어쓰기 금지」, [DEPLOYMENT_STANDARD.md](../standards/DEPLOYMENT_STANDARD.md), [PRE_PRODUCTION_GO_LIVE_CHECKLIST.md](../운영반영/PRE_PRODUCTION_GO_LIVE_CHECKLIST.md)

## 왜 필요한가

기능 브랜치 **부분 tip**만으로 `/var/www/mindgarden/frontend` 또는 JAR를 통째 교체하면, 이미 반영된 **기관연계(IL) 일지 SSOT·모달 헬퍼·카드 일정**이 사라진다.  
**부분 tip 단독 배포는 금지**한다. 심볼 게이트를 통과한 **통합 tip 한 번**만 FE+JAR를 올린다.

## 필수 체크리스트 (하나라도 없으면 배포 중단)

### JAR (백엔드)

- [ ] `ConsultationLogExistenceSsot` (+ Impl)
- [ ] `InstitutionLinkConsultationLogController` (`/api/v1/institution-link/consultation-records`)

### FE 번들 / 소스

- [ ] `frontend/src/utils/consultationLogInstitutionContext.js` — `institution-link/consultation-records` 및 `_institutionLinkLog`
- [ ] `ConsultationLogModal` 등 모달 경로의 `_institutionLinkLog` 분기
- [ ] (권장·가능하면 필수) `CardBillingProgress` + `consultationSchedules` enrich

### 금지

- [ ] **카드-only tip** (`cf9a5138` 계열 등) **단독 PROD 컷오버**
- [ ] 위 심볼이 없는 feature tip으로 SSH/Actions 배포

## 스크립트

```bash
# tip checkout 기준 (배포 직전)
./scripts/deployment/check-deploy-no-overwrite-symbols.sh --source-root .

# 빌드 산출물 / 서버 경로까지 (선택)
./scripts/deployment/check-deploy-no-overwrite-symbols.sh \
  --source-root . \
  --jar target/mindgarden-*.jar \
  --fe-dir /var/www/mindgarden/frontend
```

실패(exit 1) 시 **배포를 중단**한다.

## 권장 tip 순서 (한 번만 컷오버)

`#1023` / `cursor/fix-prod-log-register-guard-7f13`(= 카드 + IL SSOT 통합) **위에** 가예약 일지(`cursor/fix-provisional-log-write-7f13`)를 rebase한 뒤, **한 번만** FE(`/var/www/mindgarden/frontend`) + JAR를 반영한다.  
가예약 핫픽스가 RUNNING이면 그 파이프라인은 건드리지 않는다. PROD 재배포·새 기능 컷오버는 본 게이트 통과 tip으로만 한다.

## 사고 메모

- 카드 단독 번들/팁이 운영을 덮어 IL 일지·SSOT·카드 일정이 회귀한 사례가 있다 → **통합 스택이 아닌 단독 빌드 덮어쓰기 금지**.
