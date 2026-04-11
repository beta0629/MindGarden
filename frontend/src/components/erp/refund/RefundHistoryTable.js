import React from 'react';
import PropTypes from 'prop-types';
import { toSafeNumber } from '../../../utils/safeDisplay';
import MGButton from '../../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpSizeToMg,
  mapErpVariantToMg
} from '../common/erpMgButtonProps';
import ErpStatusBadge from '../common/ErpStatusBadge';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT, ErpEmptyState } from '../common';
import './RefundHistoryTable.css';

/**
 * 환불 이력 테이블 컴포넌트
 */
const RefundHistoryTable = ({ refundHistory = [], pageInfo = {}, onPageChange }) => {
  const rows = Array.isArray(refundHistory) ? refundHistory : [];
  const totalPages = pageInfo?.totalPages ?? 0;
  const currentPage = pageInfo?.currentPage ?? 0;
  const hasPrevious = pageInfo?.hasPrevious ?? false;
  const hasNext = pageInfo?.hasNext ?? false;

  const pageLabel = `${currentPage + 1} / ${totalPages} 페이지`;

  return (
    <section className="mg-v2-erp-refund-history" aria-labelledby="refund-history-table-title">
      <h2 id="refund-history-table-title" className="mg-v2-erp-refund-history__title">
        환불 이력
      </h2>
      {rows.length > 0 ? (
        <>
          <div className="mg-v2-erp-table-wrapper">
            <div className="mg-v2-table-container">
              <table className="mg-v2-table">
                <thead>
                  <tr>
                    <th>환불일시</th>
                    <th>내담자</th>
                    <th>상담사</th>
                    <th>패키지</th>
                    <th>환불 회기</th>
                    <th>환불 금액</th>
                    <th>환불 사유</th>
                    <th>ERP 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((refund, index) => {
                    const sessionsLabel = `${new Intl.NumberFormat('ko-KR').format(
                      toSafeNumber(refund.refundedSessions)
                    )}회`;
                    return (
                      <tr
                        key={`${refund.mappingId}-${refund.terminatedAt}-${index}`}
                        className={index % 2 === 0 ? 'mg-v2-table-row' : 'mg-v2-table-row-alt'}
                      >
                        <td>
                          <ErpSafeText value={refund.terminatedAt} />
                        </td>
                        <td>
                          <ErpSafeText value={refund.clientName} />
                        </td>
                        <td>
                          <ErpSafeText value={refund.consultantName} />
                        </td>
                        <td>
                          <ErpSafeText value={refund.packageName} />
                        </td>
                        <td className="mg-v2-table-cell">
                          <ErpSafeText value={sessionsLabel} />
                        </td>
                        <td className="mg-v2-table-cell mg-v2-text-right">
                          <ErpSafeNumber
                            value={refund.refundAmount}
                            formatType={ERP_NUMBER_FORMAT.CURRENCY}
                          />
                        </td>
                        <td>
                          <ErpSafeText value={refund.standardizedReason} />
                        </td>
                        <td className="mg-v2-table-cell">
                          <ErpStatusBadge status={refund.erpStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mg-v2-erp-refund-history__pagination">
              <MGButton
                variant={mapErpVariantToMg('secondary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                disabled={!hasPrevious}
                onClick={() => onPageChange(currentPage - 1)}
              >
                이전
              </MGButton>

              <span className="mg-v2-erp-refund-history__page-indicator">
                <ErpSafeText value={pageLabel} />
              </span>

              <MGButton
                variant={mapErpVariantToMg('secondary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                disabled={!hasNext}
                onClick={() => onPageChange(currentPage + 1)}
              >
                다음
              </MGButton>
            </div>
          )}
        </>
      ) : (
        <ErpEmptyState title="선택한 기간에 환불 이력이 없습니다." />
      )}
    </section>
  );
};

RefundHistoryTable.propTypes = {
  refundHistory: PropTypes.arrayOf(PropTypes.object),
  pageInfo: PropTypes.shape({
    totalPages: PropTypes.number,
    currentPage: PropTypes.number,
    hasPrevious: PropTypes.bool,
    hasNext: PropTypes.bool
  }),
  onPageChange: PropTypes.func.isRequired
};

export default RefundHistoryTable;
