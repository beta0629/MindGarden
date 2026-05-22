# 어드민 알림 발송 배치 및 회기 종료 메시지 디자인 (P1.1)

## 1. 배경 / 범위 / 사용자 결정 인용
- **배경:** 어드민 알림 발송 배치 및 회기 종료 유도 메시지 P1.1 디자인 문서입니다. 7개의 알림톡 템플릿 본문, SMS 폴백 본문, 그리고 발송 정책 문서를 작성합니다.
- **예약 2일 전 발송:** D-2 09:00 일괄 (배치)
- **단회기:** 단발성 결제(1회씩 결제)로 발생한 1회기
- **즉시 발송:** D-2 미만일 경우 예약 즉시 발송 (이벤트)
- **발송 채널:** 카카오 알림톡 + SMS 폴백
- **회기 종료 정책:** 잔여 1회기 진입 안내와 마지막 회기 종료 직후 유도 메시지 두 가지 모두 발송

## 2. 7종 알림톡 템플릿 본문
(각 200자 내외, 솔라피 비즈메시지 규격 `#{변수명}` 준수)

### 2.1 RESERVATION_REMINDER_D2 — 예약 2일 전 안내 (1회기 이상 잔여 client)
- **변수:** `#{clientName}`, `#{consultantName}`, `#{scheduleDate}`, `#{scheduleTime}`, `#{remainingSessions}`
- **본문 (마인드가든 톤 — 차분하고 정중한 안내):**
```
[마인드가든] #{clientName}님, 상담 예약 안내드립니다.

📅 일시: #{scheduleDate} #{scheduleTime}
💬 상담사: #{consultantName}
🎯 잔여 회기: #{remainingSessions}회

당일 변경/취소가 필요하시면 미리 연락 부탁드립니다.
```
- **카테고리:** 알림(정보성) — 마케팅 동의 불필요

### 2.2 RESERVATION_IMMEDIATE_SINGLE — 단회기(단발성 결제) 예약 즉시 안내
- **변수:** `#{clientName}`, `#{consultantName}`, `#{scheduleDate}`, `#{scheduleTime}`
- **본문 (첫 상담 환영 톤):**
```
[마인드가든] #{clientName}님, 상담 예약이 확정되었습니다.

📅 일시: #{scheduleDate} #{scheduleTime}
💬 상담사: #{consultantName}

처음 상담이시군요. 편안한 마음으로 오시기 바랍니다.
변경/취소 필요 시 미리 연락 부탁드립니다.
```
- **카테고리:** 알림(정보성) — 마케팅 동의 불필요

### 2.3 RESERVATION_IMMEDIATE_LATE — D-2 미만 예약 즉시 안내 (1회기 이상 잔여 + 등록 시점 D-2 미만)
- **변수:** `#{clientName}`, `#{consultantName}`, `#{scheduleDate}`, `#{scheduleTime}`
- **본문 (긴급성 강조):**
```
[마인드가든] #{clientName}님, 상담 예약이 확정되었습니다.

📅 일시: #{scheduleDate} #{scheduleTime}
💬 상담사: #{consultantName}

예약일이 가까우니 일정을 다시 한번 확인 부탁드립니다.
변경/취소 필요 시 미리 연락 부탁드립니다.
```
- **카테고리:** 알림(정보성) — 마케팅 동의 불필요

### 2.4 SESSION_ENDING_SOON — 회기 종료 안내 (잔여 1회기 진입)
- **변수:** `#{clientName}`, `#{consultantName}`, `#{remainingSessions}` (항상 1)
- **본문 (감사 톤 + 다음 상담 예약 권유, 마케팅 색채 최소화):**
```
[마인드가든] #{clientName}님, 상담 일정 안내드립니다.

이번 패키지의 마지막 1회기가 남았습니다.
💬 상담사: #{consultantName}

남은 상담을 통해 좋은 마무리가 되시기를 바랍니다.
이후 상담이 필요하시면 언제든 문의 주세요.
```
- **카테고리:** 알림(정보성) — 마케팅 동의 불필요

