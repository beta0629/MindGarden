# MindGarden 온라인 결제·카탈로그·체크아웃 기획 (상담료·심리검사)

| 항목 | 내용 |
|------|------|
| 문서 제목 | MindGarden 온라인 결제·카탈로그·체크아웃 기획 (상담료·심리검사) |
| 상태 | 초안 |
| 작성일 | 2026-05-13 |
| 대상 | 웹(내담자/상담사)·Expo 앱, 테넌트별 브랜딩, 백엔드·ERP·어드민 |

---

## 1. 비전·원칙

### 1.1 비전 (쇼핑 UX 은유)

- 내담자가 **상담 패키지·추가 회기·심리검사(TCI·MMPI 등)**를 **쇼핑몰과 같은 인지 모델**로 탐색·비교·담고·결제·구매 내역 확인할 수 있게 한다.
- **카탈로그(목록) → 상품 상세(PDP) → (선택) 장바구니 → 체크아웃 → 결제 위젯 → 완료·영수증 → 내 구매·다운로드/예약 연결**의 단선형 흐름을 **웹·Expo 공통**으로 맞춘다.
- “구매”는 단순 결제가 아니라 **서비스 이행(검사 업로드 권한, 리포트 생성, 회기 예약 가능 상태)**까지 연결되는 **주문(Order) 중심** 모델로 본다.

### 1.2 테넌트 브랜딩

- 카테고리명·배너·추천 문구·상품 설명·가격 표기 단위·약관 링크는 **테넌트별 설정**으로 노출한다 (하드코딩된 카피·색·URL 금지, 디자인 토큰·CMS/설정 테이블 활용).
- 결제 완료 화면·이메일·푸시(해당 시)에도 **테넌트 로고·명칭·연락처**를 반영한다.

### 1.3 멀티테넌트·PII·하드코딩 금지 (요지)

멀티테넌트 스킬(`.cursor/skills/core-solution-multi-tenant/SKILL.md`) 요지를 본 기능에 적용하면 다음과 같다.

- **tenantId 없음 = 금지**: 상품·주문·결제·업로드 슬롯·리포트 등 모든 영속 데이터와 API는 **tenantId와 함께** 설계·조회·검증한다. Repository/Service에서 **tenantId null로 쿼리 호출 금지**; 컨텍스트 없으면 **403/400 후 서비스 미호출**.
- **DB·쿼리·프로시저**: 테넌트 데이터 테이블은 **tenant_id NOT NULL**, 인덱스·WHERE에 tenant 조건 포함.
- **API**: 클라이언트는 **X-Tenant-Id**(또는 세션 기반 StandardizedApi 등)로 일관 전달; 백엔드는 누락 시 거절.
- **PII**: 주문·결제 메타와 검사 원자료(이미지/PDF)는 **최소 수집·목적 외 이용 금지·접근 통제·감사 로그** 원칙. 노출 화면은 역할·단계별로 필드 축소.
- **하드코딩 금지**: 금액·상품 코드·PG 키·콜백 URL·브랜딩 문구는 **설정/비밀/토큰**으로만; 운영 반영 전 하드코딩 게이트와 정합.

---

## 2. 상품(SKU) 범위 표

| SKU 그룹 | 대표 SKU 예시 | 구매자 | 이행(fulfillment) | 비고 |
|----------|----------------|--------|-------------------|------|
| 상담 패키지 | N회 패키지, 초기 평가+회기 묶음 | 내담자 | 매핑 생성·회기권·예약 가능 | 기존 상담료·매핑 도메인과 정합 |
| 추가 회기 | 단일 회기권, N회 추가 번들 | 내담자 | 추가 회기권 충전 | ERP INCOME·매핑 부가와 연계 검토 |
| TCI (업로드+AI 리포트) | TCI 업로드 슬롯 + 리포트 | 내담자 | 업로드 권한·OCR/AI·리포트 다운로드 | `docs/psych-assessment/*` 플랜과 연동 |
| MMPI (동일 패턴) | MMPI 업로드 슬롯 + 리포트 | 내담자 | 동상 | 검사 유형만 다른 동일 상품군 |
| 향후 확장 | Big5, 문항지 기반 검사, 번들(상담+검사) | 내담자 | 유형별 fulfillment 플러그인 | **상품 타입 + fulfillment 핸들러**로 확장 |

