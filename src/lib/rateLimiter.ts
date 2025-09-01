import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter configuration for API endpoints
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: 5, // Number of requests
  duration: 10, // Per 10 seconds
  blockDuration: 60, // Block for 1 minute if limit exceeded
});

// Rate limiter for Google Sheets API calls (more restrictive)
const sheetsApiLimiter = new RateLimiterMemory({
  keyPrefix: 'sheets_api_limit',
  points: 2, // Number of requests
  duration: 10, // Per 10 seconds
  blockDuration: 120, // Block for 2 minutes if limit exceeded
});

export { rateLimiter, sheetsApiLimiter };
