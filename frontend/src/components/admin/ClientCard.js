import React from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { User, Mail, Phone, Calendar, CheckCircle } from 'lucide-react';
import { getFormattedContact, getFormattedRegistrationDate } from '../../utils/codeHelper';

const ClientCard = ({ 
    client, 
    clientMappings = [], 
    activeMappings = [], 
    isSelected = false, 
    onClick 
}) => {
    const handleClick = () => {
        if (onClick) {
            onClick(client);
        }
    };

    const contact = getFormattedContact(client);
    const registrationDate = getFormattedRegistrationDate(client);

    return (
        <div 
            className={`client-card ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
            style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                marginBottom: '12px'
            }}
        >
            <div className="mg-v2-client-card-header">
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #98FB98, #B6E5D8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2F2F2F'
                }}>
                    {client.name?.charAt(0) || '?'}
                </div>
                
                <div className="mg-v2-client-info">
                    <h4 style={{ 
                        margin: '0 0 4px 0', 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: '#2F2F2F'
                    }}>
                        {client.name || '이름 없음'}
                    </h4>
                    
                    <div className="mg-v2-client-contact">
                        <div className="mg-v2-contact-item mg-v2-contact-item-email">
                            <Mail size={14} />
                            {contact.email || '이메일 없음'}
                        </div>
                        {contact.phone && (
                            <div className="mg-v2-contact-item mg-v2-contact-item-phone">
                                <Phone size={14} />
                                {contact.phone}
                            </div>
                        )}
                    </div>
                </div>
                
                {isSelected && (
                    <div className="mg-v2-client-selected-icon">
                        <CheckCircle />
                    </div>
                )}
            </div>
            
            <div className="mg-v2-client-card-footer">
                <div className="mg-v2-footer-item mg-v2-footer-item-mapping">
                    <Calendar size={14} />
                    매핑 {clientMappings.length}개
                </div>
                {activeMappings.length > 0 && (
                    <div className="mg-v2-footer-item mg-v2-footer-item-active">
                        <CheckCircle size={14} />
                        활성 {activeMappings.length}개
                    </div>
                )}
                {registrationDate && (
                    <div className="mg-v2-footer-item mg-v2-footer-item-registration">
                        <User size={14} />
                        가입일: {registrationDate}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientCard;