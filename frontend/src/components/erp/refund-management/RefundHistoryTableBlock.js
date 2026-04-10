/**
 * 환불 이력 테이블 블록 (Organism)
 * thead + tbody + 페이지네이션, 행별 ERP 반영 버튼
 *
 * @author CoreSolution
 * @since 2025-03-16
 */

import React from 'react';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import MGButton from '../../common/MGButton';
import ErpStatusBadge from '../common/ErpStatusBadge';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT, ErpEmptyState } from '../common';

const RefundHistoryTableBlock = ({
  refundHistory = [],
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
                const sessionsLabel = `${new Intl.NumberFormat('ko-KR').format(
                  toSafeNumber(refund.refundedSessions)
                )}회`;
                const rowAria = `${toDisplayString(refund.clientName)} 행 선택`;
                return (
                  <tr key={rowKey} className="refund-management__data-row">
                    {onToggleRowSelection && (
                      <td className="refund-management__td">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => handleToggle(refund)}
                          aria-label={rowAria}
                        />
                      </td>
                    )}
                    <td className="refund-management__td">
                      <ErpSafeText value={refund.terminatedAt} />
                    </td>
                    <td className="refund-management__td">
                      <ErpSafeText value={refund.clientName} />
                    </td>
                    <td className="refund-management__td">
                      <ErpSafeText value={refund.consultantName} />
                    </td>
                    <td className="refund-management__td">
                      <ErpSafeText value={refund.packageName} />
                    </td>
                    <td className="refund-management__td">
                      <span className="mg-v2-count-badge">
                        <ErpSafeText value={sessionsLabel} />
                      </span>
                    </td>
                    <td className="refund-management__td">
                      <ErpSafeNumber
                        value={refund.refundAmount}
                        formatType={ERP_NUMBER_FORMAT.CURRENCY}
                      />
                    </td>
                    <td className="refund-management__td">
                      <ErpSafeText value={refund.standardizedReason} />
                    </td>
                    <td className="refund-management__td">
                      <ErpStatusBadge status={refund.erpStatus} />
                    </td>
                    <td className="refund-management__td refund-management__td--action">
                      <MGButton
                        type="button"
                        variant="secondary"
                        size="small"
                        className="mg-v2-button mg-v2-button--secondary mg-v2-button--small"
                        onClick={() => onReflectErp(refund)}
                        disabled={isLoadingReflect}
                        loading={isLoadingReflect}
                        loadingText="반영 중..."
                        aria-label="해당 건 ERP 환불 반영"
                      >
                        ERP 반영
                      </MGButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <ErpEmptyState title="선택한 기간에 환불 이력이 없습니다." />
        )}
      </div>
      {totalPages > 1 && (
        <nav
          className="refund-management__pagination"
          aria-label="환불 이력 페이지 네비게이션"
        >
          <MGButton
            type="button"
            variant="secondary"
            size="small"
            className="mg-v2-button mg-v2-button--secondary"
            disabled={!hasPrevious}
            onClick={() => onPageChange(currentPage - 1)}
            preventDoubleClick={false}
          >
            이전
          </MGButton>
          <span className="refund-management__pagination-info">
            <ErpSafeText value={`${currentPage + 1} / ${totalPages} 페이지`} />
          </span>
          <MGButton
            type="button"
            variant="secondary"
            size="small"
            className="mg-v2-button mg-v2-button--secondary"
            disabled={!hasNext}
            onClick={() => onPageChange(currentPage + 1)}
            preventDoubleClick={false}
          >
            다음
          </MGButton>
        </nav>
      )}
    </section>
  );
};

export default RefundHistoryTableBlock;
