# 통합일정 사이드바 UX 벤치마킹

**작성일**: 2026-06-30  
**범위**: 상담·치료·코칭·예약·CRM B2B SaaS (국내·해외)  
**비교 기준**: MindGarden `/admin/integrated-schedule` 사이드바 (380px, 3칩 필터, 세로 카드, DnD, 결제/일정 CTA, **밀도 토글 없음**, compact row 실험 롤백)

---

## 1. Executive Summary

상용 B2B SaaS가 월 $45~$99(국내 ₩45,000~)를 받는 핵심 이유는 **「한 화면에서 다음 행동을 결정할 수 있는 정보 밀도」**와 **「목록↔상세 전환 시 컨텍스트 유지」**에 있다. Jane App·TherapyNotes·Cliniko 같은 클리닉 EMR은 캘린더+목록+결제·회기를 파이프라인으로 묶고, HubSpot·Notion·Linear 같은 범용 SaaS는 **목록을 줄이지 않는 side peek / preview sidebar** 패턴으로 스캔→상세→복귀 비용을 최소화한다.

밀도 토글(compact/comfortable)을 명시적으로 제공하는 제품은 **HubSpot(보드 카드 Default/Compact)**, **Notion(보드·갤러리 card_layout)**, **Jane(Schedule Zoom)** 정도이며, SimplePractice·TherapyNotes·Cliniko·Linear는 **뷰 전환(Agenda/Day/Week, Display options)이나 UI 리디자인으로 밀도를 고정**한다. 즉 「밀도 토글」 자체가 필수는 아니나, **사용자가 스캔 모드와 작업 모드를 바꿀 수단**은 상용 제품 공통 요구다.

MindGarden은 **회기 잔여·결제대기 배지를 사이드바 카드에 노출**하는 점에서 SimplePractice(수동 회기 추적)보다 목록 UX는 앞서 있으나, **compact row 롤백으로 밀도 선택권이 없고**, **행 클릭→상세 패널(split/side peek) 부재**, **필터가 3칩 고정·저장 뷰 없음**이 상용 대비 가장 큰 갭이다. Calendly·HubSpot 수준의 「목록 유지 + 우측 프리뷰」와 Jane 수준의 「패키지 잔여 자동 연동」을 P0~P1로 따라잡지 않으면 B2B 유료 전환 설득력이 약하다.

당장 따라하면 안 되는 것: **검증 없이 1줄 compact row를 기본값으로 강제**하는 것이다. HubSpot 커뮤니티·MindGarden 롤백 사례 모두 「압축=정보 손실」에 대한 사용자 반발이 있으며, 상용 제품은 **토글·Display options·뷰 저장**으로 해결한다.

---

## 2. 제품별 비교 표