- **SKU = 판매 단위**: 가격·세금·환불 단위·약관 버전을 SKU에 묶는다.
- **옵션**: 검사지 버전, 긴급 처리, 추가 해석 등은 **SKU 옵션** 또는 **자식 SKU**로 모델링 (초안).

---

## 3. 사용자 여정 (웹·Expo 공통)

| 단계 | 사용자 행동 | 시스템/화면 | 완료 기준(체크) |
|------|-------------|-------------|-----------------|
| 1. 카탈로그 | 카테고리·검색·필터 | PLP: 패키지/검사 탭, 테넌트 추천 | 노출 정책·가격·품절(해당 시) 반영 |
| 2. PDP | 상세 확인·FAQ·약관 | 스펙·처리 기간·환불 정책 링크 | 디지털 상품 고지 명확 |
| 3. (선택) 장바구니 | 여러 SKU 담기 | 수량·옵션·검증(동시 구매 제한) | 세션/로그인별 장바구니, tenant 일치 |
| 4. 체크아웃 | 배송지 없음·청구 요약 | 쿠폰/포인트(해당 시)·최종 금액 | 금액·약관 동의 체크 |
| 5. 결제 | PG 위젯 (Toss 등) | `orderId`, `amount`, `tenantId` 매핑 | **사전 생성 주문**과 PG 결제키 연결 |
| 6. 완료 | 영수증·주문번호 | 성공/실패 분기, 재시도 안내 | 멱등 처리·중복 결제 방지 |
| 7. 내 구매 | 주문 목록·상세 | 다운로드(리포트)·**예약/회기 연결** CTA | 미이행 시 안내 배너 |

- **웹·Expo**: 동일 **주문·결제 상태 머신**과 API; 네이티브는 딥링크로 PDP/주문상세 진입.
- **로그인**: 비로그인 장바구니는 정책에 따라 제한; 결제 직전 로그인 유도 시 `docs/project-management/SNS_SIMPLE_SIGNUP_SPEC.md`와 인접한 **가입·본인 확인** UX를 정렬한다.

---

## 4. 심리검사 특수 흐름: 후보 비교 및 권고

| 구분 | A안: 결제 후 업로드 슬롯 부여 | B안: 업로드 후 결제 |
|------|------------------------------|----------------------|
| 장점 | 미결제 파일 저장·GDPR 부담 감소, 재고(처리량) 통제 용이 | “파일 준비됨” 체감 상 결제 전환율 이론상 유리 |
| 단점 | 결제 전 파일 드랍 UX는 별도 안내 필요 | **미결제 PII 보관**·보안·보관 기간 이슈, 폐기 배치 필요 |
| 운영 | 주문 paid → entitlement 즉시 | 임시 스토리지·TTL·법무 검토 부담 |

**권고: A안 (결제 후 업로드 슬롯 부여)**  
- 디지털·민감정보 특성상 **유료 entitlement 이후에만 업로드 채널 개방**이 보안·컴플라이언스·삭제 정책이 단순하다.  
- PDP에서 **샘플·촬영 가이드**로 결제 전 이해도를 보완한다.  
- 예외가 필요하면 **“0원 주문+본인확인 후 업로드”** 같은 별도 흐름으로 분리해 정책을 명확히 한다 (본 문서 범위에서는 확장 행으로만 표시).

---

## 5. 백엔드·ERP (스킬 요지 반영 + 주문·결제 엔티티 초안)

### 5.1 ERP 스킬 요지 (`.cursor/skills/core-solution-erp/SKILL.md`)

- **confirm-payment** (`POST .../mappings/{mappingId}/confirm-payment`): `paymentMethod`, `paymentReference`, `paymentAmount` 등 — **AdminServiceImpl.confirmPayment** 경로로 **INCOME(입금 확인)** 또는 **RECEIVABLES(미수금)** 등 거래 타입 분기 (4인자·3인자 오버로드 구분).
- **confirm-deposit**: 현금 입금 확인, **INCOME** 생성 로직 재사용.
- **amount-info** (`GET .../mappings/{mappingId}/amount-info`): `packagePrice`, `paymentAmount`, `accurateAmount`, **`relatedTransactions`**, 일관성 플래그 — 기존 상담료 매핑과의 **대사**에 활용.
- **트러블슈팅 포인트**: 유효 금액 없음 스킵, **중복 INCOME 방지**, **tenantId 누락** 실패 — 신규 주문 결제에도 동일 원칙 적용.

### 5.2 주문·결제와 ERP 시점 (초안)

