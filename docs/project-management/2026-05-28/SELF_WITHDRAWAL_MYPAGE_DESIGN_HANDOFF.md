# 자발 회원탈퇴 (Self-Withdrawal) 마이페이지 UI/UX 디자인 스펙

## 1. 개요 및 배경
본 문서는 사용자(CLIENT/CONSULTANT)가 마이페이지에서 스스로 회원 탈퇴를 신청하고, 30일 유예 기간 내에 취소할 수 있도록 하는 UI/UX 및 디자인 스펙을 정의합니다. (참조: `USER_LIFECYCLE_TERMINATION_POLICY.md` v1.1)

## §A 진입점 위치 (Entry Point)

### 후보군 비교
1. **[권장] SecuritySection 하단 (보안 탭)**
   - **사유**: 비밀번호 재확인 등 인증이 수반되며, 세션 로그아웃과 같은 선상의 계정 생명주기 관리 영역이므로 가장 적합합니다.
2. **SettingsSection 하단 (설정 탭)**
   - 사유: 일반적인 앱에서 계정 설정을 통해 탈퇴하는 패턴.
3. **ProfileSection 하단 (프로필 탭)**
   - 사유: 내 프로필 정보 아래에 위치. 하지만 프로필 수정 폼과 위험 액션이 섞이는 단점.

**최종 권장안: `SecuritySection` 하단 신규 Article 추가**
- **UI**: `mg-v2-ad-b0kla__card mg-mypage__card` 안에 "계정 관리" 섹션 추가.
- "회원 탈퇴" 버튼: `danger` outline 톤 사용 (`variant="danger"`).

---

## §B WithdrawalRequestModal 와이어 (탈퇴 신청 모달)

**공통 모듈 `UnifiedModal`** 사용 (SSOT 준수). `className="mg-v2-ad-b0kla"` 적용.

### 레이아웃 및 구성 (Atoms / Molecules)
- **Title**: 회원 탈퇴 신청
- **Body**:
  1. **경고 배너 (StatusBadge / 알림 박스)**: "탈퇴 신청 시 30일의 유예 기간 후 개인정보가 완전히 익명화되며 복구할 수 없습니다."
  2. **이메일 Tombstone 안내**: "탈퇴 후 동일한 이메일로 재가입할 수 없습니다." (W3 정책)
  3. **비밀번호 재입력 (본인 확인)**: `input type="password"`
  4. **탈퇴 사유 선택 (라디오 버튼)**:
     - 서비스 이용 빈도 낮음
     - 원하는 상담사/서비스가 없음
     - 서비스 오류/장애가 잦음
     - 보안/개인정보 우려
     - 기타 (선택 시 텍스트 입력창 노출)
  5. **커뮤니티 게시글 옵션 (체크박스)** (Q12-b):
     - `[ ]` 내가 작성한 게시글·댓글의 본문도 함께 삭제합니다. (선택하지 않으면 작성자명만 익명화되고 본문은 유지됩니다.)
  6. **최종 동의 (체크박스)**:
     - `[ ]` 위 내용을 모두 이해했으며, 회원 탈퇴를 신청합니다.
- **Actions**:
  - `취소`: `variant="outline"`
  - `탈퇴 신청`: `variant="danger"` (동의 체크 및 비밀번호 입력 시에만 활성화)

---

## §C WITHDRAWAL_PENDING 상태 배너 + 마이페이지 위젯

탈퇴 신청 후 30일(유예 기간) 내에 표시되는 UI입니다.

### 1. 전역 배너 (Global Banner)
- **위치**: AdminCommonLayout 상단 (또는 MyPage 최상단 ContentHeader 위)
- **디자인**: 전체 폭 배너. `className="mg-v2-status-badge mg-v2-badge--danger"` 스타일 차용.
- **문구**: "회원 탈퇴 진행 중입니다. 개인정보 익명화까지 D-{n}일 남았습니다."

### 2. 마이페이지 위젯 (ProfileSection 상단)
- **UI**: `mg-v2-ad-b0kla__card` 스타일의 강조 카드.
- **헤더**: 회원 탈퇴 유예 기간
- **내용**:
  - 만료 예정일시: `YYYY-MM-DD HH:mm`
  - 남은 기간: `{n}일`
- **액션 버튼**:
  - `탈퇴 취소` (`variant="primary"`): 클릭 시 간단한 `UnifiedModal`로 취소 의사 확인 후 POST `/cancel` 호출.

---

## §D i18n 시드 키 명세 (`frontend/src/locales/ko/mypage.json`)

