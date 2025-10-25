/**
 * Button 컴포넌트 사용 예시
 */

import {useState} from 'react';

import Button from './Button';

const ButtonExamples = () => {const [loading, setLoading] = useState(false);
  const [clickedButton, setClickedButton] = useState(null);

  const handleAsyncClick = async() => {setLoading(true);
    setClickedButton('async');
    
    // 비동기 작업 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    setClickedButton(null);};

  const handleClick = (buttonName) => {setClickedButton(buttonName);
    setTimeout(() => setClickedButton(null), FORM_CONSTANTS.MAX_TEXTAREA_LENGTH);};

  return (<div className="mg-v2-v2-v2-section">
      <div className="mg-v2-v2-v2-section-header">
        <h2 className="mg-v2-v2-v2-section-title">Button 컴포넌트 예시</h2>
        <p className="mg-v2-v2-v2-section-subtitle">
          MGButton을 확장한 v2.COLOR_CONSTANTS.ALPHA_TRANSPARENT 버튼 컴포넌트의 다양한 사용법
        </p>
      </div>

      <div className="mg-v2-v2-v2-section-content">
        {/* 기본 사용법 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>기본 사용법</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button>기본 버튼</Button>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
            </div>
          </div>
        </div>

        {/* 크기 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>크기 변형</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-center mg-v2-v2-v2-flex-wrap">
              <Button size="small">Small</Button>
              <Button size="medium">Medium</Button>
              <Button size="large">Large</Button>
            </div>
          </div>
        </div>

        {/* 색상 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>색상 변형</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="error">Error</Button>
              <Button variant="info">Info</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>
        </div>

        {/* 아이콘 버튼 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>아이콘 버튼</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button icon="PLUS">추가</Button>
              <Button icon="EDIT" variant="secondary">편집</Button>
              <Button icon="TRASH" variant="error">삭제</Button>
              <Button icon="SAVE" variant="success">저장</Button>
              <Button icon="SEARCH" variant="outline">검색</Button>
            </div>
          </div>
        </div>

        {/* 아이콘 위치 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>아이콘 위치</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button icon="CHEVRON_LEFT" iconPosition="left">이전</Button>
              <Button icon="CHEVRON_RIGHT" iconPosition="right">다음</Button>
              <Button icon="DOWNLOAD" iconPosition="left" variant="outline">다운로드</Button>
              <Button icon="UPLOAD" iconPosition="right" variant="outline">업로드</Button>
            </div>
          </div>
        </div>

        {/* 상태별 버튼 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>상태별 버튼</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button>정상</Button>
              <Button disabled>비활성화</Button>
              <Button loading>로딩 중</Button>
              <Button loading loadingText="처리 중...">로딩 중 (커스텀 텍스트)</Button>
            </div>
          </div>
        </div>

        {/* 클릭 이벤트 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>클릭 이벤트</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => handleClick('normal')}>
                일반 클릭
              </Button>
              <Button 
                onClick={handleAsyncClick}
                loading={loading}
                loadingText="처리 중..."
              >
                비동기 처리
              </Button>
              <Button 
                onClick={() => handleClick('prevent')}
                preventDoubleClick={true}
              >
                중복 클릭 방지
              </Button>
            </div>
            {clickedButton && (<p className="mg-v2-v2-v2-text-sm mg-v2-v2-v2-text-center mg-v2-v2-v2-mt-md">
                {clickedButton} 버튼이 클릭되었습니다!
              </p>)}
          </div>
        </div>

        {/* 전체 너비 버튼 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>전체 너비 버튼</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-flex-column mg-v2-v2-v2-gap-sm">
              <Button fullWidth>전체 너비 버튼</Button>
              <Button fullWidth variant="outline">전체 너비 아웃라인</Button>
              <Button fullWidth variant="ghost">전체 너비 고스트</Button>
            </div>
          </div>
        </div>

        {/* 버튼 그룹 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>버튼 그룹</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-button-group">
              <Button variant="outline">왼쪽</Button>
              <Button variant="outline">가운데</Button>
              <Button variant="outline">오른쪽</Button>
            </div>
          </div>
        </div>

        {/* 버튼 툴바 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>버튼 툴바</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-button-toolbar">
              <Button icon="PLUS" size="small">추가</Button>
              <Button icon="EDIT" size="small" variant="secondary">편집</Button>
              <Button icon="TRASH" size="small" variant="error">삭제</Button>
              <Button icon="SAVE" size="small" variant="success">저장</Button>
            </div>
          </div>
        </div>

        {/* 역할별 테마 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>역할별 테마</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button role="CLIENT" icon="HEART">내담자 테마</Button>
              <Button role="CONSULTANT" icon="USERS">상담사 테마</Button>
              <Button role="ADMIN" icon="SETTINGS">관리자 테마</Button>
            </div>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>실제 사용 예시</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button 
                icon="PLUS" 
                variant="primary"
                onClick={() => handleClick('create')}
              >
                새로 만들기
              </Button>
              <Button 
                icon="EDIT" 
                variant="secondary"
                onClick={() => handleClick('edit')}
              >
                편집
              </Button>
              <Button 
                icon="TRASH" 
                variant="error"
                onClick={() => handleClick('delete')}
              >
                삭제
              </Button>
              <Button 
                icon="SAVE" 
                variant="success"
                onClick={() => handleClick('save')}
              >
                저장
              </Button>
              <Button 
                icon="CANCEL" 
                variant="outline"
                onClick={() => handleClick('cancel')}
              >
                취소
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>);};

export default ButtonExamples;
