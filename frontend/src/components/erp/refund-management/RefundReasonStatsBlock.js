/**
 * 환불 사유별 통계 블록 (Organism)
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';

const RefundReasonStatsBlock = ({ refundReasonStats }) => {
  const entries = refundReasonStats && typeof refundReasonStats === 'object'
    ? Object.entries(refundReasonStats)
    : [];
  const total = entries.reduce((sum, [, count]) => sum + (Number(count) || 0), 0);

  return (
    <section
      className="refund-management__reason-stats-block"
      aria-labelledby="refund-reason-stats-heading"
    >
      <h2 id="refund-reason-stats-heading" className="refund-management__section-title">
        환불 사유별 통계
      </h2>
      {entries.length > 0 ? (
        <table className="refund-management__reason-stats-table" role="table">
          <thead>
            <tr>
              <th scope="col">사유</th>
              <th scope="col">건수</th>
              <th scope="col">비율</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([reason, count]) => {
              const num = Number(count) || 0;
              const ratio = total > 0 ? ((num / total) * 100).toFixed(1) : '0';
              return (
                <tr key={reason}>
                  <td>{reason}</td>
                  <td>{num}건</td>
                  <td>{ratio}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="refund-management__reason-stats-empty">
          환불 사유별 통계가 없습니다.
        </p>
      )}
    </section>
  );
};

export default RefundReasonStatsBlock;
