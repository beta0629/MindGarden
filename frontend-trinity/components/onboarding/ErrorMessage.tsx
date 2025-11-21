/**
 * 에러 메시지 컴포넌트
 */

import { COMPONENT_CSS } from "../../constants/css-variables";

interface ErrorMessageProps {
  message: string | null;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className={COMPONENT_CSS.ONBOARDING.ERROR}>
      {message}
    </div>
  );
}

