import React, { useState, useEffect } from 'react';
import './AccountManagement.css';
import AccountForm from './components/AccountForm';
import AccountTable from './components/AccountTable';
import { ACCOUNT_CSS_CLASSES } from '../../constants/css';
import { 
  ACCOUNT_API_ENDPOINTS, 
  HTTP_METHODS, 
  HTTP_HEADERS,
  ACCOUNT_BUTTON_TEXT,
  ACCOUNT_MESSAGES,
  ACCOUNT_PAGE_TITLES
} from '../../constants/account';

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

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(ACCOUNT_API_ENDPOINTS.ACTIVE);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.LOAD_FAILED, error);
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      const response = await fetch(ACCOUNT_API_ENDPOINTS.BANKS);
      if (response.ok) {
        const data = await response.json();
        setBanks(data);
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.BANK_LOAD_FAILED, error);
    }
  };

  const handleSubmit = async (e) => {
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
          [HTTP_HEADERS.CONTENT_TYPE]: HTTP_HEADERS.APPLICATION_JSON,
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await loadAccounts();
        resetForm();
        alert(editingAccount ? ACCOUNT_MESSAGES.SUCCESS.UPDATED : ACCOUNT_MESSAGES.SUCCESS.CREATED);
      } else {
        const error = await response.json();
        alert(`오류: ${error.message || ACCOUNT_MESSAGES.ERROR.CREATE_FAILED}`);
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.CREATE_FAILED, error);
      alert(ACCOUNT_MESSAGES.ERROR.CREATE_FAILED);
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

  const handleDelete = async (id) => {
    if (!window.confirm(ACCOUNT_MESSAGES.CONFIRM.DELETE)) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${ACCOUNT_API_ENDPOINTS.BASE}/${id}`, {
        method: HTTP_METHODS.DELETE,
        credentials: 'include'
      });

      if (response.ok) {
        await loadAccounts();
        alert(ACCOUNT_MESSAGES.SUCCESS.DELETED);
      } else {
        alert(ACCOUNT_MESSAGES.ERROR.DELETE_FAILED);
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.DELETE_FAILED, error);
      alert(ACCOUNT_MESSAGES.ERROR.DELETE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${ACCOUNT_API_ENDPOINTS.BASE}/${id}/toggle-status`, {
        method: HTTP_METHODS.PATCH,
        credentials: 'include'
      });

      if (response.ok) {
        await loadAccounts();
        alert(ACCOUNT_MESSAGES.SUCCESS.STATUS_CHANGED);
      } else {
        alert(ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED);
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED, error);
      alert(ACCOUNT_MESSAGES.ERROR.STATUS_CHANGE_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${ACCOUNT_API_ENDPOINTS.BASE}/${id}/set-primary`, {
        method: HTTP_METHODS.PATCH,
        credentials: 'include'
      });

      if (response.ok) {
        await loadAccounts();
        alert(ACCOUNT_MESSAGES.SUCCESS.PRIMARY_SET);
      } else {
        alert(ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED);
      }
    } catch (error) {
      console.error(ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED, error);
      alert(ACCOUNT_MESSAGES.ERROR.PRIMARY_SET_FAILED);
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

  return (
    <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_MANAGEMENT}>
      <div className={ACCOUNT_CSS_CLASSES.ACCOUNT_HEADER}>
        <h2>{ACCOUNT_PAGE_TITLES.MAIN}</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          {ACCOUNT_BUTTON_TEXT.REGISTER}
        </button>
      </div>

      <AccountForm
        showForm={showForm}
        editingAccount={editingAccount}
        formData={formData}
        banks={banks}
        loading={loading}
        onClose={resetForm}
        onSubmit={handleSubmit}
        onBankChange={handleBankChange}
        onFormDataChange={handleFormDataChange}
      />

      <AccountTable
        accounts={accounts}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleStatus={handleToggleStatus}
        onSetPrimary={handleSetPrimary}
      />
    </div>
  );
};

export default AccountManagement;