### 2.5 SESSION_RENEW_PROMPT — 회기수 유도 (마지막 회기 종료 직후)
- **변수:** `#{clientName}`, `#{consultantName}`, `#{lastSessionDate}`
- **본문 (감사 + 재예약 안내):**
```
[마인드가든] #{clientName}님, 그동안 상담 함께해 주셔서 감사합니다.

#{lastSessionDate} 상담을 끝으로 패키지가 종료되었습니다.

추가 상담이나 새로운 패키지가 필요하시면
편하게 문의 주세요. 항상 곁에 있겠습니다.

💬 상담사: #{consultantName}
```
- **카테고리:** **광고/마케팅** — 수신동의 필요 (`marketing_agree=true` 인 client 만 발송)

### 2.6 CLIENT_WELCOME_FIRST — 신규 등록 내담자 환영
- **변수:** `#{clientName}`, `#{consultantName}`, `#{contactPhone}`
- **본문 (마인드가든 환영 톤, 따뜻하고 신뢰감):**
```
[마인드가든] #{clientName}님, 마인드가든에 오신 것을 환영합니다.

#{consultantName} 상담사와 함께
편안한 상담 시간을 만들어 가겠습니다.

🌱 상담 전 마음 준비, 일정 안내 등
   궁금하신 점은 언제든 문의 주세요.

📞 #{contactPhone}
```
- **카테고리:** 알림(정보성) — 마케팅 동의 불필요

### 2.7 INITIAL_CONSULTATION_GUIDE — 초기 상담 안내
- **변수:** `#{clientName}`, `#{scheduleDate}`, `#{scheduleTime}`, `#{consultantName}`, `#{branchAddress}` 또는 `#{onlineLink}`
- **본문 (오프라인 기준):**
```
[마인드가든] #{clientName}님, 첫 상담 안내입니다.

📅 일시: #{scheduleDate} #{scheduleTime}
💬 상담사: #{consultantName}
📍 장소: #{branchAddress}

[처음이신 분께]
• 15분 전 도착 권장 (간단한 안내문 작성)
• 편안한 복장으로 오시기 바랍니다
• 변경/취소 시 24시간 전 연락 부탁드립니다

마음 편히 오시면 됩니다. 기다리고 있겠습니다.
```
- **본문 (온라인 기준):**
```
[마인드가든] #{clientName}님, 첫 상담 안내입니다.

📅 일시: #{scheduleDate} #{scheduleTime}
💬 상담사: #{consultantName}
🔗 접속: #{onlineLink}

[처음이신 분께]
• 시작 10분 전 접속 권장 (마이크·카메라 확인)
• 조용한 공간에서 진행 부탁드립니다
• 변경/취소 시 24시간 전 연락 부탁드립니다

편안한 마음으로 접속해 주세요.
```
- **카테고리:** 알림(정보성) — 마케팅 동의 불필요

## 3. SMS 폴백 본문 7종 (단문, 90바이트 이내 권장)

알림톡 발송 실패 시 전송되는 SMS 폴백 텍스트입니다. 변수 치환을 고려하여 간결하게 작성되었습니다.

### 3.1 RESERVATION_REMINDER_D2 SMS 폴백
```
[마인드가든] #{scheduleDate} #{scheduleTime} 상담 예약 안내입니다. (#{consultantName} 상담사) 변경/취소 시 미리 연락 부탁드립니다.
```

### 3.2 RESERVATION_IMMEDIATE_SINGLE SMS 폴백
```
[마인드가든] 상담 예약 확정: #{scheduleDate} #{scheduleTime} (#{consultantName} 상담사). 편안하게 오시기 바랍니다.
```

### 3.3 RESERVATION_IMMEDIATE_LATE SMS 폴백
```
[마인드가든] 상담 예약 확정: #{scheduleDate} #{scheduleTime} (#{consultantName} 상담사). 예약일이 임박하니 일정 확인 부탁드립니다.
```

### 3.4 SESSION_ENDING_SOON SMS 폴백
```
[마인드가든] 패키지 마지막 1회기가 남았습니다. (#{consultantName} 상담사) 좋은 마무리 되시길 바랍니다.
```

### 3.5 SESSION_RENEW_PROMPT SMS 폴백 (마케팅성)
```
[마인드가든] 그동안 상담 함께해 주셔서 감사합니다. 추가 상담이 필요하시면 언제든 연락 주세요. (수신거부:080-XXX-XXXX)
```

### 3.6 CLIENT_WELCOME_FIRST SMS 폴백
```
[마인드가든] #{clientName}님, 마인드가든에 오신 것을 환영합니다. #{consultantName} 상담사와 함께 시작합니다. 문의: #{contactPhone}
```

