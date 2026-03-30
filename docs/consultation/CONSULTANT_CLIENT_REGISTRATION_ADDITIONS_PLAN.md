# 상담사·내담자 등록 추가 항목 기획서

> MindGarden 상담 관리 시스템 — 주민번호·주소·상담사 자격/경력 추가 및 상담일지 내담자 정보·심리검사 리포트 연동  
> @author MindGarden | @since 2026-03-02

---

## 1. 제목·목표

- **제목**: 상담사·내담자 등록 시 주민번호(앞6+뒤1)·주소(카카오 API)·상담사 자격/경력 추가 및 상담일지 내담자 정보·심리검사 리포트 노출
- **목표**: (1) 공통으로 주민번호 입력·검증·나이/성별 계산·저장, 카카오 주소 API 연동·DB 저장 (2) 상담사만 자격증·경력사항 정리 (3) 상담일지 상단에 내담자 정보·심리검사 리포트 영역을 명확히 노출해 상담에 활용

---

## 2. 범위

### 2.1 포함

| 구분 | 내용 |
|------|------|
| **공통(상담사·내담자)** | 주민번호 앞 6자리 + 뒤 1자리 입력·검증(체크섬 권장)·나이·성별 계산·DB 저장(암호화 권장) |
| **공통** | 주소 입력 필드 추가 — 카카오 주소 API 연동, 주소·상세주소·우편번호 DB 저장 |
| **상담사만** | 자격증·경력사항 — 기존 `certification`, `work_history`(consultants) 활용 또는 스키마/폼 확장 |
| **상담일지** | 상단 내담자 정보 카드에 노출 필드 확정(이름, 나이, 성별, 주소 등) |
| **상담일지** | 심리검사 리포트 영역 표시(링크/요약/임베드 등) — `PsychAssessmentDocument.clientId` 기반 조회 연동 |

### 2.2 제외·경계

- 주민번호 전체 13자리 저장·노출은 하지 않음(앞6+뒤1만 저장, 나이/성별만 활용·노출)
- 카카오 API 이외 주소 검색 방식은 본 단계 제외
- 상담일지 본문(일지 작성 폼) 구조 변경은 최소화, 상단 정보·리포트 영역만 추가/수정

### 2.3 영향 영역

- **DB**: `users`, `consultants`, `clients` 테이블 컬럼 추가/확장
- **API**: 등록/수정 요청 DTO·응답, 내담자 정보 조회, 심리검사 리포트 목록(by clientId)
- **화면**: 상담사 등록 폼, 내담자 등록 폼, 상담일지 화면(ConsultationRecordScreen) 상단
- **역할**: ADMIN(등록·관리), CONSULTANT(상담일지 조회), CLIENT(본인 정보 수정 시)

---

## 3. 의존성·순서

| 순서 | 선행 작업 | 비고 |
|------|-----------|------|
| 1 | DB 마이그레이션(users/clients/consultants 컬럼) | Flyway 스크립트 |
| 2 | 주민번호 암호화·복호화 공통 서비스(기존 암호화 패턴 있으면 재사용) | 개인정보보호법 대응 |
| 3 | 카카오 주소 API 키·약관 동의·프론트 연동 | 키 설정, 개발자 약관 확인 |
| 4 | 등록/수정 API·DTO 반영 | ConsultantRegistrationRequest, ClientRegistrationRequest 등 |
| 5 | 상담일지용 내담자 정보·심리검사 리포트 API/연동 | clientId 기준 리포트 목록 API 필요 시 추가 |
| 6 | 프론트 등록 폼·상담일지 UI | 설계(디자이너) → 구현(코더) |

---

## 4. 상세 요구사항

### 4.1 주민번호(공통)

- **입력**: 앞 6자리(생년월일 YYMMDD) + 뒤 1자리(성별·세대 구분)
- **검증**: 형식(숫자만, 길이), 선택 시 **체크섬(뒤 7자리 중 검증자리)** 검증 권장
- **저장**: 암호화 저장 권장(개인정보보호법). 복호화는 최소 범위(관리·법적 요청 등)로 제한
- **파생**: 입력값으로 **현재 나이**·**성별** 계산 후 DB에 반영 — `User`: `birth_date`, `gender`(또는 `age_group`); `Client`: `birth_date`, `gender`(기존 필드 활용)

### 4.2 주소(공통)

- **입력**: 카카오 주소 API(주소 검색) 연동 — 주소, 상세주소, 우편번호
- **저장**: `address`, `address_detail`, `postal_code` — DTO에는 이미 있음(ConsultantRegistrationRequest, ClientRegistrationRequest). DB·엔티티에 반영 여부 확인 후 부족분 추가

