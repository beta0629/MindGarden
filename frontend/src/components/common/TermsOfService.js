import React from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import './PrivacyPolicy.css';

/**
 * 이용약관 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const TermsOfService = () => {
  return (
    <SimpleLayout>
      <div className="privacy-policy-container">
        <h1 className="privacy-policy-title">
          이용약관
        </h1>

        <div className="privacy-policy-info-box">
          <p className="privacy-policy-info-text">
            <strong>시행일자:</strong> 2025년 1월 17일<br />
            <strong>최종 수정일:</strong> 2025년 1월 17일
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제1조 (목적)
          </h2>
          <p className="mg-v2-terms-paragraph">
            이 약관은 마인드가든(이하 "회사")이 제공하는 온라인 상담 서비스(이하 "서비스")를 이용함에 있어 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제2조 (정의)
          </h2>
          <p className="mg-v2-terms-paragraph">이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
          <ul className="mg-v2-terms-list">
            <li><strong>"서비스"</strong>란 회사가 제공하는 온라인 심리상담 서비스를 의미합니다.</li>
            <li><strong>"이용자"</strong>란 회사의 서비스에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
            <li><strong>"회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
            <li><strong>"상담사"</strong>란 회사와 계약을 체결하여 상담 서비스를 제공하는 자를 말합니다.</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제3조 (약관의 효력 및 변경)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            3. 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제4조 (서비스의 제공)
          </h2>
          <p className="mg-v2-terms-paragraph">
            회사는 다음과 같은 서비스를 제공합니다:
          </p>
          <ul className="mg-v2-terms-list">
            <li>온라인 심리상담 서비스</li>
            <li>상담 예약 및 관리 서비스</li>
            <li>상담 기록 관리 서비스</li>
            <li>결제 및 환불 서비스</li>
            <li>고객 지원 서비스</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제5조 (회원가입)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
          </p>
          <ul className="mg-v2-terms-list">
            <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
            <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
            <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제6조 (서비스 이용)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간 운영을 원칙으로 합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            3. 상담 서비스는 예약된 시간에만 제공되며, 상담사와 이용자 간의 개별 계약에 따라 진행됩니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제7조 (이용자의 의무)
          </h2>
          <p className="mg-v2-terms-paragraph">이용자는 다음 행위를 하여서는 안 됩니다:</p>
          <ul className="mg-v2-terms-list">
            <li>신청 또는 변경시 허위 내용의 등록</li>
            <li>타인의 정보 도용</li>
            <li>회사가 게시한 정보의 변경</li>
            <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
            <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
            <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
            <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
          </ul>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제8조 (서비스 이용료)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 서비스 이용료는 회사가 정한 요금표에 따라 부과됩니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 이용료는 사전에 공지된 방법에 따라 결제하여야 하며, 미결제 시 서비스 이용이 제한될 수 있습니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            3. 환불은 회사의 환불 정책에 따라 처리됩니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제9조 (개인정보보호)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사는 회원가입시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            3. 회사는 이용자의 개인정보를 수집·이용하는 때에는 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제10조 (회사의 의무)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함)보호를 위한 보안 시스템을 구축하여야 합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            3. 회사는 이용자가 원하지 않는 영리목적의 광고성 전자우편을 발송하지 않습니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제11조 (손해배상)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 회사가 이용자에게 손해를 입힌 경우 회사는 그 손해를 배상할 책임이 있습니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사는 무료로 제공되는 서비스와 관련하여 회원에게 어떠한 손해가 발생하더라도 동 손해가 회사의 고의 또는 중대한 과실에 의한 경우를 제외하고는 이에 대하여 책임을 부담하지 아니합니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제12조 (면책조항)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            3. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며 그 밖에 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제13조 (분쟁해결)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 회사와 이용자간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.
          </p>
        </div>

        <div className="mg-v2-terms-section">
          <h2 className="mg-v2-terms-title">
            제14조 (준거법 및 관할법원)
          </h2>
          <p className="mg-v2-terms-paragraph">
            1. 이 약관의 해석과 적용 및 회사와 이용자간의 분쟁에 대해서는 대한민국 법을 적용합니다.
          </p>
          <p className="mg-v2-terms-paragraph">
            2. 서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할법원으로 합니다.
          </p>
        </div>

        <div className="mg-v2-terms-box mg-v2-text-center">
          <p className="mg-v2-text-sm mg-v2-m-0" style={{ color: '#0c5460' }}>
            <strong>본 이용약관은 2025년 1월 17일부터 시행됩니다.</strong>
          </p>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default TermsOfService;
