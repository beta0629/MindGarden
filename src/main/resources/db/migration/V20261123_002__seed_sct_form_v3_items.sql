-- SCT v3 문항 시드 (성인·청소년·아동 각 50, 원문 그대로)
-- 출처: docs/project-management/sct-online/mindgarden_sct_v3.md
-- @author MindGarden
-- @since 2026-11-23

-- ===== ADULT =====
INSERT INTO sct_form_templates (tenant_id, form_type, version, title, instruction_text, target_desc, is_active, is_deleted, version_lock)
SELECT '', 'ADULT', 'v3', '마인드가든 문장완성 질문지 (성인용)', '- 이 질문지는 상담 면담에 참고하기 위한 자료입니다. 시험이 아니며 정답도 없습니다.
- 각 문장의 앞부분을 읽고, 가장 먼저 떠오르는 생각을 이어서 끝까지 써 주세요.
- 오래 고민하지 말고 떠오르는 대로 솔직하게 쓰면 됩니다. 쓰기 어려운 문항은 비워 두셔도 괜찮습니다.
- ''□ 해당 없음''이 있는 문항(부모, 연인·배우자, 자녀 관련)은 해당하지 않으면 □에 표시하고 넘어가세요.
- 걸리는 시간은 대략 30~40분입니다.
- 작성한 내용은 상담 기록과 같은 수준으로 비밀을 지켜 보관하며, 상담 동의서에서 안내한 목적 안에서만 씁니다. 다만 본인이나 다른 사람의 안전이 걱정되는 내용이 있으면 상담사가 먼저 함께 이야기를 나누고, 필요하면 동의서에 적힌 비밀보장의 예외에 따라 도움을 받을 수 있는 곳과 연결합니다.', '19세 이상', 1, 0, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sct_form_templates WHERE tenant_id = '' AND form_type = 'ADULT' AND version = 'v3');

