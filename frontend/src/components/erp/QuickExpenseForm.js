import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 빠른 지출 등록 컴포넌트 (공통 코드 사용)
 */
const QuickExpenseForm = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expenseSubcategories, setExpenseSubcategories] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  // 공통 코드 로드
  useEffect(() => {
    loadExpenseCodes();
  }, []);

  const loadExpenseCodes = async () => {
    try {
      setLoadingCodes(true);
      const response = await axios.get('/api/erp/common-codes/financial', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setExpenseCategories(response.data.data.expenseCategories || []);
        setExpenseSubcategories(response.data.data.expenseSubcategories || []);
      }
    } catch (err) {
      console.error('지출 공통 코드 로드 실패:', err);
      setError('공통 코드를 불러오는데 실패했습니다.');
    } finally {
      setLoadingCodes(false);
    }
  };

  // 빠른 지출 항목 생성 (공통 코드 기반)
  const getQuickExpenses = () => {
    const quickExpenseConfigs = [
      { categoryCode: 'SALARY', subcategoryCode: 'CONSULTANT_SALARY', icon: '💰', color: '#e74c3c' },
      { categoryCode: 'RENT', subcategoryCode: 'OFFICE_RENT', icon: '🏢', color: '#e67e22' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'ELECTRICITY', icon: '⚡', color: '#f39c12' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'WATER', icon: '💧', color: '#3498db' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'GAS', icon: '🔥', color: '#e74c3c' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'INTERNET', icon: '🌐', color: '#9b59b6' },
      { categoryCode: 'TAX', subcategoryCode: 'INCOME_TAX', icon: '📋', color: '#9b59b6' },
      { categoryCode: 'TAX', subcategoryCode: 'CORPORATE_TAX', icon: '📊', color: '#8e44ad' },
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'STATIONERY', icon: '📝', color: '#3498db' },
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'EQUIPMENT', icon: '🖥️', color: '#2c3e50' },
      { categoryCode: 'MARKETING', subcategoryCode: 'ONLINE_ADS', icon: '📢', color: '#1abc9c' },
      { categoryCode: 'MARKETING', subcategoryCode: 'PROMOTION', icon: '📈', color: '#27ae60' }
    ];

    return quickExpenseConfigs.map(config => {
      const category = expenseCategories.find(cat => cat.codeValue === config.categoryCode);
      const subcategory = expenseSubcategories.find(sub => sub.codeValue === config.subcategoryCode);
      
      return {
        ...config,
        category,
        subcategory,
        displayName: category ? category.codeLabel : config.categoryCode,
        subDisplayName: subcategory ? subcategory.codeLabel : config.subcategoryCode
      };
    }).filter(item => item.category && item.subcategory);
  };

  const handleQuickExpense = async (categoryCode, subcategoryCode) => {
    // 공통 코드에서 카테고리 정보 찾기
    const category = expenseCategories.find(c => c.codeValue === categoryCode);
    const subcategory = expenseSubcategories.find(s => s.codeValue === subcategoryCode);
    
    if (!category || !subcategory) {
      setError('선택한 카테고리 정보를 찾을 수 없습니다.');
      return;
    }
    
    const isVatApplicable = categoryCode !== 'SALARY'; // 급여는 부가세 없음
    
    let message = `${category.codeLabel} > ${subcategory.codeLabel} 금액을 입력하세요 (원):`;
    if (isVatApplicable) {
      message += '\n※ 부가세 포함 금액을 입력하세요 (실제 지불한 금액)';
    } else {
      message += '\n※ 급여는 부가세가 없습니다';
    }
    
    const amount = prompt(message);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/erp/finance/quick-expense', null, {
        params: {
          category: categoryCode,
          subcategory: subcategoryCode,
          amount: parseFloat(amount),
          description: `${category.codeLabel} 지출`,
          transactionDate: new Date().toISOString().split('T')[0]
        }
      });

      if (response.data.success) {
        const taxInfo = response.data.data;
        let successMessage = `${category.codeLabel} 지출이 성공적으로 등록되었습니다.`;
        
        if (isVatApplicable) {
          const vatAmount = taxInfo.taxAmount || 0;
          const totalAmount = taxInfo.amount || parseFloat(amount);
          successMessage += `\n금액: ${parseFloat(amount).toLocaleString()}원 + 부가세: ${vatAmount.toLocaleString()}원 = 총 ${totalAmount.toLocaleString()}원`;
        }
        
        alert(successMessage);
        onSuccess && onSuccess(response.data.data);
        onClose && onClose();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || '지출 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '30px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>
            ⚡ 빠른 지출 등록
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--font-size-xxl)',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {loadingCodes ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            공통 코드 로딩 중...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            {getQuickExpenses().map((expense, index) => {
              
              return (
                <button
                  key={index}
                  onClick={() => handleQuickExpense(expense.categoryCode, expense.subcategoryCode)}
                  disabled={loading}
                  style={{
                    padding: '20px',
                    border: 'none',
                    borderRadius: '10px',
                    backgroundColor: loading ? '#f8f9fa' : 'white',
                    color: loading ? '#ccc' : expense.color,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    border: `2px solid ${loading ? '#ddd' : expense.color}`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xxl)', marginBottom: '8px' }}>
                    {expense.icon}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', marginBottom: '4px' }}>
                    {expense.displayName}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>
                    {expense.subDisplayName}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div style={{
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: '#666', fontSize: 'var(--font-size-sm)' }}>
            💡 버튼을 클릭하면 금액 입력창이 나타납니다 (부가세 포함 금액 입력)
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
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
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickExpenseForm;
