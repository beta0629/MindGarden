# 스킬 추가 검토 결과

**검토일**: 2026-02  
**목적**: 추가할 스킬이 있는지 검토하고, 필요 시 신규 스킬·기존 스킬 보강 반영

---

## 현재 스킬 목록 (18개)

| 스킬 | 용도 |
|------|------|
| core-solution-rules | 전체 룰 인덱스 |
| core-solution-backend | Java/Spring 백엔드 |
| core-solution-frontend | React/JS 프론트엔드 |
| core-solution-api | API 설계·연동 |
| core-solution-database-first | DB 설계·테이블·쿼리·프로시저 |
| core-solution-multi-tenant | tenantId 필수 |
| core-solution-erp | ERP 연동·트러블슈팅 |
| core-solution-business-flow | 비즈니스 흐름·UI 규칙 |
| core-solution-testing | 단위·통합·E2E·보안 테스트 |
| core-solution-debug | 에러·500 원인 분석·수정 제안 |
| core-solution-server-status | 서버 상태·에러 로그·긴급 복구 |
| core-solution-planning | 전반 기획·Phase·서브에이전트 가동 계획 |
| core-solution-documentation | 문서 작성·정리·체계화 |
| core-solution-standardization | 디자인·표준화 설계 |
| core-solution-atomic-design | 아토믹 디자인 |
| core-solution-design-system-css | 디자인 시스템 CSS |
| core-solution-unified-modal | 모달 추가·수정 |
| core-solution-code-style | 코드 포맷·스타일 |

---

## 검토 결과 요약

### 1. 신규 스킬 추가 권장: **배포·CI 워크플로** ✅ 반영

- **이유**: DEPLOYMENT_STANDARD, 배포 체크리스트, 워크플로 paths·헬스체크·롤백 등이 반복적으로 수정됨. `.github/workflows` 수정 시 참조할 단일 스킬이 있으면 일관성·실수 방지에 유리.
- **스킬명**: `/core-solution-deployment`
- **적용 시점**: GitHub Actions 워크플로 수정, systemd·배포 스크립트 수정, 배포 전/후 체크리스트 적용.
- **담당**: core-coder (필요 시 shell로 명령 실행).
- **참조**: DEPLOYMENT_STANDARD, DEV_DEPLOYMENT_STABILITY_CHECKLIST, GIT_WORKFLOW_STANDARD.

### 2. 기존 스킬 보강

- **database-first**: Flyway 마이그레이션 작성 시 `docs/standards/DATABASE_MIGRATION_STANDARD.md` 참조 문구 추가. (DB 스키마 변경·마이그레이션은 동일 스킬로 통일.)
- **backend**: 보안·인증(OAuth2, JWT) 변경 시 SECURITY_STANDARD, SECURITY_AUTHENTICATION_STANDARD 참조 문구는 선택 사항. 현재도 backend로 처리 가능.

### 3. 별도 스킬 불필요로 판단된 영역

- **Flyway 전용 스킬**: 마이그레이션은 DB 변경의 일부이므로 database-first로 통일. DATABASE_MIGRATION_STANDARD 참조만 명시.
- **보안 전용 스킬**: 보안 이슈는 debug(원인) + coder(수정), backend 스킬로 커버 가능. 수요 증가 시 추가 검토.
- **리팩토링 전용**: code-style, backend, frontend로 충분.

---

## 반영 사항

- **신규**: `.cursor/skills/core-solution-deployment/SKILL.md` 생성.
- **보강**: `core-solution-database-first/SKILL.md`에 Flyway·DATABASE_MIGRATION_STANDARD 참조 추가.
- **매핑**: SUBAGENT_USAGE.md, core-solution-rules/SKILL.md에 배포·CI 행 추가.

이 문서는 검토 결과 기록용이며, 추후 스킬 증설 시 참고합니다.
