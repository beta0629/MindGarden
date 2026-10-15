/**
 * 상담사 색 팔레트 — /api/v1/admin/css-themes/consultant-colors 한 곳.
 * 범례와 월간 칩 앞 점이 같은 colorClassFor 를 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import { useCallback, useEffect, useState } from 'react';
import StandardizedApi from '../utils/standardizedApi';
import { setConsultantColors } from '../utils/designSystemHelper';
import {
  CONSULTANT_COLORS_ENDPOINT,
  consultantColorClassName,
  extractConsultantColors,
  resolveConsultantColorSlot,
  syncConsultantColorSlotRules
} from '../utils/consultantColorPalette';
import '../components/ui/Schedule/consultantColorSwatch.css';

let paletteCache = null;
let paletteRequest = null;

export function resetConsultantColorPaletteCache() {
  paletteCache = null;
  paletteRequest = null;
}

/**
 * @returns {Promise<string[]>}
 */
export function loadConsultantColorPalette() {
  if (paletteCache) {
    return Promise.resolve(paletteCache);
  }
  if (!paletteRequest) {
    paletteRequest = StandardizedApi.get(CONSULTANT_COLORS_ENDPOINT)
      .then((payload) => {
        const colors = extractConsultantColors(payload);
        paletteCache = colors;
        return colors;
      })
      .catch((error) => {
        paletteRequest = null;
        throw error;
      });
  }
  return paletteRequest;
}

/**
 * @returns {{
 *   colors: string[],
 *   paletteSize: number,
 *   colorClassFor: (consultantId: unknown, consultants?: Array<object>) => string
 * }}
 */
export function useConsultantColorPalette() {
  const [colors, setColors] = useState(() => (Array.isArray(paletteCache) ? paletteCache : []));

  useEffect(() => {
    let cancelled = false;
    loadConsultantColorPalette()
      .then((nextColors) => {
        if (cancelled) {
          return;
        }
        setColors(nextColors);
        if (nextColors.length > 0) {
          setConsultantColors(nextColors);
          syncConsultantColorSlotRules(nextColors.length);
        }
      })
      .catch((error) => {
        console.warn('상담사 색 팔레트 로드 실패:', error);
        if (!cancelled) {
          setColors([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const colorClassFor = useCallback((consultantId, consultants) => {
    const slot = resolveConsultantColorSlot(consultantId, consultants, colors.length);
    return consultantColorClassName(slot);
  }, [colors.length]);

  return {
    colors,
    paletteSize: colors.length,
    colorClassFor
  };
}

export default useConsultantColorPalette;
