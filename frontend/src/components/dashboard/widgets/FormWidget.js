/**
 * Form Widget
 * 폼을 표시하는 위젯
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-21
 */

import React, { useState } from 'react';
import { apiPost, apiPut } from '../../../utils/ajax';
import './Widget.css';

const FormWidget = ({ widget, user }) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const config = widget.config || {};
  const fields = config.fields || [];
  const submit = config.submit || {};
  
  const handleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);
      
      const url = submit.url;
      const method = submit.method || 'POST';
      
      let response;
      if (method === 'POST') {
        response = await apiPost(url, formData);
      } else if (method === 'PUT') {
        response = await apiPut(url, formData);
      }
      
      if (response) {
        setSuccess(true);
        setFormData({}); // 폼 초기화
      }
    } catch (err) {
      console.error('FormWidget 제출 실패:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderField = (field) => {
    const { name, type, label, required, options } = field;
    const value = formData[name] || '';
    
    switch (type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div key={name} className="form-field">
            <label>
              {label}
              {required && <span className="required">*</span>}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              required={required}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div key={name} className="form-field">
            <label>
              {label}
              {required && <span className="required">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              required={required}
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={name} className="form-field">
            <label>
              {label}
              {required && <span className="required">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              required={required}
            >
              <option value="">선택하세요</option>
              {options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="widget widget-form">
      <div className="widget-header">
        <div className="widget-title">{config.title || '폼'}</div>
      </div>
      <div className="widget-body">
        <form onSubmit={handleSubmit}>
          {fields.map(renderField)}
          
          {error && (
            <div className="form-error">{error}</div>
          )}
          
          {success && (
            <div className="form-success">제출되었습니다.</div>
          )}
          
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? '제출 중...' : '제출'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormWidget;



