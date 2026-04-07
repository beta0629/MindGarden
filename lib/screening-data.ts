export type TargetGroup = 'adult' | 'child' | 'woman';
export type Topic = 'adhd' | 'depression' | 'panic' | 'asperger';

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
    title: 'ADHD 자가진단',
    description: '주의력결핍 과다행동장애(ADHD)의 가능성을 알아봅니다.',
    questions: {
      adult: [
        { id: 'a1', text: '어떤 일의 어려운 부분은 끝내 놓고, 그 일을 마무리지을 때 곤란을 겪은 적이 있습니까?' },
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
        { id: 'w2', text: '완벽주의 성향 때문에 일을 시작하거나 끝내는 데 어려움을 겪나요?' },
        { id: 'w3', text: '감정 기복이 심하고 사소한 일에도 쉽게 압도되는 느낌을 받나요?' },
      ],
    }
  },
  depression: {
    topic: 'depression',
    title: '우울증 자가진단',
    description: '최근의 기분 상태와 우울감을 점검해 봅니다.',
    questions: {
      adult: [
        { id: 'd_a1', text: '최근 2주일 동안 기분이 가라앉거나, 우울하거나, 희망이 없다고 느낀 적이 있습니까?' },
        { id: 'd_a2', text: '평소 하던 일에 대한 흥미나 즐거움이 줄어들었습니까?' },
        { id: 'd_a3', text: '잠들기 어렵거나 자주 깨거나, 혹은 너무 많이 자는 편입니까?' },
      ],
      child: [
        { id: 'd_c1', text: '최근 들어 자주 짜증을 내거나 화를 내는 편인가요?' },
        { id: 'd_c2', text: '친구들과 노는 것이 예전만큼 즐겁지 않나요?' },
        { id: 'd_c3', text: '이유 없이 여기저기 아프다고(배, 머리 등) 자주 말하나요?' },
      ],
      woman: [
        { id: 'd_w1', text: '생리 주기나 호르몬 변화에 따라 우울감이 심해지는 것을 느끼나요?' },
        { id: 'd_w2', text: '육아나 가사, 직장 생활로 인해 심한 무기력감을 느끼나요?' },
        { id: 'd_w3', text: '자신이 가치 없는 사람이라고 느껴지거나 죄책감이 드나요?' },
      ]
    }
  },
  panic: {
    topic: 'panic',
    title: '공황장애 자가진단',
    description: '갑작스러운 불안과 신체적 증상을 확인합니다.',
    questions: {
      adult: [
        { id: 'p_a1', text: '갑자기 심장이 심하게 두근거리거나 빨리 뛰는 것을 느낀 적이 있습니까?' },
        { id: 'p_a2', text: '숨이 가빠지거나 막히는 느낌, 혹은 질식할 것 같은 느낌을 받은 적이 있습니까?' },
        { id: 'p_a3', text: '이러한 증상들이 나타날 때 죽을 것 같거나 통제력을 잃을 것 같은 두려움을 느꼈습니까?' },
      ],
      child: [
        { id: 'p_c1', text: '갑자기 무서운 느낌이 들면서 숨쉬기 힘들어한 적이 있나요?' },
        { id: 'p_c2', text: '특정 장소(학교, 학원 등)에 가는 것을 극도로 두려워하나요?' },
        { id: 'p_c3', text: '부모님과 떨어지는 것을 심하게 불안해하나요?' },
      ],
      woman: [
        { id: 'p_w1', text: '사람이 많은 곳이나 밀폐된 공간에서 갑작스러운 불안과 신체 증상을 경험한 적이 있나요?' },
        { id: 'p_w2', text: '이러한 증상이 다시 나타날까 봐 항상 불안해하며 생활하시나요?' },
        { id: 'p_w3', text: '증상 때문에 평소에 잘 가던 장소나 상황을 피하게 되었나요?' },
      ]
    }
  },
  asperger: {
    topic: 'asperger',
    title: '아스퍼거/ASD 자가진단',
    description: '사회적 상호작용과 의사소통 패턴을 알아봅니다.',
    questions: {
      adult: [
        { id: 'as_a1', text: '다른 사람들의 의도나 감정을 파악하는 데 어려움을 겪는 편입니까?' },
        { id: 'as_a2', text: '특정 주제나 관심사에 대해 지나치게 몰두하여 대화를 주도하는 경향이 있습니까?' },
        { id: 'as_a3', text: '예상치 못한 변화나 일상의 루틴이 깨지는 것을 매우 힘들어합니까?' },
      ],
      child: [
        { id: 'as_c1', text: '또래 친구들과 어울려 노는 것보다 혼자 노는 것을 더 좋아하나요?' },
        { id: 'as_c2', text: '눈맞춤을 피하거나 비언어적 의사소통(제스처 등)이 제한적인가요?' },
        { id: 'as_c3', text: '특정한 물건이나 행동에 강하게 집착하는 모습을 보이나요?' },
      ],
      woman: [
        { id: 'as_w1', text: '사회적 상황에서 남들처럼 행동하기 위해 의식적으로 많은 에너지를 소모(마스킹)하나요?' },
        { id: 'as_w2', text: '은유나 농담을 이해하기 어렵고, 사람들의 말을 글자 그대로 받아들이는 편인가요?' },
        { id: 'as_w3', text: '감각(소리, 빛, 촉각 등)에 예민하여 일상생활에서 피로감을 쉽게 느끼나요?' },
      ]
    }
  }
};
