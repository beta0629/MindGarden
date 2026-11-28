-- SCT 본인확인용 개인정보(휴대폰/이메일) 수집·이용 동의 템플릿 시드
-- @author MindGarden
-- @since 2026-11-27
-- 기존 SENSITIVE_INFO / GUARDIAN_UNDER_14 템플릿은 변경하지 않음.

INSERT INTO sct_consent_templates (tenant_id, consent_type, form_type, version, title, body_text, is_active)
SELECT '', 'IDENTITY_CONTACT', NULL, 'identity-contact-2026-11-27', '본인확인용 개인정보 수집·이용 동의',
'질문지를 작성하려면 본인확인이 필요합니다. 아래 내용을 확인한 뒤 동의해 주세요.

1. 수집·이용 목적
본인확인(초대받은 본인이 맞는지 확인)

2. 수집·이용 항목
- 휴대폰번호(문자로 안내받은 경우) 또는 이메일(이메일로 안내받은 경우)
- 본인확인 시도 기록(성공 여부, IP 주소의 해시값)

3. 보유·이용 기간
- 본인확인에 쓰인 연락처(암호화 저장)와 연락처 해시: 해당 질문지 초대 기록이 보관·파기될 때까지
- 본인확인 시도 기록: 해당 질문지 초대 기록이 보관·파기될 때까지
- 본인확인 세션(서버 임시 저장, 연락처 미포함): 마지막 활동 후 최대 30분(초대 링크 만료 시각을 넘지 않음)
- 질문지 응답 보관은 별도 민감정보 동의에 따릅니다(기본 실시일로부터 1년)

4. 동의 거부 권리 및 불이익
동의를 거부할 수 있습니다. 다만 동의하지 않으면 본인확인을 할 수 없어 이 질문지를 작성할 수 없습니다.', 1
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM sct_consent_templates t
  WHERE t.tenant_id = '' AND t.consent_type = 'IDENTITY_CONTACT'
    AND t.version = 'identity-contact-2026-11-27' AND (t.form_type IS NULL OR t.form_type = '')
);