| 이벤트 | 주문 상태 | ERP/매핑 | 비고 |
|--------|-----------|----------|------|
| 주문 생성 | `CREATED` | 없음 | 금액 스냅샷·약관 버전 저장 |
| PG 승인 완료 | `PAID` | **상담 SKU**는 기존 매핑/패키지 흐름에 맞춰 INCOME 또는 기존 규칙 호출 | **멱등 키**로 중복 방지 |
| fulfillment 완료 | `FULFILLED` | 추가 매출 인식이 필요한 모델이면 별도 규칙 | 디지털은 대부분 PAID=이행 트리거 |
| 환불 | `REFUNDED`/`PARTIAL` | 기존 REFUND 엔티티 패턴 참고 | 부분취소는 7절 |

- **포인트 적립(존재 시)**: **PAID 확정 시점**에만 적립, 취소 시 **스틸/회수** 트랜잭션으로 ERP·포인트 원장과 **동일 주문 ID**로 묶어 충돌 방지. 주문·결제·포인트·ERP는 **사가/아웃박스 또는 단일 유스케이스**로 순서 고정(초안, DDL 확정은 구현 배치에서).
- **포인트 사용(체크아웃 차감)**: hold·멱등·환불 복구·ERP 분리 표기 등은 **[POINT_REWARD_EARN_AND_REDEEM_SPEC.md](./POINT_REWARD_EARN_AND_REDEEM_SPEC.md)** 에서 상세 정의한다.

### 5.3 엔티티 초안 (이름·관계만, DDL 비활성)

- `Product`, `ProductOption`, `PriceBook`(tenant별), `Cart`, `CartLine`
- `Order`, `OrderLine` (스냅샷: 상품명·단가·세금·SKU 코드)
- `PaymentIntent` / `Payment` (PG tid, 금액, 상태, 멱등 키)
- `Entitlement` 또는 `OrderFulfillment` (검사 업로드 슬롯, 회기권, 리포트 생성 잡)
- 기존 `CONSULTANT_CLIENT_MAPPING*` 계열과의 **외래 연결은 OrderLine 수준**에서 nullable 링크로 두어 **검사 단독 구매**와 **매핑 연동 구매**를 모두 수용 (확정은 코더·DB 리뷰).

---

## 6. 어드민 (웹 테넌트)

| 영역 | 기능 | 체크리스트 |
|------|------|------------|
| 상품 등록 | SKU, 이름, 설명, 유형(패키지/검사/회기), fulfillment 타입 | tenant 스코프, 감사 로그 |
| 가격 | 통화, 부가세 표기, 기간 한정가 | 가격 이력(버전) 권장 |
| 노출 | 카탈로그 노출 여부, 태그, 추천 순위 | 비노출 사유 |
| 재고 | 검사 **일일 처리 한도**·슬롯만 해당 (무제한 디지털은 “무제한” 명시) | 초과 시 결제 차단 또는 대기열 |
| 검사 옵션 | TCI/MMPI 구분, 리포트 언어, 처리 SLA | PDP·약관과 자동 동기 |

- **AdminCommonLayout** 등 기존 어드민 레이아웃 표준에 맞춘 별도 메뉴군으로 구성한다 (구현은 `core-coder` 위임).

---

## 7. 보안·환불·부분취소 (디지털·서비스)

| 주제 | 정책 방향 |
|------|-----------|
| 파일·PII | 전송 TLS, 저장 시 암호화·테넌트 격리, **다운로드 URL 단기 서명** |
| 접근 통제 | 리포트 다운로드는 **주문·내담자·tenant** 일치 검증 |
| 위변조 | 금액·주문 ID는 서버 확정; 클라이언트 금액 신뢰 금지 |
| 환불 | **이행 전** 전액 환불 우선; **리포트 생성 후**는 약관상 **부분 환불 불가 또는 수수료 공제** 명시 |
| 부분취소 | 번들·복수 라인 시 **라인 단위 취소** + PG 부분취소 가능 여부 반영; 불가 시 **전액 취소 후 재청구** 예외 프로세스(수기) 문서화 |
| 감사 | 관리자 환불·수동 fulfillment는 **사유 코드·이전 상태** 기록 |

---

## 8. 단계별 로드맵 및 서브에이전트 배분

### 8.1 로드맵 (단계)