INSERT INTO sct_form_items (form_template_id, item_no, prompt_text, domain_code, domain_label, valence, tense, allows_not_applicable, sort_order)
SELECT v.form_template_id, v.item_no, v.prompt_text, v.domain_code, v.domain_label, v.valence, v.tense, v.allows_not_applicable, v.sort_order
FROM (
  SELECT t.id AS form_template_id, x.item_no, x.prompt_text, x.domain_code, x.domain_label, x.valence, x.tense, x.allows_not_applicable, x.sort_order
  FROM sct_form_templates t
  JOIN (

    SELECT 1 AS item_no, '내 이름 앞에 어울리는 수식어를 하나 붙인다면' AS prompt_text, 'SELF_CONCEPT' AS domain_code, '자기개념' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 1 AS sort_order UNION ALL
    SELECT 2 AS item_no, '기운이 바닥난 날 내 방의 모습은' AS prompt_text, 'AFFECT' AS domain_code, '정서(우울)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 2 AS sort_order UNION ALL
    SELECT 3 AS item_no, '어릴 적 우리 집 안에서 가장 자주 들리던 소리는' AS prompt_text, 'PARENT_FAMILY' AS domain_code, '부모/원가족(원가족)' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 3 AS sort_order UNION ALL
    SELECT 4 AS item_no, '모임에서 처음 보는 사람이 말을 걸어오면 나는' AS prompt_text, 'INTERPERSONAL' AS domain_code, '대인관계' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 4 AS sort_order UNION ALL
    SELECT 5 AS item_no, '내 웃음이 줄어드는 때는' AS prompt_text, 'AFFECT' AS domain_code, '정서(우울)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 5 AS sort_order UNION ALL
    SELECT 6 AS item_no, '하루 일과(출근·등교·살림 등)를 시작할 때 내 발걸음은' AS prompt_text, 'WORK_ROLE' AS domain_code, '직장·역할' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 6 AS sort_order UNION ALL
    SELECT 7 AS item_no, '남들 앞에서는 감추고 혼자 있을 때만 드러나는 내 모습은' AS prompt_text, 'SELF_CONCEPT' AS domain_code, '자기개념' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 7 AS sort_order UNION ALL
    SELECT 8 AS item_no, '확인하고 또 확인하게 되는 일은' AS prompt_text, 'AFFECT' AS domain_code, '정서(불안)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 8 AS sort_order UNION ALL
    SELECT 9 AS item_no, '어머니(또는 나를 키워 준 여성 보호자)를 떠올리면 먼저 생각나는 장면은  [□ 해당 없음]' AS prompt_text, 'PARENT_FAMILY' AS domain_code, '부모/원가족(모)' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 1 AS allows_not_applicable, 9 AS sort_order UNION ALL
    SELECT 10 AS item_no, '누군가 내게 실망한 눈치를 보이면' AS prompt_text, 'INTERPERSONAL' AS domain_code, '대인관계' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 10 AS sort_order UNION ALL
    SELECT 11 AS item_no, '아직 일어나지 않은 일 가운데 자꾸 마음에 걸리는 것은' AS prompt_text, 'AFFECT' AS domain_code, '정서(불안)' AS domain_label, 'NEGATIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 11 AS sort_order UNION ALL
    SELECT 12 AS item_no, '연인이나 배우자와 함께 있을 때 나는  [□ 해당 없음]' AS prompt_text, 'PARTNER' AS domain_code, '배우자·연인' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 1 AS allows_not_applicable, 12 AS sort_order UNION ALL
    SELECT 13 AS item_no, '일에서 인정받았다고 느꼈던 기억은' AS prompt_text, 'WORK_ROLE' AS domain_code, '직장·역할' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 13 AS sort_order UNION ALL
    SELECT 14 AS item_no, '화가 치밀어 오르는 순간은' AS prompt_text, 'AFFECT' AS domain_code, '정서(분노)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 14 AS sort_order UNION ALL
    SELECT 15 AS item_no, '내 삶의 방향이 바뀐 날을 하나 고른다면' AS prompt_text, 'PAST_EXP' AS domain_code, '과거 경험' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 15 AS sort_order UNION ALL
    SELECT 16 AS item_no, '일 년 뒤 오늘, 달력 속 내 하루에는' AS prompt_text, 'FUTURE_GOAL' AS domain_code, '미래·목표' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 16 AS sort_order UNION ALL
    SELECT 17 AS item_no, '마음이 복잡할 때 내 손이 먼저 가는 것은' AS prompt_text, 'COPING' AS domain_code, '대처·자원·강점(대처)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 17 AS sort_order UNION ALL
    SELECT 18 AS item_no, '연인이나 배우자에게 말하지 못하고 삼켜 둔 이야기는  [□ 해당 없음]' AS prompt_text, 'PARTNER' AS domain_code, '배우자·연인' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 1 AS allows_not_applicable, 18 AS sort_order UNION ALL
    SELECT 19 AS item_no, '열 살 무렵의 내가 지금의 나를 만난다면' AS prompt_text, 'SELF_CONCEPT' AS domain_code, '자기개념' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 19 AS sort_order UNION ALL
    SELECT 20 AS item_no, '아이가 내 말을 따르지 않을 때 나는  [□ 해당 없음]' AS prompt_text, 'CHILD_ROLE' AS domain_code, '자녀' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 1 AS allows_not_applicable, 20 AS sort_order UNION ALL
    SELECT 21 AS item_no, '아버지(또는 나를 키워 준 남성 보호자)와 나 사이의 거리는  [□ 해당 없음]' AS prompt_text, 'PARENT_FAMILY' AS domain_code, '부모/원가족(부)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 1 AS allows_not_applicable, 21 AS sort_order UNION ALL
    SELECT 22 AS item_no, '내 일을 평가하는 사람 앞에서 나는' AS prompt_text, 'WORK_ROLE' AS domain_code, '직장·역할' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 22 AS sort_order UNION ALL
    SELECT 23 AS item_no, '연락이 뜸해진 옛 친구를 생각하면' AS prompt_text, 'INTERPERSONAL' AS domain_code, '대인관계' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 23 AS sort_order UNION ALL
    SELECT 24 AS item_no, '학창 시절 나를 가장 힘들게 한 것은' AS prompt_text, 'PAST_EXP' AS domain_code, '과거 경험' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 24 AS sort_order UNION ALL
    SELECT 25 AS item_no, '화가 가라앉고 나면 나는' AS prompt_text, 'AFFECT' AS domain_code, '정서(분노)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 25 AS sort_order UNION ALL
    SELECT 26 AS item_no, '이루고 싶은 일을 가로막는 가장 큰 벽은' AS prompt_text, 'FUTURE_GOAL' AS domain_code, '미래·목표' AS domain_label, 'NEGATIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 26 AS sort_order UNION ALL
    SELECT 27 AS item_no, '어려운 순간에 의외로 침착해지는 내 모습은' AS prompt_text, 'COPING' AS domain_code, '대처·자원·강점(강점)' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 27 AS sort_order UNION ALL
    SELECT 28 AS item_no, '지금 맡은 역할에서 가장 버거운 부분은' AS prompt_text, 'WORK_ROLE' AS domain_code, '직장·역할' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 28 AS sort_order UNION ALL
    SELECT 29 AS item_no, '요즘 들어 나 자신이 조금 마음에 드는 때는' AS prompt_text, 'SELF_CONCEPT' AS domain_code, '자기개념' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 29 AS sort_order UNION ALL
    SELECT 30 AS item_no, '누군가에게 진 마음의 빚은' AS prompt_text, 'AFFECT' AS domain_code, '정서(죄책감)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 30 AS sort_order UNION ALL
    SELECT 31 AS item_no, '자라면서 집에서 몸에 밴 것 가운데 고맙게 여기는 것은' AS prompt_text, 'PARENT_FAMILY' AS domain_code, '부모/원가족(원가족)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 31 AS sort_order UNION ALL
    SELECT 32 AS item_no, '오래전 누군가 해 준 말 가운데 아직 마음에 남은 것은' AS prompt_text, 'PAST_EXP' AS domain_code, '과거 경험' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 32 AS sort_order UNION ALL
    SELECT 33 AS item_no, '지나온 연애나 결혼을 돌아보며 알게 된 것은  [□ 해당 없음]' AS prompt_text, 'PARTNER' AS domain_code, '배우자·연인' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 1 AS allows_not_applicable, 33 AS sort_order UNION ALL
    SELECT 34 AS item_no, '도움을 청하기가 망설여지는 까닭은' AS prompt_text, 'COPING' AS domain_code, '대처·자원·강점(자원)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 34 AS sort_order UNION ALL
    SELECT 35 AS item_no, '아이와 보낸 시간 중 오래 간직하고 싶은 장면은  [□ 해당 없음]' AS prompt_text, 'CHILD_ROLE' AS domain_code, '자녀' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 1 AS allows_not_applicable, 35 AS sort_order UNION ALL
    SELECT 36 AS item_no, '내 편이 되어 준다고 느끼는 사람은' AS prompt_text, 'INTERPERSONAL' AS domain_code, '대인관계' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 36 AS sort_order UNION ALL
    SELECT 37 AS item_no, '시간과 여유가 생긴다면 새로 배워 보고 싶은 것은' AS prompt_text, 'FUTURE_GOAL' AS domain_code, '미래·목표' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 37 AS sort_order UNION ALL
    SELECT 38 AS item_no, '손해를 보더라도 지키고 싶은 원칙은' AS prompt_text, 'VALUE_MEANING' AS domain_code, '가치·의미' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 38 AS sort_order UNION ALL
    SELECT 39 AS item_no, '몇 해 지나 오늘의 나를 돌아보면 아마' AS prompt_text, 'SELF_CONCEPT' AS domain_code, '자기개념' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 39 AS sort_order UNION ALL
    SELECT 40 AS item_no, '함께 나이 들어 갈 사람에게 바라는 모습은' AS prompt_text, 'PARTNER' AS domain_code, '배우자·연인' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 40 AS sort_order UNION ALL
    SELECT 41 AS item_no, '명절이나 가족 모임이 다가오면 내 마음은' AS prompt_text, 'PARENT_FAMILY' AS domain_code, '부모/원가족(원가족)' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 41 AS sort_order UNION ALL
    SELECT 42 AS item_no, '아이가 자라서 나를 떠올릴 때 기억해 주었으면 하는 것은  [□ 해당 없음]' AS prompt_text, 'CHILD_ROLE' AS domain_code, '자녀' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 1 AS allows_not_applicable, 42 AS sort_order UNION ALL
    SELECT 43 AS item_no, '사람들과 거리를 두고 싶어지는 때는' AS prompt_text, 'INTERPERSONAL' AS domain_code, '대인관계' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 43 AS sort_order UNION ALL
    SELECT 44 AS item_no, '일과 쉼의 균형이 맞춰진다면 내 하루는' AS prompt_text, 'WORK_ROLE' AS domain_code, '직장·역할' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 44 AS sort_order UNION ALL
    SELECT 45 AS item_no, '떠올리면 얼굴이 화끈해지는 장면은' AS prompt_text, 'AFFECT' AS domain_code, '정서(수치심)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 45 AS sort_order UNION ALL
    SELECT 46 AS item_no, '지나고 보니 잘했다고 여겨지는 결정은' AS prompt_text, 'PAST_EXP' AS domain_code, '과거 경험' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 46 AS sort_order UNION ALL
    SELECT 47 AS item_no, '내가 생각하는 ''잘 산 하루''란' AS prompt_text, 'VALUE_MEANING' AS domain_code, '가치·의미' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 47 AS sort_order UNION ALL
    SELECT 48 AS item_no, '상담을 마칠 무렵 달라져 있기를 바라는 것은' AS prompt_text, 'FUTURE_GOAL' AS domain_code, '미래·목표' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 48 AS sort_order UNION ALL
    SELECT 49 AS item_no, '지쳤을 때 나를 다시 일으켜 세우는 작은 것은' AS prompt_text, 'COPING' AS domain_code, '대처·자원·강점(자원)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 49 AS sort_order UNION ALL
    SELECT 50 AS item_no, '이 질문지를 다 채워 갈 즈음 드는 생각은' AS prompt_text, 'VALUE_MEANING' AS domain_code, '가치·의미(마무리)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 50 AS sort_order
  ) x
  WHERE t.tenant_id = '' AND t.form_type = 'ADULT' AND t.version = 'v3'
) v
WHERE NOT EXISTS (
  SELECT 1 FROM sct_form_items i WHERE i.form_template_id = v.form_template_id AND i.item_no = v.item_no
);

