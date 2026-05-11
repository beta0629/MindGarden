import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '../../common/Avatar';
import '../../admin/ProfileCard.css';

/**
 * 범용 프로필 카드 컴포넌트 (내담자·스태프·관리자 공통)
 *
 * variant="list" — 헤더+바디+푸터 구성 (largeCard 대체)
 * variant="compact" — 헤더만 표시 + 인라인 액션 (smallCard 대체)
 *
 * @author Core Solution
 * @since 2026-05-11
 */
const ProfileCard = ({
  variant = 'list',
  avatarUrl,
  avatarName,
  avatarSize,
  name,
  contactItems,
  badges,
  statsItems,
  extraInfo,
  renderActions,
  onClick,
  className
}) => {
  const isCompact = variant === 'compact';
  const defaultSize = isCompact ? 36 : 48;
  const resolvedAvatarSize = avatarSize ?? defaultSize;

  const rootClassName = [
    'mg-v2-profile-card',
    isCompact && 'mg-v2-profile-card--compact',
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

  const headerNode = (
    <div className="mg-v2-profile-card__header">
      <Avatar
        profileImageUrl={avatarUrl}
        displayName={avatarName}
        className="mg-v2-profile-card__avatar"
        size={resolvedAvatarSize}
      />
      <div className="mg-v2-profile-card__info">
        <h3 className="mg-v2-profile-card__name">{name}</h3>
        {contactItems && contactItems.length > 0 && (
          <div className="mg-v2-profile-card__contact">
            {contactItems.map((item, idx) => (
              <span key={idx} className="mg-v2-profile-card__contact-item">
                {item.icon && <>{item.icon} </>}
                {item.content}
              </span>
            ))}
          </div>
        )}
      </div>
      {badges && badges.length > 0 && (
        <div className="mg-v2-profile-card__badges">
          {badges}
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

  const hasStats = statsItems && statsItems.length > 0;

  return (
    <div className={rootClassName} {...interactionProps}>
      {headerNode}

      {(hasStats || extraInfo) && (
        <div className="mg-v2-profile-card__body">
          {hasStats && (
            <div className="mg-v2-profile-card__stats-grid">
              {statsItems.map((item, idx) => (
                <div key={idx} className="mg-v2-profile-card__stat-item">
                  <span className="mg-v2-profile-card__stat-label">{item.label}</span>
                  <span className="mg-v2-profile-card__stat-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}
          {extraInfo}
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
  /** 프로필 이미지 URL */
  avatarUrl: PropTypes.string,
  /** Avatar 폴백용 이름 */
  avatarName: PropTypes.string,
  /** 아바타 크기 (px). list 기본값 48, compact 기본값 36 */
  avatarSize: PropTypes.number,
  /** 표시할 이름 (ReactNode — 마스킹 처리 가능) */
  name: PropTypes.node,
  /** 연락처 항목 배열 [{icon, content}] */
  contactItems: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      content: PropTypes.node
    })
  ),
  /** 배지 ReactNode 배열 */
  badges: PropTypes.arrayOf(PropTypes.node),
  /** 통계 그리드 항목 (list variant 전용) */
  statsItems: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.node
    })
  ),
  /** 추가 정보 영역 (list variant 전용, 래핑 없이 body에 삽입) */
  extraInfo: PropTypes.node,
  /** 액션 버튼 렌더 함수 () => ReactNode */
  renderActions: PropTypes.func,
  /** 카드 클릭 핸들러 */
  onClick: PropTypes.func,
  /** 추가 className */
  className: PropTypes.string
};

export default ProfileCard;
