import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import ReactDOM from 'react-dom';
import axios from 'axios';
import './QuickExpenseForm.css';
import notificationManager from '../../utils/notification';

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
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e74c3c -> var(--mg-custom-e74c3c)
      { categoryCode: 'SALARY', subcategoryCode: 'CONSULTANT_SALARY', icon: '💰', color: '#e74c3c' },
      { categoryCode: 'RENT', subcategoryCode: 'OFFICE_RENT', icon: '🏢', color: 'var(--mg-finance-dark)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'ELECTRICITY', icon: '⚡', color: 'var(--mg-finance-primary)' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #3498db -> var(--mg-custom-3498db)
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'WATER', icon: '💧', color: '#3498db' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e74c3c -> var(--mg-custom-e74c3c)
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'GAS', icon: '🔥', color: '#e74c3c' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9b59b6 -> var(--mg-custom-9b59b6)
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'INTERNET', icon: '🌐', color: '#9b59b6' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #9b59b6 -> var(--mg-custom-9b59b6)
      { categoryCode: 'TAX', subcategoryCode: 'INCOME_TAX', icon: '📋', color: '#9b59b6' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #8e44ad -> var(--mg-custom-8e44ad)
      { categoryCode: 'TAX', subcategoryCode: 'CORPORATE_TAX', icon: '📊', color: '#8e44ad' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #3498db -> var(--mg-custom-3498db)
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'STATIONERY', icon: '📝', color: '#3498db' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #2c3e50 -> var(--mg-custom-2c3e50)
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'EQUIPMENT', icon: '🖥️', color: '#2c3e50' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1abc9c -> var(--mg-custom-1abc9c)
      { categoryCode: 'MARKETING', subcategoryCode: 'ONLINE_ADS', icon: '📢', color: '#1abc9c' },
      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #27ae60 -> var(--mg-custom-27ae60)
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
        
        notificationManager.show(successMessage, 'info');
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

  // ReactDOM.createPortal을 사용하여 document.body에 렌더링
  return ReactDOM.createPortal(
    <div className="quick-expense-modal-overlay">
      <div className="quick-expense-modal">
        <div className="quick-expense-modal-header">
          <h2 className="quick-expense-modal-title">
            ⚡ 빠른 지출 등록
          </h2>
          <button
            onClick={onClose}
            className="quick-expense-modal-close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="quick-expense-error">
            {error}
          </div>
        )}

        {loadingCodes ? (
          <div className="quick-expense-loading">
            공통 코드 로딩 중...
          </div>
        ) : (
          <div className="quick-expense-categories">
            {getQuickExpenses().map((expense, index) => {
              
              return (
                <button
                  key={index}
                  onClick={() => handleQuickExpense(expense.categoryCode, expense.subcategoryCode)}
                  disabled={loading}
                  className="quick-expense-category-btn"
                  onMouseOver={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(-2px)';
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.2) -> var(--mg-custom-color)
                      e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!loading) {
                      e.target.style.transform = 'translateY(0)';
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0,0,0,0.1) -> var(--mg-custom-color)
                      e.target.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  <div className="quick-expense-category-icon">
                    {expense.icon}
                  </div>
                  <div className="quick-expense-category-name">
                    {expense.displayName}
                  </div>
                  <div className="quick-expense-category-subname">
                    {expense.subDisplayName}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="quick-expense-info-box">
          <p className="quick-expense-info-text">
            💡 버튼을 클릭하면 금액 입력창이 나타납니다 (부가세 포함 금액 입력)
          </p>
        </div>

        <div className="quick-expense-close-container">
          <button
            onClick={onClose}
            className="quick-expense-close-btn"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickExpenseForm;
