import { useState, useEffect, useCallback } from 'react';
import notificationManager from '../../utils/notification';
import { useConfirm } from '../../hooks/useConfirm';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './AccountManagement.css';
import UnifiedModal from '../common/modals/UnifiedModal';
import AccountForm from './components/AccountForm';
import AccountTable from './components/AccountTable';
import { ACCOUNT_CSS_CLASSES } from '../../constants/css';
import {
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_MESSAGES,
  ACCOUNT_PAGE_TITLES,
  ACCOUNT_SECTION_TITLES,
  ACCOUNT_VALIDATION
} from '../../constants/account';
import {
  createAccount,
  deleteAccount,
  listAccountBanks,
  listActiveAccounts,
  setPrimaryAccount,
  toggleAccountStatus,
  updateAccount
} from '../../services/accountManagementService';
import { toDisplayString } from '../../utils/safeDisplay';

const EMPTY_FORM_DATA = {
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  branchId: null,
  isPrimary: false,
  isActive: true,
  description: ''
};

/**
 * 부모 저장 경로 방어 validate (AccountForm JS validate와 정합).
 * @param {object} data
 * @returns {string|null} 에러 메시지 또는 null
 */
const getAccountFormValidationError = (data) => {
  if (!data?.bankCode) {
    return '은행을 선택해주세요.';
  }
  const accountNumber = (data.accountNumber || '').trim();
  if (!accountNumber) {
    return '계좌번호를 입력해주세요.';
  }
  if (
    !ACCOUNT_VALIDATION.ACCOUNT_NUMBER_PATTERN.test(accountNumber)
    || accountNumber.length < ACCOUNT_VALIDATION.MIN_ACCOUNT_NUMBER_LENGTH
    || accountNumber.length > ACCOUNT_VALIDATION.MAX_ACCOUNT_NUMBER_LENGTH
  ) {
    return '계좌번호 형식이 올바르지 않습니다.';
  }
  const accountHolder = (data.accountHolder || '').trim();
  if (!accountHolder) {
    return '예금주명을 입력해주세요.';
  }
  return null;
};

const AccountManagement = () => {
  const [confirm, ConfirmModal] = useConfirm();
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  const loadAccounts = useCallback(async() => {
    try {
      setLoading(true);
      const list = await listActiveAccounts();
      setAccounts(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.LOAD_FAILED, error);
      notificationManager.show(
        toDisplayString(error?.message, ACCOUNT_MESSAGES.ERROR.LOAD_FAILED),
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBanks = useCallback(async() => {
    try {
      const list = await listAccountBanks();
      setBanks(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.BANK_LOAD_FAILED, error);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    loadBanks();
  }, [loadAccounts, loadBanks]);

  const handleSubmit = async(e) => {
    e.preventDefault();
    const validationError = getAccountFormValidationError(formData);
    if (validationError) {
      notificationManager.show(validationError, 'warning');
      return;
    }
    try {
      setLoading(true);
      if (editingAccount) {
        await updateAccount(editingAccount.id, formData);
        notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.UPDATED, 'success');
      } else {
        await createAccount(formData);
        notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.CREATED, 'success');
      }
      await loadAccounts();
      resetForm();
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.CREATE_FAILED, error);
      notificationManager.show(
        toDisplayString(error?.message, ACCOUNT_MESSAGES.ERROR.CREATE_FAILED),
        'error'
      );
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
    const confirmed = await confirm({ message: ACCOUNT_MESSAGES.CONFIRM.DELETE, variant: 'danger' });
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteAccount(id);
      await loadAccounts();
      notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.DELETED, 'success');
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.DELETE_FAILED, error);
      notificationManager.show(
        toDisplayString(error?.message, ACCOUNT_MESSAGES.ERROR.DELETE_FAILED),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async(id) => {
    try {
      setLoading(true);
      await toggleAccountStatus(id);
      await loadAccounts();
      notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.STATUS_CHANGED, 'success');
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED, error);
      notificationManager.show(
        toDisplayString(error?.message, ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async(id) => {
    try {
      setLoading(true);
      await setPrimaryAccount(id);
      await loadAccounts();
      notificationManager.show(ACCOUNT_MESSAGES.SUCCESS.PRIMARY_SET, 'success');
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED, error);
      notificationManager.show(
        toDisplayString(error?.message, ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM_DATA);
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleBankChange = (bankCode) => {
    const bank = banks.find((b) => b.code === bankCode);
    setFormData((prev) => ({
      ...prev,
      bankCode,
      bankName: bank ? bank.name : ''
    }));
  };

  const handleFormDataChange = (field, value) => {
    setFormData((prev) => ({
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
    <AdminCommonLayout loading={loading && accounts.length === 0}>
      <div className={`mg-v2-ad-b0kla ${ACCOUNT_CSS_CLASSES.ACCOUNT_MANAGEMENT}`}>
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="계좌 관리 콘텐츠">
            <ContentHeader
              title={ACCOUNT_PAGE_TITLES.MAIN}
              subtitle="정산·입금 안내에 사용할 계좌를 등록·관리합니다."
              actions={accountHeaderActions}
              titleId="account-management-page-title"
            />

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
          </ContentArea>
        </div>
      </div>
      <ConfirmModal />
    </AdminCommonLayout>
  );
};

export default AccountManagement;
