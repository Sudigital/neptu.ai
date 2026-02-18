// ============================================================================
// API Constants
// ============================================================================

export const API_ENDPOINTS = {
  READING_POTENSI: "/api/reading/potensi",
  READING_PELUANG: "/api/reading/peluang",
  READING_COMPATIBILITY: "/api/reading/compatibility",
  PAYMENT_CREATE: "/api/payment/create",
  PAYMENT_VERIFY: "/api/payment/verify",
  USER_PROFILE: "/api/user/profile",
} as const;

// ============================================================================
// Date Format Constants
// ============================================================================

export const DATE_FORMAT = "YYYY-MM-DD";
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ============================================================================
// Cache TTL (in seconds)
// ============================================================================

export const CACHE_TTL = {
  DAILY_READING: 86400,
  USER_PROFILE: 3600,
  PAYMENT_STATUS: 60,
} as const;
