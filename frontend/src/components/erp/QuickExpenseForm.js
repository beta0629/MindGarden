import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import MGButton from '../common/MGButton';
import { getLucideIcon } from '../../utils/iconUtils';
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
      const response = await axios.get('/api/v1/erp/common-codes/financial', {
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
      { categoryCode: 'SALARY', subcategoryCode: 'CONSULTANT_SALARY', icon: 'DollarSign', color: 'var(--mg-error-500)' },
      { categoryCode: 'RENT', subcategoryCode: 'OFFICE_RENT', icon: 'Building2', color: 'var(--mg-finance-dark)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'ELECTRICITY', icon: 'Zap', color: 'var(--mg-finance-primary)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'WATER', icon: 'Droplet', color: 'var(--mg-primary-500)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'GAS', icon: 'Flame', color: 'var(--mg-error-500)' },
      { categoryCode: 'MANAGEMENT_FEE', subcategoryCode: 'INTERNET', icon: 'Globe', color: 'var(--mg-purple-500)' },
      { categoryCode: 'TAX', subcategoryCode: 'INCOME_TAX', icon: 'ClipboardList', color: 'var(--mg-purple-500)' },
      { categoryCode: 'TAX', subcategoryCode: 'CORPORATE_TAX', icon: 'BarChart3', color: 'var(--mg-purple-600)' },
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'STATIONERY', icon: 'FileText', color: 'var(--mg-primary-500)' },
      { categoryCode: 'OFFICE_SUPPLIES', subcategoryCode: 'EQUIPMENT', icon: 'Monitor', color: 'var(--mg-color-text-main)' },
      { categoryCode: 'MARKETING', subcategoryCode: 'ONLINE_ADS', icon: 'Megaphone', color: 'var(--mg-success-500)' },
      { categoryCode: 'MARKETING', subcategoryCode: 'PROMOTION', icon: 'TrendingUp', color: 'var(--mg-success-600)' }
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
      const response = await axios.post('/api/v1/erp/finance/quick-expense', null, {
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
            {getLucideIcon('Zap', { size: 20 })} 빠른 지출 등록
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
                <MGButton
                  key={index}
                  type="button"
                  variant="secondary"
                  onClick={() => handleQuickExpense(expense.categoryCode, expense.subcategoryCode)}
                  loading={loading}
                  loadingText="등록 중..."
                  preventDoubleClick
                  className="quick-expense-category-btn"
                >
                  <div className="quick-expense-category-icon">
                    {getLucideIcon(expense.icon, { size: 20 })}
                  </div>
                  <div className="quick-expense-category-name">
                    {expense.displayName}
                  </div>
                  <div className="quick-expense-category-subname">
                    {expense.subDisplayName}
                  </div>
                </MGButton>
              );
            })}
          </div>
        )}

        <div className="quick-expense-info-box">
          <p className="quick-expense-info-text">
            {getLucideIcon('Lightbulb', { size: 16 })} 버튼을 클릭하면 금액 입력창이 나타납니다 (부가세 포함 금액 입력)
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
