/**
 * 환불 이력 테이블 블록 (Organism)
 * list SSOT · 행 CTA: unreflected「ERP 반영」primary / reflected「열기」ghost · EntityRowActions
 *
 * FE 휴리스틱(isRefundErpReflected): erpReference truthy 또는 erpStatus ∈ SENT/REFLECTED/SYNCED
 * → reflected, else unreflected. API erpStatus 실데이터 신뢰 불가(엔드포인트 불변).
 *
 * @author CoreSolution
 * @since 2025-03-16
 * @updated 2026-09-08 Clinic-OS row CTA
 */

import React from 'react';
import PropTypes from 'prop-types';
import { toDisplayString, toSafeNumber } from '../../../utils/safeDisplay';
import MGButton from '../../common/MGButton';
import { EntityRowActions, ENTITY_ROW_ACTIONS_LAYOUT } from '../../common';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpSizeToMg,
  mapErpVariantToMg
} from '../common/erpMgButtonProps';
import ErpStatusBadge from '../common/ErpStatusBadge';
import { ErpSafeText, ErpSafeNumber, ERP_NUMBER_FORMAT, ErpEmptyState } from '../common';
import { useTranslation } from 'react-i18next';
import {
  RM_EMPTY_LIST,
  RM_ROW,
  isRefundErpReflected
} from '../../../constants/refundManagementClinicOsStrings';

const RefundHistoryTableBlock = ({
  refundHistory = [],
  pageInfo,
  onPageChange,
  onReflectErp,
  onOpenDetail,
  selectedRowIds = [],
  onToggleRowSelection,
  isLoadingReflect = false
}) => {
  const { t } = useTranslation();
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
      className="refund-management__table refund-management__table-block"
      aria-labelledby="refund-history-heading"
      aria-busy={isLoadingReflect}
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
                  {t('common.labels.client')}
                </th>
                <th scope="col" className="refund-management__th">
                  {t('common.labels.consultant')}
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
                const reflected = isRefundErpReflected(refund);
                const menuItems = [
                  {
                    id: 'detail',
                    label: RM_ROW.DETAIL_TITLE,
                    onClick: () => onOpenDetail?.(refund)
                  }
                ];

                return (
                  <tr key={rowKey} className="refund-management__data-row refund-management__row">
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
                      <div className="refund-management__actions">
                        {reflected ? (
                          <MGButton
                            type="button"
                            variant="ghost"
                            size="small"
                            className={buildErpMgButtonClassName({
                              variant: 'ghost',
                              size: 'sm',
                              loading: false,
                              className:
                                'refund-management__cta refund-management__cta--ghost'
                            })}
                            onClick={() => onOpenDetail?.(refund)}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            aria-label={RM_ROW.CTA_OPEN_ARIA}
                            preventDoubleClick={false}
                          >
                            {RM_ROW.CTA_OPEN}
                          </MGButton>
                        ) : (
                          <MGButton
                            type="button"
                            variant="primary"
                            size="small"
                            className={buildErpMgButtonClassName({
                              variant: 'primary',
                              size: 'sm',
                              loading: isLoadingReflect,
                              className:
                                'refund-management__cta refund-management__cta--primary'
                            })}
                            onClick={() => onReflectErp(refund)}
                            disabled={isLoadingReflect}
                            loading={isLoadingReflect}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            aria-label={RM_ROW.CTA_REFLECT_ARIA}
                          >
                            {RM_ROW.CTA_REFLECT}
                          </MGButton>
                        )}
                        <div className="refund-management__row-menu">
                          <EntityRowActions
                            layout={ENTITY_ROW_ACTIONS_LAYOUT.TABLE}
                            ariaLabel={RM_ROW.MENU_ARIA}
                            menuId={`refund-row-menu-${rowKey}`}
                            items={menuItems}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <ErpEmptyState title={RM_EMPTY_LIST} />
        )}
      </div>
      {totalPages > 1 && (
        <nav
          className="refund-management__pagination"
          aria-label="환불 이력 페이지 네비게이션"
        >
          <MGButton
            type="button"
            variant={mapErpVariantToMg('secondary')}
            size={mapErpSizeToMg('md')}
            className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            disabled={!hasPrevious}
            onClick={() => onPageChange(currentPage - 1)}
            preventDoubleClick={false}
          >
            {t('common.actions.prev')}
          </MGButton>
          <span className="refund-management__pagination-info">
            <ErpSafeText value={`${currentPage + 1} / ${totalPages} 페이지`} />
          </span>
          <MGButton
            type="button"
            variant={mapErpVariantToMg('secondary')}
            size={mapErpSizeToMg('md')}
            className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
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

RefundHistoryTableBlock.propTypes = {
  refundHistory: PropTypes.array,
  pageInfo: PropTypes.object,
  onPageChange: PropTypes.func.isRequired,
  onReflectErp: PropTypes.func.isRequired,
  onOpenDetail: PropTypes.func,
  selectedRowIds: PropTypes.array,
  onToggleRowSelection: PropTypes.func,
  isLoadingReflect: PropTypes.bool
};

export default RefundHistoryTableBlock;
