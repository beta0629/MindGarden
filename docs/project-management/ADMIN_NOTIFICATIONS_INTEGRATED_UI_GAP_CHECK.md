# 관리자 "알림·메시지 관리" 통합 화면 — 기획 vs 현재 구현 갭 확인

**확인 일자**: 2026-03-17  
**배경**: 사용자 피드백 — "시스템 공지 관리 화면이 통합으로 된 화면이 아니고 기존 화면이 나오고 있다" (기획 확인 요청)

---

## 1. 기획에서 의도한 "통합 화면"

### 1.1 참고 문서

- `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3 (관리자 통합 컴포넌트 구성안)
- `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_INTEGRATION_POLICY.md`
- `docs/design-system/GNB_AND_ADMIN_NOTIFICATION_UI_SPEC.md` §2 (관리자 통합 페이지)

### 1.2 기획 요약

| 구분 | 기획 내용 |
|------|-----------|
| **라우트** | 단일 페이지 `/admin/notifications`, "알림·메시지 관리" 단일 메뉴. 기존 `/admin/system-notifications`, `/admin/messages`는 통합으로 리다이렉트. |
| **레이아웃** | AdminCommonLayout + **상단 공통 헤더**(제목 "알림·메시지 관리", 부제, 우측 "공지 작성") + **탭 바**(시스템 공지 \| 메시지) + **탭별 본문**. |
| **탭 본문** | **공지 탭**: "목록 + 필터 + 액션"을 **Organism으로 분리**한 **SystemNotificationListBlock** 등 사용. **메시지 탭**: AdminMessageListBlock 등으로 **동일한 목록/카드 스타일**로 통일. |
| **스타일** | 공지·메시지 **도메인만 다르고** "필터 + 목록 + 상세" 구조·카드 스타일을 **같게** 써서 **통합된 한 화면** 느낌. |

즉, **통합** = (1) 단일 경로 + 탭 + (2) **리뉴얼된 블록**(추출·통일 스타일)으로 탭 본문 구성.

---

## 2. 현재 구현

### 2.1 구현 요약 (GNB_AND_ADMIN_NOTIFICATIONS_IMPLEMENTATION_REPORT.md 기준)

| 항목 | 구현 내용 |
|------|-----------|
| 라우트 | ✅ `/admin/notifications` 단일 페이지. `/admin/system-notifications`, `/admin/messages` → 리다이렉트. |
| 레이아웃 | ✅ AdminCommonLayout + ContentHeader(제목·부제·공지 작성 버튼) + 탭(시스템 공지 \| 메시지). |
| **탭 본문** | **공지 탭**: `<SystemNotificationManagement contentOnly />` — **기존 시스템 공지 관리 컴포넌트 전체**를 그대로 임베드. **메시지 탭**: `<AdminMessages contentOnly />` — **기존 메시지 관리 컴포넌트 전체** 임베드. |

### 2.2 갭 정리

| 기획 | 현재 | 갭 |
|------|------|-----|
| 공지 탭에 **SystemNotificationListBlock** 등 **추출·리뉴얼된 블록** 사용 | 공지 탭에 **SystemNotificationManagement** **전체**를 `contentOnly`로 임베드 | ✅ **갭 있음**: 탭 안이 **기존 단독 페이지용 UI** 그대로 노출됨. |
| 공지·메시지 **동일 목록/카드 스타일**로 통일 | 공지·메시지 각각 **기존 컴포넌트** 그대로 → 서로 다른 레이아웃·필터·카드 스타일 | ✅ **갭 있음**: "한 화면에서 통합 관리"한 **시각적·구조적 통일** 미완. |
| 헤더·필터를 공통 Molecule/Organism으로 추출 | 각 컴포넌트가 자체 헤더·필터·섹션 타이틀 보유 (예: contentOnly 시 "공지 목록", 필터 "대상/상태") | ✅ **갭 있음**: 통합 페이지 상단 헤더와 탭 본문 내부 헤더/필터가 **이중 구조**로 보일 수 있음. |

---

## 3. 사용자 체감 ("기존 화면이 나온다")와의 대응

- **통합 페이지 자체**는 존재함: URL은 `/admin/notifications`, 상단에 "알림·메시지 관리" + 탭(시스템 공지 \| 메시지)이 있음.
- 다만 **탭을 클릭했을 때 보이는 본문**이:
  - **기획**: 리뉴얼된 공통 스타일의 "공지 목록 블록" / "메시지 목록 블록"
  - **현재**: 예전 단독 페이지였던 **시스템 공지 관리 화면**·**메시지 관리 화면**이 그대로 들어가 있음.

따라서 **"통합으로 된 화면이 아니고 기존 화면이 나온다"**는 피드백은 **기획 대비 구현 갭**과 일치함.  
(통합된 건 **경로와 탭**이고, **탭 본문 UI는 아직 기존 화면 그대로**임.)

---

## 4. 기획 측 확인·결정 사항

1. **목표 확정**  
   - **A안**: 기획서대로 **공지/메시지 탭 본문을 Organism 추출·통일 스타일**로 리뉴얼 (SystemNotificationListBlock, AdminMessageListBlock 등 도입, B0KlA·통합 스펙 적용).  
   - **B안**: 단기적으로는 **현 구조 유지** (통합 = 경로 + 탭만, 본문은 기존 컴포넌트 임베드). 추후 단계에서 리뉴얼.

2. **우선순위**  
   - 리뉴얼(A안)을 할 경우: 공지 탭부터 할지, 공지·메시지 동시에 할지, 메시지 탭은 나중에 할지.

3. **LNB/메뉴**  
   - "알림·메시지 관리" 단일 메뉴가 DB LNB(`/api/v1/menus/lnb`)에 `/admin/notifications` 로 등록되어 있는지 운영 환경에서 확인 필요 (폴백 메뉴는 구현 완료).

---

## 5. 참고 파일

| 구분 | 파일 |
|------|------|
| 통합 페이지 | `frontend/src/components/admin/AdminNotificationsPage.js` |
| 공지 탭 본문(기존 전체) | `frontend/src/components/admin/SystemNotificationManagement.js` (contentOnly 시 "공지 목록" + 필터 + 테이블 + 모달) |
| 메시지 탭 본문(기존 전체) | `frontend/src/components/admin/AdminMessages.js` (contentOnly) |
| 기획 제안 | `docs/project-management/GNB_AND_ADMIN_NOTIFICATION_COMPONENT_PROPOSAL.md` §3.3, §3.6 |
| 구현 보고 | `docs/project-management/GNB_AND_ADMIN_NOTIFICATIONS_IMPLEMENTATION_REPORT.md` |

---

*기획 확정 후, A안 선택 시 core-coder/ core-planner에 Organism 추출·통합 스타일 적용 태스크로 전달하면 됨.*
