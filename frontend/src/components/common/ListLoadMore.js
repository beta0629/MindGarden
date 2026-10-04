/**
 * ListLoadMore — page/size 목록 하단 「더 보기」 (usePagedList 짝).
 * 전체 건수를 알면 「n / total」 을 함께 보여 준다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import MGButton from './MGButton';
import { buildErpMgButtonClassName } from '../erp/common/erpMgButtonProps';
import { PAGED_LIST_COPY, PAGED_LIST_TEST_IDS } from '../../constants/pagedList';
import './ListLoadMore.css';

const ListLoadMore = ({
  loadedCount,
  totalCount = null,
  hasMore,
  loading = false,
  onLoadMore,
  label = PAGED_LIST_COPY.LOAD_MORE,
  className = ''
}) => {
  if (!hasMore && totalCount == null) {
    return null;
  }
  const rootClass = ['mg-list-load-more', className].filter(Boolean).join(' ');
  return (
    <div className={rootClass} data-testid={PAGED_LIST_TEST_IDS.LOAD_MORE}>
      {totalCount != null ? (
        <span className="mg-list-load-more__count" data-testid={PAGED_LIST_TEST_IDS.COUNT}>
          {`${loadedCount}${PAGED_LIST_COPY.COUNT_SEPARATOR}${totalCount}`}
        </span>
      ) : null}
      {hasMore ? (
        <MGButton
          type="button"
          variant="secondary"
          className={buildErpMgButtonClassName({ variant: 'secondary', loading })}
          onClick={onLoadMore}
          disabled={loading}
          loading={loading}
          loadingText={PAGED_LIST_COPY.LOADING_MORE}
          preventDoubleClick={false}
          data-testid={PAGED_LIST_TEST_IDS.LOAD_MORE_BUTTON}
        >
          {label}
        </MGButton>
      ) : null}
    </div>
  );
};

ListLoadMore.propTypes = {
  loadedCount: PropTypes.number.isRequired,
  totalCount: PropTypes.number,
  hasMore: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
  onLoadMore: PropTypes.func.isRequired,
  label: PropTypes.string,
  className: PropTypes.string
};

export default ListLoadMore;
