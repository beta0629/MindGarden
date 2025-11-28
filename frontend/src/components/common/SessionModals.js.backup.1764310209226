/**
 * SessionManagement 전용 모달 컴포넌트들
 * 디자인 가이드 준수 - ITCSS 아키텍처, 상수화 필수 원칙
 */


  BUTTON_TEXT, 
  COLORS, 
  SPACING, 
  FONT_SIZES,
  Z_INDEX,
  PACKAGE_TYPES
} from '../../constants/sessionManagement';

// 모달 스타일
const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: Z_INDEX.MODAL
  },
  modal: {
    background: COLORS.BG_PRIMARY,
    borderRadius: '12px',
    padding: SPACING.XL,
    minWidth: '400px',
    maxWidth: '500px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${COLORS.SECONDARY}20`,
    animation: 'fadeIn 0.3s ease-out'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
    paddingBottom: SPACING.MD,
    borderBottom: `1px solid ${COLORS.SECONDARY}20`
  },
  title: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: FONT_SIZES.XL,
    color: COLORS.TEXT_SECONDARY,
    cursor: 'pointer',
    padding: SPACING.SM,
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  content: {
    marginBottom: SPACING.LG
  },
  formGroup: {
    marginBottom: SPACING.MD
  },
  label: {
    display: 'block',
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM
  },
  input: {
    width: '100%',
    padding: SPACING.MD,
    border: `1px solid ${COLORS.SECONDARY}40`,
    borderRadius: '8px',
    fontSize: FONT_SIZES.BASE,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.BG_SECONDARY,
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: SPACING.MD,
    border: `1px solid ${COLORS.SECONDARY}40`,
    borderRadius: '8px',
    fontSize: FONT_SIZES.BASE,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.BG_SECONDARY,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: SPACING.MD,
    border: `1px solid ${COLORS.SECONDARY}40`,
    borderRadius: '8px',
    fontSize: FONT_SIZES.BASE,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.BG_SECONDARY,
    resize: 'vertical',
    minHeight: '80px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  infoCard: {
    background: `${COLORS.PRIMARY}10`,
    border: `1px solid ${COLORS.PRIMARY}30`,
    borderRadius: '8px',
    padding: SPACING.MD,
    marginBottom: SPACING.MD
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
    fontSize: FONT_SIZES.SM
  },
  infoLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '500'
  },
  infoValue: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTop: `1px solid ${COLORS.SECONDARY}20`
  },
  button: {
    padding: `${SPACING.SM} ${SPACING.LG}`,
    border: 'none',
    borderRadius: '8px',
    fontSize: FONT_SIZES.BASE,
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: SPACING.SM
  },
  primaryButton: {
    background: COLORS.PRIMARY,
    color: COLORS.BG_PRIMARY
  },
  secondaryButton: {
    background: COLORS.SECONDARY,
    color: COLORS.BG_PRIMARY
  },
  cancelButton: {
    background: 'transparent',
    color: COLORS.TEXT_SECONDARY,
    border: `1px solid ${COLORS.SECONDARY}40`
  }
};

/**
 * 회기 추가 모달
 */
