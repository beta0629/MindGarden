# 매칭 원샷 결제 확인 → ACTIVE (기획 요약)

**목표**: 통합스케줄·공유 매핑 모달에서 `PENDING_PAYMENT` 매칭을 **한 번의 확인 제스처**로 `ACTIVE`(또는 단회기 `SESSIONS_EXHAUSTED`)까지 전이. 다단계 결제확인→입금확인→승인 UI를 정상 경로에서 제거.

**브랜치**: `cursor/mapping-oneshot-payment-activate-871d`  
**PR title**: `feat(mapping): one-shot payment confirm → ACTIVE (simplify approve)`

## 사용자 관점

| 항목 | 내용 |
|------|------|
| 사용성 | 운영자(Admin/STAFF·MAPPING_MANAGE)가 사이드바/카드에서 primary 1회 → 모달 1회 submit → ACTIVE |
| 정보 노출 | 결제수단·금액·참조번호만 수집. 중간 상태(PAYMENT_CONFIRMED/DEPOSIT_PENDING)는 정상 경로에서 강제 노출하지 않음 |
| 레이아웃 | 기존 UnifiedModal + MGButton dusty teal. 신규 페이지/레이아웃 없음 |

## 범위

- **포함**: BE atomic 일반화, FE CTA/모달/카피, silent refresh, 단위·통합 테스트, 레거시 mid-pipeline escape
- **제외**: PG 자동정산, tax ASP, wholesale enum 삭제, 가계약 패키지 규칙 변경, Expo 네이티브 패리티

## BE 게이트 (검증됨)

- `ConsultantClientMapping.approveByAdmin`: status=`DEPOSIT_PENDING` AND paymentStatus=`APPROVED` 필수
- `checkoutSameDayCard`: 이미 confirmPayment→confirmDeposit→approveMapping을 `@Transactional`로 수행. 진입 게이트는 `PENDING_PAYMENT` only (SAME_DAY UI 게이트는 FE)
- ERP `REQUIRES_NEW` → **FE 3회 체이닝 금지**. Option A (atomic BE) 채택

## 설계 (Option A)

1. 공유 private `executeConfirmPaymentDepositAndActivate(...)` 추출
2. `POST /api/v1/admin/mappings/{id}/confirm-and-activate` 추가 (MAPPING_MANAGE, X-Request-Id, `OPERATION_CONFIRM_AND_ACTIVATE`)
3. 기존 `checkout-same-day`는 동일 코어 위임 (회귀 0)
4. FE: 모든 `PENDING_PAYMENT` primary → 원샷 모달 (`confirm-and-activate`; SAME_DAY는 기존 checkout 유지 가능)
5. `DEPOSIT_PENDING`: primary = 승인만 (단일 제스처). `PAYMENT_CONFIRMED`: 입금 확인 escape 유지
6. 카피: 「결제 확인 + 매칭 활성화」 / submit 「확인 후 활성화」 — 「결제 확인」모달 안 「입금 확인」금지
7. 성공 후 `loadMappings({ silent: true })`

## 분배실행표

| Phase | Agent | 의존 | 전달 요약 |
|-------|-------|------|-----------|
| 0 | explore/debugger (완료) | — | BE 게이트·atomic 경로 확인 |
| 1 | **core-coder** | Phase 0 | BE extract+endpoint+tests; FE CTA/modal/copy/silent; commit·push |
| 2 | **core-tester** | Phase 1 | happy path, permission, silent wiring, SAME_DAY 회귀, fail-closed |

## 완료 기준

- [ ] PENDING_PAYMENT → 원샷 → ACTIVE (추가 승인 불필요)
- [ ] DEPOSIT_PENDING → 단일 승인
- [ ] SAME_DAY checkout 회귀 0
- [ ] FE 3-call 체이닝 없음
- [ ] 테스트: happy path (+ mid-chain 없음이므로 BE atomic 실패/멱등)
- [ ] 브랜치 commit & push