### 3.7 INITIAL_CONSULTATION_GUIDE SMS 폴백 (오프라인 기본)
```
[마인드가든] 첫 상담: #{scheduleDate} #{scheduleTime} (#{consultantName} 상담사). 15분 전 도착 권장, 변경 시 24h 전 연락.
```

## 4. 발송 정책 매트릭스

| 템플릿 | 트리거 | 채널 | 마케팅 동의 | 발송 시점 | 멱등성 |
|---|---|---|---|---|---|
| RESERVATION_REMINDER_D2 | 스케줄러 (cron 0 0 9 * * *) | 알림톡 + SMS 폴백 | 불필요 | 일정일 D-2 09:00 | (user_id, schedule_id, template_code) 1회 |
| RESERVATION_IMMEDIATE_SINGLE | 스케줄 등록 이벤트 (단발성 + 1회기) | 동일 | 불필요 | 등록 즉시 | (schedule_id) 1회 |
| RESERVATION_IMMEDIATE_LATE | 스케줄 등록 이벤트 (등록 시점이 D-2 미만) | 동일 | 불필요 | 등록 즉시 | (schedule_id) 1회 |
| SESSION_ENDING_SOON | 회기 차감 이벤트 (잔여=1 진입) | 동일 | 불필요 | 차감 직후 | (user_id, package_id, "ENDING_SOON") 1회 |
| SESSION_RENEW_PROMPT | 회기 차감 이벤트 (마지막 회기 종료) | 동일 | **필요** | 마지막 회기 status=COMPLETED 직후 | (user_id, package_id, "RENEW") 1회 |
| CLIENT_WELCOME_FIRST | 이벤트 (첫 매칭 생성) | 동일 | 불필요 | 매칭 생성 즉시 | (user_id, "WELCOME") 1회 영구 |
| INITIAL_CONSULTATION_GUIDE | 이벤트 (첫 상담 예약 등록) | 동일 | 불필요 | 예약 등록 즉시 | (user_id, "INITIAL_GUIDE") 1회 영구 |

## 5. 변수 검증·null 처리

- **Fallback 처리:** 변수 누락 시 대비 (예: `#{consultantName}` null 시 "담당 상담사"로 치환)
- **마스킹 정책:** 한국어 전화번호 마스킹 정책 준수

## 6. 운영 게이트 / 첫 실행 cutoff

- **폭발적 발송 방지 (Cutoff):** 운영 반영 첫날 D-2 09:00 첫 실행 시, 첫 실행 시작 시점 이후로 등록된 schedules에 한해서만 발송하도록 제한
- **Dry-run 권장:** 운영 반영 직후 3일간은 실제 발송 대신 대상자 카운트 로그만 기록(dry-run 모드)하고, 3일 후 실 발송 전환
- **신규 사용자 대상 템플릿 예외:** `CLIENT_WELCOME_FIRST` 및 `INITIAL_CONSULTATION_GUIDE`는 신규 사용자 한정 이벤트 기반이므로 기존 사용자에게 소급 발송되지 않아 첫 실행 cutoff 영향이 없습니다. 단, 시스템 적용 시점 이전에 등록된 사용자에 대해서는 `WELCOME`/`INITIAL_GUIDE` 멱등 키로 자동 차단 처리됩니다.

## 7. 솔라피 등록 절차 (사용자 액션)

- 솔라피 콘솔 → 카카오 알림톡 → 템플릿 신규 등록
- 기존 5종은 현재 심사 대기/진행 중입니다.
- 신규 2종 추가 등록 시에도 동일한 절차를 진행합니다.
  - **templateName:** `CLIENT_WELCOME_FIRST`, `INITIAL_CONSULTATION_GUIDE`
  - **본문:** 제 2항의 내용 그대로 사용
  - **변수:** 본문 내 `#{...}` 추출하여 등록
  - **카테고리:** 알림(정보성)
- 검수 요청 후 승인(검수 영업일 1~3일 소요)되면 발급되는 `templateId` 확보
- 검수 후 `ALIMTALK_BIZ_TEMPLATE_CODE` 매핑 시드 (Flyway) — P1.2 백엔드 코더가 반영 처리

## 8. ALIMTALK_BIZ_TEMPLATE_CODE 매핑 시드 (P1.2 백엔드 인용)

