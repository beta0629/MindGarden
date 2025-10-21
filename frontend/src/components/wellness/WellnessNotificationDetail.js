import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Tag, ArrowLeft, Heart } from 'lucide-react';
import { apiGet } from '../../utils/ajax';
import { useSession } from '../../contexts/SessionContext';
import notificationManager from '../../utils/notification';
import SimpleLayout from '../layout/SimpleLayout';
import UnifiedLoading from '../common/UnifiedLoading';
import './WellnessNotificationDetail.css';

/**
 * 웰니스 알림 상세 페이지 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
const WellnessNotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useSession();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 권한 체크
    if (!isLoggedIn) {
      notificationManager.show('로그인이 필요합니다.', 'error');
      navigate('/login');
      return;
    }

    if (user?.role !== 'CLIENT' && user?.role !== 'ROLE_CLIENT') {
      notificationManager.show('접근 권한이 없습니다.', 'error');
      navigate('/');
      return;
    }

    loadNotificationDetail();
  }, [id, isLoggedIn, user, navigate]);

  const loadNotificationDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiGet(`/api/system-notifications/${id}`);
      
      if (response && response.success) {
        setNotification(response.data);
      } else {
        setError('알림을 불러올 수 없습니다.');
        notificationManager.show('알림을 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('❌ 웰니스 알림 상세 로드 실패:', error);
      setError('알림을 불러오는 중 오류가 발생했습니다.');
      notificationManager.show('알림을 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getNotificationTypeLabel = (type) => {
    const types = {
      'GENERAL': '일반',
      'URGENT': '긴급',
      'MAINTENANCE': '점검',
      'EVENT': '이벤트',
      'UPDATE': '업데이트',
      'WELLNESS': '웰니스'
    };
    return types[type] || type;
  };

  const getNotificationTypeClass = (type) => {
    const classes = {
      'GENERAL': 'type-general',
      'URGENT': 'type-urgent',
      'MAINTENANCE': 'type-maintenance',
      'EVENT': 'type-event',
      'UPDATE': 'type-update',
      'WELLNESS': 'type-wellness'
    };
    return classes[type] || 'type-general';
  };

  /**
   * AI 생성 웰니스 컨텐츠를 가독성 있게 포맷팅
   * - HTML 태그 제거
   * - 마크다운 문법 정리
   * - 자동 줄바꿈 및 문단 구분
   * - 제목/부제목 자동 감지
   */
  const formatWellnessContent = (content) => {
    if (!content) return null;

    // 1. HTML 태그 모두 제거
    let cleanContent = content.replace(/<[^>]*>/g, '');
    
    // 2. 마크다운 문법 정리
    cleanContent = cleanContent
      .replace(/^["']|["']$/g, '') // 앞뒤 따옴표 제거
      .replace(/^\*\s*/gm, '• ') // * 를 • 로 변경
      .replace(/^-\s*/gm, '• ') // - 를 • 로 변경
      .replace(/^\d+\.\s*/gm, '') // 숫자 목록 제거
      .replace(/\*\*(.*?)\*\*/g, '$1') // **굵은글씨** 제거
      .replace(/\*(.*?)\*/g, '$1') // *기울임* 제거
      .replace(/`(.*?)`/g, '$1'); // `코드` 제거

    // 3. 줄바꿈 기준으로 분할
    const lines = cleanContent.split('\n').map(line => line.trim()).filter(line => line);

    // 4. 문단별로 그룹화 및 스타일 적용
    const formattedElements = [];
    let currentParagraph = [];
    let elementIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 빈 줄이면 현재 문단을 마무리
      if (!line) {
        if (currentParagraph.length > 0) {
          formattedElements.push(createParagraphElement(currentParagraph, elementIndex++));
          currentParagraph = [];
        }
        continue;
      }

      // 제목/부제목 감지
      const isTitle = detectTitle(line);
      
      if (isTitle) {
        // 현재 문단이 있으면 먼저 마무리
        if (currentParagraph.length > 0) {
          formattedElements.push(createParagraphElement(currentParagraph, elementIndex++));
          currentParagraph = [];
        }
        // 제목 요소 추가
        formattedElements.push(
          <p key={elementIndex++} className="content-subtitle">
            {line}
          </p>
        );
      } else {
        // 일반 문단에 추가
        currentParagraph.push(line);
      }
    }

    // 마지막 문단 처리
    if (currentParagraph.length > 0) {
      formattedElements.push(createParagraphElement(currentParagraph, elementIndex++));
    }

    return formattedElements;
  };

  /**
   * 제목/부제목 감지 함수
   */
  const detectTitle = (line) => {
    // 이모지로 시작하는 경우
    if (/^[🎯🍂💡✨🌟💚🌱🌸🌿🌺🌻🌼🌷🌹🌾🌵🌲🌳🌴🌰🌙☀️🌤️⛅🌦️🌧️⛈️🌩️🌨️❄️🔥💧🌊🌈]/g.test(line)) {
      return true;
    }

    // 특정 키워드 포함
    const titleKeywords = [
      '팁', '방법', '추천', '활동', '마음챙김', '명상', '운동', '수면', '영양',
      '스트레스', '불안', '우울', '행복', '평정', '집중', '휴식', '치유',
      '오늘', '이번', '이번주', '이번달', '새로운', '특별한', '중요한',
      '기억하세요', '시도해보세요', '실천해보세요', '꼭', '반드시'
    ];

    return titleKeywords.some(keyword => line.includes(keyword));
  };

  /**
   * 문단 요소 생성 함수
   */
  const createParagraphElement = (lines, key) => {
    // 문단이 하나의 줄이면 단순하게 처리
    if (lines.length === 1) {
      return (
        <p key={key} className="content-paragraph">
          {lines[0]}
        </p>
      );
    }

    // 여러 줄이면 적절히 연결
    const paragraphText = lines.join(' ');
    
    return (
      <p key={key} className="content-paragraph">
        {paragraphText}
      </p>
    );
  };

  if (loading) {
    return (
      <SimpleLayout>
        <div className="wellness-notification-detail">
          <UnifiedLoading message="알림을 불러오는 중..." />
        </div>
      </SimpleLayout>
    );
  }

  if (error || !notification) {
    return (
      <SimpleLayout>
        <div className="wellness-notification-detail">
          <div className="wellness-notification-error">
            <div className="error-icon">
              <Heart size={48} />
            </div>
            <h2 className="error-title">알림을 찾을 수 없습니다</h2>
            <p className="error-message">{error || '요청하신 알림을 찾을 수 없습니다.'}</p>
            <button className="mg-btn mg-btn--primary" onClick={handleBack}>
              <ArrowLeft size={16} />
              <span>돌아가기</span>
            </button>
          </div>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout>
      <div className="wellness-notification-detail">
        {/* 헤더 */}
        <div className="wellness-notification-header">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={20} />
            <span>목록으로</span>
          </button>
          
          <div className="header-badges">
            {notification.isImportant && (
              <span className="badge badge-important">
                <Heart size={14} />
                <span>중요</span>
              </span>
            )}
            {notification.isUrgent && (
              <span className="badge badge-urgent">
                <span>긴급</span>
              </span>
            )}
            <span className={`badge badge-type ${getNotificationTypeClass(notification.notificationType)}`}>
              {getNotificationTypeLabel(notification.notificationType)}
            </span>
          </div>
        </div>

        {/* 제목 */}
        <div className="wellness-notification-title-section">
          <h1 className="notification-title">{notification.title}</h1>
          
          <div className="notification-meta">
            <div className="meta-item">
              <User size={16} />
              <span>{notification.authorName || '관리자'}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} />
              <span>{new Date(notification.publishedAt || notification.createdAt).toLocaleDateString('ko-KR')}</span>
            </div>
            {notification.expiresAt && (
              <div className="meta-item">
                <Clock size={16} />
                <span>만료: {new Date(notification.expiresAt).toLocaleDateString('ko-KR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div className="wellness-notification-content">
          <div className="content-body">
            {formatWellnessContent(notification.content)}
          </div>
        </div>

        {/* 하단 액션 */}
        <div className="wellness-notification-actions">
          <button className="mg-btn mg-btn--secondary" onClick={handleBack}>
            <ArrowLeft size={16} />
            <span>목록으로 돌아가기</span>
          </button>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default WellnessNotificationDetail;

