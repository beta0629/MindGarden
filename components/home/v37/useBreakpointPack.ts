'use client';

import { useEffect, useState } from 'react';
import type { PackId } from './types';

const MQ = '(min-width: 768px)';

function packFromMatch(matches: boolean): PackId {
  return matches ? '1440' : '390';
}

/**
 * width ≥768 → '1440' asset pack; &lt;768 → '390'.
 */
export function useBreakpointPack(): PackId {
  const [pack, setPack] = useState<PackId>('390');

  useEffect(() => {
    const mql = window.matchMedia(MQ);
    const apply = () => setPack(packFromMatch(mql.matches));
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);

  return pack;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mql.matches);
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, []);

  return reduced;
}