검수 통과 후 templateId를 수령하면 Flyway에 멱등성을 보장하여 시드 추가:
```sql
INSERT INTO common_codes (code_group, code_value, code_label, ...)
SELECT 'ALIMTALK_BIZ_TEMPLATE_CODE', 'RESERVATION_REMINDER_D2', 'KA01TP...', ...
WHERE NOT EXISTS (...)
```

## 9. 운영 게이트 정합 / 표준 인용

- **디자인 토큰:** 본 작업은 메시지 텍스트 설계이므로 UI 컴포넌트용 디자인 토큰은 별도 적용하지 않음 (단, 일관된 톤앤매너 유지)
- **하드코딩 금지 (0건):** 브랜드명, 연락처, URL, 수신거부 번호(`080-XXX-XXXX`)는 모두 운영 환경 변수에서 주입받아 사용
- **PII 보호:** 알림 메시지 본문에 노출되는 사용자 이름은 마스킹하지 않으나(개인화 목적), DB나 로그에 기록할 때는 마스킹 처리 (`PhoneLogMasking` 등 준수)

## 10. 다음 단계 (P1.2 백엔드 코더 핸드오프)

- **스케줄러 구현:** D-2 09:00 cron 배치 실행 및 첫 실행 cutoff 적용
- **이벤트 핸들러 구현:** 단회기/D-2 미만 스케줄 등록 및 회기 차감(잔여 1, 종료) 이벤트 수신 후 발송 로직 작성
- **멱등성 보장:** `notification_send_log` 테이블 등을 통해 중복 발송 차단 로직 구현
- **마케팅 동의 검사:** `SESSION_RENEW_PROMPT` 발송 시 반드시 `marketing_agree=true` 조건 확인
- **SMS 폴백 흐름:** 알림톡 발송 실패 시 fallback 메시지로 전환하여 SMS API 호출

## 11. [신규] CLIENT_WELCOME_FIRST 세부 정책

- **본문:** 제 2.6항 및 3.6항 참조
- **트리거 시점 비교 및 권장 안:**

| 옵션 | 트리거 시점 | 장점 | 단점 | 권장 여부 |
|---|---|---|---|---|
| **A (권장)** | 내담자 첫 매칭(`ConsultantClientMapping`) 생성 시점 | 첫 결제 및 상담사 배정이 완료되어 환영의 의미가 가장 적절함 | - | **권장** |
| B (대안) | 회원가입 직후 | 서비스 가입 즉시 인게이지먼트 발생 | 상담사가 아직 배정되지 않아 개인화(`consultantName`) 불가 | - |
| C (대안) | 첫 결제 완료 직후 | 구매 전환에 대한 즉각적인 피드백 | 매칭 생성과 거의 동일 시점이나, 매칭이 지연될 경우 정보가 부족할 수 있음 | - |

- **멱등성:** `(user_id, "WELCOME")` 키를 사용하여 영구적으로 1회만 발송되도록 보장합니다.

## 12. [신규] INITIAL_CONSULTATION_GUIDE 세부 정책

- **본문:** 제 2.7항 및 3.7항 참조
- **오프라인/온라인 분기 정책 (사용자 컨펌 필요):**
  - **단일 템플릿 + 변수 치환:** 장소 변수를 `#{branchAddress}` 또는 `#{onlineLink}`로 유동적으로 치환하여 하나의 템플릿으로 관리합니다. 관리 포인트가 줄어듭니다.
  - **2개 템플릿 분리 (권장):** 오프라인용, 온라인용 템플릿을 분리합니다. 안내 문구(15분 전 도착 vs 접속 테스트)를 완전히 다르게 가져갈 수 있으나 템플릿 심사 및 관리가 두 배가 됩니다. 본문 권장안은 분리형을 기준으로 작성되었습니다.
- **"환영 + 초기 상담 안내" 통합 옵션 (사용자 컨펌 필요):**
  - 첫 매칭 생성 후 즉시 첫 상담을 예약하는 플로우가 일반적이므로, 두 알림이 거의 동시에 발생할 수 있습니다.
  - **(A) 2통 분리 발송 (권장):** 메시지 의도(환영 vs 예약 안내)가 명확하여 사용자가 정보를 소화하기 쉽습니다.
  - **(B) 1통 통합 발송:** 사용자 알림 피로도를 줄일 수 있으나, 본문 길이가 길어지고 변수 슬롯이 많아져 솔라피 1000자 제한이나 가독성에 리스크가 존재합니다.