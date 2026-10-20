import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PasswordChangeModal from '../mypage/components/PasswordChangeModal';
import { PASSWORD_CHANGE_REQUIRED_EVENT } from '../../constants/passwordChangeRequired';
import notificationManager from '../../utils/notification';

/**
 * 변경 전 세션이 다른 API에서 403을 받으면 기존 비밀번호 변경 모달을 연다.
 */
const PasswordChangeRequiredHost = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const closedBySuccessRef = useRef(false);

  useEffect(() => {
    const openModal = () => setOpen(true);
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, openModal);
    return () => window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, openModal);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <PasswordChangeModal
      isOpen={open}
      onClose={() => {
        if (closedBySuccessRef.current) {
          closedBySuccessRef.current = false;
          return;
        }
        notificationManager.show(t('auth:tempPasswordSms.changeRequired'), 'warning');
      }}
      onSuccess={() => {
        closedBySuccessRef.current = true;
        setOpen(false);
      }}
    />
  );
};

export default PasswordChangeRequiredHost;