| 축 | SimplePractice | TherapyNotes | Jane App | Cliniko | Calendly Teams | HubSpot CRM | Linear | Notion DB | 마인듀케어 (국내) |
|---|---|---|---|---|---|---|---|---|---|
| **1. 목록 밀도** | 고정. iPad 좌측 nav 접기만. 클라이언트 목록·캘린더 **compact/comfortable 토글 없음** | 고정. **Agenda(리스트형)** vs Day/Week/Month 뷰로 밀도 간접 조절. 토글 없음 | **Schedule Zoom**으로 시간축 밀도 조절(개인 설정). Patients 탭은 최대 50명 스냅샷. 명시적 compact 토글 없음 | 고정. Appointments·Patients **탭 기반**, 사이드바 목록 밀도 설정 없음 | 고정. Meetings **타임라인 리스트**. Event Type **카드형** linear UI | **Default / Compact** 보드 카드 스타일 토글. 테이블 뷰는 컬럼·행 밀도 별도 | **밀도 토글 없음**. 2024 UI 리디자인으로 **전역 밀도·계층 최적화**. Display options로 **표시 필드**만 토글 | List는 기본 미니멀. **Board/Gallery `card_layout`: list vs compact** | 통합 캘린더(월/주/일) + 센터 뷰. 공개 문서에 **밀도 토글 언급 없음** |
| **2. 행 정보 계층** | 캘린더: **상태 색·progress note 표시**. 클라이언트 목록: 이름·Manage(⋯) 액션. **다음 액션은 프로필/캘린더 진입 후** | Agenda: **시간·환자·위치·알림**. Patients: **필터 숏컷**(Appointment Soon, Intake Soon 등) | 스케줄: **약속 상태 토글**(Unarrived/Arrived 등). 환자: **활성 50명** 우선 노출 | Appointments 클릭 → **팝업**에 환자명·상세. Patients: **검색 중심** | Event Type 카드: **즉시 예약·공유·SUL** 액션. Meetings: 날짜 그룹 타임라인 | Deal 카드: **단계·금액·태그**. Compact 시 태그 1개만 노출 이슈(커뮤니티) | Issue 행: **ID·상태·우선순위·담당·라벨** Display options로 선택 | List: **제목 + 선택 property**. Compact gallery: **한 줄 다중 property** | **일정·결제·회기·위험신호** 통합 모니터링(마케팅). 목록 행 스펙은 비공개 |
| **3. 필터/세그먼트** | 캘린더: **Location·Team dropdown** + **More filters**(신규·미완료 문서·미결제·보험). Clients: **상단 필터 칩**(Prospective 등) | **Set Calendar View** 다이얼로그: Location, Clinician, Type, Payer, Language, Hide missed. Patients: **숏컷 탭 + dropdown** | 스케줄 좌측 **practitioner 리스트**(blue highlight). Location·All Staff dropdown | Patients **검색**. Appointments **캘린더 필터** | Scheduling 탭: Event types / SUL / Polls. Meetings **검색·필터** | **View tabs**(My deals, custom) + quick/advanced filters. **저장 뷰** | **필터 + Display options** 분리. Inbox/Triage는 ordering만 | **뷰별** filter/sort/group. **저장 뷰** 다수 | 센터 통합·다중 상담사. **공개 UI 스펙 제한적** |
| **4. 상세 진입** | Clients: **View Client → 전체 프로필**. 캘린더 약속 클릭 → **약속 상세** | Agenda 항목 탭 → **상세**. Patients → **차트 전체** | 약속 클릭 → **Appointment Panel**. 환자 → **프로필 Billing 등 탭** | 약속 클릭 → **팝업** → 환자명 → **상세 페이지** | Meeting 선택 → **상세·액션**. Event type → **우측 real-time preview** | Table: **Preview 버튼 / hover**. Board: **카드 클릭 → 우측 preview sidebar**. View record로 전체 | **Space → Peek**(목록 유지). 클릭 → **전체 이슈** | **Side peek 기본**(Table/Board/List/Timeline). Center/Full page 선택 | 비공개. **통합 뷰** 마케팅 |
| **5. DnD·일정 연동** | 캘린더 **드래그·색상 필터**. 클라이언트 목록 DnD **없음** | 캘린더 **Manual scheduling**. Agenda↔Day 동기 | 스케줄 **드래그 이동**·Manage Shifts. Practitioner 다중 뷰 | Appointments **캘린더 중심**. DnD 공개 문서 제한 | **Round-robin·팀 가용성**. 목록 DnD 아님 | Board **드래그로 단계 변경**. Calendar/Gantt 뷰 | Board **Manual ordering DnD** | Board **드래그**. Calendar 뷰 | **드래그 이동·충돌 감지**(마케팅) |
| **6. 결제/회기 상태** | **Billing Overview**·Authorization(수동 회기). 패키지=Product+크레딧. **목록에 잔여 회기 자동 표시 없음** | 스케줄→청구→클레임 **통합 워크플로**. Patients 필터로 intake 등 | **Packages: Usage 컬럼에 잔여 자동**. Reports로 일괄. 예약 시 **자동 redeem** | 환자 파일 **Upcoming appointments** dropdown. 청구·인보이스 통합 | 결제 **비즈니스**. CRM 연동(Salesforce) | Deal **금액·단계·태그**. Preview에 property | 이슈 **estimate·SLA** Display options | DB **property**로 잔여/상태 커스텀 | **바우처·미수금·EAP 정산**. AI 회기 요약 |
| **7. 가격·타겟** | **$49~$99/월** solo, 그룹 add-on. 미국 **소·중형 치료·웰니스** | **$69 solo, $79+50/clinician** group. **행동건강·보험 청구** | **$54~$99/월**. **다학제 클리닉**(PT·chiro·심리) | **$45~$395/월**(practitioner 수). **65k+ practitioners, 95+국** | **$16~20/seat/월**(Teams). **세일즈·CS 팀 예약** | **$20~$1,500+/user/월** tier. **CRM·파이프라인** | **$8~16/user/월**(추정). **제품팀 이슈 트래킹** | **Free~$20/user/월**. **범용 워크스페이스** | **무료(1인) / ₩45,000/월(1~8인)**. **국내 상담센터** |
| **8. MG 대비 갭 (따라잡을 3 / 하지 말 1)** | **① More filters급 세분 필터 ② 클라이언트 목록 Manage(⋯) 분리 ③ 캘린더↔목록 동기** / **compact 1줄 강제 X** | **① Agenda 뷰(리스트+캘린더 병행) ② Patients 숏컷(회기·intake) ③ Set Calendar View 패턴** / **필터 다이얼로그만으로 UX 단순화 X** | **① Package 잔여 자동(백엔드) ② Appointment Panel ③ Schedule Zoom=밀도** / **50명 스냅샷만 보여주기 X** | **① 팝업→상세 2단 ② Upcoming appt 헤더 ③ 투명 tier 가격** / **사이드바 없이 탭만 X(MG는 사이드바 유지)** | **① 우측 real-time preview ② Meetings 타임라인 ③ 팀 필터** / **예약 SaaS 그대로 복제 X** | **① Compact/Default 토글 ② Preview sidebar ③ 저장 뷰·칩 필터** / **Compact에서 태그 숨김 같은 정보 손실 X** | **① Peek(목록 유지) ② Display options ③ 필터/표시 분리** / **밀도 토글 없이 전역 리디자인만 X** | **① Side peek 기본 ② compact card_layout ③ 뷰별 open behavior** / **List에 compact 강제 X** | **① 센터 통합 뷰 ② 알림톡·결제 통합 ③ 국내 가격대** / **비공개 UI 그대로 추정 구현 X** |