-- ===== ADOLESCENT =====
INSERT INTO sct_form_templates (tenant_id, form_type, version, title, instruction_text, target_desc, is_active, is_deleted, version_lock)
SELECT '', 'ADOLESCENT', 'v3', '마인드가든 문장완성 질문지 (청소년용)', '- 이 질문지는 상담 선생님과 이야기를 나누기 위한 참고 자료예요. 시험이 아니고 정답도 없어요.
- 문장의 앞부분을 읽고, 바로 떠오르는 생각을 이어서 문장을 완성해 주세요.
- 맞춤법이나 글씨는 신경 쓰지 않아도 돼요. 떠오르는 대로 쓰면 되고, 쓰기 어려운 문항은 비워 둬도 괜찮아요.
- ''□ 해당 없음''이 있는 문항(부모·형제자매 관련)은 나에게 해당하지 않으면 □에 표시하고 넘어가요. 학교에 다니지 않는다면 지금 다니는 곳이나 지내는 곳을 떠올려 답해도 돼요.
- 걸리는 시간은 대략 30~40분이에요.
- 적은 내용은 상담 선생님이 상담에만 쓰고 비밀로 보관해요. 다만 너나 다른 사람의 안전이 걱정되는 내용이 있으면, 먼저 너와 이야기한 뒤 보호자나 도와줄 수 있는 곳에 알릴 수 있어요.', '중·고등학생', 1, 0, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sct_form_templates WHERE tenant_id = '' AND form_type = 'ADOLESCENT' AND version = 'v3');

