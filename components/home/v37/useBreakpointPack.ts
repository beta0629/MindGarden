'use client';

import { useSyncExternalStore } from 'react';
import type { PackId } from './types';

const MQ = '(min-width: 768px)';
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)';

function packFromMatch(matches: boolean): PackId {
  return matches ? '1440' : '390';
}

function subscribePack(onChange: () => void) {
  const mql = window.matchMedia(MQ);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getPackSnapshot(): PackId {
  return packFromMatch(window.matchMedia(MQ).matches);
}

function getPackServerSnapshot(): PackId {
  return '390';
}

/**
 * width ≥768 → '1440' asset pack; &lt;768 → '390'.
 * Client snapshot is live matchMedia from the first client render (useSyncExternalStore).
 */
export function useBreakpointPack(): PackId {
  return useSyncExternalStore(subscribePack, getPackSnapshot, getPackServerSnapshot);
}

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_MQ);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_MQ).matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}