### 4.3 상담사만 — 자격증·경력

- **현재**: `Consultant`: `certification`(100자), `work_history`(1000자 TEXT) 이미 존재. `ConsultantRegistrationRequest`: `qualifications`, `specialization` 등
- **정리**: 폼에서 “자격증”“경력사항” 항목을 명시적으로 매핑 — 기존 `certification`/`work_history` 활용 또는 복수 자격/경력이 필요하면 테이블·엔티티 확장 검토

### 4.4 상담일지 연동

- **내담자 정보 카드**: 현재 `ConsultationRecordScreen` — 이름, 이메일, 전화번호, 주소, 상태, 등급, 가입일 표시. **추가 노출 권장**: 나이(또는 생년월일), 성별, 상세주소/우편 필요 시. 주민번호는 **노출하지 않음**
- **심리검사 리포트**: `PsychAssessmentDocument`에 `client_id` 있음. 상담일지에서 해당 `clientId`로 문서·리포트 목록 조회 API 필요. 표시 방식: 링크(상세 페이지 이동), 요약 텍스트, 또는 임베드 중 선택 — 기획 단계에서 “링크+요약 1줄” 수준으로 정해 두고 구현 시 확정

---

## 5. DB 변경 요약

| 테이블 | 추가/변경 컬럼 | 비고 |
|--------|----------------|------|
| **users** | `rrn_encrypted` (VARCHAR/TEXT), `address`, `address_detail`, `postal_code` | 주민번호 암호화 저장; 주소 3종. birth_date, gender는 기존 컬럼에 계산값 반영 |
| **clients** | `address_detail`, `postal_code` (없을 경우 추가), 선택 시 `rrn_encrypted` | clients에는 이미 `address` 있음. 내담자 전용으로 RRN 저장할 경우에만 clients에 컬럼 추가 |
| **consultants** | (없음) | 자격·경력은 기존 `certification`, `work_history` 활용 |

- **정책**: 주민번호는 “users에만 저장” vs “내담자는 clients에도 저장” 중 하나 결정 필요. 상담일지에서 내담자 정보는 client 기준으로 조회하므로, client에 나이/성별이 있으면 되고 RRN은 user 또는 client 한 곳에만 둬도 됨.

---

## 6. 개인정보·보안

- **주민번호**: 암호화 저장 권장(AES 등 기존 프로젝트 암호화 방식 준수). 개인정보보호법상 수집·목적·보관 기간 명시.
- **노출**: 상담일지·목록·API 응답에서 주민번호 원문 또는 앞6+뒤1 마스킹 없이 노출하지 않음. 나이·성별만 노출.
- **접근**: 조회/수정 권한은 역할별 제한(ADMIN, 본인, 담당 상담사 등) 유지.

---

## 7. Phase 목록 및 실행 위임

