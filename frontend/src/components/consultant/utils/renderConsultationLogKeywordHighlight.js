import React from 'react';

/**
 * 심리검사 요약/권고·주의 코멘트에서 키워드 강조.
 * @param {string|null|undefined} text 원문
 * @returns {React.ReactNode|null}
 */
export function renderConsultationLogKeywordHighlight(text) {
  if (!text || typeof text !== 'string') return null;
  const parts = text.split(/(위험|주의|권고)/g);
  return parts.map((part, i) => {
    if (part === '위험') {
      return (
        <strong key={i} className="mg-v2-consultation-log-modal__kw mg-v2-consultation-log-modal__kw--danger">
          위험
        </strong>
      );
    }
    if (part === '주의') {
      return (
        <strong key={i} className="mg-v2-consultation-log-modal__kw mg-v2-consultation-log-modal__kw--warning">
          주의
        </strong>
      );
    }
    if (part === '권고') {
      return (
        <strong key={i} className="mg-v2-consultation-log-modal__kw mg-v2-consultation-log-modal__kw--primary">
          권고
        </strong>
      );
    }
    return part;
  });
}
