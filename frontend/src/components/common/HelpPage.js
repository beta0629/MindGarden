import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSession } from '../../contexts/SessionContext';
import SimpleLayout from '../layout/SimpleLayout';

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
          <h4 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px' }}>마인드가든 사용 방법</h4>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-calendar-check" style={{ color: '#3498db' }}></i> 일정 관리
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 대시보드의 빠른 액션에서 "일정"을 클릭하여 예약된 상담 일정을 확인할 수 있습니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 달력 형태로 표시되어 한눈에 예정된 상담을 확인할 수 있습니다.</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-person-circle" style={{ color: '#3498db' }}></i> 프로필 관리
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• "프로필" 메뉴에서 개인정보를 확인하고 수정할 수 있습니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 비밀번호 변경 및 계정 설정을 관리할 수 있습니다.</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-chat-dots" style={{ color: '#3498db' }}></i> 상담 내역
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• "상담 내역"에서 과거 상담 기록을 조회할 수 있습니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 상담 상태별로 필터링하여 검색할 수 있습니다.</p>
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
          <h4 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px' }}>상담 서비스 안내</h4>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-clock" style={{ color: '#3498db' }}></i> 상담 예약
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 상담 예약은 관리자 또는 상담사를 통해 진행됩니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 예약 확인은 일정 메뉴에서 확인할 수 있습니다.</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-geo-alt" style={{ color: '#3498db' }}></i> 상담 방법
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 대면 상담: 지정된 장소에서 직접 만나 상담합니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 화상 상담: 온라인 플랫폼을 통한 원격 상담이 가능합니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 전화 상담: 음성 통화를 통한 상담이 가능합니다.</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-file-text" style={{ color: '#3498db' }}></i> 상담 리포트
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 상담 후 작성된 리포트를 "상담 리포트" 메뉴에서 확인할 수 있습니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 기간별로 리포트를 조회하고 다운로드할 수 있습니다.</p>
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
          <h4 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px' }}>기술적 문제 해결</h4>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-browser-chrome" style={{ color: '#3498db' }}></i> 브라우저 지원
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 권장 브라우저: Chrome, Firefox, Safari, Edge 최신 버전</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• JavaScript가 활성화되어 있어야 합니다.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 쿠키와 팝업이 허용되어야 합니다.</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-wifi" style={{ color: '#3498db' }}></i> 네트워크 문제
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 인터넷 연결 상태를 확인해주세요.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 방화벽이나 보안 프로그램이 차단하지 않는지 확인해주세요.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 문제가 지속되면 페이지를 새로고침해보세요.</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-key" style={{ color: '#3498db' }}></i> 로그인 문제
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 아이디와 비밀번호를 정확히 입력했는지 확인해주세요.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 소셜 로그인(카카오, 네이버) 사용 시 해당 서비스의 계정 상태를 확인해주세요.</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 비밀번호를 잊으신 경우 관리자에게 문의해주세요.</p>
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
          <h4 style={{ color: '#2c3e50', marginBottom: '20px', fontSize: '20px' }}>고객 지원</h4>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-envelope" style={{ color: '#3498db' }}></i> 이메일 문의
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 일반 문의: support@mindgarden.com</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 기술 지원: tech@mindgarden.com</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 응답 시간: 영업일 기준 24시간 이내</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-telephone" style={{ color: '#3498db' }}></i> 전화 문의
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 고객센터: 1588-0000</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 운영시간: 평일 09:00 ~ 18:00</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 상담 예약 및 긴급 문의 시 이용</p>
          </div>
          
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
            <h5 style={{ color: '#495057', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-clock" style={{ color: '#3498db' }}></i> 응답 시간
            </h5>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 이메일 문의: 24시간 이내</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 전화 문의: 즉시 응답</p>
            <p style={{ margin: '8px 0', color: '#6c757d', lineHeight: '1.6' }}>• 긴급 상황: 24시간 대응</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <SimpleLayout title="도움말">
      <div style={{
        padding: '24px',
        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%)',
        minHeight: '100vh'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(10px)'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#2c3e50',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <i className="bi bi-question-circle" style={{ color: '#3498db', fontSize: '36px' }}></i>
            도움말
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6c757d',
            margin: '0',
            lineHeight: '1.6'
          }}>
            마인드가든 사용에 필요한 모든 정보를 확인하세요
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '250px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {helpSections.map((section) => (
                <button
                  key={section.id}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '12px',
                    background: activeSection === section.id ? '#3498db' : 'transparent',
                    color: activeSection === section.id ? 'white' : '#6c757d',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left'
                  }}
                  onClick={() => setActiveSection(section.id)}
                >
                  <i className={section.icon}></i>
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            flex: '1',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            minHeight: '500px'
          }}>
            {helpSections.find(section => section.id === activeSection)?.content}
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}>
          <h4 style={{
            color: '#2c3e50',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <i className="bi bi-headset" style={{ color: '#3498db' }}></i>
            추가 도움이 필요하신가요?
          </h4>
          <p style={{ color: '#6c757d', marginBottom: '20px' }}>
            위의 정보로도 해결되지 않는 문제가 있으시면 언제든지 문의해주세요.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => window.open('mailto:support@mindgarden.com')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="bi bi-envelope"></i> 이메일 문의
            </button>
            <button 
              className="btn btn-outline-primary" 
              onClick={() => window.open('tel:1588-0000')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
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