| Phase | 담당 서브에이전트 | 목표 | 호출 시 전달할 태스크 설명 초안 |
|-------|-------------------|------|--------------------------------|
| **Phase 0** | **explore** | DB·엔티티·DTO·상담일지·심리검사 API 현재 구조 확인 | “users, clients, consultants 엔티티와 ConsultantRegistrationRequest, ClientRegistrationRequest DTO, ConsultationRecordScreen, PsychAssessmentDocument·Report·clientId 조회 API를 검색해, 주민번호·주소·자격/경력·상담일지 내담자 정보·리포트 연동에 필요한 파일 목록과 현재 필드/엔드포인트를 요약해 주세요.” |
| **Phase 1** | **core-designer** | 등록 폼(상담사/내담자) 주민번호·주소·자격/경력 UI 및 상담일지 상단 내담자 정보·심리검사 영역 레이아웃 설계 | “docs/consultation/CONSULTANT_CLIENT_REGISTRATION_ADDITIONS_PLAN.md와 §8 디자이너 전달 사양을 참고해, (1) 상담사/내담자 등록 폼에 넣을 주민번호(앞6+뒤1)·주소(카카오 API)·상담사만 자격증·경력 입력 항목의 라벨·placeholder·검증 메시지·배치 (2) 상담일지 상단 내담자 정보 카드에 나이·성별·주소 보강과 심리검사 리포트 영역(링크/요약) 배치를 설계해 주세요. 사용성·정보 노출 범위·레이아웃 요구는 기획서 §8을 따릅니다. AdminCommonLayout·B0KlA·unified-design-tokens.css를 참조하고, 코드 작성 없이 시안·스펙으로 산출해 주세요.” |
| **Phase 2** | **core-coder** | DB 마이그레이션·엔티티·DTO·API·주민번호 검증·암호화·카카오 연동·등록 로직 | “기획서 docs/consultation/CONSULTANT_CLIENT_REGISTRATION_ADDITIONS_PLAN.md와 §9 코더 전달 목록을 참고해, (1) Flyway 마이그레이션(users/clients 컬럼), (2) User/Client/Consultant 엔티티 및 ConsultantRegistrationRequest, ClientRegistrationRequest DTO 수정, (3) 주민번호 앞6+뒤1 검증(체크섬 권장)·나이/성별 계산·암호화 저장, (4) 카카오 주소 API 연동(프론트), (5) 상담사 자격증·경력 저장(기존 certification/work_history 매핑), (6) 상담일지용 내담자 정보·clientId 기준 심리검사 리포트 목록 API 필요 시 추가. /core-solution-backend, /core-solution-database-first, /core-solution-multi-tenant를 준수해 주세요.” |
| **Phase 3** | **core-coder** | 프론트: 등록 폼 입력 항목·상담일지 상단 카드·심리검사 영역 | “Phase 1 디자이너 산출물과 기획서를 참고해, 상담사/내담자 등록 폼에 주민번호(앞6+뒤1)·주소(카카오)·자격/경력(상담사만) 반영하고, ConsultationRecordScreen 상단 내담자 정보(나이·성별·주소 등)와 심리검사 리포트 영역(링크 또는 요약)을 구현해 주세요. StandardizedApi·unified-design-tokens·AdminCommonLayout 적용. /core-solution-frontend, /core-solution-atomic-design를 준수해 주세요.” |
| **Phase 4** | **core-tester** | 단위·통합·E2E 시나리오 | “주민번호 검증·나이/성별 계산, 등록 API(상담사/내담자), 상담일지 내담자 정보·심리검사 리포트 노출 시나리오에 대한 단위·통합·필요 시 E2E 테스트를 설계·작성해 주세요. /core-solution-testing 적용.” |

- **설계 우선**: Phase 1(core-designer) 완료 후 Phase 2·3(core-coder) 진행. Phase 0(explore)는 필요 시 병렬로 “심리검사 clientId API”만 별도 조사 가능.

---

## 8. 디자이너 전달 사양(요약)

- **사용성**: 상담사/내담자 등록 시 필수·선택 구분, 주민번호는 숫자만 입력(자동 포맷 가능), 주소는 “주소 찾기” 버튼으로 카카오 API 호출 후 상세주소만 직접 입력.
- **정보 노출**: 상담일지에서는 주민번호 미노출. 나이·성별·주소(상세·우편 포함 여부 정책에 따라) 노출. 심리검사는 “있으면 링크/요약”만 노출.
- **레이아웃**: 등록 폼 — 기존 필드 아래 또는 섹션 구분 후 주민번호(앞6-뒤1), 주소(검색+상세+우편), 상담사만 자격증·경력 블록. 상담일지 — 기존 “내담자 정보” 카드 아래 또는 옆에 “심리검사 리포트” 블록(목록·링크).
- **검증·라벨**: 주민번호 “앞 6자리”“뒤 1자리”, placeholder 예시, 오류 메시지(형식 오류, 체크섬 오류). 주소 “주소 검색”“상세 주소”“우편번호”.

---

## 9. 코더 전달 — 변경 대상 파일 목록(참고)

- **DB**: `src/main/resources/db/migration/VYYYYMMDD_xxx__add_rrn_address_consultant_client.sql` (신규)
- **엔티티**: `User.java`, `Client.java`, `Consultant.java` (필드 추가/매핑)
- **DTO**: `ConsultantRegistrationRequest.java`, `ClientRegistrationRequest.java`, 내담자 정보 응답 DTO(이름·나이·성별·주소 등)
- **서비스**: 주민번호 검증·나이/성별 계산 유틸 또는 서비스, 암호화 저장(기존 암호화 서비스 재사용), 등록 서비스(Consultant/Client 생성·갱신)
- **API**: 등록/수정 컨트롤러, 상담일지용 내담자 정보 조회, `clientId` 기준 심리검사 문서/리포트 목록(필요 시 `PsychAssessmentController` 또는 별도 컨트롤러)
- **프론트**: 상담사 등록 폼·내담자 등록 폼 컴포넌트, 주소 입력(카카오 API 연동) 공통 컴포넌트, `ConsultationRecordScreen.js`(내담자 정보 카드·심리검사 리포트 영역)
- **설정**: 카카오 API 키(환경 변수 또는 설정 테이블), `application.yml` 등

---

## 10. 리스크·제약

