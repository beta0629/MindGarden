'use client';

import { useMemo } from 'react';
import {
  getLoginPasswordChecklistItems,
  getLoginPasswordStrengthLevel,
  LOGIN_PASSWORD_POLICY_HINT_ONE_LINE,
  PASSWORD_STRENGTH_BAR_COUNT,
  PASSWORD_STRENGTH_LEVELS,
  PASSWORD_STRENGTH_META,
} from '../../constants/passwordPolicy';
import '../../styles/components/password-policy.css';

interface PasswordPolicyPanelProps {
  password: string;
  showStrength?: boolean;
  showChecklist?: boolean;
}

/**
 * Core Solution 공통 비밀번호 정책 안내 (힌트·체크리스트·강도 표시).
 */
export default function PasswordPolicyPanel({
  password,
  showStrength = true,
  showChecklist = true,
}: PasswordPolicyPanelProps) {
  const checklistItems = useMemo(
    () => getLoginPasswordChecklistItems(password),
    [password],
  );
  const strength = useMemo(() => getLoginPasswordStrengthLevel(password), [password]);
  const strengthMeta = strength !== PASSWORD_STRENGTH_LEVELS.NONE
    ? PASSWORD_STRENGTH_META[strength]
    : null;

  return (
    <div className="trinity-password-policy" aria-live="polite">
      <p className="trinity-password-policy__hint">{LOGIN_PASSWORD_POLICY_HINT_ONE_LINE}</p>

      {showChecklist && password.length > 0 && (
        <ul className="trinity-password-policy__checklist" aria-label="비밀번호 정책 체크리스트">
          {checklistItems.map((item) => (
            <li
              key={item.id}
              className={`trinity-password-policy__checklist-item${
                item.met ? ' trinity-password-policy__checklist-item--met' : ''
              }`}
            >
              <span className="trinity-password-policy__checklist-icon" aria-hidden="true">
                {item.met ? '✓' : '○'}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      )}

      {showStrength && password.length > 0 && strengthMeta && (
        <div className="trinity-password-policy__strength" id="password-strength">
          <div className="trinity-password-policy__strength-bars" aria-hidden="true">
            {Array.from({ length: PASSWORD_STRENGTH_BAR_COUNT }, (_, index) => (
              <div
                key={index}
                className={`trinity-password-policy__strength-bar${
                  index < strength
                    ? ` trinity-password-policy__strength-bar--${strengthMeta.className}`
                    : ''
                }`}
              />
            ))}
          </div>
          <span className={`trinity-password-policy__strength-text trinity-password-policy__strength-text--${strengthMeta.className}`}>
            {strengthMeta.label}
          </span>
        </div>
      )}
    </div>
  );
}
