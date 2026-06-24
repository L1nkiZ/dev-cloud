import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { authMiddleware } from '../src/middleware/auth';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/protected', authMiddleware, (req: any, res: any) => {
    res.status(200).json({ userId: req.userId, email: req.userEmail, username: req.username });
});

describe('authMiddleware (inter-service)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 when no token is provided', async () => {
        const res = await request(app).get('/protected');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('No token provided');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should attach user info when auth-service returns 200', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ userId: 'u1', email: 'a@b.com', username: 'alice' }),
        });

        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.userId).toBe('u1');
        expect(res.body.email).toBe('a@b.com');
        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/validate'),
            expect.objectContaining({ method: 'POST' }),
        );
    });

    it('should return 401 when auth-service returns non-ok', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false });

        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer bad-token');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid or expired token');
    });

    it('should return 401 when auth-service throws a network error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer any-token');

        expect(res.status).toBe(401);
    });

    it('should read token from cookie', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ userId: 'u2', email: 'b@c.com', username: 'bob' }),
        });

        const res = await request(app)
            .get('/protected')
            .set('Cookie', 'token=cookie-token');

        expect(res.status).toBe(200);
        expect(res.body.userId).toBe('u2');
    });
});
