import './Card.css';

/**
 * CardFooter 컴포넌트 - 카드 푸터
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - 푸터 내용
 * @param {Array} props.actions - 액션 버튼 배열 (선택)
 * @param {string} props.meta - 메타 정보 텍스트 (선택)
 * @param {string} props.className - 추가 CSS 클래스
 */
const CardFooter = ({children, 
  actions,
  meta,
  className = '',
  ...props}) => {return (<div className={`mg-v2-card-footer ${className}`.trim()} {...props}>
      {meta && <span className="mg-v2-v2-v2-card-meta">{meta}</span>}
      {actions && (<div className="mg-v2-v2-v2-card-actions">
          {actions.map((action, index) => (<button
              key={index}
              onClick={action.onClick}
              className={`mg-v2-button ${action.variant || 'mg-v2-button--secondary'}`}
              disabled={action.disabled}
            >
              {action.label}
            </button>))}
        </div>)}
      {children}
    </div>);};

export default CardFooter;

