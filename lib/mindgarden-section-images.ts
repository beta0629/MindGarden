/**
 * 전문특화(/about/mindgarden) 섹션별 보조 이미지 — Unsplash (next.config remotePatterns)
 * 이모지 대신 실제 사진으로 분위기 보조. alt는 제목과 중복되지 않게 장면 위주.
 */
export const mindgardenSectionImages = {
  responsibility: {
    src: 'https://images.unsplash.com/photo-1527137342181-19aab08a8ee9?w=1000&h=667&fit=crop&q=80',
    alt: '따뜻한 햇살이 들어오는 편안한 실내',
  },
  trust: {
    src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1000&h=667&fit=crop&q=80',
    alt: '서로 협력하는 듯한 비즈니스 미팅 장면',
  },
  experience: {
    src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1000&h=667&fit=crop&q=80',
    alt: '차분하고 평온한 분위기의 휴식 공간',
  },
  origin: {
    src: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1000&h=667&fit=crop&q=80',
    alt: '집중해서 읽고 정리하는 책상 위의 책과 노트',
  },
  'late-diagnosis': {
    src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&h=667&fit=crop&q=80',
    alt: '전문적인 상담 대화를 나누는 장면',
  },
  comprehensive: {
    src: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1000&h=667&fit=crop&q=80',
    alt: '가족과 함께하는 따뜻한 일상의 한 장면',
  },
  philosophy: {
    src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1000&h=667&fit=crop&q=80',
    alt: '밝고 정돈된 건축 공간의 자연광',
  },
  invitation: {
    src: 'https://images.unsplash.com/photo-1499209974431-9dddfece7f88?w=1000&h=667&fit=crop&q=80',
    alt: '부드러운 꽃과 자연이 있는 차분한 풍경',
  },
} as const;
