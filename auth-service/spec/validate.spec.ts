import express from 'express';
import request from 'supertest';
import { generateToken } from '../src/auth';
import { validateToken } from '../src/routes/validate';

// Mock metrics to avoid prom-client registry conflicts in tests
jest.mock('../src/metrics', () => ({
    authValidateTotal: { inc: jest.fn() },
    httpRequestDuration: { startTimer: jest.fn(() => jest.fn()) },
    register: { contentType: 'text/plain', metrics: jest.fn().mockResolvedValue('') },
}));

const app = express();
app.use(express.json());
app.post('/validate', validateToken);

describe('POST /validate', () => {
    it('should return 200 with payload for a valid token', async () => {
        const payload = { userId: 'user-1', email: 'a@b.com', username: 'alice' };
        const token = generateToken(payload);

        const res = await request(app).post('/validate').send({ token });

        expect(res.status).toBe(200);
        expect(res.body.userId).toBe(payload.userId);
        expect(res.body.email).toBe(payload.email);
        expect(res.body.username).toBe(payload.username);
    });

    it('should return 401 when no token is provided', async () => {
        const res = await request(app).post('/validate').send({});
        expect(res.status).toBe(401);
        expect(res.body.error).toBeDefined();
    });

    it('should return 401 for an invalid token', async () => {
        const res = await request(app).post('/validate').send({ token: 'bad.token.value' });
        expect(res.status).toBe(401);
    });

    it('should accept token from Authorization header', async () => {
        const payload = { userId: 'user-2', email: 'b@c.com', username: 'bob' };
        const token = generateToken(payload);

        const res = await request(app)
            .post('/validate')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(200);
        expect(res.body.userId).toBe(payload.userId);
    });
});
