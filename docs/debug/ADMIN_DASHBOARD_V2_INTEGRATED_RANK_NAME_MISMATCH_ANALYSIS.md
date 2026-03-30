# AdminDashboardV2 "상담사 별 통합데이터" 순위 목록 불일치·이름 오표시 원인 분석

**작성일**: 2026-03-18  
**담당**: core-debugger  
**목적**: (1) 카드 목록과 순위 목록 대상/순서 불일치, (2) 3·4위 "상담사"만 표시되는 문제의 원인 분석 및 수정 방향 제안. 코드 수정은 core-coder 위임.

---

## 1. 증상 요약

| 구분 | 내용 |
|------|------|
| **카드 목록** | GET `/api/v1/admin/consultants/with-vacation` 기준 4명( test11, 테스트 상담사, 김선희, 이가든 ) 이름 정상 표시 |
| **순위 목록** | `consultationStats.consultantStatistics` + `consultantRatingStats.topConsultants`를 **consultantName 기준 머지·정렬**해 상위 10명 표시. 1위 김선희, 2위 테스트 상담사, **3·4위 "상담사"만** 표시됨 |
| **마스킹** | `maskEncryptedDisplay(value, '상담사')`: value가 null/빈값, `legacy::` 접두사, 또는 Base64 형태 암호문이면 fallback `"상담사"` 반환 (`frontend/src/utils/codeHelper.js`) |

---

## 2. 원인 분석 요약

### 2.1 목록 불일치 원인

- **(a) 데이터 소스·정렬 기준 상이**  
  - **카드 목록**: `with-vacation` API만 사용. 응답 순서 = `findActiveConsultantsByTenantId(tenantId)` 반환 순서(예: ID/생성일 등).  
  - **순위 목록**: `consultation-completion`의 `statistics` + `consultant-rating-stats`의 `topConsultants`를 **consultantName**을 키로 머지한 뒤, **완료 건수(내림차) → 평점(내림차)**로 정렬해 상위 10명만 사용.  
  → 카드는 "전체 활성 상담사·API 기본 순서", 순위는 "통계가 있는 상담사·완료건수·평점 순"이라 **대상 집합과 정렬이 원천적으로 다름**.

- **(b) consultantName 기준 머지로 인한 부작용**  
  - 프론트 `consultantIntegratedData`는 **이름(consultantName)**을 `Map` 키로 사용 (`AdminDashboardV2.js` 767~800라인).  
  - **동명이인**이 있으면 한 행으로 합쳐짐.  
  - **이름이 암호문/legacy**인 경우: API별로 서로 다른 raw 문자열(`legacy::xxx`, Base64 등)이 오면 키가 달라 별도 행이 되지만, **표시는 모두 `maskEncryptedDisplay`로 "상담사"**가 됨.  
  → 같은 사람이라도 카드(복호화된 이름)와 순위(비복호화 이름)에서 서로 다른 키로 취급되거나, 순위만 보면 누가 3·4위인지 구분 불가.

- **(c) API별 상담사명 복호화 여부 차이**  
  - **with-vacation**: `AdminServiceImpl.getAllConsultantsWithVacationInfo`에서 `userPersonalDataCacheService.getDecryptedUserData(consultant)` 또는 `encryptionUtil.safeDecrypt(consultant.getName())`으로 **복호화된 이름** 반환 (`name` 필드).  
  - **consultation-completion**: `AdminServiceImpl.getConsultationCompletionStatistics`에서 `consultant.getName()` **그대로** `consultantName`에 넣음(복호화 없음).  
  - **consultant-rating-stats**: `ConsultantRatingServiceImpl.getConsultantRanking`에서 `consultant.getName()` **그대로** `consultantName`에 넣음(복호화 없음).  
  → 카드 목록은 복호화된 이름, 순위 목록은 DB 저장값(legacy/암호문) 그대로라 **같은 사람이 카드에서는 실명, 순위에서는 "상담사"로만 보일 수 있음**.

### 2.2 3·4위 "상담사"만 보이는 원인

