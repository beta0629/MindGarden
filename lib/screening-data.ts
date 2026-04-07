export type TargetGroup = 'adult' | 'child' | 'woman';

export type Topic =
  | 'adhd'
  | 'depression'
  | 'panic'
  | 'asperger'
  | 'ptsd'
  | 'borderline'
  | 'school'
  | 'work'
  | 'addiction';

/** 허브 카드 노출 순서 */
export const SCREENING_TOPIC_ORDER: Topic[] = [
  'adhd',
  'depression',
  'panic',
  'asperger',
  'ptsd',
  'borderline',
  'school',
  'work',
  'addiction',
];

export interface Question {
  id: string;
  text: string;
}

export interface ScreeningData {
  topic: Topic;
  title: string;
  description: string;
  questions: Record<TargetGroup, Question[]>;
}

export const screeningData: Record<Topic, ScreeningData> = {
  adhd: {
    topic: 'adhd',
    title: 'ADHD 자가 점검',
    description: '주의력과 활동량·충동성 등 일상 패턴을 참고용으로 살펴봅니다.',
    questions: {
      adult: [
        { id: 'a1', text: '어떤 일의 어려운 부분은 끝내 놓고, 그 일을 마무리할 때 곤란을 겪은 적이 있습니까?' },
        { id: 'a2', text: '체계적인 계획이 필요한 일을 할 때, 순서를 정하는 데 어려움을 겪습니까?' },
        { id: 'a3', text: '약속이나 해야 할 일을 잊어버리는 경우가 있습니까?' },
      ],
      child: [
        { id: 'c1', text: '수업 시간이나 가만히 앉아 있어야 할 때 자꾸 꼼지락거리나요?' },
        { id: 'c2', text: '질문이 채 끝나기도 전에 성급하게 대답하나요?' },
        { id: 'c3', text: '자신의 차례를 기다리는 것을 어려워하나요?' },
      ],
      woman: [
        { id: 'w1', text: '겉으로는 조용해 보이지만 머릿속은 항상 복잡하고 생각이 끊이지 않나요?' },
        { id: 'w2', text: '완벽을 추구하다 일을 시작하거나 끝내는 데 어려움을 겪나요?' },
        { id: 'w3', text: '감정 기복이 심하고 사소한 일에도 압도되는 느낌을 받나요?' },
      ],
    },
  },
  depression: {
    topic: 'depression',
    title: '우울 자가 점검',
    description: '최근 기분과 활력, 흥미 변화를 참고용으로 점검합니다.',
    questions: {
      adult: [
        { id: 'd_a1', text: '최근 2주일 동안 기분이 가라앉거나 희망이 없다고 느낀 적이 있습니까?' },
        { id: 'd_a2', text: '평소 하던 일에 대한 흥미나 즐거움이 줄어들었습니까?' },
        { id: 'd_a3', text: '잠들기 어렵거나 자주 깨거나, 혹은 너무 많이 자는 편입니까?' },
      ],
      child: [
        { id: 'd_c1', text: '최근 들어 자주 짜증을 내거나 화를 내는 편인가요?' },
        { id: 'd_c2', text: '친구들과 노는 것이 예전만큼 즐겁지 않나요?' },
        { id: 'd_c3', text: '이유 없이 여기저기 아프다고(배, 머리 등) 자주 말하나요?' },
      ],
      woman: [
        { id: 'd_w1', text: '생리 주기나 호르몬 변화에 따라 무기력하거나 우울감이 심해지나요?' },
        { id: 'd_w2', text: '육아나 가사, 직장 생활로 인해 깊은 피로감을 자주 느끼나요?' },
        { id: 'd_w3', text: '자신이 가치 없다고 느껴지거나 죄책감이 드나요?' },
      ],
    },
  },
  panic: {
    topic: 'panic',
    title: '공황·불안 발작 자가 점검',
    description: '갑작스러운 불안과 신체 반응 패턴을 참고용으로 살펴봅니다.',
    questions: {
      adult: [
        { id: 'p_a1', text: '갑자기 심장이 심하게 두근거리거나 빨리 뛰는 것을 느낀 적이 있습니까?' },
        { id: 'p_a2', text: '숨이 가빠지거나 막히는 느낌, 질식할 것 같은 느낌을 받은 적이 있습니까?' },
        { id: 'p_a3', text: '그때 죽을 것 같거나 통제력을 잃을 것 같은 두려움을 느꼈습니까?' },
      ],
      child: [
        { id: 'p_c1', text: '갑자기 무서운 느낌이 들면서 숨쉬기 힘들어한 적이 있나요?' },
        { id: 'p_c2', text: '특정 장소(학교, 학원 등)에 가는 것을 극도로 두려워하나요?' },
        { id: 'p_c3', text: '부모님과 떨어지는 것을 심하게 불안해하나요?' },
      ],
      woman: [
        { id: 'p_w1', text: '사람이 많은 곳이나 밀폐된 공간에서 갑작스러운 불안과 신체 증상을 경험한 적이 있나요?' },
        { id: 'p_w2', text: '그런 증상이 다시 나타날까 봐 항상 불안하게 지내시나요?' },
        { id: 'p_w3', text: '증상 때문에 평소 가던 장소나 상황을 피하게 되었나요?' },
      ],
    },
  },
  asperger: {
    topic: 'asperger',
    title: 'ASD(자폐 스펙트럼) 패턴 자가 점검',
    description: '사회적 상호작용·감각·관심 패턴을 참고용으로 살펴봅니다.',
    questions: {
      adult: [
        { id: 'as_a1', text: '다른 사람의 의도나 감정을 파악하는 데 어려움을 겪는 편입니까?' },
        { id: 'as_a2', text: '특정 주제에 지나치게 몰두해 대화가 한쪽으로 흐르는 경향이 있습니까?' },
        { id: 'as_a3', text: '예상치 못한 변화나 일상 루틴이 깨지는 것을 매우 힘들어합니까?' },
      ],
      child: [
        { id: 'as_c1', text: '또래와 어울려 노는 것보다 혼자 노는 것을 더 좋아하나요?' },
        { id: 'as_c2', text: '눈맞춤을 피하거나 제스처 등 비언어 표현이 제한적인가요?' },
        { id: 'as_c3', text: '특정 물건이나 행동에 강하게 집착하는 모습을 보이나요?' },
      ],
      woman: [
        { id: 'as_w1', text: '사회적 상황에서 남들처럼 보이기 위해 많은 에너지를 쓰나요?' },
        { id: 'as_w2', text: '은유나 농담을 이해하기 어렵고 말을 글자 그대로 받아들이는 편인가요?' },
        { id: 'as_w3', text: '소리·빛·촉각 등에 예민해 일상에서 쉽게 지치나요?' },
      ],
    },
  },
  ptsd: {
    topic: 'ptsd',
    title: 'PTSD·외상 후 스트레스 자가 점검',
    description: '힘들었던 경험 이후 반복되는 불안·회상·각성 반응을 참고용으로 살펴봅니다.',
    questions: {
      adult: [
        { id: 'pt_a1', text: '괴로웠던 사건이 떠오르거나 악몽으로 반복되는 경우가 있습니까?' },
        { id: 'pt_a2', text: '그 일과 관련된 생각·장소·사람을 의식적으로 피하게 됩니까?' },
        { id: 'pt_a3', text: '예민해지거나 쉽게 놀라고, 경계가 올라가 잠들기 어렵습니까?' },
      ],
      child: [
        { id: 'pt_c1', text: '무섭거나 힘들었던 일 이후로 자주 악몽을 꾸거나 그때 일을 말하나요?' },
        { id: 'pt_c2', text: '특정 장소나 상황만 되면 갑자기 무서워하거나 몸이 굳나요?' },
        { id: 'pt_c3', text: '예전만큼 놀이나 학교에 관심이 줄고 쉽게 깜짝 놀라나요?' },
      ],
      woman: [
        { id: 'pt_w1', text: '관계 속에서 무력감·불안이 반복되며 그때 기억이 떠오르곤 하나요?' },
        { id: 'pt_w2', text: '신체 증상(두통, 소화 불편 등)이 스트레스 때 악화되는 느낌인가요?' },
        { id: 'pt_w3', text: '혼자 있거나 밤이 되면 불안과 긴장이 커지나요?' },
      ],
    },
  },
  borderline: {
    topic: 'borderline',
    title: '경계선 성격 패턴 자가 점검',
    description: '감정 기복, 대인관계, 정체감 등 패턴을 참고용으로 살펴봅니다. (임상적 명칭 확정이 아님)',
    questions: {
      adult: [
        { id: 'bd_a1', text: '가까운 사람에 대한 생각이 극단적으로 좋거나 나쁘게 바뀌곤 합니까?' },
        { id: 'bd_a2', text: '외로움·공허함을 견디기 매우 힘들다고 느낄 때가 많습니까?' },
        { id: 'bd_a3', text: '순간적으로 격한 감정이 올라와 후회되는 말·행동을 한 적이 있습니까?' },
      ],
      child: [
        { id: 'bd_c1', text: '사소한 일에 크게 실망하거나 감정 반응이 매우 큰 편인가요?' },
        { id: 'bd_c2', text: '친구 관계가 자주 갈등으로 어긋나나요?' },
        { id: 'bd_c3', text: '혼자 있으면 허전하거나 불안한 마음이 자주 드나요?' },
      ],
      woman: [
        { id: 'bd_w1', text: '관계에서 버림받을까 두려워 과하게 맞추거나 거리를 두게 되나요?' },
        { id: 'bd_w2', text: '감정이 격해지면 스스로를 탓하거나 자책이 심해지나요?' },
        { id: 'bd_w3', text: '누구인지·무엇을 원하는지 혼란스럽게 느끼는 때가 있나요?' },
      ],
    },
  },
  school: {
    topic: 'school',
    title: '학교생활 부적응 자가 점검',
    description: '출석, 수업 참여, 또래 관계 등 학교 적응 어려움을 참고용으로 살펴봅니다.',
    questions: {
      adult: [
        { id: 'sc_a1', text: '(보호자 기준) 자녀가 학교 가기를 극도로 거부하거나 자주 빠진다고 느끼십니까?' },
        { id: 'sc_a2', text: '자녀의 성적·과제가 급격히 떨어졌다고 생각하십니까?' },
        { id: 'sc_a3', text: '교우 관련 갈등이나 따돌림 우려가 있다고 느끼십니까?' },
      ],
      child: [
        { id: 'sc_c1', text: '학교에 가기 싫거나 아픈 것처럼 말하는 날이 자주 있나요?' },
        { id: 'sc_c2', text: '수업 시간에 집중하기 어렵거나 자리에 잘 안 앉아 있나요?' },
        { id: 'sc_c3', text: '친구들과 어울리기 어렵다고 느끼나요?' },
      ],
      woman: [
        { id: 'sc_w1', text: '학업·진로 압박으로 학교(또는 대학) 생활이 버겁게 느껴지나요?' },
        { id: 'sc_w2', text: '교우·교사 관계에서 지속적인 스트레스를 받나요?' },
        { id: 'sc_w3', text: '등교 거부나 수업 참여 회피 경향이 있나요?' },
      ],
    },
  },
  work: {
    topic: 'work',
    title: '직장생활 부적응 자가 점검',
    description: '업무 몰입, 대인관계, 번아웃 신호 등을 참고용으로 살펴봅니다.',
    questions: {
      adult: [
        { id: 'wk_a1', text: '출근 전부터 심한 불안·저항감이 드는 날이 잦습니까?' },
        { id: 'wk_a2', text: '업무량이 버겁거나 집중이 잘 되지 않습니까?' },
        { id: 'wk_a3', text: '동료·상사와의 관계에서 지속적인 스트레스를 받습니까?' },
      ],
      child: [
        { id: 'wk_c1', text: '알바나 진로 준비가 부담스러워 피하고 싶다고 느끼나요?' },
        { id: 'wk_c2', text: '평가·지시에 민감해 스트레스가 크게 느껴지나요?' },
        { id: 'wk_c3', text: '해야 할 일을 미루다 마감 직전에 몰아서 하게 되나요?' },
      ],
      woman: [
        { id: 'wk_w1', text: '일과 가정 역할 사이에서 번아웃이나 죄책감을 자주 느끼나요?' },
        { id: 'wk_w2', text: '직장 내 관계나 평가에 과민하게 반응하게 되나요?' },
        { id: 'wk_w3', text: '휴식을 취해도 피로가 잘 풀리지 않나요?' },
      ],
    },
  },
  addiction: {
    topic: 'addiction',
    title: '중독·과몰입 행동 자가 점검',
    description: '술·담배·약물, 게임, 스마트폰 등 행동 조절 어려움을 참고용으로 살펴봅니다.',
    questions: {
      adult: [
        { id: 'ad_a1', text: '특정 행동(음주, 게임, 스마트폰 등)을 줄이려 해도 잘 되지 않습니까?' },
        { id: 'ad_a2', text: '그 행동을 하지 않으면 생활이 버겁거나 짜증이 심해집니까?' },
        { id: 'ad_a3', text: '주변 사람들이 그 행동을 걱정하거나 말린 적이 있습니까?' },
      ],
      child: [
        { id: 'ad_c1', text: '게임이나 동영상을 멈추라고 해도 자꾸 더 하고 싶나요?' },
        { id: 'ad_c2', text: '공부나 밥·잠 시간을 줄여가며 화면을 보게 되나요?' },
        { id: 'ad_c3', text: '끊으려 할 때 화가 나거나 매우 불안한가요?' },
      ],
      woman: [
        { id: 'ad_w1', text: '감정 정리를 위해 음식·음주·쇼핑 등에 자주 의존하나요?' },
        { id: 'ad_w2', text: 'SNS나 영상 시청 시간을 통제하기 어렵나요?' },
        { id: 'ad_w3', text: '그 행동 때문에 수면·대인관계에 문제가 생긴다고 느끼나요?' },
      ],
    },
  },
};
