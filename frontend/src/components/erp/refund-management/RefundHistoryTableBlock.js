/**
 * 환불 이력 테이블 블록 (Organism)
 * thead + tbody + 페이지네이션, 행별 ERP 반영 버튼
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';

const ERP_STATUS_MAP = {
  SENT: { text: '전송완료', variant: 'success' },
  PENDING: { text: '전송대기', variant: 'warning' },
  FAILED: { text: '전송실패', variant: 'danger' },
  CONFIRMED: { text: '확인완료', variant: 'neutral' }
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';

const StatusBadge = ({ status }) => {
  const config = ERP_STATUS_MAP[status] || { text: '알수없음', variant: 'neutral' };
  const className = `refund-management__status-badge refund-management__status-badge--${config.variant}`;
  return (
    <span className={className} role="status">
      {config.text}
    </span>
  );
};

const RefundHistoryTableBlock = ({
  refundHistory,
  pageInfo,
  onPageChange,
  onReflectErp,
  selectedRowIds = [],
  onToggleRowSelection,
  isLoadingReflect = false
}) => {
  const totalPages = pageInfo?.totalPages ?? 0;
  const currentPage = pageInfo?.currentPage ?? 0;
  const hasPrevious = pageInfo?.hasPrevious ?? false;
  const hasNext = pageInfo?.hasNext ?? false;

  const isRowSelected = (mappingId, terminatedAt) => {
    if (!Array.isArray(selectedRowIds)) return false;
    return selectedRowIds.some(
      (id) => id.mappingId === mappingId && id.terminatedAt === terminatedAt
    );
  };

  const handleToggle = (refund) => {
    if (onToggleRowSelection) {
      onToggleRowSelection(refund);
    }
  };

  return (
    <section
      className="refund-management__table-block"
      aria-labelledby="refund-history-heading"
    >
      <h2 id="refund-history-heading" className="sr-only">
        환불 이력 목록
      </h2>
      <div className="refund-management__table-wrapper">
        {refundHistory.length > 0 ? (
          <table
            className="refund-management__history-table"
            role="table"
            aria-labelledby="refund-history-heading"
          >
            <thead>
              <tr>
                {onToggleRowSelection && (
                  <th scope="col" className="refund-management__th" aria-label="선택">
                    선택
                  </th>
                )}
                <th scope="col" className="refund-management__th">
                  환불일시
                </th>
                <th scope="col" className="refund-management__th">
                  내담자
                </th>
                <th scope="col" className="refund-management__th">
                  상담사
                </th>
                <th scope="col" className="refund-management__th">
                  패키지
                </th>
                <th scope="col" className="refund-management__th">
                  환불 회기
                </th>
                <th scope="col" className="refund-management__th">
                  환불 금액
                </th>
                <th scope="col" className="refund-management__th">
                  환불 사유
                </th>
                <th scope="col" className="refund-management__th">
                  ERP 상태
                </th>
                <th
                  scope="col"
                  className="refund-management__th refund-management__th--action"
                  aria-label="액션"
                />
              </tr>
            </thead>
            <tbody>
              {refundHistory.map((refund, index) => {
                const rowKey = `${refund.mappingId}-${refund.terminatedAt}-${index}`;
                const selected = isRowSelected(refund.mappingId, refund.terminatedAt);
                return (
                  <tr key={rowKey} className="refund-management__data-row">
                    {onToggleRowSelection && (
                      <td className="refund-management__td">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleToggle(refund)}
                          aria-label={`${refund.clientName} 행 선택`}
                        />
                      </td>
                    )}
                    <td className="refund-management__td">{refund.terminatedAt}</td>
                    <td className="refund-management__td">{refund.clientName}</td>
                    <td className="refund-management__td">{refund.consultantName}</td>
                    <td className="refund-management__td">{refund.packageName}</td>
                    <td className="refund-management__td">
                      <span className="mg-v2-count-badge">{refund.refundedSessions}회</span>
                    </td>
                    <td className="refund-management__td">{formatCurrency(refund.refundAmount)}</td>
                    <td className="refund-management__td">{refund.standardizedReason}</td>
                    <td className="refund-management__td">
                      <StatusBadge status={refund.erpStatus} />
                    </td>
                    <td className="refund-management__td refund-management__td--action">
                      <button
                        type="button"
                        className="mg-v2-button mg-v2-button--secondary mg-v2-button--small"
                        onClick={() => onReflectErp(refund)}
                        disabled={isLoadingReflect}
                        aria-label="해당 건 ERP 환불 반영"
                      >
                        ERP 반영
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="refund-management__empty-message">
            선택한 기간에 환불 이력이 없습니다.
          </p>
        )}
      </div>
      {totalPages > 1 && (
        <nav
          className="refund-management__pagination"
          aria-label="환불 이력 페이지 네비게이션"
        >
          <button
            type="button"
            className="mg-v2-button mg-v2-button--secondary"
            disabled={!hasPrevious}
            onClick={() => onPageChange(currentPage - 1)}
          >
            이전
          </button>
          <span className="refund-management__pagination-info">
            {currentPage + 1} / {totalPages} 페이지
          </span>
          <button
            type="button"
            className="mg-v2-button mg-v2-button--secondary"
            disabled={!hasNext}
            onClick={() => onPageChange(currentPage + 1)}
          >
            다음
          </button>
        </nav>
      )}
    </section>
  );
};

export default RefundHistoryTableBlock;
