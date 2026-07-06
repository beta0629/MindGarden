import { TRINITY_CONSTANTS } from '../../constants/trinity';
import { buildOtpSentMessage } from '../../utils/phoneUtils';

describe('buildOtpSentMessage', () => {
  it('SMS_STUB 채널이면 개발 미발송 안내를 반환한다', () => {
    expect(buildOtpSentMessage(TRINITY_CONSTANTS.OTP.DELIVERY_CHANNEL_SMS_STUB)).toBe(
      TRINITY_CONSTANTS.MESSAGES.OTP_SENT_SMS_STUB
    );
  });

  it('SMS 채널이면 실발송 안내를 반환한다', () => {
    expect(buildOtpSentMessage(TRINITY_CONSTANTS.OTP.DELIVERY_CHANNEL_SMS)).toBe(
      TRINITY_CONSTANTS.MESSAGES.OTP_SENT_SMS
    );
  });
});
