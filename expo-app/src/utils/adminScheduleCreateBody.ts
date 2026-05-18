/**
 * 어드민 일정 등록 POST body — ScheduleCreateRequest SSOT
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { ADMIN_SCHEDULE_DEFAULTS } from '@/constants/adminScheduleRegisterCopy';
import type { AdminCommonCodeOption } from '@/utils/adminCommonCodeNormalize';

export type AdminScheduleCreateFormInput = {
  readonly consultantId: number;
  readonly clientId: number;
  readonly dateYmd: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly title?: string;
  readonly description?: string;
  readonly consultationType?: string;
  readonly tentativeBeforeDeposit?: boolean;
};

export type ScheduleCreateRequestBody = {
  consultantId: number;
  clientId: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  scheduleType: string;
  consultationType: string;
  tentativeBeforeDeposit?: boolean;
};

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export function parseTimeToMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time.trim());
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function computeEndTimeFromDuration(
  startTime: string,
  durationMinutes: number,
): string | null {
  const start = parseTimeToMinutes(startTime);
  if (start == null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null;
  }
  return formatMinutesToTime(start + durationMinutes);
}

export function resolveDurationMinutes(
  durationCode: string,
  durationOptions: readonly AdminCommonCodeOption[],
): number {
  const found = durationOptions.find((o) => o.value === durationCode);
  if (found && found.durationMinutes > 0) {
    return found.durationMinutes;
  }
  return 60;
}

export function buildScheduleCreateRequestBody(
  input: AdminScheduleCreateFormInput,
  options?: {
    readonly includeTentative?: boolean;
  },
): ScheduleCreateRequestBody {
  const body: ScheduleCreateRequestBody = {
    consultantId: input.consultantId,
    clientId: input.clientId,
    date: input.dateYmd,
    startTime: input.startTime,
    endTime: input.endTime,
    title: input.title?.trim() ?? '',
    description: input.description?.trim() || undefined,
    scheduleType: ADMIN_SCHEDULE_DEFAULTS.SCHEDULE_TYPE,
    consultationType: input.consultationType?.trim() || ADMIN_SCHEDULE_DEFAULTS.CONSULTATION_TYPE,
  };
  if (options?.includeTentative && input.tentativeBeforeDeposit) {
    body.tentativeBeforeDeposit = true;
  }
  return body;
}

export function buildDefaultScheduleTitle(
  consultantName: string,
  clientName: string,
): string {
  const c = consultantName.trim() || '상담사';
  const cl = clientName.trim() || '내담자';
  return `${c} - ${cl}`;
}
