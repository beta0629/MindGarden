import React from 'react';

/**
 * 공통 폼 입력 컴포넌트
 * 
 * @param {Object} props
 * @param {string} props.type - 입력 타입
 * @param {string} props.name - 입력 필드명
 * @param {string} props.value - 입력 값
 * @param {function} props.onChange - 변경 핸들러
 * @param {string} props.placeholder - 플레이스홀더
 * @param {string} props.label - 라벨
 * @param {boolean} props.required - 필수 여부
 * @param {boolean} props.disabled - 비활성화 여부
 * @param {string} props.error - 에러 메시지
 * @param {React.ReactNode} props.rightElement - 우측 요소 (예: 비밀번호 토글)
 */
const FormInput = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  error,
  rightElement,
  ...props
}) => {
  const inputId = `input-${name}`;

  return (
    <div style={{ marginBottom: '24px' }}>
      {label && (
        <label 
          htmlFor={inputId}
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: error ? '#e53e3e' : '#4a5568',
            marginBottom: '8px',
            fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
          }}
        >
          {label}
          {required && (
            <span style={{ color: '#e53e3e', marginLeft: '4px' }}>*</span>
          )}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={{
            width: '100%',
            padding: rightElement ? '16px 50px 16px 16px' : '16px',
            fontSize: '16px',
            border: `2px solid ${error ? '#e53e3e' : '#e2e8f0'}`,
            borderRadius: '12px',
            outline: 'none',
            transition: 'all 0.2s ease',
            fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif",
            backgroundColor: disabled ? '#f7fafc' : '#ffffff'
          }}
          onFocus={(e) => {
            if (!error) {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? '#e53e3e' : '#e2e8f0';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
        
        {rightElement && (
          <div style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            {rightElement}
          </div>
        )}
      </div>
      
      {error && (
        <p style={{
          fontSize: '12px',
          color: '#e53e3e',
          marginTop: '6px',
          marginBottom: 0,
          fontFamily: "'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', sans-serif"
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
