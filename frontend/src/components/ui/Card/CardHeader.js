import './Card.css';

/**
 * CardHeader 컴포넌트 - 카드 헤더
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 헤더 내용
 * @param {React.ReactNode} props.icon - 아이콘 (선택)
 * @param {string} props.title - 제목 (선택)
 * @param {string} props.subtitle - 부제목 (선택)
 * @param {React.ReactNode} props.actions - 액션 버튼들 (선택)
 * @param {string} props.className - 추가 CSS 클래스
 */
const CardHeader = ({children, 
  icon, 
  title, 
  subtitle,
  actions,
  className = '',
  ...props}) => {return (<div className={`mg-v2-card-header ${className}`.trim()} {...props}>
      <div className="mg-v2-v2-v2-card-header-content">
        {icon && <div className="mg-v2-v2-v2-card-header-icon">{icon}</div>}
        <div className="mg-v2-v2-v2-card-header-text">
          {title && <h3 className="mg-v2-v2-v2-card-title">{title}</h3>}
          {subtitle && <p className="mg-v2-v2-v2-card-subtitle">{subtitle}</p>}
          {children}
        </div>
      </div>
      {actions && <div className="mg-v2-v2-v2-card-header-actions">{actions}</div>}
    </div>);};

export default CardHeader;

