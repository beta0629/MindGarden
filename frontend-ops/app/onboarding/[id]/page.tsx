import { OnboardingDetailPageClient } from "./OnboardingDetailPageClient";

export async function generateStaticParams() {
  return [];
}

export default function OnboardingDetailPage() {
  return <OnboardingDetailPageClient />;
}