INSERT INTO sct_form_items (form_template_id, item_no, prompt_text, domain_code, domain_label, valence, tense, allows_not_applicable, sort_order)
SELECT v.form_template_id, v.item_no, v.prompt_text, v.domain_code, v.domain_label, v.valence, v.tense, v.allows_not_applicable, v.sort_order
FROM (
  SELECT t.id AS form_template_id, x.item_no, x.prompt_text, x.domain_code, x.domain_label, x.valence, x.tense, x.allows_not_applicable, x.sort_order
  FROM sct_form_templates t
  JOIN (

    SELECT 1 AS item_no, '요즘 빠져 있는 게임·영상·노래는' AS prompt_text, 'MEDIA' AS domain_code, '미디어·여가' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 1 AS sort_order UNION ALL
    SELECT 2 AS item_no, '요즘 나를 가장 크게 웃게 한 일은' AS prompt_text, 'AFFECT' AS domain_code, '정서(기쁨)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 2 AS sort_order UNION ALL
    SELECT 3 AS item_no, '엄마(또는 보호자)가 나를 부르는 소리가 들리면  [□ 해당 없음]' AS prompt_text, 'PARENT' AS domain_code, '부모' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 1 AS allows_not_applicable, 3 AS sort_order UNION ALL
    SELECT 4 AS item_no, '수업 시간에 발표를 해야 할 때' AS prompt_text, 'SCHOOL' AS domain_code, '학교·교사·학업(학업)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 4 AS sort_order UNION ALL
    SELECT 5 AS item_no, '이유 없이 축 처지는 날 나는' AS prompt_text, 'AFFECT' AS domain_code, '정서(우울)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 5 AS sort_order UNION ALL
    SELECT 6 AS item_no, '새 학기 첫날 교실 문을 열고 들어서면' AS prompt_text, 'PEER' AS domain_code, '친구·또래' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 6 AS sort_order UNION ALL
    SELECT 7 AS item_no, '선생님에게 들었던 말 가운데 힘이 된 것은' AS prompt_text, 'SCHOOL' AS domain_code, '학교·교사·학업(교사)' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 7 AS sort_order UNION ALL
    SELECT 8 AS item_no, '사람들 속에 있어도 혼자인 것 같을 때는' AS prompt_text, 'AFFECT' AS domain_code, '정서(외로움)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 8 AS sort_order UNION ALL
    SELECT 9 AS item_no, '사진 속 내 모습을 보면 나는' AS prompt_text, 'SELF_BODY' AS domain_code, '자기개념·신체상(신체상)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 9 AS sort_order UNION ALL
    SELECT 10 AS item_no, '아빠(또는 다른 보호자)와 단둘이 있게 되면  [□ 해당 없음]' AS prompt_text, 'PARENT' AS domain_code, '부모' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 1 AS allows_not_applicable, 10 AS sort_order UNION ALL
    SELECT 11 AS item_no, '내일이 오는 게 부담스러운 밤에는' AS prompt_text, 'AFFECT' AS domain_code, '정서(불안)' AS domain_label, 'NEGATIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 11 AS sort_order UNION ALL
    SELECT 12 AS item_no, '친구들 사이에서 내가 맡는 역할은' AS prompt_text, 'PEER' AS domain_code, '친구·또래' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 12 AS sort_order UNION ALL
    SELECT 13 AS item_no, '내 몸에서 마음에 드는 곳은' AS prompt_text, 'SELF_BODY' AS domain_code, '자기개념·신체상(신체상)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 13 AS sort_order UNION ALL
    SELECT 14 AS item_no, '누군가를 좋아하게 되면 나는' AS prompt_text, 'ROMANCE' AS domain_code, '좋아하는 마음·관계' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 14 AS sort_order UNION ALL
    SELECT 15 AS item_no, '부모님(또는 보호자)이 내 편이라고 느꼈던 때는' AS prompt_text, 'PARENT' AS domain_code, '부모' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 15 AS sort_order UNION ALL
    SELECT 16 AS item_no, '내 비밀이 다른 사람에게 퍼졌다는 걸 알게 되면' AS prompt_text, 'PEER' AS domain_code, '친구·또래' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 16 AS sort_order UNION ALL
    SELECT 17 AS item_no, '힘든 일이 생기면 가장 먼저 연락하는 사람은' AS prompt_text, 'STRENGTH' AS domain_code, '강점·대처(자원)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 17 AS sort_order UNION ALL
    SELECT 18 AS item_no, '숙제나 수행평가가 밀려 있으면' AS prompt_text, 'SCHOOL' AS domain_code, '학교·교사·학업(학업)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 18 AS sort_order UNION ALL
    SELECT 19 AS item_no, '가슴이 두근거리고 손에 땀이 나는 상황은' AS prompt_text, 'AFFECT' AS domain_code, '정서(불안)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 19 AS sort_order UNION ALL
    SELECT 20 AS item_no, '함께 있으면 시간이 빨리 가는 친구는' AS prompt_text, 'PEER' AS domain_code, '친구·또래' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 20 AS sort_order UNION ALL
    SELECT 21 AS item_no, '누군가 내 외모를 두고 한마디 하면' AS prompt_text, 'SELF_BODY' AS domain_code, '자기개념·신체상(신체상)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 21 AS sort_order UNION ALL
    SELECT 22 AS item_no, '서로 좋아하는 사이에서 가장 지켜야 할 것은' AS prompt_text, 'ROMANCE' AS domain_code, '좋아하는 마음·관계' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 22 AS sort_order UNION ALL
    SELECT 23 AS item_no, '집에서 듣는 잔소리 중 가장 듣기 힘든 것은' AS prompt_text, 'PARENT' AS domain_code, '부모' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 23 AS sort_order UNION ALL
    SELECT 24 AS item_no, '학교에서 하루 중 숨 돌리는 시간은' AS prompt_text, 'SCHOOL' AS domain_code, '학교·교사·학업(학교)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 24 AS sort_order UNION ALL
    SELECT 25 AS item_no, '형제자매나 다른 아이와 비교될 때' AS prompt_text, 'SIBLING' AS domain_code, '형제' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 25 AS sort_order UNION ALL
    SELECT 26 AS item_no, '휴대폰을 내려놓아야 할 때 나는' AS prompt_text, 'MEDIA' AS domain_code, '미디어·여가' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 26 AS sort_order UNION ALL
    SELECT 27 AS item_no, '화가 크게 났던 날 나는' AS prompt_text, 'AFFECT' AS domain_code, '정서(분노)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 27 AS sort_order UNION ALL
    SELECT 28 AS item_no, '스무 살 생일 아침, 눈을 뜬 내가 있는 곳은' AS prompt_text, 'CAREER' AS domain_code, '미래·진로' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 28 AS sort_order UNION ALL
    SELECT 29 AS item_no, '그만두고 싶었지만 끝까지 해낸 일은' AS prompt_text, 'STRENGTH' AS domain_code, '강점·대처(강점)' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 29 AS sort_order UNION ALL
    SELECT 30 AS item_no, '사람들이 나를 한 단어로 표현한다면' AS prompt_text, 'SELF_BODY' AS domain_code, '자기개념·신체상(자기개념)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 30 AS sort_order UNION ALL
    SELECT 31 AS item_no, '형제자매(또는 함께 자란 아이)와 같이 웃었던 일은  [□ 해당 없음]' AS prompt_text, 'SIBLING' AS domain_code, '형제' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 1 AS allows_not_applicable, 31 AS sort_order UNION ALL
    SELECT 32 AS item_no, '부모님(또는 보호자)이 나를 더 알아줬으면 하는 점은' AS prompt_text, 'PARENT' AS domain_code, '부모' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 32 AS sort_order UNION ALL
    SELECT 33 AS item_no, '혼자 점심을 먹게 되는 날' AS prompt_text, 'PEER' AS domain_code, '친구·또래' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 33 AS sort_order UNION ALL
    SELECT 34 AS item_no, '화가 날 때 하는 행동 중 고쳐 보고 싶은 것은' AS prompt_text, 'AFFECT' AS domain_code, '정서(분노)' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 34 AS sort_order UNION ALL
    SELECT 35 AS item_no, '좋아하는 마음을 들켰을 때' AS prompt_text, 'ROMANCE' AS domain_code, '좋아하는 마음·관계' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 35 AS sort_order UNION ALL
    SELECT 36 AS item_no, '진로 이야기가 나오면 내 마음은' AS prompt_text, 'CAREER' AS domain_code, '미래·진로' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 36 AS sort_order UNION ALL
    SELECT 37 AS item_no, '성적이 기대만큼 나오지 않았던 날' AS prompt_text, 'SCHOOL' AS domain_code, '학교·교사·학업(학업)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 37 AS sort_order UNION ALL
    SELECT 38 AS item_no, '스트레스가 쌓이면 꺼내 쓰는 나만의 방법은' AS prompt_text, 'STRENGTH' AS domain_code, '강점·대처(대처)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 38 AS sort_order UNION ALL
    SELECT 39 AS item_no, '온라인에서 본 글이나 댓글 때문에 기분이 상하면 나는' AS prompt_text, 'MEDIA' AS domain_code, '미디어·여가' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 39 AS sort_order UNION ALL
    SELECT 40 AS item_no, '초등학생 때의 나와 지금의 나를 비교해 보면' AS prompt_text, 'SELF_BODY' AS domain_code, '자기개념·신체상(자기개념)' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 40 AS sort_order UNION ALL
    SELECT 41 AS item_no, '미안한데 아직 말을 꺼내지 못한 일은' AS prompt_text, 'AFFECT' AS domain_code, '정서(죄책감)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 41 AS sort_order UNION ALL
    SELECT 42 AS item_no, '주말 오후 우리 집 거실 풍경은' AS prompt_text, 'PARENT' AS domain_code, '부모' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 42 AS sort_order UNION ALL
    SELECT 43 AS item_no, '아무 일정 없는 방학 하루가 주어진다면' AS prompt_text, 'MEDIA' AS domain_code, '미디어·여가' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 43 AS sort_order UNION ALL
    SELECT 44 AS item_no, '몇 년 뒤 형제자매(또는 함께 자란 아이)와 나는  [□ 해당 없음]' AS prompt_text, 'SIBLING' AS domain_code, '형제' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 1 AS allows_not_applicable, 44 AS sort_order UNION ALL
    SELECT 45 AS item_no, '내가 하고 싶은 일과 집에서 바라는 일이 다르다면' AS prompt_text, 'CAREER' AS domain_code, '미래·진로' AS domain_label, 'NEGATIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 45 AS sort_order UNION ALL
    SELECT 46 AS item_no, '예전에 멀어진 친구를 떠올리면' AS prompt_text, 'PEER' AS domain_code, '친구·또래' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 46 AS sort_order UNION ALL
    SELECT 47 AS item_no, '친구들이 나에게 고마워하는 일은' AS prompt_text, 'STRENGTH' AS domain_code, '강점·대처(강점)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 47 AS sort_order UNION ALL
    SELECT 48 AS item_no, '연애에 대해 어른들이 하는 말을 들으면' AS prompt_text, 'ROMANCE' AS domain_code, '좋아하는 마음·관계' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 48 AS sort_order UNION ALL
    SELECT 49 AS item_no, '내가 교장 선생님이라면 우리 학교에서 바꾸고 싶은 것은' AS prompt_text, 'SCHOOL' AS domain_code, '학교·교사·학업(학교)' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 49 AS sort_order UNION ALL
    SELECT 50 AS item_no, '어른이 된 내가 지금의 나에게 문자 한 줄을 보낸다면' AS prompt_text, 'CAREER' AS domain_code, '미래·진로' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 50 AS sort_order
  ) x
  WHERE t.tenant_id = '' AND t.form_type = 'ADOLESCENT' AND t.version = 'v3'
) v
WHERE NOT EXISTS (
  SELECT 1 FROM sct_form_items i WHERE i.form_template_id = v.form_template_id AND i.item_no = v.item_no
);