```json
{
  "mypage": {
    "withdrawal": {
      "sectionTitle": "계정 관리",
      "button": "회원 탈퇴",
      "modal": {
        "title": "회원 탈퇴 신청",
        "warningDesc": "탈퇴 신청 시 30일의 유예 기간 후 개인정보가 완전히 익명화되며 복구할 수 없습니다.",
        "emailTombstoneDesc": "탈퇴 후 동일한 이메일로 재가입할 수 없습니다.",
        "passwordLabel": "비밀번호 확인",
        "passwordPlaceholder": "비밀번호를 입력해주세요",
        "reasonLabel": "탈퇴 사유",
        "reason": {
          "LOW_USAGE": "서비스 이용 빈도 낮음",
          "NO_MATCH": "원하는 상담사/서비스가 없음",
          "ERROR": "서비스 오류/장애가 잦음",
          "PRIVACY": "보안/개인정보 우려",
          "OTHER": "기타"
        },
        "otherReasonPlaceholder": "기타 사유를 입력해주세요",
        "communityLabel": "커뮤니티 게시글 삭제 옵션",
        "communityCheckbox": "내가 작성한 게시글·댓글의 본문도 함께 삭제합니다.",
        "communityHint": "선택하지 않으면 작성자명만 익명(알 수 없음)으로 변경되고 본문은 유지됩니다.",
        "agreementCheckbox": "위 내용을 모두 이해했으며, 회원 탈퇴를 신청합니다.",
        "cancelButton": "취소",
        "submitButton": "탈퇴 신청"
      },
      "pending": {
        "bannerMessage": "회원 탈퇴 진행 중입니다. 개인정보 익명화까지 D-{{days}}일 남았습니다.",
        "widgetTitle": "탈퇴 진행 중",
        "expiresAt": "익명화 처리 예정일시: {{date}}",
        "cancelWithdrawalButton": "탈퇴 취소",
        "cancelModal": {
          "title": "회원 탈퇴 취소",
          "message": "회원 탈퇴를 취소하고 서비스를 계속 이용하시겠습니까?",
          "confirmButton": "탈퇴 취소 확인",
          "closeButton": "닫기"
        }
      }
    }
  }
}
```

---

## §E SSOT 컴포넌트 매핑

신규 컴포넌트 생성을 지양하고 기존 SSOT 컴포넌트를 사용합니다.

- **모달 래퍼**: `import UnifiedModal from '../../common/modals/UnifiedModal'`
- **버튼**: `import MGButton from '../../common/MGButton'` (`variant="danger"`, `variant="outline"`, `variant="primary"`)
- **버튼 클래스**: `buildErpMgButtonClassName`
- **입력 폼**: `mypage` 내부의 기존 폼 요소 스타일 재사용 (`mg-mypage__form-row`, `mg-mypage__form-control`)
- **상태 배지**: `className="mg-v2-status-badge mg-v2-badge--danger"` (전역 배너 및 상태 텍스트용)
- **카드 컨테이너**: `className="mg-v2-ad-b0kla__card mg-mypage__card"`

---

## §F 코더 위임 명세

> **core-coder** 는 다음 명세를 바탕으로 코드를 구현해 주세요.

1. **파일 변경 / 추가**:
   - 추가: `frontend/src/components/mypage/components/WithdrawalRequestModal.js`
   - 추가: `frontend/src/components/mypage/components/WithdrawalPendingWidget.js`
   - 수정: `frontend/src/components/mypage/components/SecuritySection.js` ("계정 관리" 카드 추가 및 `WithdrawalRequestModal` 연결)
   - 수정: `frontend/src/components/mypage/MyPage.js` (유저 상태가 `WITHDRAWAL_PENDING` 일 때 상단에 배너 노출 및 `WithdrawalPendingWidget` 최상단 렌더링 분기)
2. **API 연동**:
   - `frontend/src/utils/mypageApi.js` 에 3개 엔드포인트 추가
     - `requestWithdrawal(password, reason)` -> `POST /api/v1/mypage/withdrawal/request`
     - `cancelWithdrawal()` -> `POST /api/v1/mypage/withdrawal/cancel`
     - `getWithdrawalStatus()` -> `GET /api/v1/mypage/withdrawal/status`
   - **주의사항**: `WithdrawalRequestDto` 에는 현재 `password`, `reason` 필드만 존재합니다. 커뮤니티 본문 삭제 옵션(Q12-b)은 프론트엔드 UI에만 우선 반영하고, 실제 전송 시에는 `reason` 텍스트 끝에 `[커뮤니티 삭제 옵션: 선택됨]` 형식으로 추가하여 전송하거나 백엔드에 필드 추가 요청을 진행해야 합니다.
3. **단위 테스트 (Jest + RTL)**:
   - `frontend/src/components/mypage/components/__tests__/WithdrawalRequestModal.test.js`
   - 모달 렌더링, 비밀번호 미입력 시 신청 버튼 비활성화, 동의 체크박스 상태 연동, API 성공/실패 mock 테스트.
4. **게이트 체크리스트**:
   - [ ] `check:i18n-seed`: 한국어/영어 키 누락 검증.
   - [ ] `check-hardcode`: hex 컬러 하드코딩 금지, B0KlA 토큰 사용.
   - [ ] D11 가드: `TenantContext` 및 `tenantId` 관련 훼손 여부 확인.
   - [ ] 모달은 반드시 `UnifiedModal` 만 사용했는지 확인.

---

## §G 사용자 결정 필요 항목 (디자이너 권장안)

1. **진입점 위치**: `SecuritySection` 하단이 권장되나, 사용성에 따라 `SettingsSection` (설정) 탭 하단에 두는 것이 좋은지 사용자 최종 결정 필요.
2. **커뮤니티 삭제 옵션 (Q12-b)**: 현재 백엔드 `WithdrawalRequestDto` 에 `deleteCommunityPosts` 와 같은 명시적 필드가 존재하지 않습니다. 프론트엔드에서 `reason` 페이로드에 합쳐서 보낼지, 아니면 백엔드 DTO에 명시적으로 추가 반영할 지 결정 필요.
3. **배너 표시 영역**: `WITHDRAWAL_PENDING` 배너를 마이페이지 내에서만 보여줄지, 아니면 GNB(헤더) 레벨에 두어 전체 서비스 이용 중 계속 보이게 할지 결정 필요 (본 디자인은 마이페이지 내부로 한정됨).
