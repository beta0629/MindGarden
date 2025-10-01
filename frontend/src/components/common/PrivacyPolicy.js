import React from 'react';
import SimpleLayout from '../layout/SimpleLayout';

/**
 * 개인정보 처리방침 컴포넌트
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
const PrivacyPolicy = () => {
  return (
    <SimpleLayout>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '40px 20px',
        lineHeight: '1.6',
        color: '#333'
      }}>
        <h1 style={{
          fontSize: 'var(--font-size-xxl)',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '30px',
          textAlign: 'center',
          borderBottom: '2px solid #3498db',
          paddingBottom: '20px'
        }}>
          개인정보 처리방침
        </h1>

        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #e9ecef'
        }}>
          <p style={{ margin: '0', fontSize: 'var(--font-size-sm)', color: '#6c757d' }}>
            <strong>시행일자:</strong> 2025년 1월 17일<br />
            <strong>최종 수정일:</strong> 2025년 1월 17일
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            1. 개인정보의 처리목적
          </h2>
          <p style={{ marginBottom: '15px' }}>
            마인드가든(이하 "회사")은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>회원 가입 및 관리: 회원 식별, 가입의사 확인, 본인확인, 회원자격 유지·관리</li>
            <li>상담 서비스 제공: 상담 예약, 상담 진행, 상담 기록 관리</li>
            <li>결제 및 환불 처리: 서비스 이용료 결제, 환불 처리</li>
            <li>고객 지원: 문의사항 처리, 불만사항 처리</li>
            <li>마케팅 및 광고: 이벤트 정보 제공, 맞춤형 서비스 제공</li>
          </ul>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            2. 개인정보의 처리 및 보유기간
          </h2>
          <p style={{ marginBottom: '15px' }}>
            회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <div style={{
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px'
          }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: '10px', color: '#495057' }}>
              각각의 개인정보 처리 및 보유기간은 다음과 같습니다:
            </h3>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관계법령에 의해 보존이 필요한 경우 해당 기간까지)</li>
              <li><strong>상담 기록:</strong> 상담 완료 후 5년 (의료법에 의한 의료기록 보존 의무)</li>
              <li><strong>결제 정보:</strong> 결제 완료 후 5년 (전자상거래법에 의한 거래기록 보존 의무)</li>
              <li><strong>마케팅 정보:</strong> 동의 철회 시까지</li>
            </ul>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            3. 처리하는 개인정보의 항목
          </h2>
          <div style={{
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px'
          }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: '10px', color: '#495057' }}>
              필수 수집 항목:
            </h3>
            <ul style={{ paddingLeft: '20px', margin: '0 0 15px 0' }}>
              <li>이름, 이메일, 전화번호</li>
              <li>생년월일, 성별</li>
              <li>주소 (상담 서비스 제공을 위해)</li>
              <li>상담 목적 및 상담 이력</li>
            </ul>
            
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: '600', marginBottom: '10px', color: '#495057' }}>
              선택 수집 항목:
            </h3>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              <li>프로필 사진</li>
              <li>마케팅 정보 수신 동의</li>
              <li>추가 연락처</li>
            </ul>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            4. 개인정보의 제3자 제공
          </h2>
          <p style={{ marginBottom: '15px' }}>
            회사는 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
          </p>
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: '0', fontSize: '14px', color: '#856404' }}>
              <strong>주의:</strong> 상담 서비스 제공을 위해 상담사에게 필요한 최소한의 정보만 제공되며, 
              이는 상담 서비스의 질적 향상을 위한 목적으로만 사용됩니다.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            5. 개인정보 처리의 위탁
          </h2>
          <p style={{ marginBottom: '15px' }}>
            회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
          </p>
          <div style={{
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px'
          }}>
            <ul style={{ paddingLeft: '20px', margin: '0' }}>
              <li><strong>결제 처리:</strong> 토스페이먼츠, 카카오페이, 네이버페이</li>
              <li><strong>이메일 발송:</strong> AWS SES</li>
              <li><strong>데이터 저장:</strong> AWS RDS (암호화 적용)</li>
            </ul>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            6. 정보주체의 권리·의무 및 행사방법
          </h2>
          <p style={{ marginBottom: '15px' }}>
            정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>개인정보 처리현황 통지요구</li>
            <li>개인정보 열람요구</li>
            <li>개인정보 정정·삭제요구</li>
            <li>개인정보 처리정지요구</li>
          </ul>
          <p style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
            권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
          </p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            7. 개인정보의 안전성 확보조치
          </h2>
          <p style={{ marginBottom: '15px' }}>
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
          </p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>관리적 조치: 내부관리계획 수립·시행, 전담조직 운영</li>
            <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치</li>
            <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            <li>암호화: 개인정보는 암호화하여 저장 및 관리</li>
          </ul>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            8. 개인정보 보호책임자
          </h2>
          <div style={{
            background: '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: '0 0 10px 0' }}>
              <strong>개인정보 보호책임자:</strong> 마인드가든 개인정보보호팀
            </p>
            <p style={{ margin: '0 0 10px 0' }}>
              <strong>연락처:</strong> privacy@mindgarden.co.kr
            </p>
            <p style={{ margin: '0' }}>
              <strong>전화:</strong> 02-1234-5678
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: '600',
            color: '#2c3e50',
            marginBottom: '15px',
            paddingLeft: '10px',
            borderLeft: '4px solid #3498db'
          }}>
            9. 개인정보 처리방침의 변경
          </h2>
          <p style={{ marginBottom: '15px' }}>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </p>
        </div>

        <div style={{
          background: '#e8f4fd',
          border: '1px solid #bee5eb',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0', fontSize: '14px', color: '#0c5460' }}>
            <strong>본 개인정보처리방침은 2025년 1월 17일부터 시행됩니다.</strong>
          </p>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default PrivacyPolicy;
