import type { Request, Response } from 'express';
import db from '../persistence/index.js';
import { generateToken, hashPassword, comparePassword, generateResetToken } from '../auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import { authLoginTotal, authSignupTotal, authPasswordResetTotal, httpRequestDuration } from '../metrics.js';

const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

export const signUp = async (req: Request, res: Response) => {
    const end = httpRequestDuration.startTimer({ method: 'POST', route: '/auth/sign-up' });
    try {
        const { email, password, username } = req.body;

        if (!email || !password || !username) {
            authSignupTotal.inc({ status: 'failure' });
            end({ status_code: 400 });
            return res.status(400).json({ error: 'Email, password and username are required' });
        }

        const existingUser = await db.getUserByEmail(email);
        if (existingUser) {
            authSignupTotal.inc({ status: 'failure' });
            end({ status_code: 409 });
            return res.status(409).json({ error: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const user = await db.createUser(email, hashedPassword, username);
        const token = generateToken({ userId: user.id, email: user.email, username: user.username });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        authSignupTotal.inc({ status: 'success' });
        end({ status_code: 201 });
        return res.status(201).json({
            message: 'User created successfully',
            user: { id: user.id, email: user.email, username: user.username },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Sign up error:', errorMessage);
        authSignupTotal.inc({ status: 'failure' });
        end({ status_code: 500 });
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({ error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error' });
    }
};

export const signIn = async (req: Request, res: Response) => {
    const end = httpRequestDuration.startTimer({ method: 'POST', route: '/auth/sign-in' });
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            authLoginTotal.inc({ status: 'failure' });
            end({ status_code: 400 });
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await db.getUserByEmail(email);
        if (!user) {
            authLoginTotal.inc({ status: 'failure' });
            end({ status_code: 401 });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await comparePassword(password, user.hashedPassword);
        if (!isPasswordValid) {
            authLoginTotal.inc({ status: 'failure' });
            end({ status_code: 401 });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({ userId: user.id, email: user.email, username: user.username });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        authLoginTotal.inc({ status: 'success' });
        end({ status_code: 200 });
        return res.status(200).json({
            message: 'Logged in successfully',
            user: { id: user.id, email: user.email, username: user.username },
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Sign in error:', errorMessage);
        authLoginTotal.inc({ status: 'failure' });
        end({ status_code: 500 });
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({ error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(200).json({ message: 'If an account exists with that email, you will receive a password reset link' });
        }

        const resetToken = generateResetToken();
        const expiresAt = Date.now() + RESET_TOKEN_EXPIRY;
        await db.createPasswordResetToken(user.id, resetToken, expiresAt);

        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost'}/reset-password?token=${resetToken}`;
        console.log(`Password reset link for ${email}: ${resetLink}`);
        authPasswordResetTotal.inc();

        return res.status(200).json({ message: 'If an account exists with that email, you will receive a password reset link' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Forgot password error:', errorMessage);
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({ error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        const resetToken = await db.getPasswordResetToken(token);
        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        if (Date.now() > resetToken.expiresAt) {
            await db.deletePasswordResetToken(resetToken.id);
            return res.status(400).json({ error: 'Reset token has expired' });
        }

        const hashedPassword = await hashPassword(newPassword);
        await db.updatePassword(resetToken.userId, hashedPassword);
        await db.deletePasswordResetToken(resetToken.id);

        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Reset password error:', errorMessage);
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({ error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error' });
    }
};

export const logout = async (_req: AuthRequest, res: Response) => {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await db.getUserById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ user: { id: user.id, email: user.email, username: user.username } });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Get current user error:', errorMessage);
        const isDev = process.env.NODE_ENV !== 'production';
        return res.status(500).json({ error: isDev ? `Internal server error: ${errorMessage}` : 'Internal server error' });
    }
};
