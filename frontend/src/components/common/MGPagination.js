import React from 'react';
import './MGPagination.css';

/**
 * MindGarden 페이징 컴포넌트
 * 데이터 페이징을 위한 통합 컴포넌트
 */
const MGPagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange = null,
  onItemsPerPageChange = null,
  loading = false,
  className = '',
  variant = 'default', // 'default', 'compact', 'minimal'
  showInfo = true,
  showItemsPerPage = true,
  itemsPerPageOptions = [10, 20, 50, 100],
  ...props
}) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
      if (onPageChange) {
        onPageChange(page);
      }
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange && newItemsPerPage !== itemsPerPage) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  const getPaginationClasses = () => {
    return [
      'mg-pagination',
      `mg-pagination--${variant}`,
      loading ? 'mg-pagination--loading' : '',
      className
    ].filter(Boolean).join(' ');
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // 첫 페이지와 마지막 페이지 사이의 구분점 추가
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // 마지막 페이지와 구분점
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={getPaginationClasses()} {...props}>
      {loading && (
        <div className="mg-pagination__loading">
          <div className="mg-pagination__spinner"></div>
        </div>
      )}
      
      {showInfo && totalItems > 0 && (
        <div className="mg-pagination__info">
          <span className="mg-pagination__info-text">
            {startItem}-{endItem} / {totalItems}개 항목
          </span>
        </div>
      )}
      
      <div className="mg-pagination__content">
        {/* 이전 페이지 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="mg-pagination__button mg-pagination__button--prev"
          title="이전 페이지"
        >
          ←
        </button>
        
        {/* 페이지 번호들 */}
        <div className="mg-pagination__pages">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="mg-pagination__ellipsis">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={loading}
                className={`mg-pagination__button mg-pagination__button--page ${
                  page === currentPage ? 'mg-pagination__button--active' : ''
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>
        
        {/* 다음 페이지 버튼 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="mg-pagination__button mg-pagination__button--next"
          title="다음 페이지"
        >
          →
        </button>
      </div>
      
      {/* 페이지당 항목 수 선택 */}
      {showItemsPerPage && (
        <div className="mg-pagination__items-per-page">
          <label className="mg-pagination__items-label">
            페이지당:
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            disabled={loading}
            className="mg-pagination__items-select"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}개
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default MGPagination;



