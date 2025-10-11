/**
 * iPhone 17 스타일 페이지 헤더 컴포넌트
 * 안정감을 주는 서브타이틀과 액션 버튼을 포함한 재사용 가능한 헤더
 */



/**
 * iPhone 17 페이지 헤더 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.title - 메인 제목
 * @param {string} props.subtitle - 서브타이틀 (선택사항)
 * @param {string} props.description - 설명 텍스트
 * @param {string} props.icon - 아이콘 (이모지 또는 아이콘 클래스)
 * @param {React.ReactNode} props.actions - 액션 버튼들 (선택사항)
 * @param {string} props.className - 추가 CSS 클래스
 * @param {Object} props.style - 인라인 스타일 (선택사항)
 */
const IPhone17PageHeader = ({
  title,
  subtitle,
  description,
  icon,
  actions,
  className = '',
  style = {}
}) => {
  return (
    <div 
      className={`iphone17-page-header ${className}`}
      style={style}
    >
      <div className="page-header-content">
        <div className="page-header-text">
          {icon && (
            <div className="page-header-icon">
              {icon}
            </div>
          )}
          <div className="page-header-title-section">
            {title && (
              <h2 className="page-subtitle-main">
                {title}
              </h2>
            )}
            {subtitle && (
              <h3 className="page-subtitle-secondary">
                {subtitle}
              </h3>
            )}
            {description && (
              <p className="page-description">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default IPhone17PageHeader;