### MindGarden 현재 vs 상용 요약

| MindGarden 현재 | 상용 공통 패턴 | 갭 심각도 |
|---|---|---|
| 380px 사이드바 + 세로 카드 | HubSpot/Notion: **목록+프리뷰 split** | **높음** |
| 필터 3칩(신규매칭/회기남은/전체) | TherapyNotes **숏컷+다중 필터**, HubSpot **저장 뷰** | **중~높음** |
| 카드에 CTA(결제확인/일정등록) | Jane **패널 내 billing toggle**, Linear **Peek 후 액션** | **중간** |
| 회기 배지 노출 | Jane **자동 Usage**, SP **수동** — MG 목록은 양호, **정합성·자동 차감** 미확인 | **중간(백엔드)** |
| DnD 지원 | Jane·TN·Linear **캘린더/보드 DnD** — MG **있음(강점)** | **낮음** |
| 밀도 토글 없음, compact row 롤백 | HubSpot·Notion **토글**, Jane **Zoom** | **높음** |

---

## 3. Must-have 로드맵 (상용화 전)

| 우선순위 | 항목 | 근거 | MindGarden 적용 방향 |
|---|---|---|---|
| **P0-1** | **밀도/레이아웃 토글** (Comfortable 카드 ↔ Compact row) | HubSpot Default/Compact, Notion card_layout, Jane Zoom — **롤백 교훈: 기본값 1개 강제 금지** | 사용자 설정·localStorage. 기본값=현재 세로 카드(comfortable). Compact는 **선택** |
| **P0-2** | **Side peek / Preview 패널** (행 클릭 → 380px 유지 + 우측 또는 overlay drawer) | Notion side peek, HubSpot preview, Linear Peek — **캘린더 컨텍스트 유지** | 카드=스캔+Primary CTA, **「상세」→ 패널**(매칭·결제·회기·일정 이력). UnifiedModal 남용 금지 |
| **P0-3** | **필터: 저장 뷰 + 1줄 세그먼트** | TherapyNotes Patients 숏컷, HubSpot view tabs, SP More filters | 3칩 유지 + **「+필터」·저장**(예: 결제대기+당일). 칩=세그먼트, dropdown=고급 |
| **P1-1** | **회기·결제 상태 목록↔백엔드 정합** | Jane Packages Usage 자동, SP 수동(反面教材) | 카드 배지=**실시간 잔여**. 패키지/입금대기/당일결제 **단일 상태 머신** |
| **P1-2** | **Agenda/리스트 보조 뷰** (선택) | TherapyNotes Agenda, Calendly Meetings timeline | 통합일정에 **「오늘·이번주 매칭 액션 큐」** 탭 — 사이드바와 동일 데이터, 리스트 밀도 |

### 당장 하면 안 되는 것 (1가지)

**검증·토글 없이 compact 1줄 row를 기본 UI로 재도입** — MindGarden compact row 실험 실패, HubSpot Compact 카드 태그 축소 불만, SimplePractice/Jane도 **목록 스캔용·상세용 뷰 분리**가 전제. P0-1 토글 + P0-2 패널 선행 후 Compact 재시도.

---

## 4. 참고 URL

### 클리닉·상담 EMR (해외)

