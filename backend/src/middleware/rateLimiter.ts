import rateLimit from 'express-rate-limit';

// Rate limit for public registration submissions (e.g. 50 submissions per 10 mins per IP)
export const registrationRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many registration requests from this IP. Please try again after a few minutes.',
  },
});

// Rate limit for attendance scanning (e.g., 300 scans per minute per volunteer)
export const scanRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Scanner rate limit exceeded. Please wait a moment.',
  },
});

// General API rate limit (e.g., 600 requests per 5 minutes)
export const generalApiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.',
  },
});
