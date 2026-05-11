import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '../../common/Avatar';
import '../../admin/ProfileCard.css';

/**
 * 범용 프로필 카드 컴포넌트 (내담자·스태프·관리자 공통)
 *
 * variant="list"    — 헤더 + 바디(statsItems/extraInfo) + 푸터(renderActions) 구성 (largeCard 대체)
 * variant="compact" — 헤더 + 인라인 액션만 표시 (smallCard 대체)
 *
 * @author Core Solution
 * @since 2026-05-11
 */
const ProfileCard = ({
  variant = 'list',
  avatar,
  name,
  contactInfo,
  badges,
  statsItems,
  extraInfo,
  renderActions,
  onClick,
  className,
  status,
  isOnline,
  progress,
  riskLevel
}) => {
  const isCompact = variant === 'compact';
  const resolvedAvatarSize = avatar?.size ?? (isCompact ? 36 : 48);

  const rootClassName = [
    'mg-v2-profile-card',
    isCompact && 'mg-v2-profile-card--compact',
    status && `mg-v2-profile-card--status-${status}`,
    className
  ].filter(Boolean).join(' ');

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  const interactionProps = onClick
    ? { onClick, role: 'button', tabIndex: 0, onKeyDown: handleKeyDown }
    : {};

  const badgeNodes = badges
    ? (Array.isArray(badges) ? badges : [badges])
    : [];

  const hasBody = (statsItems && statsItems.length > 0) || extraInfo || progress != null;

  const avatarNode = (
    <div className="mg-v2-profile-card__avatar-wrapper">
      <Avatar
        profileImageUrl={avatar?.profileImageUrl}
        displayName={avatar?.displayName}
        className="mg-v2-profile-card__avatar"
        size={resolvedAvatarSize}
      />
      {isOnline !== undefined && (
        <span
          className={`mg-v2-profile-card__status-indicator mg-v2-profile-card__status-indicator--${isOnline ? 'online' : 'offline'}`}
          aria-label={isOnline ? '온라인' : '오프라인'}
        />
      )}
    </div>
  );

  const RISK_LABEL_MAP = { high: '고위험', medium: '주의', low: '안정' };
  const riskBadgeNode = riskLevel && (
    <span className={`mg-v2-profile-card__risk-badge mg-v2-profile-card__risk-badge--${riskLevel}`}>
      {RISK_LABEL_MAP[riskLevel]}
    </span>
  );

  const headerNode = (
    <div className="mg-v2-profile-card__header">
      {avatarNode}
      <div className="mg-v2-profile-card__info">
        <h3 className="mg-v2-profile-card__name">{name}</h3>
        {contactInfo && (
          <div className="mg-v2-profile-card__contact">
            {contactInfo.email != null && (
              <span className="mg-v2-profile-card__email">{contactInfo.email}</span>
            )}
            {contactInfo.phone != null && (
              <span className="mg-v2-profile-card__phone">{contactInfo.phone}</span>
            )}
          </div>
        )}
      </div>
      {(badgeNodes.length > 0 || riskBadgeNode) && (
        <div className="mg-v2-profile-card__badges">
          {badgeNodes}
          {riskBadgeNode}
        </div>
      )}
    </div>
  );

  if (isCompact) {
    return (
      <div className={rootClassName} {...interactionProps}>
        {headerNode}
        {renderActions && (
          <div className="mg-v2-profile-card__inline-actions">
            {renderActions()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={rootClassName} {...interactionProps}>
      {headerNode}

      {hasBody && (
        <div className="mg-v2-profile-card__body">
          {statsItems && statsItems.length > 0 && (
            <div className="mg-v2-profile-card__stats-grid">
              {statsItems.map((item, idx) => (
                <div key={idx} className="mg-v2-profile-card__stat-item">
                  {item.icon ? (
                    <span className="mg-v2-profile-card__stat-header">
                      <span className="mg-v2-profile-card__stat-icon">{item.icon}</span>
                      <span className="mg-v2-profile-card__stat-label">{item.label}</span>
                    </span>
                  ) : (
                    <span className="mg-v2-profile-card__stat-label">{item.label}</span>
                  )}
                  <span className="mg-v2-profile-card__stat-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {extraInfo && (
            <div className="mg-v2-profile-card__extra-info">
              {extraInfo}
            </div>
          )}
          {progress != null && (
            <div className="mg-v2-profile-card__progress">
              <div className="mg-v2-profile-card__progress-bar">
                <div
                  className="mg-v2-profile-card__progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {renderActions && (
        <div className="mg-v2-profile-card__footer">
          {renderActions()}
        </div>
      )}
    </div>
  );
};

ProfileCard.propTypes = {
  /** 카드 변형: list(대형), compact(소형) */
  variant: PropTypes.oneOf(['list', 'compact']),
  /** 아바타 정보 { profileImageUrl, displayName, size } */
  avatar: PropTypes.shape({
    profileImageUrl: PropTypes.string,
    displayName: PropTypes.string,
    size: PropTypes.number
  }),
  /** 표시할 이름 (ReactNode — SafeText/마스킹 래핑은 호출처에서) */
  name: PropTypes.node,
  /** 연락처 { email: ReactNode, phone: ReactNode } */
  contactInfo: PropTypes.shape({
    email: PropTypes.node,
    phone: PropTypes.node
  }),
  /** 배지 ReactNode 또는 배열 */
  badges: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  /** 통계 그리드 항목 (list variant 전용) — icon: ReactNode 지원 */
  statsItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.node,
      icon: PropTypes.node
    })
  ),
  /** 추가 정보 영역 — __extra-info div로 래핑됨 (list variant 전용) */
  extraInfo: PropTypes.node,
  /** 액션 버튼 렌더 함수 */
  renderActions: PropTypes.func,
  /** 카드 클릭 핸들러 (compact에서 상세보기 진입 등) */
  onClick: PropTypes.func,
  /** 추가 className */
  className: PropTypes.string,
  /** 좌측 상태 스트라이프 */
  status: PropTypes.oneOf(['active', 'inactive', 'urgent', 'pending']),
  /** 아바타 온라인 인디케이터 (undefined이면 미표시) */
  isOnline: PropTypes.bool,
  /** 미니 진행률 바 (0~100) */
  progress: PropTypes.number,
  /** 위험도 뱃지 */
  riskLevel: PropTypes.oneOf(['high', 'medium', 'low'])
};

export default ProfileCard;
