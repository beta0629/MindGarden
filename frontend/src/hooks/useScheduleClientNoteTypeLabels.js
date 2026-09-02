/**
 * 내담자 특이사항 noteType 공통코드 라벨 훅 (SSOT)
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

import { useCallback, useEffect, useState } from 'react';
import {
  buildScheduleClientNoteTypeLabelMap,
  resolveScheduleClientNoteTypeLabel
} from '../utils/scheduleClientNoteTypeUtils';
import { getCommonCodes } from '../utils/commonCodeUtils';
import { SCHEDULE_CLIENT_NOTE_TYPE_GROUP } from '../constants/clientScheduleNoteConstants';

export function useScheduleClientNoteTypeLabels() {
  const [labelMap, setLabelMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const codes = await getCommonCodes(SCHEDULE_CLIENT_NOTE_TYPE_GROUP);
        if (cancelled) return;
        setLabelMap(buildScheduleClientNoteTypeLabelMap(codes));
      } catch (error) {
        if (!cancelled) {
          console.warn('특이사항 유형 코드 로드 실패:', error);
          setLabelMap({});
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getLabel = useCallback(
    (codeValue) => resolveScheduleClientNoteTypeLabel(codeValue, labelMap),
    [labelMap]
  );

  return { getLabel, labelMap };
}
