// import { useState, useEffect, useCallback } from 'react';

/**
 * 간단한 분위기 테마 관리 훅
 * 
 * 기능:
 * - 분위기별 색상 변경 (accent, card, shadow)
 * - 부드러운 전환 애니메이션
 * - 분위기 지속성 (localStorage)
 */
export const useMoodTheme = () => {
  // localStorage에서 초기 분위기 설정 또는 'default'
  const [currentMood, setCurrentMood] = useState(() => {
    const savedMood = localStorage.getItem('mindgarden-mood-theme');
    return savedMood || 'default';
  });

  // body에 data-mood 속성 설정
  useEffect(() => {
    document.documentElement.setAttribute('data-mood', currentMood);
    localStorage.setItem('mindgarden-mood-theme', currentMood);
  }, [currentMood]);

  // 분위기 변경 함수
  const setMood = useCallback((mood) => {
    setCurrentMood(mood);
  }, []);

  return { currentMood, setMood };
};

