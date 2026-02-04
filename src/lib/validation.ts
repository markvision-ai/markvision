import { z } from 'zod';

// Validation schemas for data inputs
export const dailyDataFieldSchema = z.object({
  spend: z.number().min(0, 'Значение не может быть отрицательным').max(100000000, 'Превышен максимум'),
  impressions: z.number().int('Должно быть целым числом').min(0).max(1000000000),
  clicks: z.number().int('Должно быть целым числом').min(0).max(100000000),
  leads: z.number().int('Должно быть целым числом').min(0).max(1000000),
  followers: z.number().int('Должно быть целым числом').min(0).max(100000000),
  visits: z.number().int('Должно быть целым числом').min(0).max(1000000),
  diagnostics: z.number().int('Должно быть целым числом').min(0).max(1000000),
  sales: z.number().int('Должно быть целым числом').min(0).max(1000000),
  revenue: z.number().min(0).max(1000000000),
});

export const planDataSchema = dailyDataFieldSchema;

// Validate a single field value
export function validateFieldValue(
  field: string, 
  value: number
): { success: boolean; error?: string } {
  // Check for NaN or Infinity
  if (!Number.isFinite(value)) {
    return { success: false, error: 'Некорректное числовое значение' };
  }

  const fieldValidators: Record<string, z.ZodNumber> = {
    spend: z.number().min(0).max(100000000),
    impressions: z.number().int().min(0).max(1000000000),
    clicks: z.number().int().min(0).max(100000000),
    leads: z.number().int().min(0).max(1000000),
    followers: z.number().int().min(0).max(100000000),
    visits: z.number().int().min(0).max(1000000),
    diagnostics: z.number().int().min(0).max(1000000),
    sales: z.number().int().min(0).max(1000000),
    revenue: z.number().min(0).max(1000000000),
  };

  const validator = fieldValidators[field];
  if (!validator) {
    return { success: false, error: 'Неизвестное поле' };
  }

  const result = validator.safeParse(value);
  if (!result.success) {
    const error = result.error.errors[0];
    return { 
      success: false, 
      error: error?.message || 'Некорректное значение' 
    };
  }

  return { success: true };
}

// Sanitized error logger - only logs error codes, not full objects
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    // In development, log full error for debugging
    console.error(`[DEV] ${context}:`, error);
  } else {
    // In production, log only sanitized info
    const code = (error as any)?.code || 'UNKNOWN';
    console.error(`${context}: ${code}`);
  }
}
