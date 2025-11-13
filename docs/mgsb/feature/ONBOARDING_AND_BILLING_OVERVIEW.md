# 온보딩 & 자동결제 통합 개요 (Draft)

작성일: 2025-11-13  
작성자: 운영 포털 v1 팀

---

## 1. 목적
MindGarden SaaS 상용화를 위한 **외부 온보딩 신청 → 정기 결제 → 운영 승인 → 테넌트 활성화**까지의 전 과정을 한눈에 정리하고, 각 단계별 세부 문서 및 구현 계획을 연결한다.

---

## 2. End-to-End 서비스 여정

| 단계 | 주체 | 설명 | 관련 문서/시스템 |
| --- | --- | --- | --- |
| 1. 랜딩 & 상품 소개 | 입점사/지점 담당자 | 요금제 소개, FAQ, 데모 신청 | (추가 예정) `LANDING_PAGE_PLAN.md` |
| 2. 온보딩 신청 + 결제 등록 | 입점사/지점 담당자 | 폼 입력, 요금제/애드온 선택, 카드 정보 입력(PG 토큰화) | `ONBOARDING_REGISTRATION_PLAN.md` |
| 3. 신청/결제 데이터 저장 | 백엔드 | `POST /onboarding/requests`, `POST /billing/subscribe` 등 API 처리 | API 스펙 (추가 예정) |
| 4. 운영팀 승인 | HQ 운영팀 | `/onboarding` 화면에서 심사/결정, 알림 발송 | Ops 포털 |
| 5. 테넌트 활성화 & 결제 개시 | 시스템 | 승인 시 테넌트 생성, 구독 상태 Active, 정기 결제 배치 시작 | `BILLING_DOMAIN_DESIGN.md` |
| 6. 운영/정산 | HQ 운영팀 & 시스템 | 결제 실패 재처리, 영수증 발행, 정산 리포트 | Billing 도메인 문서, 결제 배치 |

※ 향후 단계: 고객 앱과의 연동, SSO 기반 로그인, 결제 실패 알림/대시보드, 구독 변경/취소 UI 등.

---

## 3. 기술 아키텍처 개요

### 3.1 프런트엔드 레이어
- **External Landing & Onboarding UI**: Next.js 기반 공개 페이지, SEO 대응, PG SDK 연동
- **Ops Portal**: 내부 심사 및 관리 (기존 프로젝트), 인증 강화(SSO 예정)

### 3.2 백엔드 레이어
- **Onboarding API**: 신청 데이터 수집 (`POST /api/v1/onboarding/requests`)
- **Billing/Subscription API**: 결제 토큰 저장, 구독 상태 관리, 정기 결제 스케줄링
- **PG Integration**: Stripe/토스페이먼츠 등 선택, 토큰화 방식으로 카드 정보 저장 금지
- **배치/스케줄러**: 매월 결제 실행, 재시도 정책, 알림 트리거

### 3.3 데이터 & 인프라
- **DB**: 멀티테넌시 구조 + 결제/구독 테이블 확장
- **이벤트/알림**: Slack/메일, 향후 Ops 대시보드 알림
- **CI/CD & IaC**: 기존 파이프라인 활용, 신규 프런트/백엔드 서비스 추가 시 관리

### 3.4 인증/보안
- 초기: 임시 관리자 계정(OPS_ADMIN) 및 JWT
- 단계적 전환: MindGarden SSO(OIDC), HttpOnly/Secure 쿠키, 권한/역할 연계
- 결제 정보: PG 토큰 방식, PCI DSS 준수

---

## 4. 관련 문서 맵

| 카테고리 | 문서 |
| --- | --- |
| 온보딩 신청 UX/기능 | `docs/mgsb/internal-ops/feature/ONBOARDING_REGISTRATION_PLAN.md` |
| 결제·구독 도메인 설계 | `docs/mgsb/feature/BILLING_DOMAIN_DESIGN.md` |
| PG 연동 가이드 | `docs/mgsb/feature/PG_INTEGRATION_GUIDE.md` |
| 운영 SOP | `docs/mgsb/feature/OPS_SOP_ONBOARDING_BILLING.md` |
| 플랫폼 로드맵 | `docs/mgsb/PLATFORM_ROADMAP.md` |
| 운영 포털 기능 | `docs/mgsb/internal-ops/phase1/functional-spec.md` |
| 환경/인프라 | `docs/mgsb/internal-ops/ENV_SETUP.md`, `docs/mgsb/ARCHITECTURE_OVERVIEW.md` |
| 향후 작성 예정 | 결제/구독 도메인 설계, PG 연동 가이드, 운영 프로세스 문서 |

---

## 5. 로드맵 포지셔닝
- **T0 (2025 Q4)**: Ops 포털 Phase 1 안정화
- **T1 (2026 Q1)**: 운영 자동화 & 품질 강화
- **T1.5 (2026 Q1~Q2)**: 외부 온보딩 + 자동결제 상용화 (본 문서 범위)
- **T2 이후**: 업종 확대, AI/자동화 고도화

상세한 항목은 `docs/mgsb/PLATFORM_ROADMAP.md` 참고.

---

## 6. 향후 세부 문서 계획
1. **결제/구독 도메인 설계서** (Billing Domain Design)  
   - 구독 상태머신, 결제 로그, 배치 스케줄링, 실패 처리
2. **PG 연동 가이드** (Payment Gateway Integration)  
   - PG 선택, 토큰화 플로우, 샌드박스 테스트 계획
3. **운영 프로세스 문서** (Ops SOP)  
   - 승인 절차, 알림, 영수증/세금계산서, 고객 커뮤니케이션
4. **Landing/홍보 페이지 계획**  
   - 마케팅 메시지, SEO, A/B 테스트 지표

---

## 7. 다음 액션
1. 본 개요 문서를 팀 내 공유 → 피드백 수집
2. Billing/PG 설계 문서 초안 작성 착수
3. 온보딩 등록 페이지와 Ops 포털 간 인터페이스 정의 확정
4. 로드맵(T1.5) 기반으로 스프린트 계획 수립 및 티켓 분해

---


