import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import SimpleLayout from '../layout/SimpleLayout';
import '../../styles/main.css';
import './HelpPage.css';

const HelpPage = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const [activeSection, setActiveSection] = useState('general');

  const helpSections = [
    {
      id: 'general',
      title: '일반 사용법',
      icon: 'bi-info-circle',
      content: (
        <div>
          <h4 className="help-section__title">마인드가든 사용 방법</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-calendar-check help-section__card-icon"></i> 일정 관리
            </h5>
            <p className="help-section__card-text">• 대시보드의 빠른 액션에서 "일정"을 클릭하여 예약된 상담 일정을 확인할 수 있습니다.</p>
            <p className="help-section__card-text">• 달력 형태로 표시되어 한눈에 예정된 상담을 확인할 수 있습니다.</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-person-circle help-section__card-icon"></i> 프로필 관리
            </h5>
            <p className="help-section__card-text">• "프로필" 메뉴에서 개인정보를 확인하고 수정할 수 있습니다.</p>
            <p className="help-section__card-text">• 비밀번호 변경 및 계정 설정을 관리할 수 있습니다.</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-chat-dots help-section__card-icon"></i> 상담 내역
            </h5>
            <p className="help-section__card-text">• "상담 내역"에서 과거 상담 기록을 조회할 수 있습니다.</p>
            <p className="help-section__card-text">• 상담 상태별로 필터링하여 검색할 수 있습니다.</p>
          </div>
        </div>
      )
    },
    {
      id: 'consultation',
      title: '상담 관련',
      icon: 'bi-chat-heart',
      content: (
        <div>
          <h4 className="help-section__title">상담 서비스 안내</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-clock help-section__card-icon"></i> 상담 예약
            </h5>
            <p className="help-section__card-text">• 상담 예약은 관리자 또는 상담사를 통해 진행됩니다.</p>
            <p className="help-section__card-text">• 예약 확인은 일정 메뉴에서 확인할 수 있습니다.</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-geo-alt help-section__card-icon"></i> 상담 방법
            </h5>
            <p className="help-section__card-text">• 대면 상담: 지정된 장소에서 직접 만나 상담합니다.</p>
            <p className="help-section__card-text">• 화상 상담: 온라인 플랫폼을 통한 원격 상담이 가능합니다.</p>
            <p className="help-section__card-text">• 전화 상담: 음성 통화를 통한 상담이 가능합니다.</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-file-text help-section__card-icon"></i> 상담 리포트
            </h5>
            <p className="help-section__card-text">• 상담 후 작성된 리포트를 "상담 리포트" 메뉴에서 확인할 수 있습니다.</p>
            <p className="help-section__card-text">• 기간별로 리포트를 조회하고 다운로드할 수 있습니다.</p>
          </div>
        </div>
      )
    },
    {
      id: 'technical',
      title: '기술 지원',
      icon: 'bi-gear',
      content: (
        <div>
          <h4 className="help-section__title">기술적 문제 해결</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-browser-chrome help-section__card-icon"></i> 브라우저 지원
            </h5>
            <p className="help-section__card-text">• 권장 브라우저: Chrome, Firefox, Safari, Edge 최신 버전</p>
            <p className="help-section__card-text">• JavaScript가 활성화되어 있어야 합니다.</p>
            <p className="help-section__card-text">• 쿠키와 팝업이 허용되어야 합니다.</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-wifi help-section__card-icon"></i> 네트워크 문제
            </h5>
            <p className="help-section__card-text">• 인터넷 연결 상태를 확인해주세요.</p>
            <p className="help-section__card-text">• 방화벽이나 보안 프로그램이 차단하지 않는지 확인해주세요.</p>
            <p className="help-section__card-text">• 문제가 지속되면 페이지를 새로고침해보세요.</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-key help-section__card-icon"></i> 로그인 문제
            </h5>
            <p className="help-section__card-text">• 아이디와 비밀번호를 정확히 입력했는지 확인해주세요.</p>
            <p className="help-section__card-text">• 소셜 로그인(카카오, 네이버) 사용 시 해당 서비스의 계정 상태를 확인해주세요.</p>
            <p className="help-section__card-text">• 비밀번호를 잊으신 경우 관리자에게 문의해주세요.</p>
          </div>
        </div>
      )
    },
    {
      id: 'contact',
      title: '문의하기',
      icon: 'bi-telephone',
      content: (
        <div>
          <h4 className="help-section__title">고객 지원</h4>
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-envelope help-section__card-icon"></i> 이메일 문의
            </h5>
            <p className="help-section__card-text">• 일반 문의: support@mindgarden.com</p>
            <p className="help-section__card-text">• 기술 지원: tech@mindgarden.com</p>
            <p className="help-section__card-text">• 응답 시간: 영업일 기준 24시간 이내</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-telephone help-section__card-icon"></i> 전화 문의
            </h5>
            <p className="help-section__card-text">• 고객센터: 1588-0000</p>
            <p className="help-section__card-text">• 운영시간: 평일 09:00 ~ 18:00</p>
            <p className="help-section__card-text">• 상담 예약 및 긴급 문의 시 이용</p>
          </div>
          
          <div className="help-section__card">
            <h5 className="help-section__card-title">
              <i className="bi bi-clock help-section__card-icon"></i> 응답 시간
            </h5>
            <p className="help-section__card-text">• 이메일 문의: 24시간 이내</p>
            <p className="help-section__card-text">• 전화 문의: 즉시 응답</p>
            <p className="help-section__card-text">• 긴급 상황: 24시간 대응</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <SimpleLayout title="도움말">
      <div className="help-page">
        <div className="help-page__header">
          <h1 className="help-page__title">
            <i className="bi bi-question-circle help-page__title-icon"></i>
            도움말
          </h1>
          <p className="help-page__subtitle">
            마인드가든 사용에 필요한 모든 정보를 확인하세요
          </p>
        </div>

        <div className="help-page__content">
          <div className="help-page__sidebar">
            <div className="help-page__nav">
              {helpSections.map((section) => (
                <button
                  key={section.id}
                  className={`help-page__nav-item ${activeSection === section.id ? 'help-page__nav-item--active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <i className={section.icon}></i>
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          <div className="help-page__main">
            {helpSections.find(section => section.id === activeSection)?.content}
          </div>
        </div>

        <div className="help-page__footer">
          <h4 className="help-page__footer-title">
            <i className="bi bi-headset help-page__footer-icon"></i>
            추가 도움이 필요하신가요?
          </h4>
          <p className="help-page__footer-text">
            위의 정보로도 해결되지 않는 문제가 있으시면 언제든지 문의해주세요.
          </p>
          <div className="help-page__footer-actions">
            <button 
              className="btn btn-primary" 
              onClick={() => window.open('mailto:support@mindgarden.com')}
            >
              <i className="bi bi-envelope"></i> 이메일 문의
            </button>
            <button 
              className="btn btn-outline-primary" 
              onClick={() => window.open('tel:1588-0000')}
            >
              <i className="bi bi-telephone"></i> 전화 문의
            </button>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default HelpPage;
