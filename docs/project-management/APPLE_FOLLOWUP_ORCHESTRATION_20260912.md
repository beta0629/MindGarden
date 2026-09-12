# Apple 거절 팔로우업 오케스트레이션 (2026-09-12)

> Submission `8c74baef-072c-4ea3-b1c7-d8518e04df6b` · Version 1.0(17) · iPad Air 11" M3  
> 브랜치: `cursor/app-store-followup-menu-96b3` ← `origin/develop`  
> 금지: `APP_STORE_REVIEW_MODE` / 빌드 플래그 하드코딩 hide. 메뉴는 Admin RoleMenuPermission `canView`만.

## 1. 목표

어제~오늘 지시(앱 메뉴 노출 재디자인·즉시 토글·커뮤니티 숨김·EULA/iPad 갭)를 develop 우선으로 반영하고, ASC/Organization은 코드 밖 체크리스트로만 남긴다.

## 2. Phase 1 갭 표 (explore 결과)

| Apple 항목 | Guideline | develop (HEAD) | main | OPEN PR | 판정 |
|------------|-----------|----------------|------|---------|------|
| **A** EULA·UGC 무관용+동의 | 1.2 | `/legal/eula` + zero-tolerance 카피 있음. **부트/가입 동의 게이트·동의 API 없음** | #983 canView만. EULA 게이트 없음 | **#206** CONFLICTING vs main | **Partial** → 본 배치에서 동의 게이트·약관 강화 |
| **B** iPad 전 화면 | 4 | `supportsTablet` + 일부 `TabletContentShell`(720) | letterbox 없음 | **#205** CONFLICTING vs main | **Partial** → letterbox(440/744)+`requireFullScreen` 보강 |
| **C** Organization 제출 | 5.1.1(ix) | 체크리스트만 | 동일 | — | **Blocked(코드 밖)** — ASC Org 전환만 |
| 앱 메뉴 Admin UI | — | #980 Clinic-OS 셸·역할 칩·Switch **있으나 일괄「변경사항 저장」잔존** | Admin UI 약함 | — | **Partial** → 행 즉시 grant/revoke |
| 커뮤니티 canView 숨김 | — | 메뉴 시드 `V20260911_001`만(권한 행 없음 → min-role로 **기본 노출**) | Expo canView 게이트(#983) | — | **Partial** → RoleMenuPermission `can_view=false` 시드 |

### 재사용 / 폐기

| 산출물 | 판단 |
|--------|------|
| #980 develop 머지 Clinic-OS UI | **재사용** — 일괄 저장만 제거·즉시 토글 |
| `clinic-os-app-menu-visibility-spec.md` | **개정** — CTA「변경사항 저장」폐기, 즉시 적용 |
| #205 / #206 (main base, CONFLICTING) | **선택 포트** — develop에 파일 단위 이식 후 충돌 해소. 통째 머지 금지 |
| `APP_STORE_REVIEW_MODE*` | **폐기 유지** |

## 3. 분배실행 표

| Phase | 담당 | 산출 | 비고 |
|-------|------|------|------|
| 1 | explore | 본 문서 §2 갭 표 | 완료 |
| 2 | core-designer | `docs/design-system/clinic-os-app-menu-visibility-spec.md` 개정 + handoff | 코드 금지 · 즉시 토글 |
| 3 | core-coder | Admin 즉시 토글 · community seed OFF · EULA 동의 · iPad letterbox · Org 체크리스트 문구 | develop PR |
| 4 | core-tester | chrome 테스트 · letterbox jest · community OFF 포인트 | 게이트 |
| 5 | (운영) | ASC 17+ · Organization 계정 | 코드 밖 |

## 4. 완료 기준

- [ ] QuietHeader에 일괄 저장 CTA 없음 · Switch 토글 시 `grant`/`revoke` 즉시 호출
- [ ] UI `visible` = `canView`만 (hasPermission OR 버그 제거)
- [ ] Flyway: CLIENT/CONSULTANT 커뮤니티 `can_view=0` 시드(멱등)
- [ ] EULA 무관용 본문 + 동의 게이트(또는 동등 경로) develop 존재
- [ ] iPad: letterbox 또는 동등 + `requireFullScreen`/`portrait` 잠금
- [ ] 운영 체크리스트에 Org 전환·즉시 토글 절차 반영
- [ ] develop 대상 PR 푸시
