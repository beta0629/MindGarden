import React from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import '../../styles/main.css';
import './ComingSoon.css';

/**
 * 준비중 페이지 컴포넌트
 * - 아직 구현되지 않은 기능에 대한 안내 페이지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */
const ComingSoon = ({ title = "준비중", description = "해당 기능은 현재 개발 중입니다." }) => {
  return (
    <SimpleLayout>
      <div className="coming-soon-container">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">
            <i className="bi bi-tools"></i>
          </div>
          <h1 className="coming-soon-title">{title}</h1>
          <p className="coming-soon-description">{description}</p>
          <div className="coming-soon-features">
            <div className="feature-item">
              <i className="bi bi-clock"></i>
              <span>곧 출시될 예정입니다</span>
            </div>
            <div className="feature-item">
              <i className="bi bi-heart"></i>
              <span>더 나은 서비스를 위해 준비 중입니다</span>
            </div>
            <div className="feature-item">
              <i className="bi bi-arrow-left"></i>
              <span>이전 페이지로 돌아가세요</span>
            </div>
          </div>
          <button 
            className="btn btn-primary coming-soon-button"
            onClick={() => window.history.back()}
          >
            <i className="bi bi-arrow-left"></i>
            이전 페이지로
          </button>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default ComingSoon;
