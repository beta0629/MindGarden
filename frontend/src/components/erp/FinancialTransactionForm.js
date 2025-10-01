import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ErpModal from './common/ErpModal';
import './FinancialTransactionForm.css';

/**
 * 수입/지출 거래 등록 폼 컴포넌트 (공통 코드 사용)
 */
const FinancialTransactionForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    transactionType: 'EXPENSE',
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    taxIncluded: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commonCodes, setCommonCodes] = useState({
    transactionTypes: [],
    incomeCategories: [],
    expenseCategories: [],
    incomeSubcategories: [],
    expenseSubcategories: [],
    vatCategories: []
  });
  const [loadingCodes, setLoadingCodes] = useState(true);

  // 공통 코드 로드
  useEffect(() => {
    loadCommonCodes();
  }, []);

  const loadCommonCodes = async () => {
    try {
      setLoadingCodes(true);
      const response = await axios.get('/api/erp/common-codes/financial', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setCommonCodes(response.data.data);
      }
    } catch (err) {
      console.error('공통 코드 로드 실패:', err);
      setError('공통 코드를 불러오는데 실패했습니다.');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // 카테고리가 변경되면 세부 카테고리 초기화
      ...(name === 'category' && { subcategory: '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/erp/finance/transactions', formData);
      
      if (response.data.success) {
        alert('거래가 성공적으로 등록되었습니다.');
        onSuccess && onSuccess(response.data.data);
        onClose && onClose();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || '거래 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 현재 거래 유형에 따른 카테고리와 세부 카테고리
  const currentCategories = formData.transactionType === 'INCOME' 
    ? commonCodes.incomeCategories 
    : commonCodes.expenseCategories;
  
  const currentSubcategories = formData.transactionType === 'INCOME' 
    ? commonCodes.incomeSubcategories 
    : commonCodes.expenseSubcategories;

  // 선택된 카테고리에 해당하는 세부 카테고리 필터링
  const filteredSubcategories = currentSubcategories.filter(sub => 
    sub.parentCodeValue === formData.category
  );

  return (
    <ErpModal
      isOpen={true}
      onClose={onClose}
      title="💰 수입/지출 등록"
      size="medium"
    >

        {error && (
          <div className="financial-transaction-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 거래 유형 */}
          <div className="financial-transaction-form-group">
            <label className="financial-transaction-label">
              거래 유형
            </label>
            <div className="financial-transaction-radio-group">
              <label className="financial-transaction-radio-label">
                <input
                  type="radio"
                  name="transactionType"
                  value="INCOME"
                  checked={formData.transactionType === 'INCOME'}
                  onChange={handleInputChange}
                  style={{ marginRight: '5px' }}
                />
                <span style={{ color: '#27ae60', fontWeight: 'bold' }}>💚 수입</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="transactionType"
                  value="EXPENSE"
                  checked={formData.transactionType === 'EXPENSE'}
                  onChange={handleInputChange}
                  style={{ marginRight: '5px' }}
                />
                <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>❤️ 지출</span>
              </label>
            </div>
          </div>

          {/* 카테고리 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              카테고리
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              disabled={loadingCodes}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: 'var(--font-size-sm)',
                opacity: loadingCodes ? 0.6 : 1
              }}
            >
              <option value="">카테고리를 선택하세요</option>
              {currentCategories.map(category => (
                <option key={category.codeValue} value={category.codeValue}>
                  {category.codeLabel}
                </option>
              ))}
            </select>
            {loadingCodes && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#666', marginTop: '5px' }}>
                공통 코드 로딩 중...
              </div>
            )}
          </div>

          {/* 세부 카테고리 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              세부 카테고리
            </label>
            <select
              name="subcategory"
              value={formData.subcategory}
              onChange={handleInputChange}
              required
              disabled={!formData.category || loadingCodes}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: 'var(--font-size-sm)',
                opacity: (!formData.category || loadingCodes) ? 0.6 : 1
              }}
            >
              <option value="">세부 카테고리를 선택하세요</option>
              {filteredSubcategories.map(subcategory => (
                <option key={subcategory.codeValue} value={subcategory.codeValue}>
                  {subcategory.codeLabel}
                </option>
              ))}
            </select>
            {!formData.category && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#666', marginTop: '5px' }}>
                먼저 카테고리를 선택해주세요
              </div>
            )}
          </div>

          {/* 금액 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              금액 (원)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="1"
              placeholder="금액을 입력하세요"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>

          {/* 거래일 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              거래일
            </label>
            <input
              type="date"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleInputChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>

          {/* 설명 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              설명 (선택사항)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="거래에 대한 추가 설명을 입력하세요"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: 'var(--font-size-sm)',
                resize: 'vertical'
              }}
            />
          </div>

          {/* 세금 포함 여부 */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="taxIncluded"
                checked={formData.taxIncluded}
                onChange={handleInputChange}
                style={{ marginRight: '8px' }}
              />
              <span style={{ color: '#2c3e50' }}>세금 포함</span>
            </label>
          </div>

          {/* 버튼들 */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: 'white',
                color: '#666',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="mg-btn mg-btn--primary"
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
    </ErpModal>
  );
};

export default FinancialTransactionForm;
