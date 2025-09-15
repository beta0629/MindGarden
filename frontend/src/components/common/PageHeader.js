import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

/**
 * 공통 페이지 헤더 컴포넌트
 * 뒤로가기 버튼, 페이지 제목, 햄버거 메뉴를 표시
 */
const PageHeader = ({ title, icon, showBackButton = true, onBackClick, showHamburger = true, onHamburgerClick }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleHamburgerClick = () => {
    setIsMenuOpen(!isMenuOpen);
    if (onHamburgerClick) {
      onHamburgerClick(!isMenuOpen);
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
        {showHamburger && (
          <button 
            className="btn btn-outline-secondary hamburger-btn"
            onClick={handleHamburgerClick}
          >
            <i className={`bi ${isMenuOpen ? 'bi-x' : 'bi-list'}`}></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
