import { useState, useEffect } from 'react';
import notificationManager from '../../utils/notification';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AccountManagement.css';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import AccountForm from './components/AccountForm';
import AccountTable from './components/AccountTable';
import { ACCOUNT_CSS_CLASSES } from '../../constants/css';
import {
  ACCOUNT_API_ENDPOINTS,
  HTTP_METHODS,
  HTTP_HEADERS,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_MESSAGES,
  ACCOUNT_PAGE_TITLES,
  ACCOUNT_SECTION_TITLES
} from '../../constants/account';

const FETCH_CREDENTIALS = 'include';

/**
 * API가 배열을 직접 주거나 ApiResponse({ data: [] }) 형태일 때 모두 안전하게 배열로 정규화
 */
const normalizeListResponse = (payload) => {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object' && Array.isArray(payload.data)) return payload.data;
  return [];
};

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchId: null,
    isPrimary: false,
    isActive: true,
    description: ''
  });

  useEffect(() => {
    loadAccounts();
    loadBanks();
  }, []);

  const loadAccounts = async() => {
    try {
      setLoading(true);
      const response = await fetch(ACCOUNT_API_ENDPOINTS.ACTIVE, {
        credentials: FETCH_CREDENTIALS
      });
      if (response.ok) {
        const raw = await response.json();
        setAccounts(normalizeListResponse(raw));
      } else {
        notificationManager.show(ACCOUNT_MESSAGES.ERROR.LOAD_FAILED, 'error');
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.LOAD_FAILED, error);
      notificationManager.show(ACCOUNT_MESSAGES.ERROR.LOAD_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async() => {
    try {
      const response = await fetch(ACCOUNT_API_ENDPOINTS.BANKS, {
        credentials: FETCH_CREDENTIALS
      });
      if (response.ok) {
        const raw = await response.json();
        setBanks(normalizeListResponse(raw));
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.BANK_LOAD_FAILED, error);
    }
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const url = editingAccount 
        ? `${ACCOUNT_API_ENDPOINTS.BASE}/${editingAccount.id}`
        : ACCOUNT_API_ENDPOINTS.BASE;
      
      const method = editingAccount ? HTTP_METHODS.PUT : HTTP_METHODS.POST;
      
      const response = await fetch(url, {
        method,
        headers: {
          [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON },
        credentials: FETCH_CREDENTIALS,
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadAccounts();
        resetForm();
        notificationManager.show(editingAccount ? ACCOUNT_MESSAGES.SUCCESS.UPDATED : ACCOUNT_MESSAGES.SUCCESS.CREATED, 'success');
      } else {
        const error = await response.json();
        notificationManager.show(`오류: ${error.message || ACCOUNT_MESSAGES.ERROR.CREATE_FAILED}`, 'info');
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.CREATE_FAILED, error);
      notificationManager.show(ACCOUNT_MESSAGES.ERROR.CREATE_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      branchId: account.branchId,
      isPrimary: account.isPrimary,
      isActive: account.isActive,
      description: account.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async(id) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(ACCOUNT_MESSAGES.CONFIRM.DELETE, resolve);
    });
    if (!confirmed) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${ACCOUNT_API_ENDPOINTS.BASE}/${id}`, {
        method: HTTP_METHODS.DELETE,
        credentials: FETCH_CREDENTIALS
      });

      if (response.ok) {
        await loadAccounts();
        notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.DELETED, 'success');
      } else {
        notificationManager.show(ACCOUNT_MESSAGES.ERROR.DELETE_FAILED, 'error');
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.DELETE_FAILED, error);
      notificationManager.show(ACCOUNT_MESSAGES.ERROR.DELETE_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async(id) => {
    try {
      setLoading(true);
      const response = await fetch(`${ACCOUNT_API_ENDPOINTS.BASE}/${id}/toggle-status`, {
        method: HTTP_METHODS.PATCH,
        credentials: FETCH_CREDENTIALS
      });

      if (response.ok) {
        await loadAccounts();
        notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.STATUS_CHANGED, 'success');
      } else {
        notificationManager.show(ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED, 'error');
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED, error);
      notificationManager.show(ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async(id) => {
    try {
      setLoading(true);
      const response = await fetch(`${ACCOUNT_API_ENDPOINTS.BASE}/${id}/set-primary`, {
        method: HTTP_METHODS.PATCH,
        credentials: FETCH_CREDENTIALS
      });

      if (response.ok) {
        await loadAccounts();
        notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.PRIMARY_SET, 'success');
      } else {
        notificationManager.show(ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED, 'error');
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED, error);
      notificationManager.show(ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bankCode: '',
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      branchId: null,
      isPrimary: false,
      isActive: true,
      description: ''
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleBankChange = (bankCode) => {
    const bank = banks.find(b => b.code === bankCode);
    setFormData(prev => ({
      ...prev,
      bankCode,
      bankName: bank ? bank.name : ''
    }));
  };

  const handleFormDataChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const accountHeaderActions = (
    <MGButton
      variant="primary"
      className={buildErpMgButtonClassName({
        variant: 'primary',
        size: 'md',
        loading,
        className: ''
      })}
      loading={loading}
      loadingText={ERP_MG_BUTTON_LOADING_TEXT}
      onClick={() => setShowForm(true)}
      preventDoubleClick={false}
    >
      {ACCOUNT_BUTTON_TEXT.REGISTER}
    </MGButton>
  );

  return (
    <AdminCommonLayout title="계좌 관리">
      <div className={`mg-v2-ad-b0kla ${ACCOUNT_CSS_CLASSES.ACCOUNT_MANAGEMENT}`}>
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="계좌 관리 콘텐츠">
            <ContentHeader
              title={ACCOUNT_PAGE_TITLES.MAIN}
              subtitle="정산·입금 안내에 사용할 계좌를 등록·관리합니다."
              actions={accountHeaderActions}
              titleId="account-management-page-title"
            />

            {loading && accounts.length === 0 ? (
              <div aria-busy="true" className="account-management-initial-loading">
                <UnifiedLoading type="inline" text="계좌 목록을 불러오는 중..." />
              </div>
            ) : (
              <>
                <UnifiedModal
                  isOpen={showForm}
                  onClose={resetForm}
                  title={editingAccount ? ACCOUNT_PAGE_TITLES.EDIT : ACCOUNT_PAGE_TITLES.CREATE}
                  size="medium"
                  variant="form"
                  backdropClick
                  showCloseButton
                  className="mg-v2-ad-b0kla"
                >
                  <AccountForm
                    showForm={showForm}
                    editingAccount={editingAccount}
                    formData={formData}
                    loading={loading}
                    onClose={resetForm}
                    onSubmit={handleSubmit}
                    onBankChange={handleBankChange}
                    onFormDataChange={handleFormDataChange}
                  />
                </UnifiedModal>

                <section
                  className={`mg-v2-ad-b0kla__card ${ACCOUNT_CSS_CLASSES.ACCOUNT_LIST_SECTION}`}
                  aria-labelledby="account-registered-list-title"
                >
                  <h2 id="account-registered-list-title" className="mg-v2-ad-b0kla__section-title">
                    {ACCOUNT_SECTION_TITLES.REGISTERED_LIST}
                  </h2>
                  <AccountTable
                    accounts={accounts}
                    loading={loading}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onSetPrimary={handleSetPrimary}
                  />
                </section>
              </>
            )}
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default AccountManagement;
