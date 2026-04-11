import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import SafeText from '../common/SafeText';
import MGButton from '../common/MGButton';
import { CLIENT_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import './MindfulnessGuide.css';

const MindfulnessGuide = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, isLoading } = useSession();
  const [activeSection, setActiveSection] = useState('breathing');

  useEffect(() => {
    // 로딩 중에는 권한 체크 안 함
    if (isLoading) {
      return;
    }

    // 권한 체크
    if (!isLoggedIn || !user) {
      notificationManager.show('로그인이 필요합니다.', 'error');
      navigate('/login');
      return;
    }

    if (user.role !== 'CLIENT' && user.role !== 'ROLE_CLIENT') {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/');
      return;
    }
  }, [isLoggedIn, user, isLoading, navigate]);

  const sections = [
    {
      id: 'breathing',
      title: '호흡법 가이드',
      icon: '🌬️',
      content: {
        title: '마음을 진정시키는 호흡법',
        description: '스트레스와 불안을 줄이고 마음을 평온하게 만드는 다양한 호흡법을 배워보세요.',
        techniques: [
          {
            name: '4-7-8 호흡법',
            description: '불면증과 불안에 효과적인 호흡법',
            steps: [
              '입을 다물고 코로 4초간 숨을 들이마시세요',
              '숨을 7초간 참으세요',
              '입으로 8초간 숨을 내쉬세요',
              '이 과정을 4회 반복하세요'
            ]
          },
          {
            name: '복식호흡',
            description: '깊고 안정적인 호흡으로 긴장을 완화',
            steps: [
              '한 손은 가슴에, 다른 손은 배에 올려두세요',
              '코로 천천히 숨을 들이마시며 배가 부풀어 오르도록 하세요',
              '가슴은 움직이지 않고 배만 움직이도록 하세요',
              '입으로 천천히 숨을 내쉬며 배가 들어가도록 하세요'
            ]
          },
          {
            name: '박자 호흡',
            description: '규칙적인 리듬으로 마음을 집중시키는 호흡법',
            steps: [
              '4박자로 숨을 들이마시세요',
              '4박자로 숨을 참으세요',
              '4박자로 숨을 내쉬세요',
              '4박자로 멈춘 후 다시 시작하세요'
            ]
          }
        ]
      }
    },
    {
      id: 'meditation',
      title: '명상 가이드',
      icon: '🧘',
      content: {
        title: '마음챙김 명상',
        description: '현재 순간에 집중하여 마음의 평화를 찾는 명상법을 알아보세요.',
        techniques: [
          {
            name: '기본 마음챙김 명상',
            description: '호흡에 집중하는 기본적인 명상법',
            steps: [
              '편안한 자세로 앉거나 누우세요',
              '눈을 감고 자연스러운 호흡을 관찰하세요',
              '생각이 떠오르면 판단하지 말고 그냥 지나가게 두세요',
              '다시 호흡에 집중하세요',
              '5-10분간 계속하세요'
            ]
          },
          {
            name: '걷기 명상',
            description: '걸으면서 하는 마음챙김 명상',
            steps: [
              '천천히 걸으면서 발의 감각에 집중하세요',
              '발이 땅에 닿는 순간을 느껴보세요',
              '걸음의 리듬과 균형을 의식하세요',
              '주변 소리와 냄새에도 주의를 기울이세요',
              '10-15분간 계속하세요'
            ]
          },
          {
            name: '사랑과 친절 명상',
            description: '자신과 타인에게 친절한 마음을 기르는 명상',
            steps: [
              '편안한 자세로 앉으세요',
              '자신에게 "나는 행복하길 바란다"고 말하세요',
              '가족에게 "당신은 행복하길 바란다"고 말하세요',
              '친구들에게도 같은 마음을 보내세요',
              '모든 사람에게 "모든 이가 행복하길 바란다"고 말하세요'
            ]
          }
        ]
      }
    },
    {
      id: 'stress',
      title: '스트레스 관리',
      icon: '😌',
      content: {
        title: '일상 스트레스 관리법',
        description: '일상에서 쉽게 실천할 수 있는 스트레스 완화 방법들을 알아보세요.',
        techniques: [
          {
            name: '5-4-3-2-1 기법',
            description: '불안할 때 현재에 집중하는 방법',
            steps: [
              '보이는 것 5가지를 찾아보세요',
              '만질 수 있는 것 4가지를 만져보세요',
              '들을 수 있는 소리 3가지를 들어보세요',
              '냄새를 맡을 수 있는 것 2가지를 찾아보세요',
              '맛볼 수 있는 것 1가지를 찾아보세요'
            ]
          },
          {
            name: '진행성 근육 이완',
            description: '신체 긴장을 단계적으로 완화하는 방법',
            steps: [
              '발가락부터 시작해서 머리까지 차례로 근육을 긴장시키세요',
              '각 부위를 5초간 긴장시킨 후 완전히 이완시키세요',
              '이완의 느낌을 10초간 느껴보세요',
              '다음 부위로 넘어가세요',
              '전신을 다 마친 후 전체적인 이완감을 느껴보세요'
            ]
          },
          {
            name: '감정 일기',
            description: '감정을 기록하고 이해하는 방법',
            steps: [
              '매일 저녁 하루의 감정을 기록하세요',
              '어떤 상황에서 어떤 감정이 생겼는지 적어보세요',
              '그 감정이 몸에 어떤 영향을 주었는지 관찰하세요',
              '감정의 원인을 생각해보세요',
              '다음에는 어떻게 대처할 수 있을지 계획해보세요'
            ]
          }
        ]
      }
    },
    {
      id: 'sleep',
      title: '수면 가이드',
      icon: '😴',
      content: {
        title: '건강한 수면을 위한 가이드',
        description: '숙면을 위한 환경 조성과 수면 습관을 개선하는 방법을 알아보세요.',
        techniques: [
          {
            name: '수면 환경 조성',
            description: '숙면을 위한 최적의 환경 만들기',
            steps: [
              '침실 온도를 18-22도로 유지하세요',
              '어둡고 조용한 환경을 만드세요',
              '침대는 오직 잠자리와 성관계에만 사용하세요',
              '전자기기는 침실 밖에 두세요',
              '편안한 침구를 사용하세요'
            ]
          },
          {
            name: '수면 루틴',
            description: '규칙적인 수면 패턴 만들기',
            steps: [
              '매일 같은 시간에 잠자리에 누우세요',
              '잠들기 1시간 전부터 전자기기를 끄세요',
              '따뜻한 목욕이나 독서 등으로 마음을 진정시키세요',
              '카페인은 오후 2시 이후 피하세요',
              '규칙적인 운동을 하되 잠들기 3시간 전에는 피하세요'
            ]
          },
          {
            name: '수면 명상',
            description: '잠들기 전 마음을 진정시키는 명상',
            steps: [
              '편안하게 누워 눈을 감으세요',
              '발끝부터 머리까지 각 부위를 이완시키세요',
              '호흡에 집중하며 천천히 숨을 쉬세요',
              '평화로운 장소를 상상하며 그곳에 있다고 느껴보세요',
              '자연스럽게 잠들 때까지 계속하세요'
            ]
          }
        ]
      }
    }
  ];

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
  };

  const currentSection = sections.find(section => section.id === activeSection);

  // 로딩 중일 때는 아무것도 렌더링하지 않음
  if (isLoading) {
    return null;
  }

  return (
    <AdminCommonLayout title="마음챙김 가이드">
      <div className="mindfulness-guide">
        <div className="mindfulness-guide-header mg-card">
          <div className="mindfulness-guide-header-content">
            <div className="mindfulness-guide-icon-wrapper">
              <span className="mindfulness-guide-icon">🧘‍♀️</span>
            </div>
            <div className="mindfulness-guide-header-text">
              <h1 className="mindfulness-guide-title">마음건강 가이드</h1>
              <p className="mindfulness-guide-subtitle">
                마음챙김과 명상으로 일상을 더 건강하게 만들어보세요
              </p>
            </div>
          </div>
        </div>

        <div className="mindfulness-guide-content">
          <div className="mindfulness-guide-sidebar">
            <div className="mg-card">
              <nav className="mindfulness-guide-nav">
                {sections.map((section) => (
                  <MGButton
                    key={section.id}
                    type="button"
                    className={`mindfulness-guide-nav-item ${activeSection === section.id ? 'active' : ''}`}
                    onClick={() => handleSectionClick(section.id)}
                    variant="outline"
                    preventDoubleClick={false}
                  >
                    <span className="nav-icon"><SafeText>{section.icon}</SafeText></span>
                    <span className="nav-title"><SafeText>{section.title}</SafeText></span>
                  </MGButton>
                ))}
              </nav>
            </div>
          </div>

          <div className="mindfulness-guide-main">
            {currentSection && (
              <div className="mindfulness-section">
                <div className="mg-card mindfulness-section-header">
                  <h2 className="mindfulness-section-title">
                    <span className="section-icon"><SafeText>{currentSection.icon}</SafeText></span>
                    <SafeText tag="span">{currentSection.content.title}</SafeText>
                  </h2>
                  <p className="mindfulness-section-description">
                    <SafeText>{currentSection.content.description}</SafeText>
                  </p>
                </div>

                <div className="mindfulness-techniques">
                  {currentSection.content.techniques.map((technique, index) => (
                    <div key={index} className="mg-card mindfulness-technique">
                      <div className="technique-header">
                        <SafeText tag="h3" className="technique-name">{technique.name}</SafeText>
                        <p className="technique-description"><SafeText>{technique.description}</SafeText></p>
                      </div>
                      <div className="technique-steps">
                        <h4 className="steps-title">실행 방법</h4>
                        <ol className="steps-list">
                          {technique.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="step-item">
                              <SafeText>{step}</SafeText>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default MindfulnessGuide;
