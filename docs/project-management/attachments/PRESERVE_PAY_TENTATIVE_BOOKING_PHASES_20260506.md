# 가예약·입금/카드 후 완료 — Phase 0~4 (PO 결정 반영)

**작성일**: 2026-05-06  
**상태**: 기획·분배용 부록 — SSOT는 [`INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md`](../INTEGRATED_SCHEDULE_RESERVE_FIRST_PAY_LATER_ORCHESTRATION.md) §12 및 저장소 오케스트레이션(§4, `core-debugger` → `core-coder` → `core-tester`, ADR·`DEPOSIT_ERP` 문서)을 따른다.

---

## Phase 0~4 표

| Phase | 목적 | 입장 조건 | 퇴장 조건 | 담당 서브에이전트 |
|:-----:|------|-----------|-----------|-------------------|
| **0** | 상태 모델·용어·제품 카피(가예약·입금 대기·확정 등) | PO 결정(가예약 1건·입금/카드 후 상태 변동·완료) 수신 | 역할별 노출·enum·카피 초안 합의(디자이너 산출) | **core-designer** (필요 시 **explore**: 기존 enum·문구 인벤토리) |
| **1** | 인벤토리: 매핑·일정 엔티티·`confirm-deposit`·결제 콜백 경로 | Phase 0 퇴장 | 엔티티·API·웹훅/콜백·ERP 연계 지점 1페이지 맵 | **explore** (필요 시 **core-component-manager**: UI 진입점 목록) |
| **2** | 갭 분석·API·도메인 계약(신규 상태·전이·오류 본문) | Phase 1 퇴장 | “ACTIVE+잔여” 전제와의 차이·필요 전이·4xx/도메인 코드 초안 | **core-debugger** → 산출을 **core-coder** 위임문에 포함 |
| **3** | UX·모달(차단·다음 동선·입금/카드 안내) | Phase 2 퇴장 | UnifiedModal·토큰·접근성 포함 시안·스펙 확정 | **core-designer** (필요 시 **core-publisher**: 마크업만) |
| **4** | 구현 + 테스트 게이트 | Phase 3 퇴장 | PR 머지 후보 + 상위 SSOT §4 테스트 블록 Phase N까지 Green | **core-coder**, **core-tester** |

**상위 문서 링크**: [REVIEW_RESERVE_PAY_RECEIVABLES_SESSION_20260506.md](./REVIEW_RESERVE_PAY_RECEIVABLES_SESSION_20260506.md) §6, [PO_ADR_REVIEW_CHECKLIST_INTEGRATED_SCHEDULE_20260506.md](./PO_ADR_REVIEW_CHECKLIST_INTEGRATED_SCHEDULE_20260506.md) §0.
