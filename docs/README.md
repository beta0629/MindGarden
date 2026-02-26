# MindGarden 문서 인덱스 (진입점)

**문서 찾기는 여기서 시작하세요.**  
**문서 추가·이동·삭제·구조 변경은 문서관리 서브에이전트 전담입니다.** (규칙: `.cursor/skills/core-solution-documentation/SKILL.md`)

---

## 문서 전담 안내

- **문서 작업 전담**: 새 문서 작성, 기존 문서 이동/이름 변경/삭제, docs 폴더 구조 정리, 이 인덱스(README) 갱신은 **문서관리 서브에이전트**에게 요청하세요.
- **이유**: 문서가 분산되거나 예전 문서를 읽고 개발하면 혼선이 커지므로, 한 곳에서만 관리합니다.
- **적용 스킬**: `core-solution-documentation` → 서브에이전트: **generalPurpose** (또는 먼저 **explore**로 조사 후 generalPurpose).

---

## 문서 위치 체계 (docs/)

| 경로 | 용도 | 비고 |
|------|------|------|
| **[standards/](./standards/)** | **표준·가이드** (API, 코드스타일, 테넌트, 테스트, 배포 등) | 최신 표준만 참조. 목차: [standards/README.md](./standards/README.md) |
| **[design-system/](./design-system/)** | 디자인 시스템·토큰·컴포넌트 스펙 | v2, ci-bi 등 하위 폴더 있음 |
| **[project-management/](./project-management/)** | 프로젝트 관리·리포트·결정 사항·일별 체크리스트 | 연도·월별 또는 archive 하위 |
| **[archive/](./archive/)** | 과거 버전·폐기 표준·레거시 백업 | **현재 설계 참조 시 사용 금지** |
| **[guides/](./guides/)** | 환경 설정·개발·빠른 시작·트러블슈팅 가이드 | quick-start, development, deployment 등 |
| **[architecture/](./architecture/)** | 시스템 아키텍처·설계 문서 | design 등 하위 |
| **[layout/](./layout/)** | 레이아웃·메뉴 구조 관련 | |
| **[troubleshooting/](./troubleshooting/)** | 장애 대응·모니터링 체크리스트 | |
| **[debug/](./debug/)** | **디버깅·원인 분석 문서** (core-debugger 산출물 등) | 목차: [debug/README.md](./debug/README.md) |
| **[database/](./database/)** | DB 관련 가이드 | |
| **[testing/](./testing/)** | 테스트 계획·가이드 | |
| **[api/](./api/)** | API 레퍼런스·설계 문서 | guides·architecture에서 참조 |
| **[issues/](./issues/)** | 이슈·결정 사항·트러블슈팅 기록 | |
| **[planning/](./planning/)** | 기능·역할·메뉴 등 기획·설계 문서 | |
| **2026-prestartup/, 2026-startup-plan/, plans/** | 기획·사업 계획 등 | 필요 시 project-management로 통합 가능 |

---

## 빠른 링크

- **루트에서 이동한 문서**: [QUICK_START](./guides/quick-start/QUICK_START.md), [DEPLOYMENT_CHECKLIST](./guides/deployment/DEPLOYMENT_CHECKLIST.md), [PROJECT_STRUCTURE](./architecture/PROJECT_STRUCTURE.md), [KOREAN_ENCODING_SETUP](./guides/development/KOREAN_ENCODING_SETUP.md), [QUICK_WILDCARD_TEST](./troubleshooting/QUICK_WILDCARD_TEST.md), [매칭·스케줄 통합 요구사항](./testing/MATCHING_SCHEDULE_INTEGRATION_REQUIREMENTS.md), 과거 계획은 [project-management/archive/](./project-management/archive/) (PROJECT_REORGANIZATION_PLAN, FOLDER_REORGANIZATION_GUIDE)
- **표준 문서 전체 목록**: [docs/standards/README.md](./standards/README.md) (45개 표준)
- **문서 작성·정리 규칙**: [.cursor/skills/core-solution-documentation/SKILL.md](../.cursor/skills/core-solution-documentation/SKILL.md)
- **서브에이전트 활용(문서 전담 포함)**: [docs/standards/SUBAGENT_USAGE.md](./standards/SUBAGENT_USAGE.md)
- **디버깅·원인 분석 문서 목록**: [docs/debug/README.md](./debug/README.md)
- **간단 표준 요약**: [docs/STANDARDS.md](./STANDARDS.md) (핵심 4개 등 요약)

---

## 인덱스 유지

- 이 README에 새 상위 폴더를 추가하거나 위치 체계를 바꿀 때는 **문서관리 서브에이전트**로 요청해 반영하세요.
- 표준 문서가 추가되면 [standards/README.md](./standards/README.md)에 항목을 추가하는 것도 문서관리 전담 범위입니다.

---

*최종 업데이트: 문서 전담 규칙 및 진입점 정리 반영*
