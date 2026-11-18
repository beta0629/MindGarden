import { z } from 'zod';

/** Live Clinic-OS consultation-products item shape. */
export const consultationProductSchema = z.object({
  skuCode: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int(),
  eventPrice: z.number().int().nullable(),
  eventStartDate: z.string().nullable(),
  eventEndDate: z.string().nullable(),
  sessionCount: z.number().int(),
  sessionMinutes: z.number().int().nullable(),
  displayOrder: z.number().int(),
  updatedAt: z.string().min(1),
});

export const consultationProductsEnvelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().nullable().optional(),
  data: z.array(z.unknown()),
  timestamp: z.string().optional(),
});

export type ConsultationProductParsed = z.infer<
  typeof consultationProductSchema
>;

/**
 * Parse envelope + drop malformed items. Sorted by displayOrder ascending.
 */
export function parseConsultationProductsResponse(
  raw: unknown,
): ConsultationProductParsed[] {
  const envelope = consultationProductsEnvelopeSchema.safeParse(raw);
  if (!envelope.success || !envelope.data.success) {
    return [];
  }

  const products: ConsultationProductParsed[] = [];
  for (const item of envelope.data.data) {
    const parsed = consultationProductSchema.safeParse(item);
    if (parsed.success) {
      products.push(parsed.data);
    }
  }

  return products.sort((a, b) => a.displayOrder - b.displayOrder);
}