-- ===== CHILD =====
INSERT INTO sct_form_templates (tenant_id, form_type, version, title, instruction_text, target_desc, is_active, is_deleted, version_lock)
SELECT '', 'CHILD', 'v3', '마인드가든 문장완성 질문지 (아동용)', '- 여기에는 정답이 없어요. 생각나는 대로 말하거나 쓰면 돼요.
- 문장 앞부분을 읽고, 뒤를 이어서 문장을 만들어 주세요.
- 글자를 틀리게 써도 괜찮아요. 잘 모르겠으면 넘어가도 돼요.
- 형제가 없거나 나랑 맞지 않는 문장은 ''□ 해당 없음''에 표시하거나 넘어가도 돼요.
- 시간은 30~40분쯤 걸려요. 힘들면 쉬었다 해도 되고, 두 번에 나눠서 해도 괜찮아요. (저학년은 상담 선생님이 읽어 주고, 말한 대로 받아 적을 수 있어요.)
- 여기 쓴 이야기는 상담 선생님이 소중하게 보관해요. 네가 다치거나 위험할까 봐 걱정되는 이야기가 있으면, 너를 지키기 위해 다른 어른에게 도움을 부탁할 수 있어요.', '초등학생', 1, 0, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM sct_form_templates WHERE tenant_id = '' AND form_type = 'CHILD' AND version = 'v3');

