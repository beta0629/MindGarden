/**
 * §3. API 키 상태 섹션 — 디자이너 §3.
 *
 * P1 보안(2026-10-03): 키·URL·모델 쓰기는 운영자 전용(서버 403)이라
 * 테넌트 화면은 provider 별 등록 여부·마스킹 값·모델만 보여 준다.
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React from 'react';
import { KeyRound } from 'lucide-react';
import { SettingsSectionPanel } from '../../settings-shell';
import { toDisplayString } from '../../../../utils/safeDisplay';
import {
  AI_PROVIDER_LABELS,
  AI_PROVIDER_OPTIONS,
  maskApiKey
} from '../constants';

const ApiKeyManager = ({ providers }) => (
  <SettingsSectionPanel
    title="API 키 관리"
    description={AI_PROVIDER_LABELS.keyOpsOnlyNotice}
    className="mg-ai-section mg-ai-api-key-manager"
    body="plain"
  >
    <ul className="mg-ai-api-key-manager__list" aria-label="API 키 목록">
      {AI_PROVIDER_OPTIONS.map((provider) => {
        const current = providers?.[provider.id] || {};
        const hasKey = (current.apiKey || '').trim() !== '';
        return (
          <li key={provider.id} className="mg-ai-api-key-manager__row">
            <div className="mg-ai-api-key-manager__head">
              <KeyRound size={16} aria-hidden="true" />
              <span className="mg-ai-api-key-manager__name">{toDisplayString(provider.label)}</span>
            </div>
            <div className="mg-ai-api-key-manager__meta">
              <span
                className={[
                  'mg-ai-api-key-manager__key',
                  hasKey ? 'mg-ai-api-key-manager__key--filled' : 'mg-ai-api-key-manager__key--empty'
                ].join(' ')}
              >
                {hasKey ? toDisplayString(maskApiKey(current.apiKey)) : AI_PROVIDER_LABELS.unregistered}
              </span>
              {current.model ? (
                <span className="mg-ai-api-key-manager__model">{toDisplayString(current.model)}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  </SettingsSectionPanel>
);

export default ApiKeyManager;