- **consultation-completion**·**consultant-rating-stats** 두 API 모두 상담사명을 **복호화하지 않고** `User#getName()`만 내려줌.
- DB에 `legacy::...` 또는 Base64 암호문으로만 저장된 상담사(3·4위 해당자)는:
  - API 응답의 `consultantName`이 그대로 legacy/암호문으로 전달되고,
  - 프론트 `maskEncryptedDisplay(row.consultantName, '상담사')`에서 조건(`legacy::` 또는 Base64 패턴)에 걸려 **fallback "상담사"**만 표시됨.
- **순위만으로는 3·4위가 누구인지 구분 불가**한 상태가 됨.

---

## 3. 데이터 흐름 정리

| 구분 | API | 백엔드 메서드 | consultantName 출처 |
|------|-----|----------------|---------------------|
| 카드 목록 | GET `/api/v1/admin/consultants/with-vacation` | `AdminServiceImpl.getAllConsultantsWithVacationInfo` | 복호화(`getDecryptedUserData` / `safeDecrypt`) → `name` |
| 완료 통계 | GET `/api/v1/admin/statistics/consultation-completion` | `AdminServiceImpl.getConsultationCompletionStatistics` | `consultant.getName()` 그대로 → `consultantName` |
| 평점 순위 | GET `/api/v1/admin/consultant-rating-stats` | `ConsultantRatingServiceImpl.getConsultantRanking` | `consultant.getName()` 그대로 → `consultantName` |

- 프론트 순위 목록: 위 두 통계를 **consultantName** 키로 머지 후 완료건수·평점 정렬 (`AdminDashboardV2.js` 763~800).

---

## 4. 재현·확인 포인트 (로그/네트워크)

- **Network 탭**  
  - `consultation-completion` 응답의 `data.statistics[].consultantName`: 3·4위 해당 인덱스가 `legacy::` 또는 긴 Base64 문자열인지 확인.  
  - `consultant-rating-stats` 응답의 `data.topConsultants[].consultantName`: 동일 확인.  
  - `with-vacation` 응답의 `data.consultants[].name`: 동일 테넌트 상담사는 복호화된 한글/영문 이름인지 확인.
- **콘솔**  
  - `AdminDashboardV2.js` 467~474라인 부근 `consultation-completion payload` 로그에서 `statistics` 배열의 `consultantName` 값 확인.
- **DB(선택)**  
  - 3·4위로 추정되는 상담사 ID의 `users.name` 컬럼이 `legacy::` 또는 암호문 형태인지 확인 (shell 서브에이전트로 읽기 전용 쿼리).

---

## 5. 수정 방향 제안 (core-coder 전달용)

### 5.1 백엔드 (권장: 통계 API에서 복호화된 이름 제공)

