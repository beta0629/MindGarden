import React from 'react';

/**
 * ERP 공통 로딩 컴포넌트
 */
const ErpLoading = ({ 
  message = '로딩중...', 
  size = 'medium',
  style = {},
  className = ''
}) => {
  const getSizeStyle = () => {
    const sizes = {
      small: {
        width: '20px',
        height: '20px',
        borderWidth: '2px'
      },
      medium: {
        width: '40px',
        height: '40px',
        borderWidth: '4px'
      },
      large: {
        width: '60px',
        height: '60px',
        borderWidth: '6px'
      }
    };
    return sizes[size] || sizes.medium;
  };

  const spinnerStyle = {
    ...getSizeStyle(),
    border: `${getSizeStyle().borderWidth} solid #f3f3f3`,
    borderTop: `${getSizeStyle().borderWidth} solid #007bff`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto'
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    ...style
  };

  const messageStyle = {
    marginTop: '12px',
    fontSize: '14px',
    color: '#666666',
    textAlign: 'center'
  };

  return (
    <div style={containerStyle} className={className}>
      <div style={spinnerStyle}></div>
      {message && <div style={messageStyle}>{message}</div>}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ErpLoading;