| 제품 | URL | 용도 |
|---|---|---|
| SimplePractice — 캘린더 | https://support.simplepractice.com/hc/en-us/articles/207625726-Navigating-your-calendar | 필터·뷰·상태 색 |
| SimplePractice — 클라이언트 목록 | https://support.simplepractice.com/hc/en-us/articles/42095477577357-Navigating-the-clients-and-contacts-list | 목록 필터·Manage |
| SimplePractice — 가격 | https://support.simplepractice.com/hc/en-us/articles/115005956266-SimplePractice-pricing-and-subscription-FAQs | $49~$99 |
| SimplePractice — 회기/Authorization | https://support.simplepractice.com/hc/en-us/articles/7007890860045-Using-Authorization-Tracking | 수동 회기 추적 |
| TherapyNotes — 스케줄링 | https://support.therapynotes.com/hc/en-us/articles/30661279632539-Quick-Start-Scheduling | Agenda·Set Calendar View |
| TherapyNotes — 가격 | https://support.therapynotes.com/hc/en-us/articles/30661380110747-TherapyNotes-Pricing-and-Subscription-Options | $69~$79+ |
| TherapyNotes — Enhanced Calendar (2024) | https://blog.therapynotes.com/whats-new-enhanced-calendar-view-options | 필터 확장 |
| TherapyNotes — Mobile Patients | https://support.therapynotes.com/hc/en-us/articles/45624783981211-Getting-Started-with-TherapyNotes-Mobile | Patients 숏컷 |
| Jane — Schedule View Settings | https://jane.app/guide/schedule-view-settings | Zoom·상태 토글 |
| Jane — Packages FAQ | https://jane.app/guide/packages-faqs | 잔여 회기 Usage |
| Jane — Packages 기능 | https://jane.app/features/packages-and-memberships | 자동 추적 |
| Cliniko — 가격 | https://www.cliniko.com/ | $45~$395 |
| Cliniko — 환자 선택 | https://help.cliniko.com/en/articles/1023904-select-a-patient | 팝업→상세 |
| Cliniko — Upcoming appointments | https://help.cliniko.com/en/articles/4790488-email-or-print-a-patient-s-list-of-upcoming-appointments | 회기 목록 UX |

### 범용 B2B SaaS (UX 레퍼런스)

| 제품 | URL | 용도 |
|---|---|---|
| Calendly — 새 UI | https://calendly.com/help/meet-the-new-calendly | 사이드바 nav |
| Calendly — Meetings | https://calendly.com/help/how-to-manage-your-meetings | 타임라인 목록 |
| Calendly — Teams 가격 | https://calendly.com/help/choose-the-right-calendly-plan-for-your-team | $16~20/seat |
| HubSpot — Index views | https://knowledge.hubspot.com/records/manage-index-page-types-and-tabs | Table/Board/Calendar |
| HubSpot — Preview record | https://knowledge.hubspot.com/records/preview-a-record | Preview sidebar |
| HubSpot — Customize preview | https://knowledge.hubspot.com/object-settings/customize-record-previews | Preview 카드 구성 |
| HubSpot — Compact 카드 이슈 | https://community.hubspot.com/t/display-more-than-1-tag-on-deal-cards-when-using-compact-card-styles/120972 | Compact 정보 손실 |
| Linear — Display options | https://linear.app/docs/display-options | 필터 vs 표시 분리 |
| Linear — Peek | https://linear.app/docs/peek | Space side preview |
| Linear — UI 리디자인 | https://linear.app/now/how-we-redesigned-the-linear-ui | 밀도·계층 |
| Notion — Views/Filters | https://www.notion.com/help/views-filters-and-sorts | List·Layout |
| Notion — Side peek (2022) | https://www.notion.com/releases/2022-07-20 | Side peek 도입 |
| Notion API — card_layout | https://developers.notion.com/guides/data-apis/working-with-views | list vs compact |

### 국내

| 제품 | URL | 용도 |
|---|---|---|
| 마인듀케어 | https://minducare.com/ | 통합 일정·결제·₩45,000 |
| 에피 | https://epipro.so/ | 상담센터 예약·이용권·30일 무료 |
| 마인드카페 센터 | https://center.mindcafe.co.kr/ | B2C 예약 UX(비교용) |

### MindGarden 내부

| 문서 | URL |
|---|---|
| Compact Row 스펙 (롤백 전) | `docs/project-management/2026-06-30/INTEGRATED_SCHEDULE_SIDEBAR_CARD_COMPACT_ROW_SPEC.md` |
| 스타일 플랜 | `docs/project-management/2026-06-30/INTEGRATED_SCHEDULE_SIDEBAR_CARD_STYLE_PLAN.md` |

---

## 5. 조사 한계

- 대부분 **공식 도움말·릴리스 노트·커뮤니티** 기반이며, 로그인 후 UI 스크린샷은 직접 캡처하지 않음.
- SimplePractice·TherapyNotes 등 **「compact/comfortable」 명칭 토글은 확인되지 않음** — Jane Zoom·HubSpot Compact 등 **유사 메커니즘**으로 대체 비교.
- 마인듀케어·에피 **관리자 UI**는 비공개 — 마케팅·가격만 반영.
- 가격은 **2025~2026 공개 FAQ** 기준이며 플랜 변경 가능.

---

*본 문서는 코드 변경 없이 기획·UX 의사결정용으로 작성됨.*
