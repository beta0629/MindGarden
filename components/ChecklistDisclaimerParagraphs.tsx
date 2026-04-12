'use client';

import type { CSSProperties } from 'react';
import CopyGuard from '@/components/CopyGuard';
import {
  checklistLegalNotice,
  CHECKLIST_EXPERT_PARAGRAPH_INDEX,
} from '@/lib/checklist-legal-notice';

interface Props {
  /** 마지막(전문가) 문단에만 동일하게 적용 */
  pStyle?: CSSProperties;
  getPStyle?: (index: number, total: number) => CSSProperties | undefined;
}

export default function ChecklistDisclaimerParagraphs({ pStyle, getPStyle }: Props) {
  const total = checklistLegalNotice.paragraphs.length;

  return (
    <>
      {checklistLegalNotice.paragraphs.map((p, i) => {
        const style = getPStyle ? getPStyle(i, total) : pStyle;
        if (i === CHECKLIST_EXPERT_PARAGRAPH_INDEX) {
          return (
            <CopyGuard key={i} as="p" style={style}>
              {p}
            </CopyGuard>
          );
        }
        return (
          <p key={i} style={style}>
            {p}
          </p>
        );
      })}
    </>
  );
}
