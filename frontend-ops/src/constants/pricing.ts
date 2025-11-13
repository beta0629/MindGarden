import { FeeType } from "@/types/sharedPricing";

export const FEE_TYPE_LABEL: Record<FeeType, string> = {
  FLAT: "고정 금액",
  USAGE: "사용량 기반",
  PERCENTAGE: "비율 기반"
};

export const FEE_TYPE_OPTIONS: Array<{ value: FeeType; label: string }> = [
  { value: "FLAT", label: FEE_TYPE_LABEL.FLAT },
  { value: "USAGE", label: FEE_TYPE_LABEL.USAGE },
  { value: "PERCENTAGE", label: FEE_TYPE_LABEL.PERCENTAGE }
];