| Phase | 기간 가정 | 산출 | 완료 정의 |
|-------|-------------|------|-----------|
| P0 | 설계 스프린트 | 도메인 용어·상태 머신·ERP 터치포인트 목록 | 기획·디자인 리뷰 통과 |
| P1 | 카탈로그+PDP+MVP 주문 | 단일 SKU 결제 성공, 주문내역 | 스테이징 E2E |
| P2 | 장바구니·복수 SKU·쿠폰(선택) | 결제 실패·재시도·멱등 | 회귀 시나리오 |
| P3 | 심리검사 fulfillment 연동 | 업로드 슬롯·리포트 링크 | `docs/psych-assessment/*`와 통합 테스트 |
| P4 | 어드민 상품·가격·노출 | 운영자 시나리오 | RBAC·감사 |
| P5 | 환불·부분취소·분쟁 대응 | 약관·운영 매뉴얼 | 법무 확인 |

### 8.2 분배실행 표 (core-designer / core-coder / core-tester)

| Phase | 서브에이전트 | 전달 태스크 요약 |
|-------|--------------|------------------|
| P0 UI 골격 | **core-designer** | PLP·PDP·장바구니·체크아웃·완료·내 구매 와이어; 테넌트 브랜딩 영역; 디지털 고지·약관 배치 |
| P0 정보 구조 | **core-designer** | 주문·결제·다운로드 CTA IA; Expo·웹 공통 컴포넌트 명세 |
| P1 API·도메인 | **core-coder** | Order/Payment 엔티티 초안 구현, PG 웹훅, tenant 검증, ERP 호출 분기 설계 |
| P1 프론트 | **core-coder** | StandardizedApi, 웹 카탈로그·결제 플로우 |
| P1 앱 | **core-coder** | Expo 동일 API 연동 (`docs/project-management/EXPO_NATIVE_APP_PLAN.md` 정합) |
| 전 구간 | **core-tester** | 멱등·이중 결제·tenant 교차·금액 변조·환불 시나리오; ERP `relatedTransactions` 대사 |
| P4 | **core-coder** (+필요 시 **core-designer**) | 어드민 상품·가격·노출 화면 |

- **병렬 가능**: 디자이너(P0 UI)와 코더(백엔드 스캐폴딩)는 스키마 합의만 선행되면 **동시 착수** 가능. 테스터는 P1 완료 직전 **계약 테스트** 착수.

---

## 9. 참조 링크

| 문서 | 용도 |
|------|------|
| [EXPO_NATIVE_APP_PLAN.md](./EXPO_NATIVE_APP_PLAN.md) | 네이티브 앱에서 동일 결제·주문·딥링크 흐름 정합 |
| [../psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md](../psych-assessment/PSYCH_PDF_AND_IMAGE_UPLOAD_PLAN.md) | 검사 자료 업로드·처리 파이프라인 |
| [../psych-assessment/PSYCH_UPLOAD_UI_SPEC.md](../psych-assessment/PSYCH_UPLOAD_UI_SPEC.md) | 업로드 UI·가이드 (PDP·결제 후 화면과 연결) |
| [../psych-assessment/PSYCH_UPLOAD_INTEGRATION_TEST_DESIGN.md](../psych-assessment/PSYCH_UPLOAD_INTEGRATION_TEST_DESIGN.md) | 통합 테스트 설계 |
| [../psych-assessment/PSYCH_IMAGE_OCR_REVIEW.md](../psych-assessment/PSYCH_IMAGE_OCR_REVIEW.md) | OCR·검수 흐름 (리포트 이행 품질) |
| [SNS_SIMPLE_SIGNUP_SPEC.md](./SNS_SIMPLE_SIGNUP_SPEC.md) | 결제 직전 인증·간편가입과 **인접 주제**로 흐름·용어 정렬 |
| [POINT_REWARD_EARN_AND_REDEEM_SPEC.md](./POINT_REWARD_EARN_AND_REDEEM_SPEC.md) | 포인트 **적립·체크아웃 사용(hold)·환불·ERP·어드민**; 본 문서와 상호 링크 |
| [CORE_PLANNER_DELEGATION_ORDER.md](./CORE_PLANNER_DELEGATION_ORDER.md) | 위임·테스터 게이트 |

---

## 10. 개정 이력

| 날짜 | 내용 |
|------|------|
| 2026-05-13 | 초안 — `core-planner` 산출 본문을 저장소에 반영 |
| 2026-05-13 | [POINT_REWARD_EARN_AND_REDEEM_SPEC.md](./POINT_REWARD_EARN_AND_REDEEM_SPEC.md) 링크 추가 — 포인트 사용·원장·환불 기획은 별도 문서로 정합 |