INSERT INTO sct_form_items (form_template_id, item_no, prompt_text, domain_code, domain_label, valence, tense, allows_not_applicable, sort_order)
SELECT v.form_template_id, v.item_no, v.prompt_text, v.domain_code, v.domain_label, v.valence, v.tense, v.allows_not_applicable, v.sort_order
FROM (
  SELECT t.id AS form_template_id, x.item_no, x.prompt_text, x.domain_code, x.domain_label, x.valence, x.tense, x.allows_not_applicable, x.sort_order
  FROM sct_form_templates t
  JOIN (

    SELECT 1 AS item_no, '제일 좋아하는 놀이는' AS prompt_text, 'PLAY' AS domain_code, '놀이·좋아하는 것' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 1 AS sort_order UNION ALL
    SELECT 2 AS item_no, '엄마(또는 돌봐 주는 어른)가 나를 꼭 안아 주면' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(엄마)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 2 AS sort_order UNION ALL
    SELECT 3 AS item_no, '웃음이 멈추지 않았던 날은' AS prompt_text, 'EMOTION' AS domain_code, '감정(기쁨)' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 3 AS sort_order UNION ALL
    SELECT 4 AS item_no, '쉬는 시간에 나는' AS prompt_text, 'FRIEND' AS domain_code, '친구' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 4 AS sort_order UNION ALL
    SELECT 5 AS item_no, '아빠(또는 돌봐 주는 어른)가 나를 부르면' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(아빠)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 5 AS sort_order UNION ALL
    SELECT 6 AS item_no, '기분이 좋으면 내 몸은' AS prompt_text, 'EMOTION' AS domain_code, '감정(기쁨)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 6 AS sort_order UNION ALL
    SELECT 7 AS item_no, '아침에 교실에 들어가면' AS prompt_text, 'SCHOOL_TEACHER' AS domain_code, '학교·선생님(학교)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 7 AS sort_order UNION ALL
    SELECT 8 AS item_no, '나에게서 제일 마음에 드는 점은' AS prompt_text, 'SELF' AS domain_code, '나' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 8 AS sort_order UNION ALL
    SELECT 9 AS item_no, '우리 집 저녁밥 시간은' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(가족)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 9 AS sort_order UNION ALL
    SELECT 10 AS item_no, '눈물이 나려고 할 때 나는' AS prompt_text, 'EMOTION' AS domain_code, '감정(슬픔)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 10 AS sort_order UNION ALL
    SELECT 11 AS item_no, '나를 색깔로 칠한다면' AS prompt_text, 'SELF' AS domain_code, '나' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 11 AS sort_order UNION ALL
    SELECT 12 AS item_no, '엄마(또는 돌봐 주는 어른)가 바쁠 때 나는' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(엄마)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 12 AS sort_order UNION ALL
    SELECT 13 AS item_no, '선생님이 나를 칭찬하면' AS prompt_text, 'SCHOOL_TEACHER' AS domain_code, '학교·선생님(선생님)' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 13 AS sort_order UNION ALL
    SELECT 14 AS item_no, '친구가 같이 안 놀아 주면' AS prompt_text, 'FRIEND' AS domain_code, '친구' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 14 AS sort_order UNION ALL
    SELECT 15 AS item_no, '혼자 놀 때 제일 자주 하는 것은' AS prompt_text, 'PLAY' AS domain_code, '놀이·좋아하는 것' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 15 AS sort_order UNION ALL
    SELECT 16 AS item_no, '마음이 아팠던 날은' AS prompt_text, 'EMOTION' AS domain_code, '감정(슬픔)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 16 AS sort_order UNION ALL
    SELECT 17 AS item_no, '잠자기 전에 떠오르는 걱정은' AS prompt_text, 'WORRY' AS domain_code, '걱정' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 17 AS sort_order UNION ALL
    SELECT 18 AS item_no, '내가 혼자서도 척척 해내는 일은' AS prompt_text, 'SELF' AS domain_code, '나' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 18 AS sort_order UNION ALL
    SELECT 19 AS item_no, '친구랑 싸운 다음 날' AS prompt_text, 'FRIEND' AS domain_code, '친구' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 19 AS sort_order UNION ALL
    SELECT 20 AS item_no, '아빠(또는 돌봐 주는 어른)랑 같이 해 보고 싶은 것은' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(아빠)' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 20 AS sort_order UNION ALL
    SELECT 21 AS item_no, '공부가 어려우면 나는' AS prompt_text, 'SCHOOL_TEACHER' AS domain_code, '학교·선생님(학교)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 21 AS sort_order UNION ALL
    SELECT 22 AS item_no, '내가 좋아하는 음식은' AS prompt_text, 'PLAY' AS domain_code, '놀이·좋아하는 것' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 22 AS sort_order UNION ALL
    SELECT 23 AS item_no, '밤에 불을 끄면' AS prompt_text, 'EMOTION' AS domain_code, '감정(무서움)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 23 AS sort_order UNION ALL
    SELECT 24 AS item_no, '하늘에서 선물 상자가 떨어진다면 그 안에는' AS prompt_text, 'WISH' AS domain_code, '바람·소원' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 24 AS sort_order UNION ALL
    SELECT 25 AS item_no, '어른들이 서로 큰 소리로 말하면' AS prompt_text, 'WORRY' AS domain_code, '걱정' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 25 AS sort_order UNION ALL
    SELECT 26 AS item_no, '아기였을 때 나는' AS prompt_text, 'SELF' AS domain_code, '나' AS domain_label, 'NEUTRAL' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 26 AS sort_order UNION ALL
    SELECT 27 AS item_no, '가족이랑 같이 갔던 곳 중에 생각나는 곳은' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(가족)' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 27 AS sort_order UNION ALL
    SELECT 28 AS item_no, '새 친구를 처음 만나면 나는' AS prompt_text, 'FRIEND' AS domain_code, '친구' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 28 AS sort_order UNION ALL
    SELECT 29 AS item_no, '학교에서 제일 하기 싫은 시간은' AS prompt_text, 'SCHOOL_TEACHER' AS domain_code, '학교·선생님(학교)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 29 AS sort_order UNION ALL
    SELECT 30 AS item_no, '텔레비전이나 영상에서 자주 보는 것은' AS prompt_text, 'PLAY' AS domain_code, '놀이·좋아하는 것' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 30 AS sort_order UNION ALL
    SELECT 31 AS item_no, '깜짝 놀라서 무서웠던 일은' AS prompt_text, 'EMOTION' AS domain_code, '감정(무서움)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 31 AS sort_order UNION ALL
    SELECT 32 AS item_no, '어른이 된 내가 하루 동안 하는 일은' AS prompt_text, 'WISH' AS domain_code, '바람·소원' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 32 AS sort_order UNION ALL
    SELECT 33 AS item_no, '몸이 아플 때 나는' AS prompt_text, 'WORRY' AS domain_code, '걱정' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 33 AS sort_order UNION ALL
    SELECT 34 AS item_no, '친구들이 생각하는 나는' AS prompt_text, 'SELF' AS domain_code, '나' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 34 AS sort_order UNION ALL
    SELECT 35 AS item_no, '언니·오빠·누나·형·동생이 내 물건을 만지면  [□ 해당 없음]' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(형제)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 1 AS allows_not_applicable, 35 AS sort_order UNION ALL
    SELECT 36 AS item_no, '친구한테 듣고 싶은 말은' AS prompt_text, 'FRIEND' AS domain_code, '친구' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 36 AS sort_order UNION ALL
    SELECT 37 AS item_no, '선생님께 꾸중 들었던 날' AS prompt_text, 'SCHOOL_TEACHER' AS domain_code, '학교·선생님(선생님)' AS domain_label, 'NEGATIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 37 AS sort_order UNION ALL
    SELECT 38 AS item_no, '놀이터에 가면 나는' AS prompt_text, 'PLAY' AS domain_code, '놀이·좋아하는 것' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 38 AS sort_order UNION ALL
    SELECT 39 AS item_no, '얼굴이 빨개질 만큼 화가 나는 때는' AS prompt_text, 'EMOTION' AS domain_code, '감정(화)' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 39 AS sort_order UNION ALL
    SELECT 40 AS item_no, '우리 가족에게 바라는 것은' AS prompt_text, 'WISH' AS domain_code, '바람·소원' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 40 AS sort_order UNION ALL
    SELECT 41 AS item_no, '내일 학교에 가서 걱정되는 것은' AS prompt_text, 'WORRY' AS domain_code, '걱정' AS domain_label, 'NEGATIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 41 AS sort_order UNION ALL
    SELECT 42 AS item_no, '집에 돌아오면 제일 먼저 하는 일은' AS prompt_text, 'FAMILY' AS domain_code, '엄마·아빠·가족(가족)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 42 AS sort_order UNION ALL
    SELECT 43 AS item_no, '내가 나한테 속상한 때는' AS prompt_text, 'SELF' AS domain_code, '나' AS domain_label, 'NEGATIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 43 AS sort_order UNION ALL
    SELECT 44 AS item_no, '내가 친구를 도와준 일은' AS prompt_text, 'FRIEND' AS domain_code, '친구' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 44 AS sort_order UNION ALL
    SELECT 45 AS item_no, '다음 학년이 되면' AS prompt_text, 'SCHOOL_TEACHER' AS domain_code, '학교·선생님(학교)' AS domain_label, 'NEUTRAL' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 45 AS sort_order UNION ALL
    SELECT 46 AS item_no, '지난 방학에 제일 재미있었던 일은' AS prompt_text, 'PLAY' AS domain_code, '놀이·좋아하는 것' AS domain_label, 'POSITIVE' AS valence, 'PAST' AS tense, 0 AS allows_not_applicable, 46 AS sort_order UNION ALL
    SELECT 47 AS item_no, '화가 풀리려면' AS prompt_text, 'EMOTION' AS domain_code, '감정(화)' AS domain_label, 'NEUTRAL' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 47 AS sort_order UNION ALL
    SELECT 48 AS item_no, '학교에 생겼으면 하는 것은' AS prompt_text, 'WISH' AS domain_code, '바람·소원' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 48 AS sort_order UNION ALL
    SELECT 49 AS item_no, '걱정이 생기면 이야기하는 사람은' AS prompt_text, 'WORRY' AS domain_code, '걱정' AS domain_label, 'POSITIVE' AS valence, 'PRESENT' AS tense, 0 AS allows_not_applicable, 49 AS sort_order UNION ALL
    SELECT 50 AS item_no, '오늘 밤 꿈에서 만나고 싶은 것은' AS prompt_text, 'WISH' AS domain_code, '바람·소원' AS domain_label, 'POSITIVE' AS valence, 'FUTURE' AS tense, 0 AS allows_not_applicable, 50 AS sort_order
  ) x
  WHERE t.tenant_id = '' AND t.form_type = 'CHILD' AND t.version = 'v3'
) v
WHERE NOT EXISTS (
  SELECT 1 FROM sct_form_items i WHERE i.form_template_id = v.form_template_id AND i.item_no = v.item_no
);