export const AddSessionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedClient, 
  selectedMapping, 
  packageOptions, 
  loading 
}) => {
  const [formData, setFormData] = useState({
    additionalSessions: 1,
    packageName: '',
    packagePrice: 0,
    notes: ''
  });

  useEffect(() => {
    if (isOpen && selectedMapping) {
      setFormData(prev => ({
        ...prev,
        packageName: selectedMapping.packageName || '',
        packagePrice: selectedMapping.packagePrice || 0
      }));
    }
  }, [isOpen, selectedMapping]);

  const handlePackageChange = (packageValue) => {
    const selectedPackage = packageOptions.find(pkg => pkg.value === packageValue);
    if (selectedPackage) {
      setFormData(prev => ({
        ...prev,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        additionalSessions: selectedPackage.value.startsWith(PACKAGE_TYPES.SINGLE) ? 1 : prev.additionalSessions
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      consultantId: selectedMapping?.consultantId || '',
      clientId: selectedClient?.id || ''
    });
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>{BUTTON_TEXT.ADD_SESSION}</h2>
          <button style={modalStyles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={modalStyles.content}>
          {/* 선택된 정보 표시 */}
          {(selectedClient || selectedMapping) && (
            <div style={modalStyles.infoCard}>
              <div style={modalStyles.infoRow}>
                <span style={modalStyles.infoLabel}>내담자:</span>
                <span style={modalStyles.infoValue}>{selectedClient?.name || '선택되지 않음'}</span>
              </div>
              <div style={modalStyles.infoRow}>
                <span style={modalStyles.infoLabel}>상담사:</span>
                <span style={modalStyles.infoValue}>{selectedMapping?.consultantName || '선택되지 않음'}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>패키지 선택</label>
              <select
                style={modalStyles.select}
                value={packageOptions.find(pkg => pkg.name === formData.packageName)?.value || ''}
                onChange={(e) => handlePackageChange(e.target.value)}
                required
              >
                <option value="">패키지를 선택해주세요</option>
                {packageOptions.map((pkg) => (
                  <option key={pkg.id} value={pkg.value}>
                    {pkg.name} - {pkg.price.toLocaleString()}원
                  </option>
                ))}
              </select>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>추가 회기 수</label>
              <input
                type="number"
                style={modalStyles.input}
                value={formData.additionalSessions}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalSessions: parseInt(e.target.value) || 1 }))}
                min="1"
                max="20"
                required
              />
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>비고</label>
              <textarea
                style={modalStyles.textarea}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="회기 추가에 대한 추가 정보를 입력해주세요"
              />
            </div>

            {/* 선택된 패키지 정보 표시 */}
            {formData.packageName && (
              <div style={modalStyles.infoCard}>
                <div style={modalStyles.infoRow}>
                  <span style={modalStyles.infoLabel}>선택된 패키지:</span>
                  <span style={modalStyles.infoValue}>{formData.packageName}</span>
                </div>
                <div style={modalStyles.infoRow}>
                  <span style={modalStyles.infoLabel}>회기 수:</span>
                  <span style={modalStyles.infoValue}>{formData.additionalSessions}회</span>
                </div>
                <div style={modalStyles.infoRow}>
                  <span style={modalStyles.infoLabel}>총 금액:</span>
                  <span style={modalStyles.infoValue}>{(formData.packagePrice * formData.additionalSessions).toLocaleString()}원</span>
                </div>
              </div>
            )}
          </form>
        </div>

        <div style={modalStyles.footer}>
          <button
            type="button"
            
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            
            onClick={handleSubmit}
            disabled={loading || !formData.packageName}
          >
            {loading ? '처리 중...' : '회기 추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 결제 확인 모달
 */
export const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedMapping, 
  loading 
}) => {
  const handleSubmit = () => {
    onSubmit();
  };

  if (!isOpen || !selectedMapping) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>{BUTTON_TEXT.CONFIRM_PAYMENT}</h2>
          <button style={modalStyles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={modalStyles.content}>
          <div style={modalStyles.infoCard}>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>내담자:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.clientName}</span>
            </div>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>상담사:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.consultantName}</span>
            </div>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>패키지:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.packageName}</span>
            </div>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>총 금액:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.packagePrice?.toLocaleString()}원</span>
            </div>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>회기 수:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.totalSessions}회</span>
            </div>
          </div>

          <div style={{ 
            background: `${COLORS.SUCCESS}10`, 
            border: `1px solid ${COLORS.SUCCESS}30`, 
            borderRadius: '8px', 
            padding: SPACING.MD,
            textAlign: 'center'
          }}>
            <p >
              💳 입금이 확인되었습니다. 결제를 완료하시겠습니까?
            </p>
            <p style={{ margin: `${SPACING.SM} 0 0 0`, fontSize: FONT_SIZES.XS, color: COLORS.TEXT_SECONDARY }}>
              * 완료 시 ERP 시스템에 자동으로 등록됩니다.
            </p>
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button
            type="button"
            
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '처리 중...' : '결제 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 승인 모달
 */
export const ApprovalModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedMapping, 
  loading 
}) => {
  const handleSubmit = () => {
    onSubmit();
  };

  if (!isOpen || !selectedMapping) return null;

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>{BUTTON_TEXT.APPROVE}</h2>
          <button style={modalStyles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div style={modalStyles.content}>
          <div style={modalStyles.infoCard}>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>내담자:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.clientName}</span>
            </div>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>상담사:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.consultantName}</span>
            </div>
            <div style={modalStyles.infoRow}>
              <span style={modalStyles.infoLabel}>패키지:</span>
              <span style={modalStyles.infoValue}>{selectedMapping.packageName}</span>
            </div>
          </div>

          <div style={{ 
            background: `${COLORS.WARNING}10`, 
            border: `1px solid ${COLORS.WARNING}30`, 
            borderRadius: '8px', 
            padding: SPACING.MD,
            textAlign: 'center'
          }}>
            <p >
              ✅ 이 매핑을 승인하시겠습니까?
            </p>
            <p style={{ margin: `${SPACING.SM} 0 0 0`, fontSize: FONT_SIZES.XS, color: COLORS.TEXT_SECONDARY }}>
              * 승인 후 상담을 시작할 수 있습니다.
            </p>
          </div>
        </div>

        <div style={modalStyles.footer}>
          <button
            type="button"
            
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '처리 중...' : '승인'}
          </button>
        </div>
      </div>
    </div>
  );
};
