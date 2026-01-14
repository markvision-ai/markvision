import { format, isValid, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Safe date formatter that prevents "Invalid time value" errors
 * Returns a fallback string if the date is invalid
 */
export const safeFormat = (
  date: string | Date | null | undefined,
  formatStr: string,
  fallback: string = '—'
): string => {
  if (!date) return fallback;
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // Try parsing ISO string first
      dateObj = parseISO(date);
      
      // If that fails, try Date constructor
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    // Final validity check
    if (!isValid(dateObj)) {
      console.warn('[safeFormat] Invalid date:', date);
      return fallback;
    }
    
    return format(dateObj, formatStr, { locale: ru });
  } catch (error) {
    console.warn('[safeFormat] Error formatting date:', date, error);
    return fallback;
  }
};

/**
 * Safe date parser that returns null for invalid dates
 */
export const safeParseDate = (date: string | Date | null | undefined): Date | null => {
  if (!date) return null;
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = parseISO(date);
      if (!isValid(dateObj)) {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }
    
    return isValid(dateObj) ? dateObj : null;
  } catch {
    return null;
  }
};

/**
 * Check if a date is valid
 */
export const isValidDate = (date: string | Date | null | undefined): boolean => {
  return safeParseDate(date) !== null;
};
