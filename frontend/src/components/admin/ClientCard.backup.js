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
            className={`mg-v2-card mg-v2-client-card ${isSelected ? 'selected' : ''}`}
            onClick={handleClick}
        >
            <div className="mg-v2-client-card-header">
                <div className="mg-v2-client-avatar">
                    {client.name?.charAt(0) || '?'}
                </div>
                
                <div className="mg-v2-client-info">
                    <h4 className="mg-v2-client-name">
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