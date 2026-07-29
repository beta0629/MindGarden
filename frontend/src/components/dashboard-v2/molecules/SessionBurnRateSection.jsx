/**
 * §D 회기 소진율 — ACTIVE 매칭 기준 상담사별 가중 소진율 프로그레스 섹션.
 *
 * 기존 `integrated-progress-*` 행 패턴 재사용. 읽기 전용(드릴다운 없음).
 *
 * @author CoreSolution
 * @since 2026-07-29
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { maskEncryptedDisplay } from '../../../utils/codeHelper';
import { toSafeNumber } from '../../../utils/safeDisplay';

/**
 * @param {object} props
 * @param {Array<{
 *   consultantId: number|string,
 *   consultantName: string,
 *   burnRate: number,
 *   usedSessions?: number,
 *   remainingSessions?: number
 * }>} props.items — 집계된 랭킹 (이미 top N·정렬 완료, 사용 회기 합산 기준)
 * @param {boolean} [props.showRemaining=true]
 */
const SessionBurnRateSection = ({ items, showRemaining = true }) => {
  const { t } = useTranslation(['admin']);
  const list = Array.isArray(items) ? items : [];

  const title = t('admin:dashboard.consultationStats.sessionBurnTitle', {
    defaultValue: '회기 소진율'
  });
  const hint = t('admin:dashboard.consultationStats.sessionBurnHint', {
    defaultValue: '현재 활성 매칭 · 순위는 사용 회기 합산'
  });
  const sectionAria = t('admin:dashboard.consultationStats.sessionBurnSectionAria', {
    defaultValue: '회기 소진율, 순위는 사용 회기 합산 기준'
  });
  const emptyLabel = t('admin:dashboard.consultationStats.sessionBurnEmpty', {
    defaultValue: '활성 매칭의 회기 소진 데이터가 없습니다'
  });

  return (
    <section
      className="mg-v2-ad-b0kla__session-burn-section"
      aria-label={sectionAria}
    >
      <div className="mg-v2-ad-b0kla__session-burn-header">
        <h4 className="mg-v2-ad-b0kla__session-burn-title">{title}</h4>
        <span className="mg-v2-ad-b0kla__session-burn-hint">{hint}</span>
      </div>

      {list.length === 0 ? (
        <div className="mg-v2-ad-b0kla__session-burn-empty">{emptyLabel}</div>
      ) : (
        <div className="mg-v2-ad-b0kla__integrated-progress-list">
          {list.map((row, index) => {
            const rank = index + 1;
            const rate = Math.min(100, Math.max(0, toSafeNumber(row.burnRate, 0)));
            const maskedName = maskEncryptedDisplay(row.consultantName, '상담사');
            const used = toSafeNumber(row.usedSessions, 0);
            const remaining = toSafeNumber(row.remainingSessions, 0);
            const ariaLabel = t('admin:dashboard.consultationStats.sessionBurnRowAria', {
              name: maskedName,
              used,
              rate,
              remaining,
              defaultValue: `${maskedName} 사용 ${used}회, 소진율 ${rate}%, 잔여 ${remaining}회`
            });

            return (
              <div
                key={`session-burn-${row.consultantId ?? maskedName}-${rank}`}
                className="mg-v2-ad-b0kla__integrated-progress-row mg-v2-ad-b0kla__session-burn-row"
              >
                <span className="mg-v2-ad-b0kla__integrated-progress-rank">{`${rank}위`}</span>
                <span
                  className="mg-v2-ad-b0kla__integrated-progress-name"
                  title={maskedName}
                >
                  {maskedName}
                </span>
                <div
                  className="mg-v2-ad-b0kla__integrated-progress-track"
                  role="progressbar"
                  aria-valuenow={rate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={ariaLabel}
                >
                  <div
                    className="mg-v2-ad-b0kla__integrated-progress-fill"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="mg-v2-ad-b0kla__integrated-progress-value">{`${rate}%`}</span>
                {showRemaining && (
                  <span className="mg-v2-ad-b0kla__session-burn-remaining">
                    {t('admin:dashboard.consultationStats.sessionBurnRemaining', {
                      count: remaining,
                      defaultValue: `잔여 ${remaining}회`
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

SessionBurnRateSection.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      consultantId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      consultantName: PropTypes.string,
      burnRate: PropTypes.number,
      usedSessions: PropTypes.number,
      remainingSessions: PropTypes.number
    })
  ),
  showRemaining: PropTypes.bool
};

export default SessionBurnRateSection;
