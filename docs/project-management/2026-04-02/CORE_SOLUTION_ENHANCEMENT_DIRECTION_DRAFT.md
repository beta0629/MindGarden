# Core Solution 고도화 방향·미흡 사항 초안 (기획 위임용)

> **성격**: 메인/개발 채팅에서 도출된 이슈를 한곳에 묶은 **초안**입니다. 우선순위·일정·수용 기준은 **기획(core-planner)** 주관으로 확정하는 것을 전제로 합니다.  
> **위임**: 본 문서를 입력으로 **core-planner**가 에픽/스토리 분해, 담당 에이전트 배정(코더·디자이너·테스터), 운영 반영 게이트 정합을 수행하면 됩니다. 구현은 스펙 확정 후 **core-coder** 등에 위임.

---

## 1. 배경·목적

- 멀티테넌트 SaaS로 확장하면서 **온보딩(가입 신청)·구독·테넌트 수명**에 대한 통제와 운영 도구가 고도화 단계에서 요구됨.
- 현재는 **데이터 모델·일부 서비스** 수준까지는 갖추었으나, **OPS/API/정책 문구**가 따라오지 않은 영역이 있음.

---

## 2. 고도화 방향 (방향성만)

| 영역 | 방향 |
|------|------|
| 온보딩·가입 | 공개 신청 경로에 **가입 제어**(전역 스위치, 쿼터, 초대/화이트리스트, 남용 방지)를 단계적으로 도입 |
| 구독·계약 | `effective_from` / `effective_to` 등 **기간 필드**와 만료 배치를 **제품 플로우·화면**과 연결 |
| 테넌트 수명 | `CLOSED` / 소프트 삭제 등 **표준 문서상 절차**를 **OPS/API**로 실행 가능하게 정리 |
| 운영·보안 | Rate limit, CAPTCHA, 발송 쿨다운, 모니터링 등 **공개 API 하드닝**을 TODO와 통합 |

---

## 3. 미흡·개선 후보 (초안 목록)

### 3.1 온보딩·공개 가입 제어

- [ ] 플랫폼 단 **신규 온보딩 신청 허용/중지**(또는 초대 전용) 스위치 및 OPS/설정 반영
- [ ] 동일 이메일·IP·도메인 기준 **중복·남용 방지** 정책 명시 및 구현
- [ ] 기존 초안: `docs/project-management/2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md`  
  (Rate limit, 발송 쿨다운, CAPTCHA, 모니터링 등)과 **한 에픽으로 묶을지** 기획 판단
- [ ] (선택) 초대 코드·이메일 도메인 화이트리스트 등 **B2B 온보딩** 모델 검토

### 3.2 구독·계약 기간 (제품 노출)

- [ ] DB/엔티티: `tenant_subscriptions.effective_*`, `tenants.subscription_*_date` 등 **이미 존재** → **관리자·OPS UI/API에서 조회·수정 노출 여부** 기획
- [ ] `SubscriptionService`: 취소는 Billing API에 노출, **만료(TERMINATED)·일시정지(SUSPENDED)** 는 서비스에만 있고 REST 정합성 검토
- [ ] 만료 배치(`SubscriptionExpirationServiceImpl` 등)와 **테넌트 접근 차단** 정책 연동 여부 정의 (구독만 SUSPENDED vs 테넌트 SUSPENDED/CLOSED)

### 3.3 테넌트 종료·삭제 (운영 실행 경로)

- [ ] 표준: `docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md` (테넌트 삭제·CLOSED·구독 해지·통지 절차)
- [ ] 현황: `TenantOpsController`는 **목록·관리자 조회** 위주, **종료/소프트삭제 전용 API** 부재 → OPS 플로우·권한·감사 로그 포함 설계 필요
- [ ] 온보딩 복구 시나리오(삭제된 테넌트 이메일 기준)와 **충돌 없는 정책** 정리

### 3.4 고객·법무 문구 (저장소 외 연계)

- [ ] 이용약관·계약서에 **계약기간·해지·데이터 보존** 문구: 코드베이스만으로는 미확인 → **법무/기획 산출물**과 링크

### 3.5 배포·운영 (이전 이슈에서 학습)

- [ ] 운영 JAR가 **DB 스키마·엔티티 타입**과 어긋나지 않도록 배포 체크(빌드 커밋·Flyway 이력·스모크) 문서화 여부 검토

---

## 4. 기획(core-planner)에게 맡기면 좋은 일

1. 위 **3절 항목**을 에픽으로 묶고, **MVP / 다음 분기 / 장기**로 나눔  
2. 각 스토리에 **수용 기준**, **OPS vs 테넌트 관리자 vs 최종 사용자** 범위 명시  
3. **core-coder** 위임 시: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, 멀티테넌트 스킬, 운영 하드코딩 게이트 문서 인용  
4. **core-tester**: 공개 온보딩·권한·격리 E2E 시나리오에 반영

---

## 5. 참고 링크 (저장소 내)

- `docs/project-management/2026-03-31/TODO_ONBOARDING_PUBLIC_API_HARDENING.md`
- `docs/standards/TENANT_ROLE_SYSTEM_STANDARD.md` (테넌트 삭제·종료 정책)
- `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`

---

**문서 버전**: 초안  
**작성일**: 2026-04-02
