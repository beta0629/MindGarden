# SMS·알림톡 설정 + 채널 선호도 UI 카피 시안

## 1. UI-1 어드민 SMS 설정 페이지

### 1.1 페이지 상단 안내문
- **채택 시안**: "이 설정은 단일 테넌트 운영 중에는 보통 환경변수(`SMS_*`)만으로도 충분합니다. 빈 값이면 전역 폴백(Fallback)을 사용합니다."

### 1.2 sms_enabled 토글
- **라벨**: "테넌트 SMS 발송 활성화"
- **도움말**: "이 토글을 끄면 본 테넌트의 모든 SMS 발송이 차단됩니다 (인증 SMS 포함). 비상 차단 용도로만 사용하세요."
- **Confirm modal 카피**: "정말로 이 테넌트의 SMS 발송을 차단하시겠습니까? 인증 SMS도 발송되지 않으며, 사용자 가입 및 로그인에 영향이 있을 수 있습니다."

### 1.3 폴백 체인 다이어그램
```text
[Page Override] → [Tenant ENV (SMS_*)] → [전역 ENV (sms.auth.*)]
```

### 1.4 각 필드 placeholder + hint
| 필드 | placeholder | hint |
|---|---|---|
| provider | "솔라피 (기본)" | "SOLAPI / NHN / TWILIO 등 — 빈값이면 전역 설정 사용" |
| sender_number | "01012345678" | "발신자 번호 — 빈값이면 환경변수 `SMS_SENDER_NUMBER` 사용" |
| api_key_ref | "SOLAPI_KEY_TENANT_A" | "환경변수명 참조 (Secrets 별칭) — `<REF>_API_KEY` 패턴" |
| api_secret_ref | "SOLAPI_SECRET_TENANT_A" | "동일 패턴 — 본문은 DB에 저장되지 않습니다" |

## 2. UI-2 어드민 알림톡 설정 페이지

### 2.1 페이지 상단 안내문
- **채택 시안**: "비어있으면 전역 환경변수(`SOLAPI_ALIMTALK_*`)와 공통코드 `ALIMTALK_BIZ_TEMPLATE_CODE`로 폴백됩니다. 단일 테넌트 및 단일 PFID 운영 중에는 자주 변경할 필요가 없습니다."

### 2.2 alimtalk_enabled 토글
- **라벨**: "테넌트 알림톡 발송 활성화"
- **도움말**: "이 토글을 끄면 본 테넌트의 모든 알림톡 발송이 차단됩니다. 비상 차단 용도로만 사용하세요."
- **Confirm modal 카피**: "정말로 이 테넌트의 알림톡 발송을 차단하시겠습니까? 중요한 알림이 발송되지 않을 수 있습니다."

### 2.3 7 템플릿 코드 hint
| 필드 | placeholder | hint (이벤트 발화 시점) |
|---|---|---|
| template_consultation_confirmed | "KA01TPxxxx..." | "내담자 예약 확정 시 발화 — 1:1 알림톡 발송" |
| template_consultation_reminder | "KA01TPxxxx..." | "예약 1시간 전 리마인더 — 자동 발화" |
| template_consultation_cancelled | "KA01TPxxxx..." | "예약 취소 시 발화" |
| template_refund_completed | "KA01TPxxxx..." | "환불 완료 시 발화" |
| template_schedule_changed | "KA01TPxxxx..." | "상담 일정 변경 시 발화" |
| template_payment_completed | "KA01TPxxxx..." | "결제 완료 시 발화" |
| template_deposit_pending_reminder | "KA01TPxxxx..." | "입금 대기 24시간 후 발화" |

### 2.4 폴백 체인
```text
[Page Override (tenant_kakao_alimtalk_settings)] 
  → [공통코드 (ALIMTALK_BIZ_TEMPLATE_CODE)]
  → [기본 type.name() 변환]
```

## 3. UI-3 마이페이지 채널 선호도

### 3.1 섹션 헤더
- **채택 시안**: "알림 채널 우선순위"

### 3.2 라디오 3옵션 카피
| 옵션 | 라벨 | 설명문 |
|---|---|---|
| TENANT_DEFAULT | "기본 정책 따름 (권장)" | "긴급 알림(예약 확정·결제 등)은 카카오 알림톡, 일반 알림(리마인더·안내)은 SMS 우선" |
| KAKAO | "카카오 알림톡 우선" | "카카오 알림톡으로 먼저 시도하고, 실패 시 SMS로 발송됩니다" |
| SMS | "SMS 우선" | "SMS로 먼저 시도하고, 실패 시 카카오 알림톡으로 발송됩니다" |

### 3.3 공통 안내
- "⚠️ 선택은 우선 시도 순서일 뿐, 실패 시 다른 채널로 자동 폴백됩니다."
- "📱 전체 알림 거부는 마이페이지 > 알림 설정에서 별도 변경하실 수 있습니다." (legacy UI 별도 신설 권고)

### 3.4 (회귀 확정 시 표시) 추가 안내
- "현재 카카오 알림톡 수신을 위해서는 추가 동의가 필요할 수 있습니다. 자세한 안내는 고객센터에 문의하세요." (회귀 확정 및 isKakaoAlimTalkEnabled 게이트 완화 전 임시 안내)

## 4. i18n 키 (frontend/src/constants/notificationChannelPreference.js 갱신 안)

```javascript
export const NOTIFICATION_CHANNEL_PREFERENCE_I18N = {
  ko: {
    sectionHeader: '알림 채널 우선순위',
    commonNotice: '⚠️ 선택은 우선 시도 순서일 뿐, 실패 시 다른 채널로 자동 폴백됩니다.',
    rejectGuide: '📱 전체 알림 거부는 별도 메뉴에서 변경하실 수 있습니다.',
    options: {
      TENANT_DEFAULT: {
        label: '기본 정책 따름 (권장)',
        description: '긴급 알림은 카카오 알림톡, 일반 알림은 SMS 우선'
      },
      KAKAO: {
        label: '카카오 알림톡 우선',
        description: '카카오 알림톡으로 먼저 시도, 실패 시 SMS 폴백'
      },
      SMS: {
        label: 'SMS 우선',
        description: 'SMS로 먼저 시도, 실패 시 카카오 알림톡 폴백'
      }
    }
  }
};
```

## 5. 핸드오프 정합

- 본 시안 채택 후 `core-coder` 위임:
  - UI-1 / UI-2 페이지의 hint·안내문 갱신
  - UI-3 마이페이지 i18n 키 갱신
  - 단위 테스트 — 라디오 옵션 카피 정합 + i18n 키 fallback
- 디버거 회귀 확정 시 UI-3 §3.4 임시 안내 추가
