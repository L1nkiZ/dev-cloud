import { generateToken, verifyToken, hashPassword, comparePassword, generateResetToken } from '../src/auth';

describe('Auth utilities', () => {
    describe('generateToken / verifyToken', () => {
        it('should generate a valid JWT and verify it', () => {
            const payload = { userId: 'user-123', email: 'test@test.com', username: 'testuser' };
            const token = generateToken(payload);
            expect(typeof token).toBe('string');

            const decoded = verifyToken(token);
            expect(decoded).not.toBeNull();
            expect(decoded?.userId).toBe(payload.userId);
            expect(decoded?.email).toBe(payload.email);
            expect(decoded?.username).toBe(payload.username);
        });

        it('should return null for an invalid token', () => {
            const result = verifyToken('invalid.token.here');
            expect(result).toBeNull();
        });

        it('should return null for an empty string', () => {
            const result = verifyToken('');
            expect(result).toBeNull();
        });
    });

    describe('hashPassword / comparePassword', () => {
        it('should hash a password and compare it correctly', async () => {
            const password = 'mySecretPassword123';
            const hash = await hashPassword(password);

            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(0);

            const isValid = await comparePassword(password, hash);
            expect(isValid).toBe(true);
        });

        it('should return false for wrong password', async () => {
            const hash = await hashPassword('correctPassword');
            const isValid = await comparePassword('wrongPassword', hash);
            expect(isValid).toBe(false);
        });

        it('should produce different hashes for the same password', async () => {
            const password = 'samePassword';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);
            expect(hash1).not.toBe(hash2);
        });
    });

    describe('generateResetToken', () => {
        it('should generate a hex string of 64 characters', () => {
            const token = generateResetToken();
            expect(typeof token).toBe('string');
            expect(token).toMatch(/^[0-9a-f]{64}$/);
        });

        it('should generate unique tokens', () => {
            const token1 = generateResetToken();
            const token2 = generateResetToken();
            expect(token1).not.toBe(token2);
        });
    });
});
