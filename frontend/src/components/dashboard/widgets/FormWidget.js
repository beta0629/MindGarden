/**
 * Form Widget - 표준화된 위젯
/**
 * 폼을 표시하는 위젯
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 2.0.0 (표준화 업그레이드)
/**
 * @since 2025-11-21
 */

import React, { useState } from 'react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import { WIDGET_CONSTANTS } from '../../../constants/widgetConstants';
import './Widget.css';
import SafeText from '../../common/SafeText';
import { toDisplayString } from '../../../utils/safeDisplay';

const FormWidget = ({ widget, user }) => {
  // 표준화된 위젯 훅 사용
  const {
    data,
    loading,
    error,
    hasData,
    isEmpty,
    refresh,
    formatValue
  } = useWidget(widget, user, {
    immediate: false, // 폼은 즉시 로드하지 않음
    cache: false,     // 폼 데이터는 캐시하지 않음
    retryCount: 3
  });

  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const config = widget.config || {};
  const fields = config.fields || [];
  const submitUrl = config.submitUrl || '';

  // 폼 필드 변경 핸들러
  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submitUrl) {
      setSubmitResult({ success: false, message: '제출 URL이 설정되지 않았습니다.' });
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitResult({ success: true, message: '성공적으로 제출되었습니다.' });
        setFormData({}); // 폼 초기화
      } else {
        throw new Error(`제출 실패: ${response.status}`);
      }
    } catch (err) {
      console.error('폼 제출 오류:', err);
      setSubmitResult({ success: false, message: err.message || '제출 중 오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
    }
  };

  // 폼 필드 렌더링
  const renderField = (field, index) => {
    const { name, label, type = 'text', required = false, options = [] } = field;
    const labelSafe = toDisplayString(label);
    const value = formData[name] || '';

    switch (type) {
      case 'select':
        return (
          <div key={index} className="form-field">
            <label htmlFor={name}>
              {labelSafe}
              {required && <span className="required">*</span>}
            </label>
            <select
              id={name}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              required={required}
            >
              <option value="">선택하세요</option>
              {options.map((option, optIndex) => (
                <option key={optIndex} value={option.value || option}>
                  {toDisplayString(option.label != null ? option.label : option)}
                </option>
              ))}
            </select>
          </div>
        );

      case 'textarea':
        return (
          <div key={index} className="form-field">
            <label htmlFor={name}>
              {labelSafe}
              {required && <span className="required">*</span>}
            </label>
            <textarea
              id={name}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              required={required}
              rows={4}
            />
          </div>
        );

      default:
        return (
          <div key={index} className="form-field">
            <label htmlFor={name}>
              {labelSafe}
              {required && <span className="required">*</span>}
            </label>
            <input
              type={type}
              id={name}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              required={required}
            />
          </div>
        );
    }
  };

  // 폼 렌더링
  const renderForm = () => {
    if (fields.length === 0) {
      return (
        <div className={WIDGET_CONSTANTS.CSS_CLASSES.MG_TEXT_MUTED}>
          표시할 폼 필드가 없습니다.
        </div>
      );
    }

    return (
      <div className="form-container">
        <form onSubmit={handleSubmit} className="widget-form">
          {fields.map((field, index) => renderField(field, index))}
          
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? '제출 중...' : '제출'}
            </button>
            <button 
              type="button" 
              onClick={() => setFormData({})}
              className="reset-btn"
            >
              초기화
            </button>
          </div>
        </form>

        {submitResult && (
          <div className={`form-result ${submitResult.success ? 'form-success' : 'form-error'}`}>
            <i className={`bi bi-${submitResult.success ? 'check-circle' : 'exclamation-triangle'}`}></i>
            <SafeText>{submitResult.message}</SafeText>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      isEmpty={fields.length === 0}
      onRefresh={refresh}
      title={widget.config?.title || WIDGET_CONSTANTS.DEFAULT_TITLES.FORM}
      subtitle={widget.config?.subtitle || ''}
    >
      <div className={WIDGET_CONSTANTS.CSS_CLASSES.WIDGET_CONTENT}>
        {renderForm()}
      </div>
    </BaseWidget>
  );
};

export default FormWidget;