- **카카오 API**: 키 발급·약관·일일 호출 한도. 프론트에서만 호출 시 CORS·도메인 제한 확인.
- **주민번호 체크섬**: 뒤 7자리 전체가 아닌 “앞6+뒤1”만 받을 경우 검증 공식이 제한적일 수 있음 — 검증 수준(형식만 vs 체크섬) 사전 결정.
- **정책**: 내담자만 주민번호/주소 수집 vs 상담사도 수집 — 정책 확정 후 users/clients 반영 범위 결정.
- **기존 데이터**: 마이그레이션 시 기존 행에 대해 `rrn_encrypted`, 주소 계열 NULL 허용.

---

## 11. 단계별 완료 기준·체크리스트

| 단계 | 완료 기준 | 체크리스트 |
|------|-----------|-------------|
| Phase 0 | 조사 산출물 공유 | users/clients/consultants 필드·DTO·상담일지·심리검사 clientId 조회 가능 여부 요약 |
| Phase 1 | 설계 산출물 공유 | 등록 폼 필드·레이아웃·상담일지 내담자·리포트 영역 스펙 또는 시안, 코더가 구현 가능한 수준 |
| Phase 2 | 백엔드 반영 | 마이그레이션 적용, 등록/수정 시 주민번호·주소·자격/경력 저장, 내담자 정보·리포트 API 동작 |
| Phase 3 | 프론트 반영 | 등록 폼 입력·저장, 상담일지 상단 내담자 정보·심리검사 영역 노출 |
| Phase 4 | 테스트 | 주민번호 검증·나이/성별·등록·상담일지 조회 시나리오 자동화 또는 수동 시나리오 정리 |

---

## 12. 검토 포인트·추가 제안(회의용)

- **주민번호 수집 범위**: 상담사도 주민번호를 받을지, 내담자만 받을지 정책 확정 필요. 상담일지 “내담자 정보”에는 내담자만 노출하므로, 상담사 RRN은 인사·세금 등 다른 목적이 있을 때만 수집.
- **주민번호 검증 수준**: “앞6+뒤1”만 받을 경우 체크섬으로 유효성 검사가 불완전할 수 있음. 형식만 검증할지, 가능한 범위에서 체크섬을 적용할지 결정.
- **카카오 API 키·약관**: 개발/운영 키 분리, 이용약관·개인정보 처리 방침 링크 노출 여부, 프론트 단일 연동 vs 백엔드 프록시 여부.
- **심리검사 리포트 표시**: “링크만” vs “요약 1~2줄 + 링크” vs “모달/드로어로 요약 임베드”. 상담 중 참고 편의성과 개인정보 노출 범위 균형.
- **clients 주소**: 현재 `Client`에 `address`만 있고 `address_detail`, `postal_code` 없음. DTO에는 있으므로 DB·엔티티에 두 컬럼 추가 필요.
- **암호화**: 기존 User 이메일/이름 등 암호화 패턴이 있으면 동일 방식으로 RRN 암호화 저장 권장.

---

## 13. 실행 요청문(서브에이전트 호출 시)

다음 순서로 서브에이전트를 호출해 주세요.

1. **Phase 0 (explore)**  
   - 서브에이전트: **explore**  
   - 전달 프롬프트: 위 Phase 0 “호출 시 전달할 태스크 설명 초안” 내용으로, DB·엔티티·DTO·상담일지·심리검사 clientId 관련 파일·엔드포인트 요약 요청.

2. **Phase 1 (core-designer)**  
   - 서브에이전트: **core-designer**  
   - 전달 프롬프트: 본 기획서 §8 및 Phase 1 태스크 설명. 화면설계서 경로 `docs/consultation/CONSULTANT_CLIENT_REGISTRATION_ADDITIONS_PLAN.md` 및 사용성·정보 노출·레이아웃 요구 포함.

3. **Phase 2 (core-coder)**  
   - 서브에이전트: **core-coder**  
   - 전달 프롬프트: 기획서 §9 및 Phase 2 태스크 설명. DB·백엔드·암호화·API 구현.

4. **Phase 3 (core-coder)**  
   - 서브에이전트: **core-coder**  
   - 전달 프롬프트: Phase 1 산출물 기준으로 프론트 등록 폼·상담일지 UI 구현.

5. **Phase 4 (core-tester)**  
   - 서브에이전트: **core-tester**  
   - 전달 프롬프트: Phase 4 태스크 설명. 단위·통합·E2E 시나리오 작성·실행.

Phase 1 완료 후 Phase 2·3을 진행하고, 필요 시 Phase 0 결과로 §9 파일 목록을 보완해 코더에 전달하면 됩니다.
