/**
 * Icon 컴포넌트 사용 예시
 */

import {useState} from 'react';

import Icon from './Icon';

const IconExamples = () => {const [clickedIcon, setClickedIcon] = useState(null);

  const handleIconClick = (iconName) => {setClickedIcon(iconName);
    setTimeout(() => setClickedIcon(null), FORM_CONSTANTS.MAX_TEXTAREA_LENGTH);};

  return (<div className="mg-v2-v2-v2-section">
      <div className="mg-v2-v2-v2-section-header">
        <h2 className="mg-v2-v2-v2-section-title">Icon 컴포넌트 예시</h2>
        <p className="mg-v2-v2-v2-section-subtitle">
          중앙화된 아이콘 시스템을 사용하는 Icon 컴포넌트의 다양한 사용법
        </p>
      </div>

      <div className="mg-v2-v2-v2-section-content">
        {/* 기본 사용법 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>기본 사용법</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md">
              <Icon name="CALENDAR" />
              <Icon name="USERS" />
              <Icon name="SETTINGS" />
              <Icon name="BELL" />
            </div>
          </div>
        </div>

        {/* 크기 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>크기 변형</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <Icon name="CALENDAR" size="XS" />
              <Icon name="CALENDAR" size="SM" />
              <Icon name="CALENDAR" size="MD" />
              <Icon name="CALENDAR" size="LG" />
              <Icon name="CALENDAR" size="XL" />
              <Icon name="CALENDAR" size="XXL" />
              <Icon name="CALENDAR" size="XXXL" />
              <Icon name="CALENDAR" size="HUGE" />
            </div>
          </div>
        </div>

        {/* 색상 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>색상 변형</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <Icon name="CALENDAR" color="PRIMARY" />
              <Icon name="CALENDAR" color="SECONDARY" />
              <Icon name="CALENDAR" color="SUCCESS" />
              <Icon name="CALENDAR" color="WARNING" />
              <Icon name="CALENDAR" color="ERROR" />
              <Icon name="CALENDAR" color="INFO" />
              <Icon name="CALENDAR" color="MUTED" />
              <Icon name="CALENDAR" color="TRANSPARENT" />
            </div>
          </div>
        </div>

        {/* 변형 스타일 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>변형 스타일</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <Icon name="CALENDAR" variant="default" />
              <Icon name="CALENDAR" variant="outlined" />
              <Icon name="CALENDAR" variant="filled" />
              <Icon name="CALENDAR" variant="minimal" />
            </div>
          </div>
        </div>

        {/* 클릭 가능한 아이콘 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>클릭 가능한 아이콘</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <Icon 
                name="CALENDAR" 
                onClick={() => handleIconClick('CALENDAR')}
                aria-label="달력 열기"
              />
              <Icon 
                name="SETTINGS" 
                onClick={() => handleIconClick('SETTINGS')}
                aria-label="설정 열기"
              />
              <Icon 
                name="BELL" 
                onClick={() => handleIconClick('BELL')}
                aria-label="알림 열기"
              />
              <Icon 
                name="SEARCH" 
                onClick={() => handleIconClick('SEARCH')}
                aria-label="검색 열기"
              />
            </div>
            {clickedIcon && (<p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-center mg-v2-v2-v2-mt-md">
                {clickedIcon} 아이콘이 클릭되었습니다!
              </p>)}
          </div>
        </div>

        {/* 상태별 아이콘 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>상태별 아이콘</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <Icon name="CALENDAR" />
              <Icon name="CALENDAR" disabled />
              <Icon name="CALENDAR" loading />
            </div>
          </div>
        </div>

        {/* 역할별 테마 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>역할별 테마</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <Icon name="CALENDAR" role="CLIENT" color="PRIMARY" />
              <Icon name="CALENDAR" role="CONSULTANT" color="PRIMARY" />
              <Icon name="CALENDAR" role="ADMIN" color="PRIMARY" />
            </div>
          </div>
        </div>

        {/* 아이콘 래퍼와 배지 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>아이콘 래퍼와 배지</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <div className="mg-v2-v2-v2-icon-wrapper">
                <Icon name="BELL" />
                <span className="mg-v2-v2-v2-icon-badge">BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS</span>
              </div>
              <div className="mg-v2-v2-v2-icon-wrapper">
                <Icon name="MAIL" />
                <span className="mg-v2-v2-v2-icon-badge">99+</span>
              </div>
              <div className="mg-v2-v2-v2-icon-wrapper">
                <Icon name="MESSAGE" />
                <span className="mg-v2-v2-v2-icon-badge">!</span>
              </div>
            </div>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>실제 사용 예시</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center">
              <button className="mg-v2-v2-v2-button mg-v2-v2-v2-button-primary">
                <Icon name="PLUS" size="SM" />
                새로 만들기
              </button>
              <button className="mg-v2-v2-v2-button mg-v2-v2-v2-button-secondary">
                <Icon name="EDIT" size="SM" />
                편집
              </button>
              <button className="mg-v2-v2-v2-button mg-v2-v2-v2-button-error">
                <Icon name="TRASH" size="SM" />
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>);};

export default IconExamples;
