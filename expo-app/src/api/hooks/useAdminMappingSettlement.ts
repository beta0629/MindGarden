/**
 * 어드민·스태프 — 매칭 결제 확인·입금 확인·최종 승인 POST
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { ADMIN_MOBILE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { invalidateAdminApiQueries } from '@/utils/invalidateAdminApiQueries';
import { extractApiErrorMessage } from '@/utils/adminSchedulePickerNormalize';
import { canManageMappingsOnMobile } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import { resolveAdminApproveName } from '@/utils/adminMappingSettlement';

export type ConfirmMappingPaymentInput = {
  readonly mappingId: number;
  readonly paymentMethod: string;
  readonly paymentReference: string | null;
  readonly paymentAmount: number;
};

export type ConfirmMappingDepositInput = {
  readonly mappingId: number;
  readonly depositReference: string;
};

export type ApproveMappingInput = {
  readonly mappingId: number;
  readonly adminName: string;
};

async function postConfirmPayment(input: ConfirmMappingPaymentInput): Promise<unknown> {
  const body = {
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference,
    paymentAmount: input.paymentAmount,
  };
  return apiPost<unknown>(ADMIN_MOBILE_API.confirmMappingPayment(input.mappingId), body);
}

async function postConfirmDeposit(input: ConfirmMappingDepositInput): Promise<unknown> {
  return apiPost<unknown>(ADMIN_MOBILE_API.confirmMappingDeposit(input.mappingId), {
    depositReference: input.depositReference.trim(),
  });
}

async function postApproveMapping(input: ApproveMappingInput): Promise<unknown> {
  return apiPost<unknown>(ADMIN_MOBILE_API.approveMapping(input.mappingId), {
    adminName: input.adminName,
  });
}

function useSettlementMutationBase<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const { ready } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = canManageMappingsOnMobile(role, accessToken);
  useAdminApiTenantSync();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      invalidateAdminApiQueries(queryClient);
    },
    meta: { ready, allowed },
  });
}

export function useConfirmMappingPayment() {
  return useSettlementMutationBase(postConfirmPayment);
}

export function useConfirmMappingDeposit() {
  return useSettlementMutationBase(postConfirmDeposit);
}

export function useApproveMapping() {
  const user = useAuthStore((s) => s.user);

  return useSettlementMutationBase(async (mappingId: number) =>
    postApproveMapping({
      mappingId,
      adminName: resolveAdminApproveName(user),
    }),
  );
}

export function getAdminMappingSettlementErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return extractApiErrorMessage(error, fallback);
}
