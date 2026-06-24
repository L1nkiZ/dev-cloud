import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const authLoginTotal = new Counter({
    name: 'auth_login_total',
    help: 'Total number of login attempts',
    labelNames: ['status'],
    registers: [register],
});

export const authSignupTotal = new Counter({
    name: 'auth_signup_total',
    help: 'Total number of signup attempts',
    labelNames: ['status'],
    registers: [register],
});

export const authPasswordResetTotal = new Counter({
    name: 'auth_password_reset_total',
    help: 'Total number of password reset requests',
    registers: [register],
});

export const authValidateTotal = new Counter({
    name: 'auth_validate_total',
    help: 'Total number of token validation requests',
    labelNames: ['status'],
    registers: [register],
});

export const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [register],
});
