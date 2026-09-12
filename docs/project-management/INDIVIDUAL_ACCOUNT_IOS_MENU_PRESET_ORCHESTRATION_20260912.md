# Individual 계정 재제출 — Apple 가이드라인 준수 확인 오케스트레이션 (2026-09-12)

> **역할**: core-planner (오케스트레이션 전용 · 코드 직수정 금지)  
> **사용자 전략(필수 · 2026-09-12 개정)**: Apple Developer **Individual** 유지 · Organization 전환은 **당장 불가** · 그래도 **출시(재제출)** · **기능을 사전 차단하지 않음** · 심사 전 **Apple 가이드라인 준수 여부만 미리 확인**(EULA·17+·iPad·UGC 안전장치·Org 리스크)  
> **철회**: 「커뮤니티 OFF 시드 / 위험 메뉴 일괄 숨김 / Individual 심사 프리셋 원클릭 OFF」  
> **금지**: `APP_STORE_REVIEW_MODE` / `EXPO_PUBLIC_*` / 빌드 extra / `Platform.OS === 'ios' hide` 소스 하드코딩 · **기본 숨김 시드(ios=0 등)**  
> **선행·병행 SSOT**:  
> - iOS/AOS 이중 Switch(**운영 도구**): `docs/project-management/MENU_VISIBILITY_IOS_ANDROID_ORCHESTRATION_20260912.md`  
> - RBAC 통일(완료): `docs/project-management/APP_STORE_MENU_PERMISSION_RBAC_PLAN_20260911.md`  
> - 구 팔로우업(양측 OFF·Org 전제): `APPLE_FOLLOWUP_ORCHESTRATION_20260912.md` → **본 문서로 재정렬(supersede)**  
> **목표 브랜치**: `cursor/individual-ios-menu-preset-891c` (문서)  
> **목표 반영**: `develop` PR (#987)

---

## 0. 정직성 고지 (기획 보고 필수 · 운영·PR 설명에도 반복)

| 사실 | 의미 |
|------|------|
| Guideline **5.1.1(ix)** | Apple Developer가 **Individual**인 한, 앱이 **심리상담·민감 건강 서비스**로 인식되면 **재거절 가능**. |
| 메뉴 게이트의 한계 | Admin 플랫폼 Switch는 **운영 중 필요 시** 끄는 도구일 뿐. **Organization 요구의 법적·심사 대체재가 아니다.** |
| 본 전략 | **사전 OFF로 우회하지 않음.** EULA·연령·iPad·UGC 안전장치·Org 리스크를 **미리 확인**한 뒤 기능 노출 상태로 재제출. |
| 코어 비즈 | **상담 예약·회기·내 상담·메시지·커뮤니티 등**을 심사 전 시드로 끄지 않음. |

---

## 1. 목표 (1~2문장)

Individual 계정으로 iOS 재제출 시, **기능 사전 차단 없이** Apple 가이드라인 **준수 확인 체크리스트**만 운영 SSOT로 둔다.  
iOS/Android **이중 Switch**는 배포하되 **운영 시 필요하면 끄는 도구**로만 기술하며, **기본 숨김 시드·심사 프리셋 OFF는 금지**한다. EULA·17+·iPad·UGC 안전장치는 병행 유지한다.

---

## 2. 사용자 관점 (§0.4)

| 항목 | 내용 |
|------|------|
| **사용성** | ADMIN이 `/admin/menu-permissions`에서 역할별 **iOS \| Android 이중 Switch**를 **운영 필요 시에만** 토글. 심사 전 **원클릭 OFF 프리셋 없음**. |
| **정보 노출** | 노출: 한국어 메뉴명, iOS/Android 상태. **비노출**: `menuCode`/`menuPath`/CRUD. 5.1.1 정직성 고지는 **운영 문서·Review Notes**. |
| **레이아웃** | Clinic-OS `MenuPermissionManagement` + `AdminCommonLayout`. QuietHeader 일괄 저장 CTA **금지**. 「Individual 심사 프리셋」원클릭 **도입하지 않음**. |

---

## 3. 범위

### 포함

| # | 항목 | 비고 |
|---|------|------|
| 1 | **준수 확인 체크리스트** | EULA · 17+ · iPad · UGC 안전장치 · Org/5.1.1(ix) 리스크 — `docs/운영반영/APP_STORE_REVIEW_MENU_PERMISSION_CHECKLIST.md` |
| 2 | **iOS / Android 이중 Switch(인프라)** | 운영 도구로 유지. 시드 기본값은 **기존 can_view 동일 복사**(숨김 강제 없음) |
| 3 | **EULA 17+ · iPad(G4)** | 병행 트랙 유지 |
| 4 | **문서 정책 개정** | 사전 OFF·위험 메뉴 숨김 문구 전부 |

### 제외

- Organization 계정 전환 자동화
- 소스 `REVIEW_MODE` 부활
- **커뮤니티/위험 메뉴 기본 OFF 시드** · Individual 심사 프리셋 원클릭
- 코어 비즈·UGC **심사 전 일괄 OFF**
- 스케줄/사이드바/fc-event 대규모 수정

---

## 4. 준수 확인 SSOT (사전 OFF 대체)

운영 체크리스트와 동일. 상세·체크박스는  
`docs/운영반영/APP_STORE_REVIEW_MENU_PERMISSION_CHECKLIST.md`.

| 영역 | 확인 요지 |
|------|-----------|
| **EULA** | `/legal/eula` · zero-tolerance · (해당 시) 동의 게이트 |
| **17+** | ASC 연령·Privacy·Review Notes·카피 일치 |
| **iPad** | tablet/letterbox/`requireFullScreen` 스모크 |
| **UGC 안전장치** | **노출 유지** 전제로 차단·신고·검수·딥링크 가드 |
| **Org 리스크** | Individual → 5.1.1(ix) 재거절 가능 · 메뉴로 대체 불가 |

### 이중 Switch · 시드 정책 (개정)

| menuCode / 대상 | can_view_ios | can_view_android | can_view(웹) | 비고 |
|-----------------|--------------|------------------|--------------|------|
| 기존 권한 행 전반 | **can_view 복사** | **can_view 복사** | 기존 | **기본 숨김 금지** |
| `CLT_COMMUNITY` / `CST_COMMUNITY` | **동일 복사**(OFF 강제 없음) | 동일 | 기존 | 운영 시 Admin에서만 토글 |

> **충돌 정리**: 과거 `ios=0 / android=1` 또는 양쪽 `can_view=0` **숨김 시드 전략은 철회**. 마이그레이션이 숨김을 강제하면 **동일 복사(또는 기존 운영값 유지)** 로 개정.

---

## 5. 의존성·순서

```
Phase 0  docs — 체크리스트·오케스트레이션 「사전 OFF」→「준수 확인」개정 (#987)
    ↓
Phase 1  (선택) MENU_VISIBILITY 문서·시드 문구: 기본 숨김 금지 / 운영 도구만
    ↓
Phase 2  (코드 트랙 별도) 이중 Switch 인프라 — 시드에 OFF 강제 넣지 않음
    ↓
Phase 3  core-tester — 준수 항목·하드코딩 hide 0 · 시드 숨김 강제 없음
```

---

## 6. 분배실행 표

| Phase | subagent_type | 목표 | 병렬 | 적용 스킬 |
|-------|---------------|------|------|-----------|
| 0 | `generalPurpose` | 운영 체크리스트·본 문서·MENU_VISIBILITY 「사전 OFF」철회·준수 확인으로 개정, PR #987 본문 | — | `/core-solution-documentation` |
| 1 | `core-coder` (해당 시) | 숨김 강제 시드가 있으면 **동일 복사**로 정정. 이중 Switch는 유지 | Phase 0 후 | backend·database-first |
| 2 | `core-tester` | REVIEW_MODE/Platform hide 0 · 시드 기본 숨김 없음 · EULA/iPad 스모크 | Phase 1 후 | `/core-solution-testing` |

---

## 7. 리스크·제약

| 리스크 | 완화 |
|--------|------|
| 5.1.1(ix) 재거절 | 정직성 고지. Org는 추후. **메뉴 OFF로 우회하지 않음** |
| 구 문서·PR이 OFF 시드 잔존 | 본 배치에서 문서·PR 본문 일괄 개정 |
| UGC 노출 시 1.2 | 안전장치·EULA 준수 확인으로 대응 |

---

## 8. 완료 기준·체크리스트

- [x] 정직성 고지 유지(메뉴≠Org 대체)
- [ ] 운영 체크리스트가 **준수 확인**(EULA·17+·iPad·UGC·Org)만 기술
- [ ] 「출시 전 iOS OFF / 시드 숨김 / Individual 프리셋」문구 **제거·철회** 명시
- [ ] 이중 Switch = **운영 도구**, 기본 숨김 시드 **금지**
- [ ] PR #987 본문 정책 반영
- [ ] REVIEW_MODE 신규 0

---

## 9. 실행 요청 (부모 에이전트)

1. `generalPurpose`(+`/core-solution-documentation`): 체크리스트·본 문서·관련 오케스트레이션 개정 → `cursor/individual-ios-menu-preset-891c` 커밋·푸시.  
2. PR #987 본문을 **준수 확인 정책**으로 갱신.  
3. 코드 트랙에 숨김 시드가 있으면 `core-coder`에 **동일 복사 정정**만 위임(본 문서 Phase 1).

**확인 질문 금지. 사전 차단 철회·준수 확인만 모든 위임 프롬프트에 유지.**
