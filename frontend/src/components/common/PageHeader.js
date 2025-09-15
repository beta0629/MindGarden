import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

/**
 * 공통 페이지 헤더 컴포넌트
 * 뒤로가기 버튼과 페이지 제목을 표시
 */
const PageHeader = ({ title, icon, showBackButton = true, onBackClick }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="page-header">
      <div className="page-header-content">
        {showBackButton && (
          <button 
            className="btn btn-outline-secondary back-btn"
            onClick={handleBackClick}
          >
            <i className="bi bi-arrow-left"></i> 뒤로
          </button>
        )}
        <h1 className="page-title">
          {icon && <i className={`bi ${icon}`}></i>}
          {title}
        </h1>
      </div>
    </div>
  );
};

export default PageHeader;