- **목표**: 순위/통계 API에서도 with-vacation과 동일하게 **복호화된 상담사명**을 내려주어, 프론트에서 3·4위도 실명으로 표시되도록 함.
- **파일·메서드**  
  1. **`AdminServiceImpl.getConsultationCompletionStatistics`**  
     - 위치: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java` (약 4382라인).  
     - 현재: `consultantStats.put("consultantName", consultant.getName());`  
     - 변경: with-vacation과 동일하게 `userPersonalDataCacheService.getDecryptedUserData(consultant)` 또는 `encryptionUtil.safeDecrypt(consultant.getName())`으로 복호화한 값을 `consultantName`에 넣기. 실패 시 기존처럼 `consultant.getName()` 또는 "알 수 없음" fallback.
  2. **`ConsultantRatingServiceImpl.getConsultantRanking`**  
     - 위치: `src/main/java/com/coresolution/consultation/service/impl/ConsultantRatingServiceImpl.java` (약 373라인).  
     - 현재: `rankingInfo.put("consultantName", consultant.getName());`  
     - 변경: 동일하게 복호화 후 `consultantName` 설정. (AdminServiceImpl과 동일한 유틸/캐시 사용 가능한지 프로젝트 구조에 맞게 적용.)
- **참고**: 이미 `AdminServiceImpl`에서 `userPersonalDataCacheService`, `PersonalDataEncryptionUtil` 사용 중이므로, ConsultantRatingServiceImpl에서도 동일한 복호화 패턴 또는 AdminService 경유 조회를 적용하면 됨.

### 5.2 프론트엔드 (보조: consultantId 기준 머지 + 이름은 카드 목록과 매칭)

- **목표**: 순위 목록의 "대상/순서"를 카드와 혼동하지 않도록 하고, 이름은 가능하면 카드용 API와 ID로 맞춰서 표시.
- **방안**  
  - **consultantId 기준 머지·정렬**: `consultantIntegratedData` 생성 시 `consultantName` 대신 **consultantId**를 Map 키로 사용해 머지.  
  - **이름 표시**:  
    - (A) 백엔드에서 복호화된 이름을 주면 그대로 사용.  
    - (B) 또는 상담사 카드용으로 이미 로드한 `consultants`(with-vacation)와 **consultantId**로 매칭해, 매칭된 항목의 `name`을 순위 테이블/차트에 사용.  
  - 이렇게 하면 동명이인은 별도 행으로 유지되고, 3·4위도 ID로 매칭된 실명으로 표시 가능.
- **파일**: `frontend/src/components/dashboard-v2/AdminDashboardV2.js`  
  - 767~800라인: `byName` → `byConsultantId` 등으로 변경, 키를 `consultantId`로, 값에 `consultantName`은 통계 API 응답 또는 나중에 카드 목록으로 보정.  
  - 1352, 1373, 1433 등: `row.consultantName` 대신 카드 목록 매칭 결과 또는 그대로 사용(백엔드 복호화 적용 시).

### 5.3 권장 조합

- **1차**: 백엔드에서 **consultation-completion**·**consultant-rating-stats** 모두 **복호화된 consultantName** 제공 (위 5.1).  
  → 3·4위 "상담사" 문제 해소, 기존 프론트 머지 로직만으로도 이름 표시 개선.
- **2차(선택)**: 프론트에서 **consultantId 기준 머지**로 통일하고, 이름은 (가능하면) with-vacation 기반 `consultants`와 consultantId 매칭해 표시.  
  → 카드와 순위의 "같은 사람" 인식 일치, 동명이인 처리 명확.

---

## 6. 수정 후 체크리스트

- [ ] `consultation-completion` 응답의 `statistics[].consultantName`이 legacy/암호문이 아닌 복호화된 값인지 확인.
- [ ] `consultant-rating-stats` 응답의 `topConsultants[].consultantName` 동일 확인.
- [ ] Admin 대시보드 V2에서 "상담사 별 통합데이터" 순위 목록 3·4위에 실명(또는 의도한 마스킹)이 표시되는지 확인.
- [ ] 카드 목록(4명)과 순위 목록의 "대상"이 서로 다른 의도(전체 vs 통계 있음)임을 전제로, 정렬만 완료건수·평점 기준으로 일관되는지 확인.
- [ ] (프론트 consultantId 머지 적용 시) consultantId가 null인 항목 처리(이름만 표시 또는 "알 수 없음") 확인.

---

## 7. core-coder용 태스크 설명 초안

> **AdminDashboardV2 "상담사 별 통합데이터" 순위 목록 이름·목록 불일치 수정**
>
> 1. **백엔드**  
>    - `AdminServiceImpl.getConsultationCompletionStatistics`: 상담사별 통계의 `consultantName`을 복호화해 넣기. (userPersonalDataCacheService 또는 PersonalDataEncryptionUtil.safeDecrypt 사용, with-vacation과 동일 패턴.)  
>    - `ConsultantRatingServiceImpl.getConsultantRanking`: topConsultants의 `consultantName`을 동일하게 복호화해 넣기.  
> 2. **프론트(선택)**  
>    - `AdminDashboardV2.js`의 consultantIntegratedData를 consultantName 대신 **consultantId** 기준으로 머지·정렬하도록 변경.  
>    - 표시 이름은 통계 API의 복호화된 consultantName 사용 또는, 이미 로드한 with-vacation `consultants`와 consultantId로 매칭한 `name` 사용.  
> 3. **검증**  
>    - consultation-completion / consultant-rating-stats 응답에서 consultantName이 복호화된 값인지 확인.  
>    - 대시보드에서 3·4위에 실명이 표시되는지 확인.  
>
> 상세 경로·라인·체크리스트는 `docs/debug/ADMIN_DASHBOARD_V2_INTEGRATED_RANK_NAME_MISMATCH_ANALYSIS.md` 참고.

---

**문서 끝.**
