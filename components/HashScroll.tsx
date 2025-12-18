'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    // 홈페이지에서만 작동
    if (pathname !== '/') return;

    // URL에 해시가 있으면 해당 섹션으로 스크롤
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          const offset = 80; // GNB 높이 고려
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  }, [pathname]);

  return null;
}

