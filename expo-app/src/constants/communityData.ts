/**
 * 커뮤니티 Mock 데이터
 *
 * @author MindGarden
 * @since 2026-05-12
 */

export type CommunityTab = 'all' | 'reviews' | 'columns';

export interface CommunityComment {
  readonly id: number;
  readonly author: string;
  readonly body: string;
  readonly time: string;
  readonly likes: number;
}

export interface CommunityPost {
  readonly id: number;
  readonly tab: CommunityTab;
  readonly author: string;
  readonly specialty: string;
  readonly title: string;
  readonly body: string;
  readonly likes: number;
  readonly comments: readonly CommunityComment[];
  readonly time: string;
  readonly isConsultant: boolean;
  readonly isAnonymous: boolean;
}

export const COMMUNITY_TABS: readonly { key: CommunityTab; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'reviews', label: '내담자 후기' },
  { key: 'columns', label: '상담사 칼럼' },
] as const;

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 1,
    tab: 'reviews',
    author: '익명의 나무',
    specialty: '',
    title: '첫 상담 후기',
    body: '처음이라 많이 긴장했는데, 상담사 선생님이 정말 편안하게 대해주셔서 좋았습니다. 그동안 혼자 끙끙 앓던 것들을 이야기하니 마음이 한결 가벼워졌어요.',
    likes: 12,
    comments: [
      { id: 1, author: '익명의 하늘', body: '저도 비슷한 경험이에요!', time: '1시간 전', likes: 3 },
      { id: 2, author: '익명의 꽃', body: '용기 내셔서 정말 대단해요.', time: '30분 전', likes: 5 },
    ],
    time: '2시간 전',
    isConsultant: false,
    isAnonymous: true,
  },
  {
    id: 2,
    tab: 'reviews',
    author: '익명의 바다',
    specialty: '',
    title: '3개월 상담 후 변화',
    body: '매주 상담을 받으면서 불안이 많이 줄었어요. 자동적 사고를 알아차리는 연습이 정말 도움이 되었습니다.',
    likes: 24,
    comments: [
      { id: 3, author: '익명의 구름', body: '어떤 기법이 가장 도움이 되었나요?', time: '2시간 전', likes: 2 },
    ],
    time: '5시간 전',
    isConsultant: false,
    isAnonymous: true,
  },
  {
    id: 3,
    tab: 'reviews',
    author: '익명의 별',
    specialty: '',
    title: '상담이 처음인 분들에게',
    body: '용기 내서 시작해보세요. 저도 반년 전에 시작했는데 인생이 바뀌었어요. 혼자가 아니라는 걸 알게 되었습니다.',
    likes: 35,
    comments: [],
    time: '1일 전',
    isConsultant: false,
    isAnonymous: true,
  },
  {
    id: 4,
    tab: 'columns',
    author: '김상담',
    specialty: '인지행동치료 전문',
    title: '스트레스를 관리하는 마인드풀니스',
    body: '일상에서 마인드풀니스를 실천하는 방법에 대해 알려드립니다. 지금 이 순간에 집중하는 것만으로도 스트레스가 크게 줄어듭니다. 마인드풀니스는 특별한 도구가 필요하지 않습니다. 하루 5분, 호흡에 집중하는 것으로 시작해보세요.',
    likes: 45,
    comments: [
      { id: 4, author: '이마음', body: '좋은 글 감사합니다!', time: '1시간 전', likes: 4 },
      { id: 5, author: '익명의 달', body: '매일 실천해보겠습니다.', time: '30분 전', likes: 2 },
    ],
    time: '3시간 전',
    isConsultant: true,
    isAnonymous: false,
  },
  {
    id: 5,
    tab: 'columns',
    author: '이마음',
    specialty: '가족상담 전문',
    title: '부모-자녀 관계에서 경계 설정하기',
    body: '건강한 가족관계를 위해서는 서로의 경계를 존중하는 것이 중요합니다. 오늘은 부모-자녀 사이에서 건강한 경계를 설정하는 방법을 이야기해보겠습니다.',
    likes: 31,
    comments: [],
    time: '1일 전',
    isConsultant: true,
    isAnonymous: false,
  },
  {
    id: 6,
    tab: 'columns',
    author: '박치유',
    specialty: '우울증 전문',
    title: '우울할 때 할 수 있는 작은 일들',
    body: '아무것도 하고 싶지 않은 날, 정말 작은 것부터 시작하면 됩니다. 커튼 열기, 물 한 잔 마시기, 5분만 산책하기 — 이것만으로도 충분합니다.',
    likes: 52,
    comments: [
      { id: 6, author: '익명의 빛', body: '오늘 산책 다녀왔습니다. 감사합니다.', time: '3시간 전', likes: 8 },
    ],
    time: '2일 전',
    isConsultant: true,
    isAnonymous: false,
  },
] as const;

export const MMKV_KEY_COMMUNITY_POSTS = 'mg_community_posts';
export const MMKV_KEY_COMMUNITY_LIKES = 'mg_community_likes';
