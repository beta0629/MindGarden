# 상담사 배지 수정 기능 제안서

**작성:** core-component-manager (조사·제안만, 코드 미작성)  
**참조:** core-solution-encapsulation-modularization, 아토믹 디자인  
**목적:** “상담사 배지를 수정 가능하게” 요청에 대한 현재 상태 조사·범위 정리·UI 위치 제안

---

## 1. 상담사 레벨/배지 정의·사용 위치

### 1.1 표시용 레벨 (연차 기반, 프론트 전용)

| 구분 | 위치 | 설명 |
|------|------|------|
| **함수** | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` | `getConsultantLevel(consultant)` — `consultant.yearsOfExperience` 기준으로 `{ label, level }` 반환 |
| **규칙** | 동일 파일 10~15행 | `yearsOfExperience`: 0~2 → 주니어(junior), 3~5 → 매니어(manier), 6+ → 시니어(senior) |
| **배지 클래스** | `frontend/src/components/admin/ProfileCard.css` | `.mg-v2-consultant-level-badge`, `--junior` / `--manier` / `--senior` (색상·배경) |
| **사용처** | ConsultantComprehensiveManagement.js | 매칭 리스트 그리드 내 상담사 프로필 카드 헤더 배지 영역 2곳(약 1097행, 1253행) — `getConsultantLevel(consultant)` 결과로 `label` 표시, `level`로 BEM modifier 적용 |

배지 텍스트("주니어 상담사" 등)와 클래스(junior/manier/senior)는 **현재 전부 위 함수의 연차 기반 결과**로만 결정됨.

### 1.2 DB·공통코드 기반 등급(grade)

| 구분 | 위치 | 설명 |
|------|------|------|
| **엔티티** | `User` (상속: `Consultant`) | `grade` 컬럼 (length 30), 인덱스 `idx_users_grade` / `idx_consultants_grade` |
| **값** | 공통코드 그룹 `CONSULTANT_GRADE` | CONSULTANT_JUNIOR, CONSULTANT_SENIOR, CONSULTANT_EXPERT, CONSULTANT_MASTER (CodeInitializationServiceImpl, commonCodeUtils 등) |
| **한글 라벨** | commonCodeUtils.getGradeKoreanName, SalaryProfileFormModal 기본값 | 주니어/시니어/엑스퍼트/마스터 상담사 |
| **API** | AdminController | `PUT /api/admin/consultants/{id}/grade` → `AdminService.updateConsultantGrade(id, grade)` |
| **사용처** | ERP 급여(SalaryProfileFormModal), AdminServiceImpl.getAllConsultantsWithSpecialty(grade·gradeColor·gradeIcon 반환), 통계/대시보드 등 |

즉, **저장·급여·통계용 등급(grade)** 은 DB와 API가 이미 갖춰져 있음.

### 1.3 정리

- **카드 배지**: 현재는 **연차 기반** `getConsultantLevel`만 사용 → DB `grade`와 **연동되지 않음**.
- **등급(grade)** : DB 저장·수정 API·공통코드·ERP 연동까지 이미 존재.
- **목록 API**: `GET /api/v1/admin/consultants/with-stats` → `ConsultantStatsServiceImpl.convertConsultantToMap` 에는 **grade, yearsOfExperience 미포함**. 따라서 목록에서 오는 `consultant` 객체에는 두 값이 없을 수 있고, 현재는 `yearsOfExperience`가 없으면 0으로 취급되어 배지가 항상 “주니어 상담사”로 나올 수 있음.

---

## 2. 범위 정리 (표시만 vs DB 저장)

| 구분 | 현재 상태 | 비고 |
|------|-----------|------|
| **표시만 변경 (프론트 only)** | 가능. 단, 현재 카드 배지는 연차 기반 함수만 사용하므로 “수정”이라기보다 라벨/연차 규칙 변경에 가깝고, DB와 불일치 가능. | 실무적으로는 “배지 수정 = 등급 변경”으로 보는 편이 자연스러움. |
| **DB 저장까지** | **이미 가능.** `User`/`Consultant.grade` 필드와 `PUT /api/admin/consultants/{id}/grade` 존재. ERP·급여·통계에서 사용 중. | 배지 수정 = 이 API로 `grade` 변경 + 목록/카드에서 `grade` 기반 표시로 통일하는 방향 권장. |

**제안:**  
“배지 수정”을 **DB 등급(grade) 수정**으로 정의하고,  
- 목록 API 응답에 `grade`(필요 시 `yearsOfExperience`) 포함  
- 카드 배지는 **grade 기준**으로 표시하거나, 정책에 따라 grade 우선·연차 보조 등 한 가지로 정해 사용  
- 기존 `getConsultantLevel`는 grade 기반으로 교체하거나, “표시용 레벨”과 “DB 등급” 매핑을 한 곳에서만 쓰이도록 정리.

---

## 3. UI 위치 제안

### (A) 카드 배지 클릭 시 드롭다운/팝오버로 선택

- **설명:** 매칭 리스트 그리드의 상담사 카드에서 배지 영역 클릭 → 등급 옵션(CONSULTANT_GRADE 공통코드) 드롭다운/팝오버 표시 → 선택 시 `PUT /consultants/{id}/grade` 호출 후 목록 갱신.
- **장점:** 카드만 보고 바로 수정 가능, 컨텍스트 유지.
- **단점:** 터치·접근성(키보드/스크린리더), 실수 클릭 시 변경 가능성 있음 → 확인 단계 권장.

### (B) 상담사 수정 모달 내 등급(레벨) 필드

- **설명:** 기존 “상담사 정보 수정” 모달(ConsultantComprehensiveManagement)에 등급(grade) 선택 필드 추가. 저장 시 기존 update API 또는 `PUT /consultants/{id}/grade` 호출.
- **장점:** 다른 개인정보·설정과 함께 한 곳에서 수정, 실수 변경 적고 접근성·일관성 유지.
- **단점:** 배지만 바꾸려 해도 모달을 열어야 함.

**권장:**  
- **주요 수정 경로:** (B) 상담사 수정 모달에 등급 필드 추가.  
- **보조:** 리스트에서 빠른 변경이 필요하면 (A)를 추가(예: 관리자 전용 툴팁/버튼으로 “등급 변경” 진입 후 선택).  
- (B)만 해도 “배지 수정 가능” 요구는 충족 가능.

---

## 4. 캡슐화·아토믹 디자인 관점

- **배지 표시:**  
  - “등급(grade) → 라벨·클래스” 변환은 한 곳(유틸 또는 Molecules 배지 컴포넌트)에서만 수행해, `getConsultantLevel` 연차 전용과 혼재하지 않도록 정리 권장.
- **등급 선택 UI:**  
  - 공통코드 `CONSULTANT_GRADE` 기반 선택 컴포넌트를 Atoms/Molecules로 두고, 모달·카드 드롭다운 모두에서 재사용하면 일관성·유지보수에 유리 (core-solution-encapsulation-modularization 스킬 참고).

---

## 5. core-coder / core-planner 참고 사항

- **백엔드:**  
  - `ConsultantStatsServiceImpl.convertConsultantToMap`에 `grade`(및 필요 시 `yearsOfExperience`) 추가 시, 목록에서 배지를 grade 기반으로 그릴 수 있음.  
  - 등급 변경 시 캐시(`consultantsWithStats`) 무효화 여부 검토(이미 `updateConsultantGrade` 호출부에서 캐시 제거 여부 확인 권장).
- **프론트:**  
  - ConsultantComprehensiveManagement: 카드 배지에 사용하는 데이터를 `consultant.grade` 기준으로 전환하고, 공통코드 라벨/스타일 매핑 한 곳에서 사용.  
  - 상담사 수정 모달 `formData`에 `grade` 추가, 저장 시 기존 update 또는 `PUT /consultants/{id}/grade` 호출.  
- **코드 작성·수정:**  
  - 본 문서는 제안만 포함하며, 실제 반영은 **core-coder**가 수행.

---

**문서 끝.**
