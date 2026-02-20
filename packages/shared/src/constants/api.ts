// ============================================================================
// API Constants
// ============================================================================

export const API_ENDPOINTS = {
  READING_POTENSI: "/api/v1/reading/potensi",
  READING_PELUANG: "/api/v1/reading/peluang",
  READING_COMPATIBILITY: "/api/v1/reading/compatibility",
  PAYMENT_CREATE: "/api/v1/payment/create",
  PAYMENT_VERIFY: "/api/v1/payment/verify",
  USER_PROFILE: "/api/v1/user/profile",
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
